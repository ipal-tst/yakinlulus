```markdown id="z8p3kt"
# 12_engineering_implementation_guide/ai/08_ai_tutor_architecture.md

# AI Tutor Architecture

## 1. Tujuan

Dokumen ini menjelaskan desain dan implementasi **AI Tutor System Architecture** pada platform YakinLulus.id.

AI Tutor merupakan sistem pembelajaran berbasis AI yang berfungsi sebagai pendamping belajar personal bagi siswa.

AI Tutor mampu:

- menjelaskan konsep pelajaran;
- menjawab pertanyaan siswa;
- memberikan contoh;
- membantu penyelesaian soal;
- memberikan feedback;
- mendeteksi kesulitan belajar;
- merekomendasikan materi.


Tujuan utama:


```

Student

*

Educational Knowledge

*

AI Reasoning

*

Personal Learning Context

=

Personal AI Tutor

```

---

# 2. Peran AI Tutor Dalam Platform


AI Tutor menjadi layer kecerdasan di atas:


```

Learning Material

Question Bank

CBT Engine

Learning Analytics

Student Profile

```

---

# 3. AI Tutor Architecture Overview


```

```
                Student


                   |

                   |

             AI Tutor Interface


                   |

                   |

              AI Tutor Engine


                   |

  +----------------+----------------+

  |                |                |
```

Conversation     Knowledge        Personalization

Engine           Retrieval        Engine

```
  |                |                |

  +----------------+----------------+

                   |

                   |

                  LLM


                   |

                   |

          Response Generation
```

```

---

# 4. Core Components


## 4.1 Conversation Engine


Mengelola interaksi:


```

Question Understanding

Conversation Context

Dialogue Management

Response Formatting

```

---

## 4.2 Knowledge Retrieval Engine


Mengambil sumber:


```

Learning Material

Question Bank

Curriculum

Teacher Content

```

Menggunakan:


```

RAG Pipeline

Vector Database

Semantic Search

```

---

## 4.3 Personalization Engine


Menyesuaikan berdasarkan:


```

Student Level

Learning History

Weak Topic

Learning Goal

Progress

```

---

## 4.4 Reasoning Engine


Bertugas:


```

Analyze Question

Choose Teaching Strategy

Generate Explanation

Provide Feedback

```

---

# 5. AI Tutor Flow


```

Student Question

```
    |

    |
```

Intent Detection

```
    |

    |
```

Student Context Retrieval

```
    |

    |
```

Knowledge Retrieval

```
    |

    |
```

Prompt Construction

```
    |

    |
```

LLM Processing

```
    |

    |
```

Answer Validation

```
    |

    |
```

Student Response

```

---

# 6. Student Context


AI Tutor memahami:


## Profile


```

Grade

School

Subject Level

Learning Goal

```

---

## Learning History


```

Completed Material

Exam Result

Wrong Answers

Study Duration

```

---

## Learning Behavior


```

Preferred Learning Style

Difficulty Preference

Learning Speed

```

---

# 7. Teaching Strategy Engine


AI Tutor tidak hanya menjawab.

AI menentukan metode:


```

Explain Concept

Give Example

Ask Question

Provide Hint

Review Material

```

---

Example:


Student:

```

Saya tidak mengerti integral

```

AI Tutor:


```

1. Explain basic concept

2. Give simple example

3. Ask understanding check

4. Continue gradually

```

---

# 8. Adaptive Learning


AI Tutor menyesuaikan:


```

Beginner

```
    |
```

Intermediate

```
    |
```

Advanced

```

---

Example:


Beginner:


```

Simple explanation

Visual example

Basic exercise

```

Advanced:


```

Complex reasoning

Problem solving

Challenge question

```

---

# 9. Socratic Teaching Mode


AI Tutor dapat menggunakan metode:


```

Ask

Guide

Hint

Confirm Understanding

```

---

Example:


Student:

```

Jawaban saya 10

```

AI:


```

Bagaimana kamu mendapatkan angka tersebut?

Mari kita cek langkahnya.

```

---

# 10. AI Tutor Modes


## Learning Mode


Untuk memahami materi.


```

Explanation

Summary

Example

Practice

```

---

## Homework Mode


Membantu belajar:


```

Hint

Step Explanation

Concept Review

```

---

## Exam Preparation Mode


Untuk persiapan ujian:


```

