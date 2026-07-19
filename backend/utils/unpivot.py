"""
unpivot.py — Transformasi cross-table → tidy (normalized) format.

Input (format yang disimpan oleh kontributor):
  schema: {header_levels, first_column}
  rows: [{"__row_label": "X", "__col_0": "10", "__col_1": "20", ...}]

Output (tidy rows siap untuk visualisasi):
  [
    {"Jenis Pengairan": "X", "Kecamatan": "Kamang Baru", "Tahun": "2021", "_value": 10.0},
    {"Jenis Pengairan": "X", "Kecamatan": "Kamang Baru", "Tahun": "2022", "_value": 20.0},
    ...
  ]

Untuk single-level schema (tanpa group):
  rows: [{"__row_label": "Kec. A", "__col_0": "100", "__col_1": "200"}]
  → [{"Kecamatan": "Kec. A", "2021": "100", "_value": 100.0, "_col_label": "2021"}]
"""

from utils.excel import normalize_schema


def _build_col_paths(levels: list) -> list:
    """
    Untuk tiap indeks kolom leaf (0..N-1), kembalikan dict berisi label
    dari setiap level ancestor. Level name diambil dari posisi.

    Contoh multi-level (Kecamatan × Tahun):
      levels = [
        [{"label": "Kamang Baru", "span": 2}, {"label": "Sijunjung", "span": 2}],
        [{"label": "2021"}, {"label": "2022"}, {"label": "2021"}, {"label": "2022"}]
      ]
    → col_paths = [
        {"_dim_0": "Kamang Baru", "_dim_1": "2021"},
        {"_dim_0": "Kamang Baru", "_dim_1": "2022"},
        {"_dim_0": "Sijunjung",   "_dim_1": "2021"},
        {"_dim_0": "Sijunjung",   "_dim_1": "2022"},
      ]

    Contoh single-level (hanya Tahun):
      levels = [[{"label": "2021"}, {"label": "2022"}]]
    → col_paths = [{"_dim_0": "2021"}, {"_dim_0": "2022"}]
    """
    if not levels:
        return []

    leaf_level = levels[-1]
    n = len(leaf_level)
    paths = [{} for _ in range(n)]

    for lvl_idx, level in enumerate(levels):
        key = f'_dim_{lvl_idx}'
        if lvl_idx < len(levels) - 1:
            # Non-leaf: group dengan span
            col_pos = 0
            for grp in level:
                span  = grp.get('span', 1)
                label = str(grp.get('label', '') or '').strip()
                for i in range(col_pos, min(col_pos + span, n)):
                    paths[i][key] = label
                col_pos += span
        else:
            # Leaf: satu label per kolom
            for i, leaf in enumerate(leaf_level):
                label = str(leaf.get('label', leaf.get('name', f'col_{i}')) or '').strip()
                paths[i][key] = label

    return paths


def get_dimension_names(schema: dict) -> dict:
    """
    Kembalikan mapping _dim_N → nama dimensi yang human-readable.
    Juga kembalikan nama kolom first_column.

    Returns:
      {
        'row_dim': 'Jenis Pengairan',   # nama first_column (None jika tidak ada)
        'col_dims': {                    # nama tiap level header
          '_dim_0': 'Kecamatan',        # level 0 = nama group (Kecamatan)
          '_dim_1': 'Tahun',            # level 1 = nama leaf (Tahun)
        },
        'value_col': '_value',
      }
    """
    s      = normalize_schema(schema)
    fc     = s.get('first_column', {})
    levels = s.get('header_levels', [[]])

    row_dim = None
    if fc.get('enabled') and fc.get('label'):
        row_dim = str(fc['label']).replace('\n', ' / ').strip()

    col_dims = {}
    for lvl_idx, level in enumerate(levels):
        key = f'_dim_{lvl_idx}'
        if not level:
            col_dims[key] = f'Dimensi {lvl_idx + 1}'
            continue

        is_last = (lvl_idx == len(levels) - 1)
        if is_last:
            # Leaf level — coba deteksi apakah semua label numerik (tahun)
            labels = [str(c.get('label', c.get('name', '')) or '').strip()
                      for c in level if isinstance(c, dict)]
            numeric = [l for l in labels if l.isdigit()]
            if len(numeric) >= len(labels) * 0.7:
                col_dims[key] = 'Tahun'
            else:
                col_dims[key] = 'Kolom'
        else:
            # Group level — coba deteksi dari nama label
            labels = [str(c.get('label', '') or '').strip() for c in level if isinstance(c, dict)]
            col_dims[key] = _guess_dimension_name(labels) or f'Kelompok {lvl_idx + 1}'

    return {'row_dim': row_dim, 'col_dims': col_dims, 'value_col': '_value'}


