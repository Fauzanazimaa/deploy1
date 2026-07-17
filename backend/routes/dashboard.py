"""
Dashboard routes — admin kelola widget, viewer membaca data widget.
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, DashboardWidget, DataType, ManualEntry, Task, Submission
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import io, json
from datetime import datetime
from collections import Counter

dashboard_bp = Blueprint('dashboard', __name__)


# ── helpers ─────────────────────────────────────────────────────────────────

def _current_user():
    return User.query.get(int(get_jwt_identity()))

def _require_admin():
    u = _current_user()
    if not u or u.role != 'admin':
        return None, jsonify({'error': 'Admin access required'}), 403
    return u, None, None

def _get_entries_for_widget(widget: DashboardWidget):
    """Ambil semua row data untuk sebuah widget."""
    rows = []

    if widget.data_source in ('manual', 'both'):
        entries = ManualEntry.query.filter_by(data_type_id=widget.data_type_id).all()
        for e in entries:
            row = e.get_data()
            row['__source__'] = 'manual'
            row['__date__']   = e.created_at.strftime('%Y-%m-%d')
            rows.append(row)

    if widget.data_source in ('approved_submissions', 'both'):
        subs = (Submission.query
                .filter_by(status='approved')
                .join(Task, Task.id == Submission.task_id)
                .filter(Task.data_type_id == widget.data_type_id)
                .all())
        for s in subs:
            rows.append({
                '__source__': 'submission',
                '__date__':   s.reviewed_at.strftime('%Y-%m-%d') if s.reviewed_at else '',
                '__task__':   s.task.title if s.task else '',
            })

    return rows

def _build_chart_data(widget: DashboardWidget, rows: list):
    """
    Bangun data chart dari rows.
    Jika value_field adalah angka → sum per label.
    Jika value_field kosong → hitung frekuensi label.
    """
    label_field = widget.label_field
    value_field = widget.value_field

    if not label_field:
        return {'labels': [], 'values': []}

    if value_field:
        # Aggregate: sum value per label
        agg = {}
        for row in rows:
            lbl = str(row.get(label_field, 'N/A'))
            try:
                val = float(row.get(value_field, 0) or 0)
            except (ValueError, TypeError):
                val = 0
            agg[lbl] = agg.get(lbl, 0) + val
        labels = list(agg.keys())
        values = [agg[l] for l in labels]
    else:
        # Frekuensi / count per label
        counter = Counter(str(row.get(label_field, 'N/A')) for row in rows)
        labels  = list(counter.keys())
        values  = [counter[l] for l in labels]

    return {'labels': labels, 'values': values}


# ── ADMIN: CRUD widget ───────────────────────────────────────────────────────

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
        title         = d['title'],
        description   = d.get('description', ''),
        category      = d.get('category', 'Umum'),
        data_type_id  = d.get('data_type_id'),
        data_source   = d.get('data_source', 'both'),
        chart_type    = d.get('chart_type', 'bar'),
        label_field   = d.get('label_field', ''),
        value_field   = d.get('value_field', ''),
        is_visible    = d.get('is_visible', True),
        allow_download= d.get('allow_download', True),
        sort_order    = d.get('sort_order', 0),
        created_by    = u.id,
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

    for field in ('title','description','category','data_type_id','data_source','chart_type',
                  'label_field','value_field','is_visible','allow_download','sort_order'):
        if field in d:
            setattr(w, field, d[field])

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
    """Admin preview chart data sebelum publish."""
    u, err, code = _require_admin()
    if err: return err, code
    w = DashboardWidget.query.get_or_404(wid)
    rows = _get_entries_for_widget(w)
    chart_data = _build_chart_data(w, rows)
    return jsonify({
        'widget':     w.to_dict(),
        'chart_data': chart_data,
        'total_rows': len(rows),
        'sample_rows': rows[:5],
    }), 200


# ── ADMIN: manual entry + self-approve ──────────────────────────────────────

@dashboard_bp.route('/admin/widgets/<int:wid>/entries', methods=['POST'])
@jwt_required()
def add_widget_entry(wid):
    """Admin tambah data manual langsung ke widget, auto-approved."""
    u, err, code = _require_admin()
    if err: return err, code

    w = DashboardWidget.query.get_or_404(wid)
    d = request.get_json()
    entry_data = d.get('data', {})

    entry = ManualEntry(
        data_type_id = w.data_type_id,
        data         = json.dumps(entry_data),
        entered_by   = u.id,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'message': 'Entry added', 'entry': entry.to_dict()}), 201


# ── VIEWER / PUBLIC: baca widget ─────────────────────────────────────────────

@dashboard_bp.route('/public/widgets', methods=['GET'])
def public_widgets():
    """Semua widget yang is_visible=True, tidak perlu login."""
    widgets = (DashboardWidget.query
               .filter_by(is_visible=True)
               .order_by(DashboardWidget.sort_order)
               .all())

    result = []
    for w in widgets:
        rows       = _get_entries_for_widget(w)
        chart_data = _build_chart_data(w, rows)
        item       = w.to_dict()
        item['chart_data']  = chart_data
        item['total_rows']  = len(rows)
        item['table_rows']  = rows[:200]   # max 200 baris di tabel
        result.append(item)

    return jsonify(result), 200


@dashboard_bp.route('/public/widgets/<int:wid>/download', methods=['GET'])
def download_widget(wid):
    """Download data widget sebagai Excel."""
    w = DashboardWidget.query.get_or_404(wid)
    if not w.allow_download:
        return jsonify({'error': 'Download tidak diizinkan'}), 403

    rows = _get_entries_for_widget(w)
    if not rows:
        return jsonify({'error': 'Tidak ada data'}), 404

    # Build Excel
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = w.title[:31]

    hf = Font(bold=True, color='FFFFFF', size=11)
    hfill = PatternFill(start_color='F97316', end_color='F97316', fill_type='solid')
    ha = Alignment(horizontal='center', vertical='center')

    all_keys = []
    for row in rows:
        for k in row.keys():
            if k not in all_keys and not k.startswith('__'):
                all_keys.append(k)

    headers = all_keys + ['Sumber', 'Tanggal']
    for ci, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=ci, value=h.replace('_',' ').title())
        cell.font = hf; cell.fill = hfill; cell.alignment = ha

    for ri, row in enumerate(rows, 2):
        for ci, k in enumerate(all_keys, 1):
            ws.cell(row=ri, column=ci, value=row.get(k, ''))
        ws.cell(row=ri, column=len(all_keys)+1, value=row.get('__source__',''))
        ws.cell(row=ri, column=len(all_keys)+2, value=row.get('__date__',''))

    for col in ws.columns:
        width = max((len(str(c.value or '')) for c in col), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(width + 4, 50)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(output, as_attachment=True,
                     download_name=f"{w.title}_{datetime.now().strftime('%Y%m%d')}.xlsx",
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
