"""
Dashboard routes — admin kelola widget, viewer membaca data widget.
Pendekatan: Admin memilih sendiri kolom X, Y, Series, dan jenis visualisasi.
Data disimpan dalam format cross-table (__row_label + __col_N),
lalu ditransformasi (unpivot) ke tidy format untuk visualisasi.
"""
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, DataType, Task, Submission
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
    Ambil semua baris data dari approved Submission (form source).
    Kembalikan dalam format RAW (cross-table: __row_label + __col_N).
    """
    rows = []

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


def _build_chart_data(widget, tidy_rows: list) -> dict:
    """
    Bangun data chart dari TIDY rows (hasil unpivot).
    tidy_rows berisi kolom dengan nama human-readable, plus '_value'.
    """
    label_field  = getattr(widget, 'label_field', '') or ''
    value_field  = getattr(widget, 'value_field', '_value') or '_value'
    series_field = getattr(widget, 'series_field', '') or ''

    if not label_field:
        return {'labels': [], 'values': [], 'series': []}

    if tidy_rows and label_field not in tidy_rows[0]:
        return {'labels': [], 'values': [], 'series': [],
                'warning': f'Kolom "{label_field}" tidak ada di data.'}

    if series_field and tidy_rows and series_field not in tidy_rows[0]:
        series_field = ''

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


def _get_entries_for_widget(widget) -> list:
    """
    Ambil tidy rows untuk widget dari approved submission.
    """
    dt_id = getattr(widget, 'data_type_id', None)
    if not dt_id:
        return []

    dt = DataType.query.get(dt_id)
    if not dt:
        return []

    schema = dt.get_fields_schema()
    raw_rows = []

    subs = (Submission.query.filter_by(status='approved')
            .join(Task, Task.id == Submission.task_id)
            .filter(Task.data_type_id == dt_id).all())
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

    return unpivot_rows(raw_rows, schema)


# ── ADMIN: Schema preview endpoint ────────────────────────────────────────────

@dashboard_bp.route('/admin/widgets/verified-data-types', methods=['GET'])
@jwt_required()
def get_verified_data_types():
    """
    Kembalikan data types yang memiliki setidaknya 1 submission approved.
    """
    u, err, code = _require_admin()
    if err: return err, code

    from sqlalchemy import distinct
    approved_dt_ids = set(
        row[0] for row in
        db.session.query(distinct(Task.data_type_id))
        .join(Submission, Submission.task_id == Task.id)
        .filter(Submission.status == 'approved')
        .all()
    )

    if not approved_dt_ids:
        return jsonify([]), 200

    data_types = DataType.query.filter(DataType.id.in_(approved_dt_ids)).all()
    result = []
    for dt in data_types:
        approved_count = (Submission.query
            .join(Task, Task.id == Submission.task_id)
            .filter(Task.data_type_id == dt.id, Submission.status == 'approved')
            .count())
        result.append({
            **dt.to_dict(),
            'approved_count': approved_count,
            'total_data':     approved_count,
        })
    return jsonify(result), 200


@dashboard_bp.route('/admin/widgets/schema/<int:dt_id>', methods=['GET'])
@jwt_required()
def get_data_type_schema(dt_id):
    u, err, code = _require_admin()
    if err: return err, code
    info = _parse_schema_fields(dt_id)
    return jsonify(info), 200


# ── ADMIN: Widgets stubs (Legacy compatibility) ───────────────────────────────

@dashboard_bp.route('/admin/widgets', methods=['GET'])
@jwt_required()
def get_widgets():
    return jsonify([]), 200


@dashboard_bp.route('/admin/widgets', methods=['POST'])
@jwt_required()
def create_widget():
    return jsonify({}), 201


@dashboard_bp.route('/admin/widgets/<int:wid>', methods=['PUT'])
@jwt_required()
def update_widget(wid):
    return jsonify({}), 200


@dashboard_bp.route('/admin/widgets/<int:wid>', methods=['DELETE'])
@jwt_required()
def delete_widget(wid):
    return jsonify({'message': 'deleted'}), 200


@dashboard_bp.route('/admin/widgets/<int:wid>/toggle-visibility', methods=['PUT'])
@jwt_required()
def toggle_visibility(wid):
    return jsonify({}), 200


@dashboard_bp.route('/admin/widgets/<int:wid>/preview', methods=['GET'])
@jwt_required()
def preview_widget(wid):
    return jsonify({'widget': {}, 'chart_data': {}, 'total_rows': 0, 'sample_rows': []}), 200


# ── PUBLIC: Widgets stubs ─────────────────────────────────────────────────────

@dashboard_bp.route('/public/widgets', methods=['GET'])
def public_widgets():
    return jsonify([]), 200
