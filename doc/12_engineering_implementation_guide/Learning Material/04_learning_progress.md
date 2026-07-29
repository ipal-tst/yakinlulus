```markdown id="p4m8xz"
# 12_engineering_implementation_guide/learning_material/04_learning_progress.md

# Learning Progress Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi **Learning Progress System** pada Learning Material YakinLulus.id.

Learning Progress System bertanggung jawab untuk mencatat, mengukur, dan menganalisis perkembangan belajar siswa.

Sistem harus mampu menjawab:

- materi apa yang sudah dipelajari siswa;
- seberapa jauh progres pembelajaran;
- materi mana yang belum dikuasai;
- pola belajar siswa;
- rekomendasi pembelajaran berikutnya.


Tujuan utama:


```

Learning Visibility

*

Student Engagement

*

Personalized Learning

*

Performance Improvement

*

AI Recommendation Ready

```

---

# 2. Konsep Learning Progress


Progress bukan hanya status selesai.


Model:


```

Student Activity

```
    |

    |
```

Learning Event

```
    |

    |
```

Progress Calculation

```
    |

    |
```

Learning Analytics

```
    |

    |
```

Recommendation Engine

```

---

# 3. Learning Progress Architecture


```

```
              Learning Progress System


                     |

    +----------------+----------------+

    |                                 |
```

Activity Tracking                 Progress Engine

```
    |                                 |

    |                                 |
```

Event Storage                   Progress Calculation

```
    |                                 |

    +----------------+----------------+

                     |

                     |

             Analytics Service


                     |

                     |

          Recommendation Engine
```

```

---

# 4. Progress Entity Model


Entity utama:


```

student_learning_progress

```

---

Field:


| Field | Type | Description |
|-|-|-|
| id | UUID | Primary Key |
| student_id | UUID | Student |
| material_id | UUID | Learning Material |
| progress_status | ENUM | Status |
| completion_percentage | FLOAT | Progress |
| last_accessed_at | TIMESTAMP | Last Activity |
| completed_at | TIMESTAMP | Completion Time |

---

# 5. Progress Status


Lifecycle:


```

NOT_STARTED

```
  |
```

IN_PROGRESS

```
  |
```

COMPLETED

```
  |
```

MASTERED

```

---

# 6. Learning Event Tracking


Semua aktivitas dicatat:


Entity:


```

learning_events

```

---

Contoh:


```

OPEN_MATERIAL

READ_SECTION

WATCH_VIDEO

DOWNLOAD_FILE

START_EXERCISE

COMPLETE_EXERCISE

TAKE_EXAM

```

---

# 7. Event Data Model


```

learning_events

id

student_id

event_type

resource_id

metadata

timestamp

````

---

Contoh:


```json
{
 "student_id":"USR001",
 "event_type":"VIDEO_WATCH",
 "resource_id":"VID001",
 "metadata":{
    "duration":1200,
    "watched":900
 }
}
````

---

# 8. Progress Calculation Engine

Progress dihitung dari:

```
Material Completion


+

Content Interaction


+

Exercise Completion


+

Assessment Result

```

---

Formula:

```
Progress Score =


(Content Completion x 40%)

+

(Activity Engagement x 30%)

+

(Exercise Score x 30%)

```

---

# 9. Material Completion

Contoh:

```
Lesson


 |

10 Content Block


 |

Student Completed 8 Block


 |

80% Completion

```

---

# 10. Video Progress Tracking

Video:

```
Started

25%

50%

75%

Completed

```

---

Rule:

```
Video Completion

>= 80%

=

Completed

```

---

# 11. Reading Progress

Text material:

Tracking:

```
Scroll Position

Section Viewed

Reading Time

Last Position

```

---

# 12. Exercise Progress

Exercise:

```
Started


 |

Answer Submitted


 |

Score Generated


 |

Knowledge Level Updated

```

---

# 13. Learning Streak

Sistem menghitung:

```
Daily Learning Activity

```

---

Example:

```
Day 1  ✓

Day 2  ✓

Day 3  ✓

Day 4  X


Streak = 3 Days

```

---

# 14. Student Dashboard Integration

Dashboard menampilkan:

```
Overall Progress

Subject Progress

Chapter Completion

Learning Time

Achievement

Weak Area

```

---

# 15. Subject Progress

Example:

```
Matematika


████████░░ 80%


Fisika


██████░░░░ 60%

```

---

# 16. Chapter Progress

Hierarchy:

```
Subject


 |

Chapter


 |

Lesson


 |

Progress

```

---

# 17. Learning Analytics

Data:

```
Total Learning Time

Material Completion

Question Practice

Exam Performance

Learning Frequency

```

---

# 18. Knowledge Mastery Model

Progress menuju:

```
Learning


 |

Practice


 |

Assessment


 |

Mastery

```

---

Mastery level:

```
BEGINNER

INTERMEDIATE

ADVANCED

MASTERED

```

---

# 19. Integration With CBT Engine

Learning Progress menerima:

```
Exam Result


 |

Score Analysis


 |

Knowledge Update


 |

Progress Adjustment

```

---

# 20. Integration With Question Bank

Hubungan:

```
Question Topic


        |

        |

Student Answer


        |

        |

Topic Mastery

```

---

# 21. Weak Area Detection

Sistem mendeteksi:

```
Low Exercise Score

+

Repeated Mistake

+

Low Exam Performance


=

Weak Topic

```

---

# 22. AI Recommendation Input

Data:

```
Learning History

+

Question Performance

+

Material Interaction

+

Exam Result

```

---

Output:

```
Recommended Material

Recommended Exercise

Recommended Study Plan

```

---

# 23. Database Relationship

```
students


   |

   |

learning_progress


   |

   |

learning_materials


   |

   |

learning_events


   |

   |

analytics

```

---

# 24. API Design

Get Student Progress:

```
GET

/api/v1/students/{id}/progress

```

---

Response:

```json
{
 "student":"USR001",
 "overall_progress":75,
 "subjects":[
   {
    "name":"Math",
    "progress":80
   }
 ]
}
```

---

Record Learning Event:

```
POST

/api/v1/learning/events

```

---

# 25. Offline Progress Strategy

Mobile/Web Offline:

```
Local Event Queue


        |

        |

Connection Available


        |

        |

Sync Server


        |

        |

Update Progress

```

---

# 26. Performance Strategy

Optimization:

```
Event Queue

Batch Processing

Caching

Aggregation Table

Background Worker

```

---

# 27. Background Processing

Worker:

```
Collect Events


 |

Calculate Progress


 |

Update Analytics


 |

Generate Recommendation

```

---

# 28. Security

Protection:

```
Student Data Privacy

Access Control

Event Validation

Audit Log

```

---

# 29. Testing Strategy

Test:

```
Progress Calculation

Event Recording

Offline Sync

Dashboard Accuracy

Mastery Calculation

Recommendation Input

```

---

# 30. Implementation Recommendation

Backend:

```
Learning Progress Service

Event Tracking Service

Analytics Service

Recommendation Service

```

Technology:

```
Go Backend

PostgreSQL

Redis

Queue Worker

Event Processing

```

---

# 31. Future Enhancement

Support:

```
Adaptive Learning Engine

AI Study Planner

Learning Path Optimization

Gamification

Achievement System

Knowledge Graph

```

---

# Summary

Learning Progress Architecture YakinLulus.id:

```
Activity Tracking

+

Progress Calculation

+

Mastery Detection

+

Analytics

+

AI Recommendation

```

Learning Progress System menjadi fondasi untuk personalisasi pembelajaran, analisis perkembangan siswa, dan pengembangan AI Tutor YakinLulus.id.
