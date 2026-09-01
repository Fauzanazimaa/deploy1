from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    password_plain = db.Column(db.String(256), nullable=True)
    role = db.Column(db.String(20), nullable=False, default='viewer')  # admin/contributor/viewer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    whatsapp = db.Column(db.String(30), nullable=True)

    tasks_assigned = db.relationship('Task', foreign_keys='Task.assigned_to', backref='assignee', lazy=True, cascade='all, delete-orphan')
    tasks_created = db.relationship('Task', foreign_keys='Task.assigned_by', backref='creator', lazy=True)
    submissions = db.relationship('Submission', backref='contributor', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'whatsapp': self.whatsapp,
            'password_plain': self.password_plain
        }


class DataType(db.Model):
    __tablename__ = 'data_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    fields_schema = db.Column(db.Text)  # JSON string
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship('Task', backref='data_type', lazy=True, cascade='all, delete-orphan')
    templates = db.relationship('ExcelTemplate', backref='data_type', lazy=True, cascade='all, delete-orphan')

    def get_fields_schema(self):
        if self.fields_schema:
            return json.loads(self.fields_schema)
        return []

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'fields_schema': self.get_fields_schema(),
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat()
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    data_type_id = db.Column(db.Integer, db.ForeignKey('data_types.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending/submitted/revision/approved
    deadline = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    submissions = db.relationship('Submission', backref='task', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'data_type_id': self.data_type_id,
            'data_type_name': self.data_type.name if self.data_type else None,
            'assigned_to': self.assigned_to,
            'assignee_username': self.assignee.username if self.assignee else None,
            'assignee_whatsapp': self.assignee.whatsapp if self.assignee else None,
            'assignee_password_plain': self.assignee.password_plain if self.assignee else None,
            'assigned_by': self.assigned_by,
            'creator_username': self.creator.username if self.creator else None,
            'status': self.status,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'created_at': self.created_at.isoformat()
        }


class Submission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    contributor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(500))
    source = db.Column(db.String(10), default='excel')  # 'excel' | 'form'
    form_data = db.Column(db.Text)                       # JSON jika source='form'
    status = db.Column(db.String(20), default='pending')  # pending/revision/approved
    revision_notes = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)

    def get_form_data(self):
        if self.form_data:
            return json.loads(self.form_data)
        return None

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'task_title': self.task.title if self.task else None,
            'data_type_name': self.task.data_type.name if (self.task and self.task.data_type) else None,
            'contributor_id': self.contributor_id,
            'contributor_username': self.contributor.username if self.contributor else None,
            'file_path': self.file_path,
            'source': self.source or 'excel',
            'status': self.status,
            'revision_notes': self.revision_notes,
            'submitted_at': self.submitted_at.strftime('%Y-%m-%d') if self.submitted_at else None,
            'reviewed_at': self.reviewed_at.strftime('%Y-%m-%d') if self.reviewed_at else None
        }


class ExcelTemplate(db.Model):
    __tablename__ = 'excel_templates'
    id = db.Column(db.Integer, primary_key=True)
    data_type_id = db.Column(db.Integer, db.ForeignKey('data_types.id'), nullable=False)
    file_path = db.Column(db.String(500))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    original_filename = db.Column(db.String(255))

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'data_type_id': self.data_type_id,
            'data_type_name': self.data_type.name if self.data_type else None,
            'file_path': self.file_path,
            'original_filename': self.original_filename,
            'created_by': self.created_by,
            'creator_username': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat()
        }


class AssignmentLetter(db.Model):
    __tablename__ = 'assignment_letters'
    id = db.Column(db.Integer, primary_key=True)
    task_title = db.Column(db.String(200), nullable=False, unique=True)
    file_path = db.Column(db.String(500), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    reference_number = db.Column(db.String(100), nullable=True)
    activity_name = db.Column(db.String(255), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'task_title': self.task_title,
            'file_path': self.file_path,
            'original_filename': self.original_filename,
            'reference_number': self.reference_number,
            'activity_name': self.activity_name,
            'created_by': self.created_by,
            'creator_username': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat()
        }


class SignedCoverLetter(db.Model):
    __tablename__ = 'signed_cover_letters'
    id = db.Column(db.Integer, primary_key=True)
    task_title = db.Column(db.String(200), nullable=False)
    contributor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    signer_role = db.Column(db.String(200), nullable=False)
    agency_name = db.Column(db.String(200), nullable=False)
    signer_name = db.Column(db.String(200), nullable=False)
    signature_img_path = db.Column(db.String(500), nullable=False)
    signed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    contributor = db.relationship('User', foreign_keys=[contributor_id])

    __table_args__ = (db.UniqueConstraint('task_title', 'contributor_id', name='_task_contributor_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'task_title': self.task_title,
            'contributor_id': self.contributor_id,
            'contributor_username': self.contributor.username if self.contributor else None,
            'signer_role': self.signer_role,
            'agency_name': self.agency_name,
            'signer_name': self.signer_name,
            'signature_img_path': self.signature_img_path,
            'signed_at': self.signed_at.isoformat(),
            'created_at': self.created_at.isoformat()
        }



