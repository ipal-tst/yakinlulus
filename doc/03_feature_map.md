# YakinLulus.id
# Feature Map

Version : 1.0

Status : Draft

Document Type : Feature Map

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh Business Feature yang dimiliki platform YakinLulus.

Feature merupakan kemampuan (Business Capability) yang dapat digunakan oleh pengguna sistem.

Feature Map menjadi acuan utama dalam penyusunan:

- Use Case
- Entity Catalog
- API Specification
- Database Design
- Backend Service
- Frontend Development

---

# 2. Feature Hierarchy

Business Domain
↓
Module
↓
Feature
↓
Use Case
↓
Entity
↓
Database

---

# 3. Feature Map

=========================================================
MASTER ACADEMIC DOMAIN
=========================================================

Module : Curriculum Management

Features

✓ Create Curriculum

✓ Update Curriculum

✓ Archive Curriculum

✓ Activate Curriculum

✓ Curriculum Versioning

✓ Curriculum Mapping

✓ Import Curriculum

✓ Export Curriculum

-----------------------------------------

Module : Education Level Management

Features

✓ Create Education Level

✓ Update Education Level

✓ Archive Education Level

✓ Education Level Ordering

-----------------------------------------

Module : Grade Management

Features

✓ Create Grade

✓ Update Grade

✓ Grade Mapping

✓ Grade Ordering

-----------------------------------------

Module : Subject Management

Features

✓ Create Subject

✓ Update Subject

✓ Archive Subject

✓ Subject Alias

✓ Subject Ordering

✓ Subject Mapping

✓ Import Subject

✓ Export Subject

-----------------------------------------

Module : Academic Structure

Features

✓ Create Chapter

✓ Create Sub Chapter

✓ Create Topic

✓ Create Sub Topic

✓ Topic Ordering

✓ Topic Tree

✓ Topic Mapping

✓ Topic Merge

✓ Topic Move

-----------------------------------------

Module : Competency

Features

✓ Create Competency

✓ Update Competency

✓ Competency Mapping

✓ Competency Versioning

-----------------------------------------

Module : Learning Objective

Features

✓ Create Learning Objective

✓ Objective Mapping

✓ Objective Versioning

-----------------------------------------

Module : Taxonomy

Features

✓ Bloom Taxonomy

✓ Difficulty Level

✓ HOTS / MOTS / LOTS

✓ Cognitive Level

✓ Question Classification

-----------------------------------------

Module : Academic Reference

Features

✓ Semester

✓ Academic Year

✓ National Standard

✓ Reference Book

✓ Education Regulation

=========================================================
QUESTION BANK DOMAIN
=========================================================

Module : Question Authoring

Features

✓ Create Question

✓ Edit Question

✓ Delete Question

✓ Duplicate Question

✓ Copy Question

✓ Preview Question

✓ Save Draft

✓ Publish Question

✓ Archive Question

-----------------------------------------

Module : Question Metadata

Features

✓ Academic Mapping

✓ Difficulty Mapping

✓ Bloom Mapping

✓ Source Management

✓ Estimated Time

✓ Question Category

✓ Tag Management

✓ Keyword Management

-----------------------------------------

Module : Question Option

Features

✓ Multiple Choice

✓ Correct Answer

✓ Shuffle Option

✓ Rich Text Option

✓ Formula Option

-----------------------------------------

Module : Question Media

Features

✓ Upload Image

✓ Upload Audio

✓ Upload Video

✓ Upload PDF

✓ Upload Diagram

✓ Upload Formula

-----------------------------------------

Module : Question Review

Features

✓ Submit Review

✓ Approve Question

✓ Reject Question

✓ Revision

✓ Reviewer Note

✓ Review History

-----------------------------------------

Module : Question Version

Features

✓ Version History

✓ Restore Version

✓ Compare Version

-----------------------------------------

Module : Question Import

Features

✓ Excel Import

✓ CSV Import

✓ JSON Import

✓ AI Import

✓ Bulk Update

✓ Preview Import

✓ Validation

✓ Error Report

-----------------------------------------

Module : Question Search

Features

✓ Basic Search

✓ Advanced Search

✓ Duplicate Detection

✓ Similar Question

✓ Full Text Search

✓ Filter

-----------------------------------------

Module : Question Analytics

Features

✓ Usage Count

✓ Correct Rate

✓ Wrong Rate

✓ Difficulty Analysis

✓ Average Duration

✓ Popular Question

-----------------------------------------

Module : Question AI

Features

✓ AI Generate

✓ AI Improve

✓ AI Explanation

✓ AI Similarity

✓ AI Validation

✓ AI Metadata

=========================================================
LEARNING MATERIAL DOMAIN
=========================================================

Module : Material Authoring

✓ Create Material

✓ Edit Material

✓ Delete Material

✓ Preview Material

✓ Draft

✓ Publish

-----------------------------------------

Module : Material Content

✓ Rich Text

✓ Markdown

✓ Formula

✓ Interactive Block

✓ Code Block

-----------------------------------------

Module : Material Media

✓ Image

✓ Audio

✓ Video

✓ PDF

✓ Attachment

✓ External Link

-----------------------------------------

Module : Material Version

✓ History

✓ Restore

✓ Compare

-----------------------------------------

Module : Material Analytics

✓ Read Count

✓ Completion

✓ Average Duration

✓ Popular Material

=========================================================
CBT ENGINE DOMAIN
=========================================================

Module : Exam Management

✓ Create Exam

✓ Edit Exam

✓ Delete Exam

✓ Publish Exam

✓ Archive Exam

-----------------------------------------

Module : Exam Blueprint

✓ Question Composition

✓ Difficulty Distribution

✓ Topic Distribution

✓ Random Pool

-----------------------------------------

Module : Exam Session

✓ Start Exam

✓ Resume Exam

✓ Finish Exam

✓ Force Finish

✓ Pause

-----------------------------------------

Module : Exam Engine

✓ Timer

✓ Auto Save

✓ Navigation

✓ Flag Question

✓ Review Before Submit

✓ Fullscreen Mode

-----------------------------------------

Module : Assessment

✓ Auto Scoring

✓ Manual Review

✓ Final Score

✓ Ranking

✓ Result Release

-----------------------------------------

Module : CBT Analytics

✓ Participation

✓ Average Score

✓ Pass Rate

✓ Time Analysis

=========================================================
USER MANAGEMENT DOMAIN
=========================================================

Authentication

Authorization

User Profile

Role Management

Permission Management

Device Management

Session Management

Password Management

=========================================================
LEARNING DOMAIN
=========================================================

Learning Progress

Learning History

Learning Recommendation

Weak Topic Detection

Achievement

Badge

Leaderboard

Learning Statistics

=========================================================
ORGANIZATION DOMAIN
=========================================================

School Management

Teacher Management

Student Management

Classroom Management

Enrollment

Academic Period

=========================================================
MEDIA DOMAIN
=========================================================

Upload

Storage

Image Processing

Video Processing

Audio Processing

Thumbnail

Compression

CDN Management

=========================================================
AI DOMAIN
=========================================================

Question Generation

Material Generation

Explanation Generation

Embedding

Similarity Engine

Prompt Management

Model Management

AI Evaluation

=========================================================
ANALYTICS DOMAIN
=========================================================

Dashboard

Question Analytics

Learning Analytics

Exam Analytics

User Analytics

School Analytics

AI Analytics

Report Generator

=========================================================
SYSTEM DOMAIN
=========================================================

Notification

Audit Log

Activity Log

System Configuration

Background Job

Scheduler

Feature Flag

Monitoring

Health Check

Backup

Restore

=========================================================