Practice Question

Analysis

Weakness Detection

```

---

## Review Mode


Setelah ujian:


```

Wrong Answer Analysis

Concept Recovery

Recommended Material

```

---

# 11. AI Tutor Prompt Architecture


Template:


```

SYSTEM

You are YakinLulus AI Tutor.

ROLE

Teach student based on academic level.

CONTEXT

Student Profile

Learning History

Retrieved Material

TASK

Answer student's question.

RULES

Do not give unsupported answers.

Explain step by step.

OUTPUT

Educational explanation.

```

---

# 12. RAG Integration


Flow:


```

Student Question

```
    |
```

Generate Query Embedding

```
    |
```

Vector Search

```
    |
```

Retrieve Material

```
    |
```

Build Tutor Context

```
    |
```

LLM Response

```

---

# 13. Memory Architecture


AI Tutor memiliki:


## Short Term Memory


Untuk:


```

Current Conversation

Recent Questions

Current Topic

```

---

## Long Term Memory


Untuk:


```

Learning History

Student Weakness

Learning Preference

Progress

```

---

# 14. Memory Storage


Entities:


```

ai_conversations

ai_messages

student_learning_memory

````

---

# 15. Conversation Model


```sql
ai_conversations

id

student_id

topic

started_at

ended_at

````

---

# 16. Message Model

```sql
ai_messages

id

conversation_id

role

content

token_usage

created_at

```

---

Role:

```
system

user

assistant

```

---

# 17. Learning Memory Model

```sql
student_learning_memory


student_id

subject

weak_topic

strength

recommendation

updated_at

```

---

# 18. Knowledge Feedback Loop

AI Tutor belajar dari:

```
Student Interaction


        |

Performance Analysis


        |

Learning Profile Update


        |

Better Recommendation

```

---

# 19. AI Tutor Integration With CBT

Setelah ujian:

```
Exam Result


        |

Analyze Mistake


        |

Find Weak Concept


        |

Recommend Material


        |

AI Tutor Explanation

```

---

# 20. AI Tutor Integration With Analytics

Analytics memberikan:

```
Learning Progress

Difficulty Area

Achievement

Behavior Pattern

```

---

# 21. AI Tutor API

Chat:

```
POST

/api/v1/ai/tutor/chat

```

---

Request:

```json
{
 "student_id":"ST001",
 "message":
 "Jelaskan hukum Newton"
}
```

---

Response:

```json
{
 "answer":
 "Hukum Newton menjelaskan...",
 "sources":[
  "Physics Grade 10"
 ],
 "recommendation":
 "Study Newton Second Law"
}
```

---

# 22. Streaming Response

Untuk pengalaman seperti ChatGPT:

```
User Question


        |

LLM Processing


        |

Token Streaming


        |

UI Update Real Time

```

---

Technology:

```
WebSocket

Server Sent Events

```

---

# 23. Safety Layer

Protection:

```
Content Filtering

Prompt Injection Defense

Academic Safety

Privacy Protection

```

---

# 24. Teacher Control

Guru dapat:

```
Review AI Answer

Provide Correction

Create Custom Knowledge

Approve Material

```

---

# 25. Monitoring Metrics

Track:

```
Question Count

Response Quality

Student Satisfaction

Learning Improvement

Token Usage

Latency

```

---

# 26. Testing Strategy

Test:

```
Knowledge Accuracy

Teaching Quality

Personalization Accuracy

Response Safety

Load Testing

```

---

# 27. Implementation Recommendation

Services:

```
AI Tutor Service

Conversation Service

Memory Service

Recommendation Service

RAG Service

```

---

Technology:

```
Python FastAPI

LLM Provider

PostgreSQL

pgvector

Redis

WebSocket

```

---

# 28. Future Enhancement

Advanced:

```
Voice AI Tutor

AI Avatar Teacher

Multimodal Tutor

Personal Learning Agent

Autonomous Study Planner

```

---

# Summary

AI Tutor Architecture YakinLulus.id:

```
Student Context

+

Educational Knowledge

+

RAG

+

LLM

+

Learning Analytics

+

Personalization

=

Personal AI Teacher

```

AI Tutor menjadi komponen utama yang mengubah YakinLulus.id dari sekadar platform bank soal menjadi **adaptive intelligent learning platform**.

