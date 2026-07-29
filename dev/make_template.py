import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableColumn, TableStyleInfo
from openpyxl.comments import Comment

wb = openpyxl.Workbook()

# STYLE
hdr_font = Font(name='Calibri', bold=True, size=11, color='FFFFFF')
hdr_fill = PatternFill(start_color='1F3864', end_color='1F3864', fill_type='solid')
hdr2_fill = PatternFill(start_color='2F5496', end_color='2F5496', fill_type='solid')
title_font = Font(name='Calibri', bold=True, size=14, color='1F3864')
body_font = Font(name='Calibri', size=10)
note_font = Font(name='Calibri', size=10, color='595959', italic=True)
thin_border = Border(
    left=Side(style='thin', color='B4C6E7'),
    right=Side(style='thin', color='B4C6E7'),
    top=Side(style='thin', color='B4C6E7'),
    bottom=Side(style='thin', color='B4C6E7'),
)
wrap_align = Alignment(wrap_text=True, vertical='top')
hdr_align = Alignment(horizontal='center', vertical='center', wrap_text=True)

# COLUMN SCHEMA — v4: academic hierarchy + AI generation metadata
# (name, required, type, valid_values, description, example)
columns = [
    # -- ACADEMIC --
    ('No',               False, 'INT',    '',                             'Nomor urut', '1'),
    ('education_level',  True,  'ENUM',   'SD,SMP,SMA,SMK,UTBK',         'Jenjang pendidikan', 'SMA'),
    ('grade',            True,  'ENUM',   '4-12,GAP_YEAR',               'Kelas', '10'),
    ('curriculum',       True,  'ENUM',   'K13,Merdeka,UTBK,Internal',   'Kurikulum', 'Merdeka'),
    ('subject_code',     True,  'STRING', '',                            'Kode Subject — lihat Referensi', 'MTK-WAJIB-11'),
    ('chapter_code',     False, 'STRING', '',                            'Kode Chapter — lihat Referensi', 'MTK11-BAB1'),
    ('topic_title',      False, 'STRING', '',                            'Judul topik (contoh: SPLDV)', 'Metode Eliminasi'),
    ('lo_title',         False, 'STRING', '',                            'Judul Learning Outcome / SubTopic', 'Menyelesaikan SPLDV dengan eliminasi'),
    ('lo_code',          False, 'STRING', '',                            'Kode CP/TP/ATP', 'TP.3.3'),
    # -- QUESTION --
    ('question_type',    True,  'ENUM',   'SINGLE_CHOICE,MULTIPLE_CHOICE,TRUE_FALSE', 'Tipe soal', 'SINGLE_CHOICE'),
    ('difficulty',       True,  'ENUM',   'EASY,MEDIUM,HARD',            'Tingkat kesulitan', 'MEDIUM'),
    ('content',          True,  'TEXT',   '',                            'Teks soal HTML', 'Hasil dari 25 x 4 + 12 adalah ...'),
    ('image_url',        False, 'STRING', '',                            'URL gambar', ''),
    ('explanation',      False, 'TEXT',   '',                            'Pembahasan', '25 x 4 = 100, 100 + 12 = 112'),
    ('correct_answer',   True,  'STRING', '',                            'A/B/C/D/E atau A,B,C atau TRUE/FALSE', 'A'),
    ('option_a',         False, 'TEXT',   '',                            'Opsi A', '112'),
    ('option_b',         False, 'TEXT',   '',                            'Opsi B', '100'),
    ('option_c',         False, 'TEXT',   '',                            'Opsi C', '88'),
    ('option_d',         False, 'TEXT',   '',                            'Opsi D', '96'),
    ('option_e',         False, 'TEXT',   '',                            'Opsi E', '87'),
    # -- AI METADATA --
    ('bloom_level',      False, 'ENUM',   'C1,C2,C3,C4,C5,C6',          'Taksonomi Bloom', 'C3'),
    ('thinking_level',   False, 'ENUM',   'LOTS,MOTS,HOTS',             'Level berpikir', 'HOTS'),
    ('language',         False, 'ENUM',   'id,en',                       'Bahasa soal', 'id'),
    ('source',           False, 'STRING', '',                            'Asal soal (Manual/AI/Import Excel/Kemendikbud/Sekolah/Guru/Publisher)', 'Import Excel'),
    ('score',            False, 'NUM',    '',                            'Bobot skor default 1.0', '1.0'),
    ('negative_score',   False, 'NUM',    '',                            'Skor negatif default 0.0', '0.0'),
    ('estimated_time',   False, 'INT',    '',                            'Waktu estimasi (detik)', '90'),
    ('tags',             False, 'STRING', '',                            'Tag pisah koma', 'aritmatika, operasi-hitung'),
    # -- AI GENERATION (JSONB — optional advanced) --
    ('difficulty_params',    False, 'JSONB', '',  'Parameter kesulitan: {"steps":3,"distractors":4,"range":[1,100]}', ''),
    ('distractor_patterns',  False, 'JSONB', '',  'Pola jawaban salah: [{"type":"sign_error","desc":"Salin tanda negatif"}]', ''),
    ('cognitive_skills',     False, 'JSONB', '',  'Keterampilan kognitif: ["transform_equation","simplify_expression"]', ''),
    ('prerequisites',        False, 'JSONB', '',  'Prasyarat: {"topic_ids":[...],"lo_ids":[...]}', ''),
    ('ai_metadata',          False, 'JSONB', '',  'Metadata AI: {"ai_generated":true,"model":"gpt-4","version":"1.0"}', ''),
]