def _guess_dimension_name(labels: list) -> str:
    """Tebak nama dimensi dari contoh label (heuristik sederhana)."""
    if not labels:
        return ''
    sample = ' '.join(labels[:5]).lower()
    import re
    kec_pat  = re.compile(r'\b(kec|kecamatan)\b', re.I)
    kel_pat  = re.compile(r'\b(kel|kelurahan|desa)\b', re.I)
    kab_pat  = re.compile(r'\b(kab|kabupaten|kota|provinsi)\b', re.I)
    year_pat = re.compile(r'\b(20\d{2}|19\d{2})\b')
    month_pat= re.compile(r'\b(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des|'
                          r'january|february|march|april|june|july|august|'
                          r'september|october|november|december)\b', re.I)
    if kec_pat.search(sample):   return 'Kecamatan'
    if kel_pat.search(sample):   return 'Kelurahan'
    if kab_pat.search(sample):   return 'Wilayah'
    if year_pat.search(sample):  return 'Tahun'
    if month_pat.search(sample): return 'Bulan'
    return ''


def unpivot_rows(rows: list, schema: dict) -> list:
    """
    Konversi daftar cross-table rows (format __col_N) ke tidy rows.

    Setiap sel dalam cross-table menjadi satu baris dalam tidy output:
      input row:  {"__row_label": "Irigasi Teknis", "__col_0": "10", "__col_1": "20"}
      output:     [
        {"Jenis Pengairan": "Irigasi Teknis", "Kecamatan": "Kamang Baru", "Tahun": "2021", "_value": 10.0},
        {"Jenis Pengairan": "Irigasi Teknis", "Kecamatan": "Kamang Baru", "Tahun": "2022", "_value": 20.0},
      ]

    Untuk flat schema (bukan cross-table), kembalikan rows as-is dengan sedikit normalisasi.
    """
    if not rows:
        return []

    s      = normalize_schema(schema)
    fc     = s.get('first_column', {})
    levels = s.get('header_levels', [[]])

    has_first = fc.get('enabled', False)
    fc_label  = str(fc.get('label', 'Baris') or 'Baris').replace('\n', ' / ').strip()

    # Cek apakah ini cross-table (ada __col_N) atau flat
    sample = rows[0] if rows else {}
    is_cross = any(k.startswith('__col_') for k in sample.keys())

    if not is_cross:
        # Flat schema — kembalikan as-is (sudah tidy)
        return rows

    leaf_level = levels[-1] if levels else []
    col_paths  = _build_col_paths(levels)
    dim_names  = get_dimension_names(schema)
    col_dims   = dim_names['col_dims']

    # Buat mapping _dim_N → nama dimensi yang readable
    renamed = {}
    for key, name in col_dims.items():
        renamed[key] = name

    tidy = []
    for row in rows:
        if not isinstance(row, dict):
            continue

        # Base: nilai first_column (baris)
        base = {}
        if has_first:
            base[fc_label] = str(row.get('__row_label', '') or '').strip()

        for col_idx, path in enumerate(col_paths):
            raw_val = row.get(f'__col_{col_idx}', '')
            # Parse nilai numerik
            try:
                num_str = str(raw_val).replace(',', '.').replace(' ', '').strip()
                value   = float(num_str) if num_str else None
            except (ValueError, TypeError):
                value = None

            # Bangun record dengan dimensi yang sudah diberi nama
            record = dict(base)
            for dim_key, dim_val in path.items():
                dim_name = renamed.get(dim_key, dim_key)
                record[dim_name] = dim_val

            record['_value']     = value
            record['_col_index'] = col_idx
            record['_raw_value'] = str(raw_val).strip() if raw_val not in (None, '') else ''
            tidy.append(record)

    return tidy


def get_tidy_dimensions(schema: dict) -> list:
    """
    Kembalikan daftar nama dimensi yang akan tersedia setelah unpivot.
    Digunakan untuk mengisi dropdown field di AdminPublicDashboard.

    Returns list of {name, label, type} — siap dipakai sebagai field options.
    """
    s      = normalize_schema(schema)
    fc     = s.get('first_column', {})
    levels = s.get('header_levels', [[]])
    dim_names = get_dimension_names(schema)

    dims = []

    # First column (baris)
    if fc.get('enabled') and fc.get('label'):
        fc_label = str(fc['label']).replace('\n', ' / ').strip()
        dims.append({
            'name':  fc_label,
            'label': fc_label,
            'type':  'category',
            'source': 'row',
        })

    # Kolom dimensi dari header levels
    for key, name in dim_names['col_dims'].items():
        dims.append({
            'name':  name,
            'label': name,
            'type':  'time' if name == 'Tahun' else 'category',
            'source': 'col',
            'dim_key': key,
        })

    # Nilai numerik
    dims.append({
        'name':  '_value',
        'label': 'Nilai (Numerik)',
        'type':  'numeric',
        'source': 'value',
    })

    return dims
