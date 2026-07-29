```markdown id="v5k9pz"
# 12_engineering_implementation_guide/question_bank/07_ai_question_generation_pipeline.md

# AI Question Generation Pipeline Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi **AI Question Generation Pipeline** pada Question Bank YakinLulus.id.

Pipeline ini digunakan untuk membantu proses pembuatan soal secara otomatis menggunakan:

- Large Language Model (LLM);
- Prompt Engineering;
- Retrieval Augmented Generation (RAG);
- Embedding Search;
- Knowledge Base;
- Human Review Workflow.


Tujuan utama:


```

Accelerate Question Production

*

Maintain Academic Quality

*

Generate Curriculum Aligned Questions

*

Create AI Ready Content Pipeline

```


---

# 2. AI Question Generation Concept


AI tidak langsung membuat soal final.


Flow:


```

Curriculum Knowledge

```
    |

    |
```

AI Generation

```
    |

    |
```

Validation

```
    |

    |
```

Teacher Review

```
    |

    |
```

Question Bank

```


---

# 3. High Level Architecture


```

```
              Knowledge Source


                    |

    +---------------+---------------+

    |                               |
```

Curriculum Database             Learning Material

```
    |                               |

    +---------------+---------------+

                    |

             RAG Retrieval


                    |

                    |

                LLM Engine


                    |

                    |

          Generated Question


                    |

    +---------------+---------------+

    |                               |
```

Validation Engine              Quality Scoring

```
    |                               |

    +---------------+---------------+

                    |

             Human Review


                    |

             Question Bank
```

```

---

# 4. AI Generation Pipeline


Tahapan:


```

1. Collect Reference Material

2. Retrieve Relevant Knowledge

3. Build Prompt

4. Generate Question

5. Validate Output

6. Score Quality

7. Human Review

8. Publish

```


---

# 5. Input Dataset


AI membutuhkan:


## Curriculum Data


```

Jenjang

Kelas

Subject

Chapter

Learning Objective

Competency

```


---

## Reference Material


Contoh:


```

Textbook

Learning Module

Teacher Notes

Previous Questions

Exam Blueprint

```


---

# 6. Generation Request Model


Entity:


```

ai_question_generation_jobs

```


Field:


| Field | Description |
|-|-|
| id | Job ID |
| requested_by | User |
| subject | Subject |
| chapter | Topic |
| difficulty | Target Difficulty |
| quantity | Number Generated |
| status | Job Status |
| created_at | Timestamp |


---

# 7. Generation Workflow


```

Teacher/Admin

```
  |
```

Select:

Subject

Chapter

Difficulty

Quantity

```
  |
```

Generate Request

```
  |
```

AI Processing

```
  |
```

Preview Result

```
  |
```

Review

```
  |
```

Save Question

```

---

# 8. Prompt Engineering Strategy


Prompt tidak statis.


Menggunakan template:


```

System Prompt

*

Curriculum Context

*

Reference Material

*

Question Requirement

*

Output Format

```


---

# 9. Prompt Example Structure


```

ROLE:

You are an expert mathematics teacher.

CONTEXT:

Create questions for grade 10 algebra.

REQUIREMENT:

Generate 20 medium difficulty multiple choice questions.

OUTPUT:

JSON format.

````


---

# 10. Output Format


AI harus menghasilkan struktur standar:


```json
{
 "question":
 "Solve equation x + 5 = 10",

 "options":[
  "3",
  "5",
  "10",
  "15"
 ],

 "answer":"B",

 "explanation":
 "x equals 5 because..."
}
````

---

# 11. AI Validation Pipeline

Generated question:

```
AI Output


   |

Schema Validation


   |

Academic Validation


   |

Duplicate Detection


   |

Difficulty Check


   |

Quality Score


```

---

# 12. RAG Integration

Tujuan:

AI tidak hanya mengandalkan model.

Menggunakan:

```
Question Bank

+

Learning Material

+

Curriculum Database

+

Teacher Reference

```

---

# 13. Embedding Pipeline

Flow:

```
Document


 |

Chunking


 |

Embedding Generation


 |

Vector Storage


 |

Similarity Search


 |

Context Retrieval


```

---

# 14. Vector Database

Digunakan untuk:

```
Semantic Search

Question Similarity

Reference Retrieval

Duplicate Detection

```

Recommended:

```
PostgreSQL + pgvector

```

---

# 15. AI Generation Service

Service:

```
AI Question Service


        |

        +-- Prompt Manager


        |

        +-- LLM Client


        |

        +-- RAG Retriever


        |

        +-- Validator


        |

        +-- Question Creator


```

---

# 16. n8n Automation Pipeline

Automation:

```
Trigger


 |

Read Curriculum


 |

Retrieve Material


 |

Generate Prompt


 |

Call LLM API


 |

Validate JSON


 |

Save Database


 |

Notify Reviewer

```

---

# 17. AI Generation Trigger

Trigger:

```
Manual Request

Scheduled Generation

Low Question Inventory

New Curriculum Added

```

---

# 18. Question Quality Scoring

AI memberikan:

```
quality_score

confidence_score

difficulty_score

```

Example:

```json
{
 "quality_score":0.87,
 "difficulty":"MEDIUM",
 "confidence":0.92
}
```

---

# 19. Human Review Workflow

AI Result:

```
GENERATED


 |

REVIEW


 |

APPROVED


 |

PUBLISHED

```

Reviewer melakukan:

```
Check Accuracy

Check Explanation

Check Difficulty

Modify Content

Approve

```

---

# 20. AI Generated Question Versioning

Setiap hasil AI:

Disimpan:

```
Generated Version

Prompt Version

Model Version

Reference Source

Reviewer Action

```

---

# 21. AI Audit Trail

Entity:

```
ai_generation_logs

```

Field:

```
id

model_name

prompt_version

input_context

output_result

token_usage

created_at

```

---

# 22. Security

Protection:

```
Prompt Injection Protection

Reference Validation

Content Filtering

API Key Security

Access Control

```

---

# 23. Cost Optimization

Strategi:

```
Cache Similar Prompt

Use Smaller Model For Draft

Use Larger Model For Final Review

Batch Generation

```

---

# 24. Performance Target

| Process               | Target      |
| --------------------- | ----------- |
| Generate 10 Questions | <60 seconds |
| Validation            | <10 seconds |
| Embedding Processing  | <30 seconds |

---

# 25. Testing Strategy

Test:

```
Prompt Quality

Output JSON Validation

Wrong Answer Detection

Hallucination Detection

Reference Accuracy

Duplicate Generation

```

---

# 26. Implementation Recommendation

Architecture:

```
Backend API

+

AI Service

+

Vector Database

+

Queue Worker

+

n8n Automation

```

Technology:

```
Go Backend

Python AI Service

PostgreSQL

pgvector

Redis Queue

n8n

LLM Provider

```

---

# 27. Future Development

Advanced capability:

```
Adaptive Question Generation

AI Tutor Feedback Loop

Automatic Difficulty Calibration

Knowledge Graph Integration

IRT Based Question Generation

```

---

# Summary

AI Question Generation Pipeline YakinLulus.id:

```
Curriculum Knowledge

+

RAG Retrieval

+

LLM Generation

+

Validation Engine

+

Human Review

+

Question Bank

```

Pipeline ini menjadikan Question Bank bukan hanya repository soal, tetapi menjadi **AI-powered academic content generation platform** yang dapat berkembang secara berkelanjutan.