col_names = [c[0] for c in columns]

# ============================================================
# SHEET 1: INSTRUKSI
# ============================================================
ws_inst = wb.active
ws_inst.title = 'Instruksi'
ws_inst.sheet_properties.tabColor = '1F3864'

ws_inst.merge_cells('A3:G3')
ws_inst['A3'].value = 'TEMPLATE IMPORT DATA SOAL — YakinLulus.id'
ws_inst['A3'].font = title_font

# AI metadata block
for r, k, v in [
    (5,  'AI_METADATA_VERSION', '2.0'),
    (6,  'AI_SCHEMA_SHEET', 'Schema'),
    (7,  'AI_DATA_SHEET', 'Data Soal'),
    (8,  'AI_TABLE_NAME', 'Data_Soal'),
    (9,  'AI_TARGET_TABLES', 'questions + question_options + topics + learning_outcomes'),
    (10, 'AI_FILE_FORMAT', 'xlsx'),
    (11, 'AI_NORMALIZATION', 'Grade→Curriculum→Subject→Chapter→Topic→LearningOutcome'),
]:
    ws_inst.cell(row=r, column=1, value=k).font = Font(name='Calibri', bold=True, size=9, color='808080')
    ws_inst.cell(row=r, column=2, value=v).font = note_font

instructions = [
    (13, 'PETUNJUK PENGISIAN', True),
    (15, '1. Buka sheet "Data Soal" untuk mengisi soal.', False),
    (16, '2. Kolom wajib: education_level, grade, curriculum, subject_code, question_type, difficulty, content, correct_answer.', False),
    (17, '3. academic columns: education_level + grade + curriculum + subject_code + chapter_code + topic_title + lo_title', False),
    (18, '4. SINGLE_CHOICE: correct_answer = A/B/C/D/E. MULTIPLE: A,B,C. TRUE_FALSE: TRUE/FALSE.', False),
    (19, '5. Bloom level: C1(Remember) C2(Understand) C3(Apply) C4(Analyze) C5(Evaluate) C6(Create).', False),
    (20, '6. Thinking level: LOTS(Lower) MOTS(Middle) HOTS(Higher Order).', False),
    (21, '7. Tags: pisah koma.', False),
    (22, '8. AI JSONB columns (difficulty_params etc): JSON objects — optional, untuk AI generation engine.', False),
    (23, '9. score: bobot soal (default 1.0). negative_score: skor negatif untuk UTBK (default 0.0).', False),
    (24, '10. estimated_time: estimasi waktu jawab dalam detik.', False),
    (26, 'IMPORT: jalankan script import backend / API POST /import.', False),
]
for r, txt, is_title in instructions:
    cell = ws_inst.cell(row=r, column=1, value=txt)
    cell.font = title_font if is_title else note_font

