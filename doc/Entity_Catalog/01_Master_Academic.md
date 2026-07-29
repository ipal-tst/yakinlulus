====================================================
ENTITY : CURRICULUM
====================================================

Entity ID

MA-001

Domain

Master Academic

Module

Curriculum Management

Description

Representasi kurikulum yang digunakan dalam platform.

Purpose

Menjadi root struktur akademik.

Owner

Academic Management

Life Cycle

Draft

↓

Active

↓

Archived

Parent

-

Child

Education Level

Dependencies

-

Business Rules

Satu Curriculum dapat memiliki banyak Education Level.

Curriculum tidak boleh dihapus apabila telah digunakan oleh Subject.

Future Expansion

International Curriculum

Custom Curriculum

Curriculum Versioning

Candidate Table

curriculums

====================================================
ENTITY : EDUCATION LEVEL
====================================================

Entity ID

MA-002

Purpose

Menyimpan jenjang pendidikan.

Examples

SD

SMP

SMA

SMK

Gap Year

Owner

Academic

Parent

Curriculum

Child

Grade

Candidate Table

education_levels

====================================================
ENTITY : GRADE
====================================================

Entity ID

MA-003

Purpose

Menyimpan tingkat pendidikan.

Examples

Grade 1

Grade 2

...

Grade 12

Owner

Academic

Parent

Education Level

Child

Subject

Candidate Table

grades

====================================================
ENTITY : SUBJECT
====================================================

Entity ID

MA-004

Purpose

Menyimpan mata pelajaran.

Parent

Grade

Child

Chapter

Future

Cross Grade Subject

Subject Alias

Candidate Table

subjects

====================================================
ENTITY : CHAPTER
====================================================

Entity ID

MA-005

Parent

Subject

Child

Sub Chapter

Candidate Table

chapters

====================================================
ENTITY : SUB CHAPTER
====================================================

Entity ID

MA-006

Parent

Chapter

Child

Topic

Candidate Table

sub_chapters

====================================================
ENTITY : TOPIC
====================================================

Entity ID

MA-007

Purpose

Unit pembelajaran utama.

Parent

Sub Chapter

Child

Sub Topic

Business Rules

Topic dapat digunakan oleh:

- Question

- Material

- CBT Blueprint

- Analytics

- AI

Candidate Table

topics

====================================================
ENTITY : SUB TOPIC
====================================================

Entity ID

MA-008

Candidate Table

sub_topics

====================================================
ENTITY : LEARNING OBJECTIVE
====================================================

Entity ID

MA-009

Purpose

Menyimpan tujuan pembelajaran.

Candidate Table

learning_objectives

====================================================
ENTITY : COMPETENCY
====================================================

Entity ID

MA-010

Candidate Table

competencies

====================================================
ENTITY : TAXONOMY
====================================================

Entity ID

MA-011

Purpose

Menyimpan metadata akademik.

Examples

Bloom

Difficulty

LOTS

MOTS

HOTS

Candidate Table

taxonomies

====================================================
ENTITY : ACADEMIC REFERENCE
====================================================

Entity ID

MA-012

Purpose

Menyimpan referensi akademik.

Examples

Semester

Academic Year

Reference Book

Education Regulation

National Standard

Candidate Table

academic_references

