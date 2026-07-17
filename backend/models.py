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
    role = db.Column(db.String(20), nullable=False, default='viewer')  # admin/contributor/viewer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    tasks_assigned = db.relationship('Task', foreign_keys='Task.assigned_to', backref='assignee', lazy=True, cascade='all, delete-orphan')
    tasks_created = db.relationship('Task', foreign_keys='Task.assigned_by', backref='creator', lazy=True)
    submissions = db.relationship('Submission', backref='contributor', lazy=True, cascade='all, delete-orphan')
    manual_entries = db.relationship('ManualEntry', backref='entered_by_user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }


class DataType(db.Model):
    __tablename__ = 'data_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    fields_schema = db.Column(db.Text)  # JSON string
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship('Task', backref='data_type', lazy=True, cascade='all, delete-orphan')
    manual_entries = db.relationship('ManualEntry', backref='data_type', lazy=True, cascade='all, delete-orphan')
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
            'contributor_id': self.contributor_id,
            'contributor_username': self.contributor.username if self.contributor else None,
            'file_path': self.file_path,
            'source': self.source or 'excel',
            'status': self.status,
            'revision_notes': self.revision_notes,
            'submitted_at': self.submitted_at.isoformat(),
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }


class ManualEntry(db.Model):
    __tablename__ = 'manual_entries'
    id = db.Column(db.Integer, primary_key=True)
    data_type_id = db.Column(db.Integer, db.ForeignKey('data_types.id'), nullable=False)
    data = db.Column(db.Text)  # JSON string
    entered_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_data(self):
        if self.data:
            return json.loads(self.data)
        return {}

    def to_dict(self):
        return {
            'id': self.id,
            'data_type_id': self.data_type_id,
            'data_type_name': self.data_type.name if self.data_type else None,
            'data': self.get_data(),
            'entered_by': self.entered_by,
            'entered_by_username': self.entered_by_user.username if self.entered_by_user else None,
            'created_at': self.created_at.isoformat()
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


class DashboardWidget(db.Model):
    """
    Konfigurasi widget yang tampil di dashboard viewer.
    Admin menentukan data apa yang ditampilkan, chart apa, dll.
    """
    __tablename__ = 'dashboard_widgets'
    id            = db.Column(db.Integer, primary_key=True)
    title         = db.Column(db.String(200), nullable=False)
    description   = db.Column(db.Text)
    category      = db.Column(db.String(50), default='Umum')  # Penduduk/Ekonomi/Kemiskinan/IPM/Tenaga Kerja/Umum
    data_type_id  = db.Column(db.Integer, db.ForeignKey('data_types.id'), nullable=True)
    # Sumber data: 'manual' | 'approved_submissions' | 'both'
    data_source   = db.Column(db.String(20), default='both')
    # Tipe tampilan: 'bar' | 'line' | 'pie' | 'doughnut' | 'table' | 'number'
    chart_type    = db.Column(db.String(20), default='bar')
    # Field yang dijadikan label (sumbu X / kategori)
    label_field   = db.Column(db.String(100))
    # Field yang dijadikan value (sumbu Y / angka)
    value_field   = db.Column(db.String(100))
    # Tampilkan di viewer publik?
    is_visible    = db.Column(db.Boolean, default=True)
    # Bisa di-download?
    allow_download = db.Column(db.Boolean, default=True)
    # Urutan tampil
    sort_order    = db.Column(db.Integer, default=0)
    created_by    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    data_type = db.relationship('DataType', foreign_keys=[data_type_id])
    creator   = db.relationship('User',     foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id':             self.id,
            'title':          self.title,
            'description':    self.description,
            'category':       self.category or 'Umum',
            'data_type_id':   self.data_type_id,
            'data_type_name': self.data_type.name if self.data_type else None,
            'data_source':    self.data_source,
            'chart_type':     self.chart_type,
            'label_field':    self.label_field,
            'value_field':    self.value_field,
            'is_visible':     self.is_visible,
            'allow_download': self.allow_download,
            'sort_order':     self.sort_order,
            'created_by':     self.created_by,
            'creator_username': self.creator.username if self.creator else None,
            'created_at':     self.created_at.isoformat(),
        }