ws_inst.column_dimensions['A'].width = 24
ws_inst.column_dimensions['B'].width = 55

# ============================================================
# SHEET 2: DATA SOAL
# ============================================================
ws_data = wb.create_sheet('Data Soal')
ws_data.sheet_properties.tabColor = '1B5E20'

human_headers = [c[0] + ('*' if c[1] else '') for c in columns]
for j, h in enumerate(human_headers, 1):
    cell = ws_data.cell(row=1, column=j, value=h)
    cell.font = hdr_font
    cell.fill = hdr_fill
    cell.alignment = hdr_align
    cell.border = thin_border
    c = columns[j-1]
    comment_text = (
        f"Required: {'YES' if c[1] else 'NO'}\n"
        f"Type: {c[2]}\n"
        f"{'Values: ' + c[3] if c[3] else ''}\n"
        f"Description: {c[4]}\n"
        f"Example: {c[5]}"
    )
    cell.comment = Comment(comment_text, 'AI Schema', width=300, height=160)

# Row 2: type metadata (hidden)
type_fill = PatternFill(start_color='E8F0FE', end_color='E8F0FE', fill_type='solid')
for j, c in enumerate(columns, 1):
    cell = ws_data.cell(row=2, column=j)
    type_info = c[2]
    if c[3]:
        type_info += f'|{c[3]}'
    cell.value = type_info
    cell.font = Font(name='Calibri', size=9, color='A6C8E8')
    cell.fill = type_fill
    cell.border = thin_border
    cell.alignment = Alignment(horizontal='center', vertical='center')

ws_data.freeze_panes = 'A3'

# Sample row (row 3) — SMA Merdeka Matematika SPLDV
sample = [
    1, 'SMA', '10', 'Merdeka', 'MTK-WAJIB-10', 'MTK10-BAB5', 'Persamaan Linear',
    'Menyelesaikan SPLDV', 'TP.5.1',
    'SINGLE_CHOICE', 'MEDIUM',
    'Sebuah toko menjual 2 jenis buah: apel Rp 5.000/ons dan jeruk Rp 3.000/ons. Jika beli total 10 ons seharga Rp 42.000, maka banyak apel yang dibeli adalah ...',
    '', '25 x 4 = 100, 100 + 12 = 112',
    'A', '6 ons', '4 ons', '5 ons', '3 ons', '8 ons',
    'C3', 'MOTS', 'id', 'Import Excel', '1.0', '0', '90',
    'aljabar, SPLDV, eliminasi',
    '{"steps":3,"distractors":4,"range":[1,100]}',
    '[{"type":"sign_error","desc":"Salin tanda negatif"}]',
    '["transform_equation","substitute_value"]',
    '',
    '{"ai_generated":true,"model":"gpt-4","version":"1.0"}',
]
for j, v in enumerate(sample, 1):
    cell = ws_data.cell(row=3, column=j, value=v)
    cell.font = Font(name='Calibri', size=10, color='808080', italic=True)
    cell.fill = PatternFill(start_color='FFF8E1', end_color='FFF8E1', fill_type='solid')
    cell.border = thin_border
    cell.alignment = wrap_align

# Empty rows 4-500
for row_idx in range(4, 501):
    for col_idx in range(1, len(columns) + 1):
        c = ws_data.cell(row=row_idx, column=col_idx)
        c.border = thin_border
        c.alignment = wrap_align
        c.font = body_font
    ws_data.cell(row=row_idx, column=1).value = f'=IF(B{row_idx}="","",ROW()-2)'

# Excel Table
table = Table(displayName='Data_Soal', ref=f'A1:{get_column_letter(len(columns))}500')
table.tableStyleInfo = TableStyleInfo(
    name='TableStyleMedium9', showFirstColumn=False, showLastColumn=False,
    showRowStripes=True, showColumnStripes=False,
)
for j, c in enumerate(columns, 1):
    table.tableColumns.append(TableColumn(id=j, name=c[0]))
ws_data.add_table(table)

# Data validations
def add_dv(ws, formula, cols_str, err_msg, blank=False):
    dv = DataValidation(type='list', formula1=formula, allow_blank=blank)
    dv.error = err_msg
    ws.add_data_validation(dv)
    dv.add(cols_str)

