```markdown id="b7p2ks"
# 12_engineering_implementation_guide/question_bank/04_excel_import_engine.md

# Excel Import Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi **Excel Import Engine** untuk Question Bank YakinLulus.id.

Excel Import Engine bertugas mengubah file spreadsheet yang dibuat oleh:

- guru;
- admin;
- content team;
- partner pendidikan;

menjadi data soal terstruktur yang dapat digunakan oleh:

- Question Bank;
- CBT Engine;
- Learning System;
- AI Pipeline.


Tujuan utama:


```

Easy Content Migration

*

Standardized Template

*

Automatic Validation

*

Bulk Processing

*

Error Reporting

```


---

# 2. Excel Import Architecture


```

```
          Excel File (.xlsx)


                |

                |

         File Upload Service


                |

                |

         Excel Parser Engine


                |

    +-----------+-----------+

    |                       |
```

Column Mapping        Data Validation

```
    |                       |

    +-----------+-----------+

                |

         Question DTO


                |

         Import Processor


                |

         Question Database
```

```


---

# 3. Supported Excel Template


Template standar:


```

Question Bank Import Template.xlsx

```


Sheet:


```

Questions

Options

Metadata

Media

```


---

# 4. Questions Sheet Structure


Kolom:


| Column | Description |
|-|-|
| question_code | ID soal |
| question_text | Isi soal |
| question_type | Jenis soal |
| difficulty | Tingkat kesulitan |
| answer_key | Jawaban benar |
| explanation | Pembahasan |
| source | Sumber soal |


Example:


|question_code|question_text|answer_key|
|-|-|-|
|MAT001|2 + 2 = ?|B|

---

# 5. Options Sheet Structure


Format:


| Column | Description |
|-|-|
| question_code | Reference |
| option_label | A/B/C/D |
| option_text | Option Content |


Example:


```

MAT001 | A | 3

MAT001 | B | 4

MAT001 | C | 5

MAT001 | D | 6

```

---

# 6. Metadata Sheet


Menyimpan:


| Field | Example |
|-|-|
| education_level | SMA |
| grade | 10 |
| subject | Matematika |
| chapter | Aljabar |
| topic | Linear Equation |
| curriculum | Kurikulum Merdeka |


---

# 7. Media Sheet


Untuk attachment:


| Field | Description |
|-|-|
| question_code | Reference |
| file_name | File |
| media_type | Image/Video |
| storage_path | Location |


---

# 8. Import Workflow


```

Upload Excel

```
|
```

Detect Template

```
|
```

Read Sheet

```
|
```

Validate Column

```
|
```

Parse Rows

```
|
```

Create Question Object

```
|
```

Validate Content

```
|
```

Save Database

```


---

# 9. Column Mapping Engine


Masalah:


Nama kolom bisa berbeda.


Contoh:


Input:


```

Pertanyaan

```


Standard:


```

question_text

```


Mapping:


```

Column Alias Dictionary

````


Example:


```json
{
 "Pertanyaan":"question_text",
 "Soal":"question_text",
 "Question":"question_text"
}
````

---

# 10. Excel Parser

Komponen:

```
Excel Reader

        |

Cell Converter

        |

Row Parser

        |

Object Builder

```

Output:

```json
{
 "question_text":"2 + 2 = ?",
 "answer_key":"B"
}
```

---

# 11. Data Normalization

Sebelum masuk database:

Dilakukan:

```
Trim Text

Remove Extra Space

Normalize Case

Validate Character

Convert Format

```

Contoh:

Input:

```
 matematika 

```

Output:

```
Matematika

```

---

# 12. Answer Key Processing

Support:

```
A

B

C

D

```

Validation:

```
Answer Exists

Option Exists

Only One Correct Answer

```

---

# 13. Import Validation Flow

```
Excel Row


 |

Required Validation


 |

Reference Validation


 |

Business Rule Validation


 |

Duplicate Check


 |

Ready Import

```

---

# 14. Invalid Row Handling

Contoh:

Excel:

```
Question:

2 + 2


Answer:

E

```

Result:

```
FAILED


Reason:

Answer option E not found

```

---

# 15. Preview Before Import

Sebelum execute:

Dashboard:

```
Total Rows

Valid Rows

Invalid Rows

Warning

Duplicate

```

User:

```
Confirm Import

```

---

# 16. Batch Import Strategy

Tidak insert satu per satu.

Menggunakan:

```
Batch Insert

```

Example:

```
10000 Questions


Batch Size:

500

```

Process:

```
Batch 1

Batch 2

Batch 3

...

```

---

# 17. Background Processing

Untuk file besar:

```
Upload


 |

Create Import Job


 |

Queue


 |

Worker


 |

Process Excel


 |

Update Status

```

---

# 18. Import Job Tracking

Entity:

```
excel_import_jobs

```

Field:

```
id

filename

status

total_rows

processed_rows

success_rows

failed_rows

error_file

created_at

```

---

# 19. Error Report Generation

Output:

```
import_error_report.xlsx

```

Isi:

| Row | Error           |
| --- | --------------- |
| 25  | Missing Answer  |
| 70  | Invalid Subject |

---

# 20. Duplicate Detection Integration

Flow:

```
Imported Question


        |

Normalize


        |

Compare Existing


        |

Similarity Check


        |

Accept / Reject

```

---

# 21. Security

Protection:

```
File Size Limit

File Extension Validation

Permission Check

Malware Scan

Temporary Storage Cleanup

```

---

# 22. API Endpoint

Upload:

```
POST

/api/v1/questions/import/excel

```

Response:

```json
{
 "job_id":"excel-import-001",
 "status":"QUEUED"
}
```

Check Status:

```
GET

/api/v1/questions/import/status/{id}

```

---

# 23. Performance Target

| Operation         | Target      |
| ----------------- | ----------- |
| Read 10.000 Rows  | <30 seconds |
| Validation        | <2 minutes  |
| Import Processing | <5 minutes  |

---

# 24. Testing Strategy

Test:

```
Valid Template

Missing Column

Large File

Wrong Format

Duplicate Question

Broken Reference

Rollback

```

---

# 25. Implementation Recommendation

Backend:

```
Excel Import Service

Background Worker

Batch Processor

Validation Engine

PostgreSQL Transaction

```

Technology:

```
Go

Excelize

PostgreSQL COPY

Redis Queue

```

---

# 26. Future Enhancement

Support:

```
Google Sheet Import

CSV Streaming

API Import

AI Generated Excel

Automatic Template Detection

```

---

# Summary

Excel Import Engine YakinLulus.id:

```
Standard Template

+

Smart Column Mapping

+

Validation Pipeline

+

Batch Processing

+

Error Reporting

+

Audit Tracking

```

Engine ini memungkinkan tim akademik memasukkan ribuan soal secara cepat tanpa mengorbankan kualitas dan konsistensi data.
