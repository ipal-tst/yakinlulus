# YakinLulus.id

# Entity Catalog

## 03_learning_resource.md

Version : 1.0

Status : Draft

Domain : Learning Resource

---

# Domain Purpose

Learning Resource Domain bertanggung jawab mengelola seluruh sumber belajar yang tersedia pada platform YakinLulus.

Learning Resource merupakan seluruh konten pembelajaran yang digunakan siswa untuk memahami suatu kompetensi.

Domain ini tidak mengelola:

- User
- CBT
- Progress
- Analytics
- AI Model

Domain ini hanya mengelola konten pembelajaran beserta metadata-nya.

---

# Entity List

LR-001 Learning Resource

LR-002 Resource Content

LR-003 Resource Media

LR-004 Resource Attachment

LR-005 Resource Version

LR-006 Resource Review

LR-007 Resource Approval

LR-008 Resource Category

LR-009 Resource Tag

LR-010 Resource Reference

LR-011 Resource Bookmark

LR-012 Resource Rating

LR-013 Resource Comment

LR-014 Resource Download

LR-015 Resource View History

LR-016 Resource Visibility

LR-017 Resource Prerequisite

LR-018 Learning Path Mapping

LR-019 Resource AI Metadata

LR-020 Resource Embedding

LR-021 Resource Analytics

LR-022 Resource Translation

LR-023 Resource Transcript

LR-024 Resource Subtitle

LR-025 Resource Quiz Mapping

---

====================================================
ENTITY : LEARNING RESOURCE
====================================================

Entity ID

LR-001

Purpose

Entity utama yang merepresentasikan sebuah sumber belajar.

Learning Resource merupakan root entity pada domain ini.

Semua entity lain bergantung pada Learning Resource.

Examples

Artikel

Video

Audio

PDF

Slide

Interactive Lesson

Simulation

Flashcard

Mind Map

Owner

Content Team

Life Cycle

Draft

↓

Review

↓

Approved

↓

Published

↓

Archived

Parent

Topic

Child

Resource Content

Resource Media

Resource Version

Resource Review

Resource Analytics

Business Rules

Satu Learning Resource hanya memiliki satu tipe utama.

Satu Learning Resource dapat memiliki banyak media.

Satu Learning Resource dapat digunakan oleh banyak Learning Path.

Future Expansion

AI Tutor

Adaptive Lesson

Interactive Simulation

Candidate Table

learning_resources

---

====================================================
ENTITY : RESOURCE CONTENT
====================================================

Entity ID

LR-002

Purpose

Menyimpan isi utama Learning Resource.

Examples

Rich Text

Markdown

HTML

Formula

Interactive Block

Candidate Table

resource_contents

---

====================================================
ENTITY : RESOURCE MEDIA
====================================================

Entity ID

LR-003

Purpose

Menyimpan media utama.

Examples

Image

Video

Audio

Animation

Candidate Table

resource_media

---

====================================================
ENTITY : RESOURCE ATTACHMENT
====================================================

Entity ID

LR-004

Purpose

File pendukung.

Examples

PDF

DOCX

PPTX

ZIP

Spreadsheet

Candidate Table

resource_attachments

---

====================================================
ENTITY : RESOURCE VERSION
====================================================

Entity ID

LR-005

Purpose

Versioning konten.

Candidate Table

resource_versions

---

====================================================
ENTITY : RESOURCE REVIEW
====================================================

Entity ID

LR-006

Purpose

Riwayat review.

Candidate Table

resource_reviews

---

====================================================
ENTITY : RESOURCE APPROVAL
====================================================

Entity ID

LR-007

Purpose

Approval workflow.

Candidate Table

resource_approvals

---

====================================================
ENTITY : RESOURCE CATEGORY
====================================================

Entity ID

LR-008

Purpose

Kategori Resource.

Examples

Theory

Exercise

Summary

Video Lesson

Simulation

Candidate Table

resource_categories

---

====================================================
ENTITY : RESOURCE TAG
====================================================

Entity ID

LR-009

Purpose

Tagging.

Candidate Table

resource_tags

---

====================================================
ENTITY : RESOURCE REFERENCE
====================================================

Entity ID

LR-010

Purpose

Referensi sumber.

Examples

Book

Journal

Government Regulation

Website

Publisher

ISBN

DOI

Candidate Table

resource_references

---

====================================================
ENTITY : RESOURCE BOOKMARK
====================================================

Entity ID

LR-011

Purpose

Bookmark siswa.

Candidate Table

resource_bookmarks

---

====================================================
ENTITY : RESOURCE RATING
====================================================

Entity ID

LR-012

Purpose

Rating materi.

Candidate Table

resource_ratings

---

====================================================
ENTITY : RESOURCE COMMENT
====================================================

Entity ID

LR-013

Purpose

Komentar pengguna.

Candidate Table

resource_comments

---

====================================================
ENTITY : RESOURCE DOWNLOAD
====================================================

Entity ID

LR-014

Purpose

Riwayat download.

Candidate Table

resource_downloads

---

====================================================
ENTITY : RESOURCE VIEW HISTORY
====================================================

Entity ID

LR-015

Purpose

Riwayat pembacaan.

Candidate Table

resource_view_histories

---

====================================================
ENTITY : RESOURCE VISIBILITY
====================================================

Entity ID

LR-016

Purpose

Mengatur siapa yang dapat mengakses resource.

Examples

Public

Private

Premium

School

Classroom

Candidate Table

resource_visibilities

---

====================================================
ENTITY : RESOURCE PREREQUISITE
====================================================

Entity ID

LR-017

Purpose

Materi prasyarat.

Contoh

SPLDV membutuhkan pemahaman Persamaan Linear.

Candidate Table

resource_prerequisites

---

====================================================
ENTITY : LEARNING PATH MAPPING
====================================================

Entity ID

LR-018

Purpose

Menghubungkan Resource dengan Learning Path.

Candidate Table

learning_path_resources

---

====================================================
ENTITY : RESOURCE AI METADATA
====================================================

Entity ID

LR-019

Purpose

Metadata AI.

Examples

Summary

Keywords

Difficulty Prediction

Embedding Score

AI Quality Score

Candidate Table

resource_ai_metadata

---

====================================================
ENTITY : RESOURCE EMBEDDING
====================================================

Entity ID

LR-020

Purpose

Semantic Search dan RAG.

Candidate Table

resource_embeddings

---

====================================================
ENTITY : RESOURCE ANALYTICS
====================================================

Entity ID

LR-021

Purpose

Statistik penggunaan.

Examples

View

Completion

Average Duration

Drop Rate

Candidate Table

resource_analytics

---

====================================================
ENTITY : RESOURCE TRANSLATION
====================================================

Entity ID

LR-022

Purpose

Multi Language.

Candidate Table

resource_translations

---

====================================================
ENTITY : RESOURCE TRANSCRIPT
====================================================

Entity ID

LR-023

Purpose

Transcript Video/Audio.

Candidate Table

resource_transcripts

---

====================================================
ENTITY : RESOURCE SUBTITLE
====================================================

Entity ID

LR-024

Purpose

Subtitle Video.

Candidate Table

resource_subtitles

---

====================================================
ENTITY : RESOURCE QUIZ MAPPING
====================================================

Entity ID

LR-025

Purpose

Menghubungkan Resource dengan Question Bank.

Satu Resource dapat memiliki banyak latihan soal.

Candidate Table

resource_questions