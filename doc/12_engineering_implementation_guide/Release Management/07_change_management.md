```markdown id="91746"
# 14_release_management/07_change_management.md

# Change Management
## YakinLulus.id Engineering Implementation Guide

---

# 1. Overview

Change Management merupakan proses pengelolaan perubahan sistem secara terstruktur untuk memastikan setiap perubahan terhadap aplikasi, database, infrastruktur, dan konfigurasi dilakukan secara aman serta memiliki dampak yang dapat diprediksi.

Dalam YakinLulus.id, perubahan dapat berasal dari:

```

Business Requirement

Bug Fix

Security Improvement

Performance Optimization

Infrastructure Update

Technology Upgrade

```

---

# 2. Change Management Objectives

## 2.1 Control System Changes

Setiap perubahan harus melalui proses:

```

Request

↓

Analysis

↓

Approval

↓

Implementation

↓

Validation

↓

Documentation

```

---

## 2.2 Reduce Operational Risk

Change management membantu mencegah:

```

Unexpected Downtime

Data Loss

Security Issue

Service Disruption

Deployment Failure

```

---

## 2.3 Maintain System Stability

Perubahan harus menjaga:

```

Availability

Reliability

Security

Performance

Maintainability

```

---

# 3. Change Management Architecture

Proses perubahan:

```

```
             Change Request


                   |

                   v


          Impact Analysis


                   |

                   v


          Change Approval


                   |

                   v


         Implementation


                   |

                   v


          Testing Validation


                   |

                   v


          Production Release


                   |

                   v


          Change Review
```

```

---

# 4. Change Categories

YakinLulus.id memiliki beberapa kategori perubahan.

---

# 4.1 Standard Change

Perubahan rutin dengan risiko rendah.

Contoh:

```

Update Documentation

Minor Configuration Change

UI Text Improvement

Dependency Patch

```

Karakteristik:

```

Pre-approved

Low Risk

Repeatable

```

---

# 4.2 Normal Change

Perubahan membutuhkan analisis dan approval.

Contoh:

```

New Feature

API Modification

Database Change

Architecture Improvement

```

---

# 4.3 Emergency Change

Perubahan mendesak untuk mengatasi masalah kritis.

Contoh:

```

Security Vulnerability

Production Outage

Critical Bug

```

Flow:

```

Incident

↓

Emergency Approval

↓

Immediate Fix

↓

Post Review

```

---

# 5. Change Request Lifecycle

Lifecycle:

```

Create Request

```
  |

  v
```

Classification

```
  |

  v
```

Impact Analysis

```
  |

  v
```

Approval

```
  |

  v
```

Implementation

```
  |

  v
```

Testing

```
  |

  v
```

Deployment

```
  |

  v
```

Review

```

---

# 6. Change Request Document

Setiap perubahan harus memiliki informasi:

```

Change ID

Requester

Description

Reason

Impact

Risk Level

Implementation Plan

Rollback Plan

Approval Status

```

---

Contoh:

```

Change ID:

CHG-2026-001

Title:

Improve CBT Randomization

Risk:

Medium

Impact:

Exam Engine

Rollback:

Restore Previous Version

```

---

# 7. Impact Analysis

Sebelum perubahan dilakukan, lakukan analisis dampak.

---

## 7.1 Technical Impact

Analisis:

```

Code Impact

Database Impact

API Impact

Infrastructure Impact

```

---

## 7.2 Business Impact

Analisis:

```

User Experience

Business Process

Feature Availability

```

---

## 7.3 Security Impact

Analisis:

```

Authentication

Authorization

Data Protection

Compliance

```

---

# 8. Change Risk Assessment

Risk level:

| Risk | Description | Approval |
|-|-|-|
| Low | Minor change | Team Lead |
| Medium | Feature/API change | Engineering Lead |
| High | Architecture/Security | Management Approval |

---

# 9. Change Approval Process

Approval flow:

```

Developer

```
|

v
```

Engineering Lead

```
|

v
```

QA Team

```
|

v
```

Product Owner

```
|

v
```

Release

```

---

# 10. Change Implementation Process

Standard implementation:

```

Create Branch

↓

Develop Change

↓

Code Review

↓

Automated Testing

↓

QA Validation

↓

Release Deployment

```

---

# 11. Database Change Management

Database adalah komponen kritikal.

Perubahan database harus:

```

Reviewed

Tested

Backward Compatible

Documented

```

---

Contoh perubahan:

```

Add Table

Modify Column

Create Index

Data Migration

```

---

Database change flow:

```

Migration Created

↓

Local Testing

↓

Staging Testing

↓

Backup Production

↓

Execute Migration

↓

Validate