add_dv(ws_data, '"SMA,SMP,SD,SMK,UTBK"', 'C4:C500', 'Pilih jenjang')
add_dv(ws_data, '"K13,Merdeka,UTBK,Internal"', 'E4:E500', 'Pilih kurikulum')
add_dv(ws_data, '"SINGLE_CHOICE,MULTIPLE_CHOICE,TRUE_FALSE"', 'J4:J500', 'Pilih tipe soal')
add_dv(ws_data, '"EASY,MEDIUM,HARD"', 'K4:K500', 'Pilih difficulty')
add_dv(ws_data, '"C1,C2,C3,C4,C5,C6"', 'W4:W500', 'Pilih Bloom level', True)
add_dv(ws_data, '"LOTS,MOTS,HOTS"', 'X4:X500', 'Pilih thinking level', True)
add_dv(ws_data, '"id,en"', 'Y4:Y500', 'Pilih bahasa', True)

# Column widths
col_widths = [5, 12, 8, 14, 20, 20, 25, 30, 12, 18, 12, 55, 30, 45, 16, 30, 30, 30, 30, 30, 12, 12, 10, 18, 10, 12, 14, 28, 35, 35, 35, 30, 35]
for i, w in enumerate(col_widths, 1):
    if i <= len(columns):
        ws_data.column_dimensions[get_column_letter(i)].width = w

ws_data.row_dimensions[2].hidden = True

# ============================================================
# SHEET 3: REFERENSI
# ============================================================
ws_ref = wb.create_sheet('Referensi')
ws_ref.sheet_properties.tabColor = 'BF8F00'

r = 1
ws_ref.cell(row=r, column=1, value='DAFTAR EDUCATION LEVEL').font = title_font
ws_ref.merge_cells(f'A{r}:D{r}')
r += 1
for j, h in enumerate(['Code', 'Name', 'Active'], 1):
    cell = ws_ref.cell(row=r, column=j, value=h)
    cell.font = hdr_font; cell.fill = hdr_fill; cell.alignment = hdr_align; cell.border = thin_border
r += 1
for code, name in [('SD','Sekolah Dasar'),('SMP','Sekolah Menengah Pertama'),('SMA','Sekolah Menengah Atas'),('SMK','Sekolah Menengah Kejuruan'),('UTBK','UTBK')]:
    for j, v in enumerate([code, name, 'YES'], 1):
        cell = ws_ref.cell(row=r, column=j, value=v)
        cell.font = body_font; cell.border = thin_border
    r += 1

r += 2
ws_ref.cell(row=r, column=1, value='DAFTAR CURRICULUM').font = title_font
ws_ref.merge_cells(f'A{r}:D{r}')
r += 1
for j, h in enumerate(['Code', 'Name', 'Description'], 1):
    cell = ws_ref.cell(row=r, column=j, value=h)
    cell.font = hdr_font; cell.fill = hdr_fill; cell.alignment = hdr_align; cell.border = thin_border
r += 1
for code, name, desc in [('K13','Kurikulum 2013','Kurikulum 2013'),('Merdeka','Kurikulum Merdeka','Kurikulum Merdeka / Prototype'),('UTBK','UTBK','UTBK SNBT'),('Internal','Internal','Internal')]:
    for j, v in enumerate([code, name, desc], 1):
        cell = ws_ref.cell(row=r, column=j, value=v)
        cell.font = body_font; cell.border = thin_border
    r += 1

r += 2
ws_ref.cell(row=r, column=1, value='DAFTAR GRADE').font = title_font
ws_ref.merge_cells(f'A{r}:D{r}')
r += 1
for j, h in enumerate(['Level', 'Grade', 'Alias'], 1):
    cell = ws_ref.cell(row=r, column=j, value=h)
    cell.font = hdr_font; cell.fill = hdr_fill; cell.alignment = hdr_align; cell.border = thin_border
r += 1
for lvl, gr, alias in [('SMP','7',''),('SMP','8',''),('SMP','9',''),('SMA','10','X'),('SMA','11','XI'),('SMA','12','XII')]:
    for j, v in enumerate([lvl, gr, alias], 1):
        cell = ws_ref.cell(row=r, column=j, value=v)
        cell.font = body_font; cell.border = thin_border
    r += 1

