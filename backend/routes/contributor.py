from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, User, Task, Submission, ExcelTemplate
from storage import upload_file, download_file, UPLOADS_BUCKET, TEMPLATES_BUCKET
from utils.excel import normalize_schema, get_leaf_columns
from datetime import datetime
import io
import uuid
import json as _json
import openpyxl

contributor_bp = Blueprint('contributor', __name__)


def require_contributor():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role != 'contributor':
        return None, jsonify({'error': 'Contributor access required'}), 403
    return user, None, None


ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@contributor_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    user, err, code = require_contributor()
    if err:
        return err, code

    tasks = Task.query.filter_by(assigned_to=user.id).order_by(Task.created_at.desc()).all()
    result = []
    for t in tasks:
        task_dict = t.to_dict()
        latest_sub = (Submission.query
                      .filter_by(task_id=t.id, contributor_id=user.id)
                      .order_by(Submission.submitted_at.desc())
                      .first())
        task_dict['latest_submission'] = latest_sub.to_dict() if latest_sub else None
        # Sertakan fields_schema dari DataType agar frontend bisa render form
        if t.data_type:
            task_dict['fields_schema'] = t.data_type.get_fields_schema()
        result.append(task_dict)
    return jsonify(result), 200


@contributor_bp.route('/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    user, err, code = require_contributor()
    if err:
        return err, code
    task = Task.query.filter_by(id=task_id, assigned_to=user.id).first_or_404()
    return jsonify(task.to_dict()), 200


@contributor_bp.route('/templates/<int:data_type_id>', methods=['GET'])
@jwt_required()
def download_template(data_type_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    template = (ExcelTemplate.query
                .filter_by(data_type_id=data_type_id)
                .order_by(ExcelTemplate.created_at.desc())
                .first())
    if not template:
        return jsonify({'error': 'No template found for this data type'}), 404

    try:
        file_bytes = download_file(TEMPLATES_BUCKET(), template.file_path)
    except Exception:
        return jsonify({'error': 'Template file not found in storage'}), 404

    return send_file(
        io.BytesIO(file_bytes),
        as_attachment=True,
        download_name=template.original_filename,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@contributor_bp.route('/tasks/<int:task_id>/submit', methods=['POST'])
@jwt_required()
def submit_task(task_id):
    user, err, code = require_contributor()
    if err:
        return err, code

    task = Task.query.filter_by(id=task_id, assigned_to=user.id).first_or_404()

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only Excel files (.xlsx, .xls) or CSV are allowed'}), 400

    file_bytes   = file.read()
    filename     = secure_filename(file.filename)
    storage_path = f"{uuid.uuid4()}_{filename}"

    upload_file(UPLOADS_BUCKET(), storage_path, file_bytes,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    # Hapus semua submission lama untuk task ini agar tidak double
    from storage import delete_file as _del
    old_subs = Submission.query.filter_by(task_id=task.id, contributor_id=user.id).all()
    for old in old_subs:
        if old.file_path:
            try:
                _del(UPLOADS_BUCKET(), old.file_path)
            except Exception:
                pass
        db.session.delete(old)

    submission = Submission(
        task_id=task.id,
        contributor_id=user.id,
        file_path=storage_path,
        source='excel',
        status='pending',
    )
    db.session.add(submission)
    task.status = 'submitted'
    db.session.commit()

    return jsonify(submission.to_dict()), 201


@contributor_bp.route('/tasks/<int:task_id>/template-grid', methods=['GET'])
@jwt_required()
def get_template_grid(task_id):
    """
    Baca template Excel untuk task ini dan kembalikan sebagai grid 2D.
    Response:
      {
        "headers": [  // header rows (tidak bisa diubah)
          [{"value": str, "rowspan": int, "colspan": int, "is_header": true}, ...]
        ],
        "rows": [     // baris data; setiap sel punya "locked" (true jika terisi dari template)
          [{"value": str, "locked": bool}, ...]
        ],
        "num_header_rows": int,
        "num_data_cols": int,
        "has_first_col": bool,
        "first_col_label": str
      }
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    task = Task.query.filter_by(id=task_id, assigned_to=user.id).first_or_404()

    template = (ExcelTemplate.query
                .filter_by(data_type_id=task.data_type_id)
                .order_by(ExcelTemplate.created_at.desc())
                .first())

    # ── Jika tidak ada template, fallback ke fields_schema ───────────────────
    if not template:
        if not task.data_type:
            return jsonify({'error': 'Template tidak tersedia'}), 404
        schema = normalize_schema(task.data_type.get_fields_schema())
        return _schema_to_grid(schema), 200

    try:
        file_bytes = download_file(TEMPLATES_BUCKET(), template.file_path)
    except Exception:
        # Fallback ke schema
        if task.data_type:
            schema = normalize_schema(task.data_type.get_fields_schema())
            return _schema_to_grid(schema), 200
        return jsonify({'error': 'File template tidak ditemukan'}), 404

    return _excel_to_grid(file_bytes), 200


def _excel_to_grid(file_bytes: bytes):
    """Baca Excel template → grid JSON untuk direct input."""
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    ws = wb.active

    max_row = ws.max_row or 1
    max_col = ws.max_column or 1

    # ── Merge map ─────────────────────────────────────────────────────────────
    merge_info = {}   # (r,c) top-left → {rowspan, colspan}
    merged_skip = set()
    for mr in ws.merged_cells.ranges:
        rs = mr.max_row - mr.min_row + 1
        cs = mr.max_col - mr.min_col + 1
        merge_info[(mr.min_row, mr.min_col)] = {'rowspan': rs, 'colspan': cs}
        for r in range(mr.min_row, mr.max_row + 1):
            for c in range(mr.min_col, mr.max_col + 1):
                if (r, c) != (mr.min_row, mr.min_col):
                    merged_skip.add((r, c))

    # ── Jumlah baris header ───────────────────────────────────────────────────
    num_header_rows = 1
    for mr in ws.merged_cells.ranges:
        if mr.min_row == 1 and mr.max_row > num_header_rows:
            num_header_rows = mr.max_row
        if num_header_rows >= 5:
            break

    # ── Baca nilai grid ───────────────────────────────────────────────────────
    def cell_val(r, c):
        v = ws.cell(r, c).value
        if v is None:
            return ''
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return str(v).strip()

    # ── Header rows ───────────────────────────────────────────────────────────
    header_rows = []
    HEADER_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa']
    for r in range(1, num_header_rows + 1):
        row_cells = []
        for c in range(1, max_col + 1):
            if (r, c) in merged_skip:
                continue
            mi = merge_info.get((r, c), {'rowspan': 1, 'colspan': 1})
            color_idx = min(r - 1, len(HEADER_COLORS) - 1)
            # Kolom yang di-rowspan penuh → level 0 color
            if mi['rowspan'] >= num_header_rows and num_header_rows > 1:
                color_idx = 0
            row_cells.append({
                'value': cell_val(r, c),
                'rowspan': mi['rowspan'],
                'colspan': mi['colspan'],
                'bg': HEADER_COLORS[color_idx],
            })
        header_rows.append(row_cells)

    # ── Deteksi first_column ──────────────────────────────────────────────────
    # Kolom 1 dianggap first_column jika ada merge vertikal penuh di baris header
    has_first_col = False
    first_col_label = ''
    first_col_values = []  # isian default dari template

    if num_header_rows > 1:
        mi = merge_info.get((1, 1))
        if mi and mi['rowspan'] >= num_header_rows:
            has_first_col = True
            first_col_label = cell_val(1, 1)
    else:
        # Single header — cek apakah ada isian di kolom 1 pada baris data
        pass  # ditangani di bawah

    # ── Baris data dari template ──────────────────────────────────────────────
    data_start = num_header_rows + 1
    num_data_cols = max_col - (1 if has_first_col else 0)

    # Kumpulkan nilai first_column dari baris data
    fc_data_values = []
    if has_first_col:
        for r in range(data_start, max_row + 1):
            fc_data_values.append(cell_val(r, 1))
    else:
        # Single header: cek apakah kolom 1 terisi (artinya ia first_col)
        non_empty = [cell_val(r, 1) for r in range(data_start, min(data_start + 30, max_row + 1))
                     if cell_val(r, 1)]
        if non_empty:
            has_first_col = True
            if header_rows and header_rows[0]:
                first_col_label = header_rows[0][0]['value']
                # Hapus kolom pertama dari header (dia pindah ke first_col_label)
                header_rows[0] = header_rows[0][1:]
            fc_data_values = [cell_val(r, 1) for r in range(data_start, max_row + 1)]
            num_data_cols = max_col - 1

    col_start = 2 if has_first_col else 1

    # ── Tentukan baris mana yang valid dari template ──────────────────────────
    # Strategi: jika ada first_col, baris valid = baris yang first_col-nya terisi
    # Jika tidak ada first_col, ambil semua baris sampai baris terakhir yang ada isinya
    if has_first_col:
        # Hanya ambil baris yang punya isian di first_col (terisi dari template)
        # Skip baris kosong di first_col (baris benar-benar kosong / padding Excel)
        valid_rows = []
        for r in range(data_start, max_row + 1):
            fc_val = cell_val(r, 1)
            if fc_val.strip():
                valid_rows.append(r)
            # Stop jika sudah 3 baris kosong berturut-turut di first_col
            # (menghindari membaca note/footer Excel)
        # Ambil sampai baris valid terakhir saja
        last_valid = valid_rows[-1] if valid_rows else data_start - 1
    else:
        # Tanpa first_col: cari baris terakhir yang ada isinya
        last_valid = data_start - 1
        for r in range(data_start, max_row + 1):
            row_vals = [cell_val(r, c) for c in range(col_start, max_col + 1)]
            if any(v.strip() for v in row_vals):
                last_valid = r

    # ── Bangun baris data ─────────────────────────────────────────────────────
    data_rows = []
    for r in range(data_start, last_valid + 1):
        row_cells = []
        fc_val = cell_val(r, 1) if has_first_col else ''

        if has_first_col:
            row_cells.append({'value': fc_val, 'locked': bool(fc_val.strip())})

        for c in range(col_start, max_col + 1):
            v = cell_val(r, c)
            row_cells.append({'value': v, 'locked': bool(v.strip())})

        data_rows.append(row_cells)

    # Jika tidak ada baris sama sekali, tambah 1 baris kosong agar tabel tetap terbuka
    if not data_rows:
        empty_row = []
        if has_first_col:
            empty_row.append({'value': '', 'locked': False})
        for _ in range(num_data_cols):
            empty_row.append({'value': '', 'locked': False})
        data_rows.append(empty_row)

    wb.close()
    return jsonify({
        'headers': header_rows,
        'rows': data_rows,
        'num_header_rows': num_header_rows,
        'num_data_cols': num_data_cols,
        'has_first_col': has_first_col,
        'first_col_label': first_col_label,
        'total_cols': max_col,
    })


def _schema_to_grid(schema: dict):
    """Fallback: bangun grid dari fields_schema (tanpa file Excel)."""
    levels = schema.get('header_levels', [[]])
    first_col = schema.get('first_column', {})
    has_first = first_col.get('enabled', False)
    fc_label = first_col.get('label', '')
    fc_rows = first_col.get('default_rows', [])
    leaf_cols = get_leaf_columns(schema)
    num_levels = len(levels)
    HEADER_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa']

    header_rows = []
    for li, level in enumerate(levels):
        is_last = (li == num_levels - 1)
        row_cells = []
        if has_first and li == 0:
            row_cells.append({
                'value': fc_label,
                'rowspan': num_levels,
                'colspan': 1,
                'bg': HEADER_COLORS[0],
            })
        if not is_last:
            for grp in level:
                row_cells.append({
                    'value': grp.get('label', ''),
                    'rowspan': 1,
                    'colspan': grp.get('span', 1),
                    'bg': HEADER_COLORS[min(li, len(HEADER_COLORS)-1)],
                })
        else:
            for f in level:
                row_cells.append({
                    'value': f.get('label', f.get('name', '')),
                    'rowspan': 1,
                    'colspan': 1,
                    'bg': HEADER_COLORS[min(li, len(HEADER_COLORS)-1)],
                })
        header_rows.append(row_cells)

    # Hanya gunakan baris yang sudah ada di default_rows (dari template)
    # Jika tidak ada default_rows, tampilkan 1 baris kosong saja
    n_rows = len(fc_rows) if has_first else max(len(fc_rows), 1)
    data_rows = []
    for ri in range(n_rows):
        row = []
        if has_first:
            val = fc_rows[ri] if ri < len(fc_rows) else ''
            row.append({'value': val, 'locked': bool(val.strip())})
        for _ in leaf_cols:
            row.append({'value': '', 'locked': False})
        data_rows.append(row)

    if not data_rows:
        empty_row = []
        if has_first:
            empty_row.append({'value': '', 'locked': False})
        for _ in leaf_cols:
            empty_row.append({'value': '', 'locked': False})
        data_rows.append(empty_row)

    return jsonify({
        'headers': header_rows,
        'rows': data_rows,
        'num_header_rows': num_levels,
        'num_data_cols': len(leaf_cols),
        'has_first_col': has_first,
        'first_col_label': fc_label,
        'total_cols': (1 if has_first else 0) + len(leaf_cols),
    })


@contributor_bp.route('/tasks/<int:task_id>/submit-form', methods=['POST'])
@jwt_required()
def submit_task_form(task_id):
    """Submit data via form (JSON), bukan file upload."""
    user, err, code = require_contributor()
    if err:
        return err, code

    task = Task.query.filter_by(id=task_id, assigned_to=user.id).first_or_404()

    if task.status not in ('pending', 'revision'):
        return jsonify({'error': f'Tugas berstatus {task.status}, tidak bisa disubmit'}), 400

    data = request.get_json()
    if not data or 'form_data' not in data:
        return jsonify({'error': 'form_data diperlukan'}), 400

    # Hapus semua submission lama untuk task ini agar tidak double
    old_subs = Submission.query.filter_by(task_id=task.id, contributor_id=user.id).all()
    for old in old_subs:
        db.session.delete(old)

    submission = Submission(
        task_id=task.id,
        contributor_id=user.id,
        file_path=None,
        source='form',
        form_data=_json.dumps(data['form_data']),
        status='pending',
    )
    db.session.add(submission)
    task.status = 'submitted'
    db.session.commit()

    return jsonify(submission.to_dict()), 201


@contributor_bp.route('/submissions', methods=['GET'])
@jwt_required()
def get_my_submissions():
    user, err, code = require_contributor()
    if err:
        return err, code
    submissions = (Submission.query
                   .filter_by(contributor_id=user.id)
                   .order_by(Submission.submitted_at.desc())
                   .all())
    return jsonify([s.to_dict() for s in submissions]), 200


@contributor_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    user, err, code = require_contributor()
    if err:
        return err, code

    recent_tasks = (Task.query
                    .filter_by(assigned_to=user.id)
                    .order_by(Task.created_at.desc())
                    .limit(5).all())

    return jsonify({
        'total_tasks':        Task.query.filter_by(assigned_to=user.id).count(),
        'pending_tasks':      Task.query.filter_by(assigned_to=user.id, status='pending').count(),
        'submitted_tasks':    Task.query.filter_by(assigned_to=user.id, status='submitted').count(),
        'approved_tasks':     Task.query.filter_by(assigned_to=user.id, status='approved').count(),
        'revision_tasks':     Task.query.filter_by(assigned_to=user.id, status='revision').count(),
        'total_submissions':  Submission.query.filter_by(contributor_id=user.id).count(),
        'pending_submissions': Submission.query.filter_by(contributor_id=user.id, status='pending').count(),
        'recent_tasks':       [t.to_dict() for t in recent_tasks],
    }), 200
