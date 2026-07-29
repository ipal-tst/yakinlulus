```markdown id="p4d7xm"
# 12_engineering_implementation_guide/question_bank/03_question_import_process.md

# Question Import Process Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur proses **Question Import Pipeline** pada Question Bank YakinLulus.id.

Fitur import digunakan untuk memasukkan jumlah soal dalam skala besar dari berbagai sumber:

- Excel;
- CSV;
- sistem eksternal;
- database lama;
- AI generated dataset.


Tujuan utama:


```

Bulk Question Management

*

Data Consistency

*

Validation Before Storage

*

Fast Content Migration

*

Audit Import History

```

---

# 2. Import Architecture


```

```
            Import Source


                 |

                 |

          Import Processor


                 |

    +------------+------------+

    |                         |
```

Data Parser              Validation Engine

```
    |                         |

    +------------+------------+

                 |

          Import Preview


                 |

          Approval Process


                 |

         Question Database
```

```

---

# 3. Supported Import Source


## Excel


Format utama:


```

.xlsx

```

Digunakan oleh:

- guru;
- admin;
- content team.


---

## CSV


Untuk:


```

Large Dataset Migration

External System Integration

```

---

## API Import


Untuk:


```

Partner Integration

External Question Provider

```

---

## AI Generated Import


Pipeline:


```

AI Generator

|

Question Dataset

|

Import Engine

```

---

# 4. Import Lifecycle


```

UPLOAD FILE

```
|
```

FILE VALIDATION

```
|
```

PARSING

```
|
```

DATA MAPPING

```
|
```

CONTENT VALIDATION

```
|
```

DUPLICATE CHECK

```
|
```

PREVIEW

```
|
```

IMPORT EXECUTION

```
|
```

COMPLETED

```

---

# 5. Import Module Components


```

Question Import Service

```
    |

    +---- File Reader


    |

    +---- Parser


    |

    +---- Mapper


    |

    +---- Validator


    |

    +---- Duplicate Detector


    |

    +---- Import Worker
```

```

---

# 6. File Upload Process


Flow:


```

User Upload File

```
    |
```

Store Temporary File

```
    |
```

Generate Import Job

```
    |
```

Process Async

```
    |
```

Generate Result Report

```

---

# 7. Import Job Entity


Entity:


```

question_import_jobs

```


Field:


| Field | Description |
|-|-|
| id | Import ID |
| filename | Uploaded File |
| source | Import Source |
| status | Job Status |
| total_rows | Total Data |
| success_rows | Successful Import |
| failed_rows | Failed Import |
| created_by | User |
| created_at | Timestamp |

---

# 8. Import Status


State:


```

CREATED

|

UPLOADED

|

PROCESSING

|

VALIDATING

|

COMPLETED

|

FAILED

```

---

# 9. File Parsing Process


Example Excel:


```

Row 1

Question

Option A

Option B

Option C

Option D

Answer

Explanation

Subject

Chapter

Difficulty

```

Parser mengubah:


```

Spreadsheet Row

```
    |
```

Question Object

````

---

# 10. Data Mapping


Input:


```text
subject_name

````

Mapping:

```
subject_name

        |

subject_id

        |

question_metadata

```

---

# 11. Import Data Model

Raw data:

```
Import Row

```

Transform:

```
Question DTO

```

Convert:

```
Question Entity

```

---

# 12. Validation Pipeline

Setiap row diperiksa:

```
Required Field Check


        |

Format Validation


        |

Academic Validation


        |

Answer Validation


        |

Duplicate Detection

```

---

# 13. Import Validation Example

Input:

```
Question:

2 + 2 = ?


Options:

A. 3

B. 4


Answer:

C

```

Result:

```
FAILED


Reason:

Answer key not found

```

---

# 14. Duplicate Detection

Sistem melakukan:

```
New Question


        |

Normalize Text


        |

Generate Similarity Hash


        |

Compare Existing Question


        |

Duplicate Score

```

---

# 15. Similarity Strategy

Level:

```
Exact Match

+

Text Similarity

+

Embedding Similarity

```

---

# 16. Import Preview

Sebelum masuk database:

User melihat:

```
Total Question

Valid Question

Invalid Question

Duplicate Question

Warning

```

---

# 17. Import Execution

Flow:

```
Approve Import


        |

Create Transaction


        |

Insert Question


        |

Insert Options


        |

Insert Metadata


        |

Create Version


        |

Commit

```

---

# 18. Transaction Management

Import menggunakan:

```
Database Transaction

```

Jika gagal:

```
Rollback All

```

Contoh:

```
Import 1000 soal


999 berhasil

1 gagal critical


Result:

Rollback

```

---

# 19. Large Import Processing

Untuk data besar:

Tidak:

```
Single Request Processing

```

Tetapi:

```
Upload


 |

Queue Job


 |

Worker Process


 |

Batch Insert

```

---

# 20. Batch Processing

Contoh:

```
10000 Questions


Batch Size:

500


Process:

20 Batch

```

---

# 21. Background Worker

Komponen:

```
Import Worker


        |

Queue


        |

Database Writer

```

---

# 22. Import Result Report

Output:

```
Import Summary


Total:

10000


Success:

9980


Failed:

20


```

Detail:

```
Row Number

Error Message

Correction Suggestion

```

---

# 23. Error Handling

Kategori:

## Critical Error

Contoh:

```
Invalid File Format

Database Failure

```

Action:

```
Stop Import

```

---

## Row Error

Contoh:

```
Missing Explanation

Invalid Answer

```

Action:

```
Skip Row

Continue

```

---

# 24. Import Security

Protection:

```
File Permission

Virus Scan

File Size Limit

Role Validation

Audit Log

```

---

# 25. API Design

Endpoint:

```
POST

/api/v1/questions/import

```

Upload:

```
multipart/form-data

```

Response:

```json
{
 "job_id":"import001",
 "status":"PROCESSING"
}
```

---

# 26. Import Monitoring

Metric:

```
Import Duration

Success Rate

Failure Rate

Average Processing Speed

```

---

# 27. Testing Strategy

Test:

```
Valid Excel

Invalid Format

Large File

Duplicate Question

Missing Field

Rollback Scenario

```

---

# 28. Performance Target

Target:

| Operation              | Target     |
| ---------------------- | ---------- |
| Import 1000 Questions  | <1 minute  |
| Import 10000 Questions | <5 minutes |
| Validation Response    | <2 seconds |

---

# 29. Implementation Recommendation

Backend:

```
Go Import Service

Excel Parser

Background Worker

PostgreSQL Batch Insert

Object Storage

```

Library:

```
Excelize

CSV Parser

Validation Package

```

---

# Summary

Question Import Pipeline YakinLulus.id:

```
Upload

+

Parse

+

Validate

+

Preview

+

Approve

+

Batch Import

+

Audit

```

Dengan desain ini, sistem dapat mengelola ribuan hingga jutaan soal secara aman dan terkontrol.

