"""
Storage abstraction layer.
- Jika SUPABASE_URL ada → pakai Supabase Storage
- Jika tidak → pakai filesystem lokal (untuk development)
"""
import os
import io

_USE_SUPABASE = bool(os.environ.get('SUPABASE_URL'))


# ── Supabase backend ──────────────────────────────────────────────────────────

_supabase_client = None

def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client
        _supabase_client = create_client(
            os.environ['SUPABASE_URL'],
            os.environ['SUPABASE_SERVICE_KEY'],
        )
    return _supabase_client


def UPLOADS_BUCKET():
    return os.getenv('SUPABASE_UPLOADS_BUCKET', 'submissions')

def TEMPLATES_BUCKET():
    return os.getenv('SUPABASE_TEMPLATES_BUCKET', 'templates')


# ── Local backend ─────────────────────────────────────────────────────────────

def _local_uploads_dir():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    return os.path.join(base, 'uploads')

def _local_templates_dir():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    return os.path.join(base, 'templates_excel')

def _bucket_to_local_dir(bucket_fn):
    """Map bucket name ke folder lokal."""
    name = bucket_fn() if callable(bucket_fn) else bucket_fn
    if 'template' in name:
        return _local_templates_dir()
    return _local_uploads_dir()


# ── Public API ────────────────────────────────────────────────────────────────

def upload_file(bucket, path: str, file_bytes: bytes, content_type: str = 'application/octet-stream') -> str:
    if _USE_SUPABASE:
        sb = _get_supabase()
        bucket_name = bucket() if callable(bucket) else bucket
        sb.storage.from_(bucket_name).upload(
            path, file_bytes,
            file_options={'content-type': content_type, 'upsert': 'true'}
        )
        return sb.storage.from_(bucket_name).get_public_url(path)
    else:
        folder = _bucket_to_local_dir(bucket)
        os.makedirs(folder, exist_ok=True)
        with open(os.path.join(folder, path), 'wb') as f:
            f.write(file_bytes)
        return path


def download_file(bucket, path: str) -> bytes:
    if _USE_SUPABASE:
        sb = _get_supabase()
        bucket_name = bucket() if callable(bucket) else bucket
        return sb.storage.from_(bucket_name).download(path)
    else:
        folder = _bucket_to_local_dir(bucket)
        file_path = os.path.join(folder, path)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f'File not found: {file_path}')
        with open(file_path, 'rb') as f:
            return f.read()


def delete_file(bucket, path: str) -> None:
    if _USE_SUPABASE:
        try:
            sb = _get_supabase()
            bucket_name = bucket() if callable(bucket) else bucket
            sb.storage.from_(bucket_name).remove([path])
        except Exception:
            pass
    else:
        try:
            folder = _bucket_to_local_dir(bucket)
            file_path = os.path.join(folder, path)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass


def get_public_url(bucket, path: str) -> str:
    if _USE_SUPABASE:
        sb = _get_supabase()
        bucket_name = bucket() if callable(bucket) else bucket
        return sb.storage.from_(bucket_name).get_public_url(path)
    else:
        return path