r += 2
ws_ref.cell(row=r, column=1, value='DAFTAR SUBJECT').font = title_font
ws_ref.merge_cells(f'A{r}:D{r}')
r += 1
for j, h in enumerate(['Subject Code', 'Nama Subject', 'Level', 'Curriculum'], 1):
    cell = ws_ref.cell(row=r, column=j, value=h)
    cell.font = hdr_font; cell.fill = hdr_fill; cell.alignment = hdr_align; cell.border = thin_border
r += 1
subjects = [
    ('MTK-WAJIB-10', 'Matematika Wajib Kelas 10', 'SMA', 'Merdeka'),
    ('MTK-WAJIB-11', 'Matematika Wajib Kelas 11', 'SMA', 'Merdeka'),
    ('MTK-WAJIB-12', 'Matematika Wajib Kelas 12', 'SMA', 'Merdeka'),
    ('BINDO-10', 'Bahasa Indonesia Kelas 10', 'SMA', 'K13'),
    ('BING-10', 'Bahasa Inggris Kelas 10', 'SMA', 'K13'),
    ('FISIKA-10', 'Fisika Kelas 10', 'SMA', 'K13'),
    ('KIMIA-10', 'Kimia Kelas 10', 'SMA', 'K13'),
    ('BIOLOGI-10', 'Biologi Kelas 10', 'SMA', 'K13'),
    ('SEJARAH-10', 'Sejarah Kelas 10', 'SMA', 'K13'),
]
for s in subjects:
    for j, v in enumerate(s, 1):
        cell = ws_ref.cell(row=r, column=j, value=v)
        cell.font = body_font; cell.border = thin_border
    r += 1

r += 2
ws_ref.cell(row=r, column=1, value='DAFTAR CHAPTER / BAB').font = title_font
ws_ref.merge_cells(f'A{r}:D{r}')
r += 1
for j, h in enumerate(['Chapter Code', 'Nama Bab', 'Subject Code', 'Order'], 1):
    cell = ws_ref.cell(row=r, column=j, value=h)
    cell.font = hdr_font; cell.fill = hdr_fill; cell.alignment = hdr_align; cell.border = thin_border
r += 1
chapters = [
    ('MTK10-BAB1', 'Persamaan & Pertidaksamaan', 'MTK-WAJIB-10', 1),
    ('MTK10-BAB5', 'Persamaan Linear', 'MTK-WAJIB-10', 5),
    ('MTK11-BAB1', 'Eksponen & Logaritma', 'MTK-WAJIB-11', 1),
    ('MTK11-BAB2', 'Barisan & Deret', 'MTK-WAJIB-11', 2),
    ('FIS10-BAB1', 'Besaran & Satuan', 'FISIKA-10', 1),
]
for ch in chapters:
    for j, v in enumerate(ch, 1):
        cell = ws_ref.cell(row=r, column=j, value=v)
        cell.font = body_font; cell.border = thin_border
    r += 1

ws_ref.column_dimensions['A'].width = 22
ws_ref.column_dimensions['B'].width = 38
ws_ref.column_dimensions['C'].width = 22
ws_ref.column_dimensions['D'].width = 18

# ============================================================
# SHEET 4: SCHEMA
# ============================================================
ws_schema = wb.create_sheet('Schema')
ws_schema.sheet_properties.tabColor = '37474F'

schema_headers = [
    'COLUMN_NAME', 'REQUIRED', 'DATA_TYPE', 'VALID_VALUES',
    'DB_TABLE', 'DB_COLUMN', 'DESCRIPTION', 'EXAMPLE'
]
for j, h in enumerate(schema_headers, 1):
    cell = ws_schema.cell(row=1, column=j, value=h)
    cell.font = Font(name='Consolas', bold=True, size=10, color='FFFFFF')
    cell.fill = PatternFill(start_color='37474F', end_color='37474F', fill_type='solid')
    cell.alignment = hdr_align
    cell.border = thin_border