```

---

# 12. API Change Management

API change harus menjaga kompatibilitas.

---

Non Breaking:

```

Add New Endpoint

Add Optional Field

```

---

Breaking:

```

Remove Field

Change Response Format

Change Authentication Flow

```

---

Breaking change membutuhkan:

```

New API Version

Migration Guide

Deprecation Period

```

---

# 13. Configuration Change Management

Configuration:

```

Environment Variable

Nginx Config

Docker Config

Application Setting

```

---

Rules:

```

Version Controlled

Reviewed

Tested Before Production

```

---

# 14. Infrastructure Change Management

Infrastructure change mencakup:

```

Server

Network

Container

Cloud Resource

Monitoring

```

---

Contoh:

```

Increase Server Capacity

Update Docker Version

Change Load Balancer

```

---

# 15. Security Change Management

Security change membutuhkan perhatian khusus.

Contoh:

```

JWT Policy Update

Password Policy Change

Encryption Update

Firewall Rule Change

```

---

Validation:

```

Security Testing

Penetration Testing

Access Review

```

---

# 16. YakinLulus.id Critical Change Areas

---

# 16.1 CBT Engine Changes

Karena CBT adalah core system:

Perubahan wajib:

```

Full Regression Test

Performance Test

UAT Validation

```

---

Risiko:

```

Exam Failure

Score Error

Student Impact

```

---

# 16.2 Question Bank Changes

Validasi:

```

Question Integrity

Answer Accuracy

Permission Control

```

---

# 16.3 AI Tutor Changes

Validasi:

```

Prompt Version

Model Version

Response Quality

Safety Evaluation

```

---

# 17. Change Testing Strategy

Setiap perubahan harus melewati:

```

Unit Test

Integration Test

Regression Test

Security Test

User Acceptance Test

```

---

# 18. Change Deployment Strategy

Deployment berdasarkan risiko.

---

Low Risk:

```

Direct Deployment

```

---

Medium Risk:

```

Staging Validation

↓

Production Release

```

---

High Risk:

```

Staging

↓

Approval

↓

Controlled Deployment

↓

Monitoring

```

---

# 19. Emergency Change Process

Emergency flow:

```

Critical Issue

↓

Emergency Assessment

↓

Fast Approval

↓

Implementation

↓

Validation

↓

Documentation

```

---

Setelah emergency:

```

Root Cause Analysis

Process Improvement

Knowledge Update

```

---

# 20. Change Documentation

Setiap perubahan harus menghasilkan:

```

Change Record

Release Note

Technical Documentation

Migration Documentation

Operational Note

```

---

# 21. Change Audit Trail

Audit menyimpan:

```

Who Changed

What Changed

When Changed

Why Changed

Approval History

```

---

Contoh:

```

User:

Developer A

Action:

Updated CBT Module

Date:

2026-08-01

```

---

# 22. Change Failure Management

Jika perubahan gagal:

```

Detect Failure

↓

Rollback

↓

Analyze Cause

↓

Create Improvement Plan

```

---

Root Cause Analysis menggunakan:

```

5 Why Analysis

Fishbone Diagram

Post Incident Review

```

---

# 23. Change Metrics

Metrics:

```

Change Success Rate

Failed Change Rate

Emergency Change Count

Average Approval Time

Rollback Frequency

```

---

Target:

```

High Success Rate

Low Failed Change

Fast Recovery

```

---

# 24. Change Management Checklist

## Request

- [ ] Change documented
- [ ] Reason defined
- [ ] Impact analyzed


## Approval

- [ ] Risk assessed
- [ ] Reviewer assigned
- [ ] Approval obtained


## Implementation

- [ ] Branch created
- [ ] Code reviewed
- [ ] Testing completed


## Deployment

- [ ] Backup completed
- [ ] Rollback ready
- [ ] Monitoring enabled


## Post Change

- [ ] Result verified
- [ ] Documentation updated
- [ ] Audit recorded

---

# 25. Change Management Roadmap

## Phase 1 - MVP

Implement:

```

Basic Change Request

Code Review

Release Documentation

```

---

## Phase 2 - Growth

Implement:

```

Change Approval Workflow

Automated Tracking

Change Dashboard

```

---

## Phase 3 - Enterprise

Implement:

```

ITIL-Based Change Management

Automated Risk Assessment

Compliance Reporting

```

---

# Conclusion

Change Management YakinLulus.id memastikan setiap perubahan sistem dilakukan secara terkendali, terdokumentasi, dan aman.

Dengan proses:

```

Request

*

Analysis

*

Approval

*

Implementation

*

Validation

*

Review

```

platform dapat berkembang secara cepat tanpa mengorbankan stabilitas dan keamanan production.
```
