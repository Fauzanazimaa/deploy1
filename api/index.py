"""
Vercel serverless entry point.
File ini harus ada di folder /api di root project.
"""
import sys
import os

# Tambahkan folder backend ke path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app

app = create_app()

# Vercel butuh object bernama 'app'
