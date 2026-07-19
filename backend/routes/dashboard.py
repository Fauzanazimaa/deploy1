"""
Dashboard routes — admin kelola widget, viewer membaca data widget.
Pendekatan: Admin memilih sendiri kolom X, Y, Series, dan jenis visualisasi.
Data disimpan dalam format cross-table (__row_label + __col_N),
lalu ditransformasi (unpivot) ke tidy format untuk visualisasi.
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, DashboardWidget, DataType, ManualEntry, Task, Submission
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import io, json
from datetime import datetime
from collections import Counter
from utils.excel import normalize_schema
from utils.unpivot import unpivot_rows, get_tidy_dimensions, get_dimension_names

dashboard_bp = Blueprint('dashboard', __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _current_user():
    return User.query.get(int(get_jwt_identity()))

def _require_admin():
    u = _current_user()
    if not u or u.role != 'admin':
        return None, jsonify({'error': 'Admin access required'}), 403
    return u, None, None


def _get_all_rows(data_type_id: int) -> list:
    """
    Ambil semua baris data dari ManualEntry + approved Submission (form source).
    Kembalikan dalam format RAW (cross-table: __row_label + __col_N).
    """
    rows = []
    for entry in ManualEntry.query.filter_by(data_type_id=data_type_id).all():
        try:
            d = entry.get_data()
            if isinstance(d, list):
                rows.extend([r for r in d if isinstance(r, dict)])
            elif isinstance(d, dict):
                rows.append(d)
        except Exception:
            pass

    subs = (Submission.query.filter_by(status='approved')
            .join(Task, Task.id == Submission.task_id)
            .filter(Task.data_type_id == data_type_id).all())
    for s in subs:
        if s.source == 'form' and s.form_data:
            try:
                fd = json.loads(s.form_data)
                if isinstance(fd, list):
                    rows.extend([r for r in fd if isinstance(r, dict)])
                elif isinstance(fd, dict):
                    rows.append(fd)
            except Exception:
                pass
    return rows


def _get_tidy_rows(data_type_id: int) -> list:
    """
    Ambil data dan transformasikan ke tidy format menggunakan unpivot.
    Ini yang digunakan untuk visualisasi di Dashboard Publik.
    """
    dt = DataType.query.get(data_type_id)
    if not dt:
        return []
    raw_rows = _get_all_rows(data_type_id)
    schema   = dt.get_fields_schema()
    return unpivot_rows(raw_rows, schema)


def _parse_schema_fields(data_type_id: int) -> dict:
    """
    Parse schema DataType dan kembalikan dimensi-dimensi yang tersedia
    setelah unpivot/normalisasi. Admin menggunakan ini untuk memilih
    X-Axis, Y-Axis, Series — semua dengan nama yang human-readable.
    """
    dt = DataType.query.get(data_type_id)
    if not dt:
        return {'schema_type': 'empty', 'dimensions': [], 'total_rows': 0,
                'row_field': None, 'col_fields': [], 'flat_fields': [],
                'header_levels': [], 'first_column': {}}

    schema    = dt.get_fields_schema()
    raw_rows  = _get_all_rows(data_type_id)
    tidy_rows = unpivot_rows(raw_rows, schema)
    total_raw = len(raw_rows)

    normalized = normalize_schema(schema)
    is_nested  = isinstance(schema, dict) and 'header_levels' in schema
    is_flat    = isinstance(schema, list)

    # Dimensi untuk pilihan Admin (hasil unpivot)
    dimensions = get_tidy_dimensions(schema)

    # Untuk backward compat — juga kembalikan info nested
    fc = normalized.get('first_column', {})
    hl = normalized.get('header_levels', [])

    row_field = None
    if fc.get('enabled') and fc.get('label'):
        clean = str(fc['label']).replace('\n', ' / ').strip()
        row_field = {'name': clean, 'label': clean}

    # Leaf columns dari schema
    col_fields = []
    if hl:
        leaf = hl[-1] if hl else []
        for i, c in enumerate(leaf):
            if not isinstance(c, dict): continue
            lbl = str(c.get('label', c.get('name', f'Col {i}')) or '').strip()
            col_fields.append({'name': f'__col_{i}', 'label': lbl, 'is_leaf': True})

    # Sample tidy rows untuk preview
    sample_tidy = tidy_rows[:3] if tidy_rows else []

    return {
        'schema_type':   'nested' if is_nested else ('flat' if is_flat else 'empty'),
        'dimensions':    dimensions,       # ← yang digunakan untuk field selector
        'row_field':     row_field,
        'col_fields':    col_fields,
        'all_col_fields': col_fields,
        'header_levels': hl,
        'first_column':  fc,
        'flat_fields':   [],
        'total_rows':    total_raw,
        'tidy_count':    len(tidy_rows),
        'sample_tidy':   sample_tidy,
    }


def _build_chart_data(widget: DashboardWidget, tidy_rows: list) -> dict:
    """
    Bangun data chart dari TIDY rows (hasil unpivot).
    tidy_rows berisi kolom dengan nama human-readable, plus '_value'.
    """
    label_field  = widget.label_field  or ''
    value_field  = widget.value_field  or '_value'
    series_field = widget.series_field or ''

    if not label_field:
        return {'labels': [], 'values': [], 'series': []}

    # Cek apakah label_field ada di tidy rows; jika tidak ada mungkin
    # widget masih pakai format lama (__row_label/__col_N) — skip gracefully
    if tidy_rows and label_field not in tidy_rows[0]:
        # Field tidak ditemukan di tidy rows — kembalikan kosong
        # Admin perlu re-konfigurasi widget via modal Edit
        return {'labels': [], 'values': [], 'series': [],
                'warning': f'Kolom "{label_field}" tidak ada di data. Silakan edit widget dan pilih ulang kolom X.'}

    if series_field and tidy_rows and series_field not in tidy_rows[0]:
        series_field = ''  # Series field tidak valid, abaikan

    if series_field:
        series_data = {}
        all_labels  = []
        for row in tidy_rows:
            lbl = str(row.get(label_field, '') or '').strip() or 'N/A'
            ser = str(row.get(series_field, '') or '').strip() or 'Lainnya'
            if lbl not in all_labels:
                all_labels.append(lbl)
            if ser not in series_data:
                series_data[ser] = {}
            try:
                if value_field == '_value':
                    val = float(row.get('_value') or 0)
                else:
                    val = float(str(row.get(value_field, 0) or 0).replace(',', '.'))
            except (ValueError, TypeError):
                val = 0
            series_data[ser][lbl] = series_data[ser].get(lbl, 0) + val

        series_out = [
            {'name': s, 'data': [series_data[s].get(l, 0) for l in all_labels]}
            for s in series_data
        ]
        return {'labels': all_labels, 'values': [], 'series': series_out}

    # Tanpa seri
    agg = {}
    for row in tidy_rows:
        lbl = str(row.get(label_field, '') or '').strip() or 'N/A'
        try:
            if value_field == '_value':
                val = float(row.get('_value') or 0)
            else:
                val = float(str(row.get(value_field, 0) or 0).replace(',', '.'))
        except (ValueError, TypeError):
            val = 0
        agg[lbl] = agg.get(lbl, 0) + val

    labels = list(agg.keys())
    values = [agg[l] for l in labels]
    return {'labels': labels, 'values': values, 'series': []}


def _get_entries_for_widget(widget: DashboardWidget) -> list:
    """
    Ambil tidy rows untuk widget.
    Tidy rows digunakan untuk chart data; raw rows digunakan untuk download.
    """
    if not widget.data_type_id:
        return []

    dt = DataType.query.get(widget.data_type_id)
    if not dt:
        return []

    schema = dt.get_fields_schema()

    raw_rows = []
    if widget.data_source in ('manual', 'both'):
        for e in ManualEntry.query.filter_by(data_type_id=widget.data_type_id).all():
            try:
                d = e.get_data()
                meta = {'__source__': 'manual', '__date__': e.created_at.strftime('%Y-%m-%d')}
                if isinstance(d, list):
                    for row in d:
                        if isinstance(row, dict):
                            raw_rows.append({**row, **meta})
                elif isinstance(d, dict):
                    raw_rows.append({**d, **meta})
            except Exception:
                pass

    if widget.data_source in ('approved_submissions', 'both'):
        subs = (Submission.query.filter_by(status='approved')
                .join(Task, Task.id == Submission.task_id)
                .filter(Task.data_type_id == widget.data_type_id).all())
        for s in subs:
            meta = {'__source__': 'submission',
                    '__date__': s.reviewed_at.strftime('%Y-%m-%d') if s.reviewed_at else '',
                    '__task__': s.task.title if s.task else ''}
            if s.source == 'form' and s.form_data:
                try:
                    fd = json.loads(s.form_data)
                    if isinstance(fd, list):
                        for row in fd:
                            if isinstance(row, dict):
                                raw_rows.append({**row, **meta})
                    elif isinstance(fd, dict):
                        raw_rows.append({**fd, **meta})
                except Exception:
                    raw_rows.append(meta)
            else:
                raw_rows.append(meta)

    # Unpivot ke tidy format
    tidy = unpivot_rows(raw_rows, schema)
    return tidy


# ── ADMIN: Schema preview endpoint ────────────────────────────────────────────

@dashboard_bp.route('/admin/widgets/verified-data-types', methods=['GET'])
@jwt_required()
def get_verified_data_types():
    """
    Kembalikan data types yang memiliki setidaknya 1 submission approved
    atau manual entry — yaitu tabel yang sudah 'terverifikasi' dan siap dipublikasikan.
    """
    u, err, code = _require_admin()
    if err: return err, code

    # Data types dengan approved submission
    from sqlalchemy import distinct
    approved_dt_ids = set(
        row[0] for row in
        db.session.query(distinct(Task.data_type_id))
        .join(Submission, Submission.task_id == Task.id)
        .filter(Submission.status == 'approved')
        .all()
    )
    # Data types dengan manual entry
    manual_dt_ids = set(
        row[0] for row in
        db.session.query(distinct(ManualEntry.data_type_id)).all()
    )

    all_verified_ids = approved_dt_ids | manual_dt_ids
    if not all_verified_ids:
        return jsonify([]), 200

    data_types = DataType.query.filter(DataType.id.in_(all_verified_ids)).all()
    result = []
    for dt in data_types:
        approved_count = (Submission.query
            .join(Task, Task.id == Submission.task_id)
            .filter(Task.data_type_id == dt.id, Submission.status == 'approved')
            .count())
        manual_count = ManualEntry.query.filter_by(data_type_id=dt.id).count()
        result.append({
            **dt.to_dict(),
            'approved_count': approved_count,
            'manual_count':   manual_count,
            'total_data':     approved_count + manual_count,
        })
    return jsonify(result), 200


@dashboard_bp.route('/admin/widgets/schema/<int:dt_id>', methods=['GET'])
@jwt_required()
def get_data_type_schema(dt_id):
    """
    Kembalikan struktur field DataType untuk membantu Admin
    memilih X-Axis, Y-Axis, Series secara manual.
    """
    u, err, code = _require_admin()
    if err: return err, code
    info = _parse_schema_fields(dt_id)
    return jsonify(info), 200


# ── ADMIN: CRUD widget ────────────────────────────────────────────────────────

@dashboard_bp.route('/admin/widgets', methods=['GET'])
@jwt_required()
def get_widgets():
    u, err, code = _require_admin()
    if err: return err, code
    widgets = DashboardWidget.query.order_by(DashboardWidget.sort_order).all()
    return jsonify([w.to_dict() for w in widgets]), 200


@dashboard_bp.route('/admin/widgets', methods=['POST'])
@jwt_required()
def create_widget():
    u, err, code = _require_admin()
    if err: return err, code
    d = request.get_json()
    if not d or not d.get('title'):
        return jsonify({'error': 'title is required'}), 400
    w = DashboardWidget(
        title          = d['title'],
        description    = d.get('description', ''),
        category       = d.get('category', 'Umum'),
        data_type_id   = d.get('data_type_id'),
        data_source    = d.get('data_source', 'both'),
        chart_type     = d.get('chart_type', 'bar'),
        label_field    = d.get('label_field', ''),
        value_field    = d.get('value_field', ''),
        series_field   = d.get('series_field', ''),
        viz_config     = json.dumps(d.get('viz_config', {})) if d.get('viz_config') else None,
        is_visible     = d.get('is_visible', True),
        allow_download = d.get('allow_download', True),
        sort_order     = d.get('sort_order', 0),
        created_by     = u.id,
    )
    db.session.add(w)
    db.session.commit()
    return jsonify(w.to_dict()), 201


@dashboard_bp.route('/admin/widgets/<int:wid>', methods=['PUT'])
@jwt_required()
def update_widget(wid):
    u, err, code = _require_admin()
    if err: return err, code
    w = DashboardWidget.query.get_or_404(wid)
    d = request.get_json()
    for field in ('title','description','category','data_type_id','data_source',
                  'chart_type','label_field','value_field','series_field',
                  'is_visible','allow_download','sort_order'):
        if field in d:
            setattr(w, field, d[field])
    if 'viz_config' in d:
        w.viz_config = json.dumps(d['viz_config']) if d['viz_config'] else None
    db.session.commit()
    return jsonify(w.to_dict()), 200


@dashboard_bp.route('/admin/widgets/<int:wid>', methods=['DELETE'])
@jwt_required()
def delete_widget(wid):
    u, err, code = _require_admin()
    if err: return err, code
    w = DashboardWidget.query.get_or_404(wid)
    db.session.delete(w)
    db.session.commit()
    return jsonify({'message': 'deleted'}), 200


@dashboard_bp.route('/admin/widgets/<int:wid>/toggle-visibility', methods=['PUT'])
@jwt_required()
def toggle_visibility(wid):
    u, err, code = _require_admin()
    if err: return err, code
    w = DashboardWidget.query.get_or_404(wid)
    w.is_visible = not w.is_visible
    db.session.commit()
    return jsonify(w.to_dict()), 200


@dashboard_bp.route('/admin/widgets/<int:wid>/preview', methods=['GET'])
@jwt_required()
def preview_widget(wid):
    u, err, code = _require_admin()
    if err: return err, code
    w = DashboardWidget.query.get_or_404(wid)
    rows       = _get_entries_for_widget(w)
    chart_data = _build_chart_data(w, rows)
    return jsonify({
        'widget':      w.to_dict(),
        'chart_data':  chart_data,
        'total_rows':  len(rows),
        'sample_rows': rows[:5],
    }), 200


# ── PUBLIC: baca widget ───────────────────────────────────────────────────────

@dashboard_bp.route('/public/widgets', methods=['GET'])
def public_widgets():
    widgets = (DashboardWidget.query
               .filter_by(is_visible=True)
               .order_by(DashboardWidget.sort_order).all())
    result = []
    for w in widgets:
        tidy_rows  = _get_entries_for_widget(w)
        chart_data = _build_chart_data(w, tidy_rows)
        item       = w.to_dict()
        item['chart_data'] = chart_data
        item['total_rows'] = len(tidy_rows)
        # Sertakan sample tidy rows untuk tabel (max 200)
        item['table_rows'] = [
            {k: v for k, v in r.items() if not k.startswith('_')}
            for r in tidy_rows[:200]
        ]
        result.append(item)
    return jsonify(result), 200


@dashboard_bp.route('/public/widgets/<int:wid>/download', methods=['GET'])
def download_widget(wid):
    w = DashboardWidget.query.get_or_404(wid)
    if not w.allow_download:
        return jsonify({'error': 'Download tidak diizinkan'}), 403

    tidy_rows = _get_entries_for_widget(w)
    if not tidy_rows:
        return jsonify({'error': 'Tidak ada data'}), 404

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = w.title[:31]

    hf    = Font(bold=True, color='FFFFFF', size=11)
    hfill = PatternFill(start_color='F97316', end_color='F97316', fill_type='solid')
    ha    = Alignment(horizontal='center', vertical='center')

    # Kumpulkan kolom yang human-readable (skip internal __ keys)
    all_keys = []
    for row in tidy_rows:
        for k in row.keys():
            if k not in all_keys and not k.startswith('_') and not k.startswith('__'):
                all_keys.append(k)
    # Tambahkan _value sebagai kolom "Nilai"
    if '_value' not in all_keys and any('_value' in r for r in tidy_rows):
        all_keys.append('_value')

    display_headers = []
    for k in all_keys:
        display_headers.append('Nilai' if k == '_value' else k)

    for ci, h in enumerate(display_headers, 1):
        cell = ws.cell(row=1, column=ci, value=h)
        cell.font = hf; cell.fill = hfill; cell.alignment = ha

    for ri, row in enumerate(tidy_rows, 2):
        for ci, k in enumerate(all_keys, 1):
            ws.cell(row=ri, column=ci, value=row.get(k, ''))

    for col in ws.columns:
        width = max((len(str(c.value or '')) for c in col), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(width + 4, 50)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return send_file(output, as_attachment=True,
                     download_name=f"{w.title}_{datetime.now().strftime('%Y%m%d')}.xlsx",
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
