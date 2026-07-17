import os
from flask import Flask, send_file
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

from models import db, User


def create_app():
    app = Flask(__name__)

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # ── Database: PostgreSQL jika ada DATABASE_URL, fallback ke SQLite lokal ──
    db_url = os.environ.get('DATABASE_URL', '')
    if db_url:
        # Vercel/Heroku kadang kirim "postgres://" → harus "postgresql://"
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'pool_pre_ping': True,
            'pool_recycle': 300,
        }
        IS_LOCAL = False
    else:
        # Mode lokal — pakai SQLite
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'data_collection.db')}"
        IS_LOCAL = True

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get(
        'JWT_SECRET_KEY', 'super-secret-jwt-key-change-in-production'
    )
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

    # Folder lokal hanya dipakai saat bukan production
    if IS_LOCAL:
        app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
        app.config['TEMPLATES_EXCEL_FOLDER'] = os.path.join(BASE_DIR, 'templates_excel')
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['TEMPLATES_EXCEL_FOLDER'], exist_ok=True)

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r'/api/*': {'origins': '*'}})

    # SQLite foreign key enforcement (hanya lokal)
    if IS_LOCAL:
        from sqlalchemy import event
        from sqlalchemy.engine import Engine
        import sqlite3

        @event.listens_for(Engine, 'connect')
        def set_sqlite_pragma(dbapi_connection, connection_record):
            if isinstance(dbapi_connection, sqlite3.Connection):
                cursor = dbapi_connection.cursor()
                cursor.execute('PRAGMA foreign_keys=ON')
                cursor.close()

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.auth        import auth_bp
    from routes.admin       import admin_bp
    from routes.contributor import contributor_bp
    from routes.viewer      import viewer_bp
    from routes.dashboard   import dashboard_bp
    from routes.penduduk    import penduduk_bp

    app.register_blueprint(auth_bp,        url_prefix='/api/auth')
    app.register_blueprint(admin_bp,       url_prefix='/api/admin')
    app.register_blueprint(contributor_bp, url_prefix='/api/contributor')
    app.register_blueprint(viewer_bp,      url_prefix='/api/viewer')
    app.register_blueprint(dashboard_bp,   url_prefix='/api')
    app.register_blueprint(penduduk_bp,    url_prefix='/api')

    # Serve React frontend (mode lokal)
    frontend_dist = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend', 'dist'))

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        if path.startswith('api/'):
            from flask import abort
            abort(404)
        target = os.path.join(frontend_dist, path)
        if path and os.path.exists(target) and os.path.isfile(target):
            return send_file(target)
        index = os.path.join(frontend_dist, 'index.html')
        if os.path.exists(index):
            return send_file(index)
        return '<h3>Frontend belum di-build. Jalankan: cd frontend && npm run build</h3>', 404

    # ── Init DB & seed ────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        _seed_admin()

    return app


def _seed_admin():
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            role='admin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        print('Default admin created: admin / admin123')

    if not User.query.filter_by(username='kontributor').first():
        contrib = User(
            username='kontributor',
            email='kontributor@example.com',
            password_hash=generate_password_hash('kontributor123'),
            role='contributor',
            is_active=True,
        )
        db.session.add(contrib)
        db.session.commit()
        print('Default contributor created: kontributor / kontributor123')


if __name__ == '__main__':
    try:
        app = create_app()
        port = int(os.environ.get('PORT', 5001))
        print(f'\n Flask running → http://localhost:{port}\n')
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    except OSError as e:
        if '10048' in str(e) or 'Address already in use' in str(e):
            print('\nERROR: Port 5001 sudah dipakai!')
        else:
            print(f'\nERROR: {e}')
        input('Tekan Enter untuk keluar...')
    except KeyboardInterrupt:
        print('\nServer dihentikan.')
    except Exception as e:
        import traceback
        traceback.print_exc()
        input('\nTekan Enter untuk keluar...')
