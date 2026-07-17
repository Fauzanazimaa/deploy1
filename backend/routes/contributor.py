from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, User, Task, Submission, ExcelTemplate
from storage import upload_file, download_file, UPLOADS_BUCKET, TEMPLATES_BUCKET
from datetime import datetime
import io
import uuid

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

    import json as _json
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