db_map = {
    'No':                 ('',       '',                    'Auto-number'),
    'education_level':    ('questions → education_levels', 'subject_id→level_id', 'Resolved via education_levels.code'),
    'grade':              ('questions → grades',           'subject_id→grade_id',  'Resolved via grades'),
    'curriculum':         ('questions → curriculums',      'subject_id→curriculum_id', 'Resolved via curriculums'),
    'subject_code':       ('questions', 'subject_id',      'Resolved via subjects.code'),
    'chapter_code':       ('questions', 'chapter_id',      'Resolved via chapters.name'),
    'topic_title':        ('topics', 'title',              'NEW TABLE: chapters→topics'),
    'lo_title':           ('learning_outcomes', 'title',   'NEW TABLE: topics→learning_outcomes'),
    'lo_code':            ('learning_outcomes', 'code',    'CP/TP/ATP code'),
    'question_type':      ('questions', 'question_type',   'SINGLE_CHOICE/MULTIPLE_CHOICE/TRUE_FALSE'),
    'difficulty':         ('questions', 'difficulty',       'EASY/MEDIUM/HARD'),
    'content':            ('questions', 'content',          'TEXT NOT NULL'),
    'image_url':          ('questions', 'image_url',        'TEXT nullable'),
    'explanation':        ('questions', 'explanation',      'TEXT nullable'),
    'correct_answer':     ('question_options', 'is_correct','Determines which label has is_correct=true'),
    'option_a':           ('question_options', 'content',  'Row where label=A'),
    'option_b':           ('question_options', 'content',  'Row where label=B'),
    'option_c':           ('question_options', 'content',  'Row where label=C'),
    'option_d':           ('question_options', 'content',  'Row where label=D'),
    'option_e':           ('question_options', 'content',  'Row where label=E'),
    'bloom_level':        ('questions', 'bloom_level',     'C1-C6 nullable'),
    'thinking_level':     ('questions', 'thinking_level',  'LOTS/MOTS/HOTS nullable'),
    'language':           ('questions', 'language',         'VARCHAR default id'),
    'source':             ('questions', 'source',           'VARCHAR nullable'),
    'score':              ('questions', 'score',            'DECIMAL(5,2) default 1.0'),
    'negative_score':     ('questions', 'negative_score',   'DECIMAL(5,2) default 0.0'),
    'estimated_time':     ('questions', 'estimated_time',   'INT nullable, seconds'),
    'tags':               ('question_tag_map', 'tag_id',   'Resolved via question_tags.name'),
    'difficulty_params':  ('questions', 'difficulty_params', 'JSONB nullable'),
    'distractor_patterns':('questions', 'distractor_patterns','JSONB nullable'),
    'cognitive_skills':   ('questions', 'cognitive_skills',  'JSONB nullable'),
    'prerequisites':      ('questions', 'prerequisites',     'JSONB nullable'),
    'ai_metadata':        ('questions', 'ai_metadata',       'JSONB nullable'),
}

for i, c in enumerate(columns, 2):
    col_name = c[0]
    db_tbl, db_col, db_note = db_map.get(col_name, ('', '', ''))
    row_data = [col_name, 'YES' if c[1] else 'NO', c[2], c[3], db_tbl, db_col, db_note, c[5]]
    for j, v in enumerate(row_data, 1):
        cell = ws_schema.cell(row=i, column=j, value=v)
        cell.font = Font(name='Consolas', size=10)
        cell.border = thin_border
        cell.alignment = wrap_align if j >= 7 else Alignment(vertical='top')
        if i % 2 == 0:
            cell.fill = PatternFill(start_color='F5F5F5', end_color='F5F5F5', fill_type='solid')

ws_schema.column_dimensions['A'].width = 22
ws_schema.column_dimensions['B'].width = 10
ws_schema.column_dimensions['C'].width = 12
ws_schema.column_dimensions['D'].width = 40
ws_schema.column_dimensions['E'].width = 28
ws_schema.column_dimensions['F'].width = 22
ws_schema.column_dimensions['G'].width = 55
ws_schema.column_dimensions['H'].width = 30
ws_schema.freeze_panes = 'A2'

# ============================================================
# SAVE
# ============================================================
out = 'D:/Project/EdTech/Yakinlulus.id/template_import_soal_v4.xlsx'
wb.save(out)
print(f'OK: {out}')
