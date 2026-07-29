```markdown id="r8m2qd"
# 12_engineering_implementation_guide/devops/04_github_actions.md

# GitHub Actions Implementation Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi **GitHub Actions CI/CD Pipeline** untuk platform YakinLulus.id.

GitHub Actions digunakan sebagai automation engine untuk:

```

Continuous Integration

*

Continuous Deployment

*

Automated Testing

*

Docker Build

*

Release Automation

```

---

# 2. GitHub Actions Position


```

Developer

```
|

|
```

Git Repository

```
|

|
```

GitHub Actions

```
|

|
```

CI Pipeline

```
|

|
```

CD Pipeline

```
|

|
```

Deployment Environment

```

---

# 3. Repository Workflow Structure


Recommended structure:


```

repository/

├── backend/

├── frontend/

├── ai-service/

├── worker/

├── docker/

├── deployment/

└── .github/

```
└── workflows/


    ├── backend-ci.yml


    ├── frontend-ci.yml


    ├── docker-build.yml


    ├── security-scan.yml


    ├── staging-deploy.yml


    └── production-deploy.yml
```

```

---

# 4. GitHub Actions Components


## Workflow

File konfigurasi automation:


```

.github/workflows/*.yml

```

---

## Event Trigger


Menentukan kapan pipeline berjalan.


Example:


```

push

pull_request

release

manual trigger

schedule

```

---

## Job


Sekumpulan proses:


```

Build Job

Test Job

Deploy Job

```

---

## Step


Task individual:


```

Install Dependency

Run Test

Build Image

Deploy

```

---

# 5. Environment Strategy


GitHub Environment:


```

development

staging

production

```

Setiap environment memiliki:

```

Secret

Approval Rule

Protection Rule

Variable

```

---

# 6. Backend CI Workflow


File:


```

.github/workflows/backend-ci.yml

```

Flow:


```

Push Backend Code

```
    |
```

Checkout Repository

```
    |
```

Setup Runtime

```
    |
```

Install Dependency

```
    |
```

Run Lint

```
    |
```

Run Test

```
    |
```

Build Verification

````

---

# 7. Backend Pipeline Example


```yaml
name: Backend CI


on:

  pull_request:

    paths:

      - "backend/**"


jobs:

  test:

    runs-on: ubuntu-latest


    steps:

      - uses: actions/checkout@v4


      - name:
          Setup Python

        uses:
          actions/setup-python@v5


      - name:
          Install Dependency

        run:

          pip install -r requirements.txt


      - name:
          Run Test

        run:

          pytest

````

---

# 8. Frontend CI Workflow

File:

```
frontend-ci.yml

```

Flow:

```
Checkout


 |

Setup Node


 |

Install Package


 |

Lint


 |

Type Check


 |

Build Next.js


 |

Test

```

---

# 9. Docker Build Workflow

Tujuan:

```
Create Production Image

Version Image

Push Registry

```

Flow:

```
Code Commit


 |

Docker Build


 |

Security Scan


 |

Docker Tag


 |

Push Registry

```

---

# 10. Docker Image Versioning

Format:

```
application:version

```

Example:

```
backend:v1.0.0


frontend:v1.0.0


ai-service:v1.0.0

```

---

# 11. Container Registry Integration

Pilihan:

```
GitHub Container Registry


Docker Hub


AWS ECR

```

---

# 12. GitHub Container Registry Flow

```
GitHub Actions


        |

Authenticate


        |

Build Image


        |

Push Image


        |

Server Pull Image

```

---

# 13. Deployment Workflow

Production:

```
Merge main


        |

Approval


        |

Build Release


        |

Deploy Server


        |

Health Check


        |

Release

```

---

# 14. Server Deployment Method

MVP:

```
SSH Deployment

```

Flow:

```
GitHub Actions


 |

SSH


 |

Production Server


 |

docker compose pull


 |

docker compose up -d

```

---

# 15. SSH Deployment Security

Gunakan:

```
SSH Key


Limited User


Firewall Rule


No Password Login

```

---

# 16. Database Migration Automation

Pipeline:

```
Deploy Backend


        |

Backup Database


        |

Run Migration


        |

Restart Service


        |

Health Check

```

---

# 17. Production Approval Gate

Production deployment membutuhkan:

```
Code Review

CI Success

Security Scan

Manual Approval

```

---

# 18. Security Workflow

File:

```
security-scan.yml

```

Check:

```
Dependency Vulnerability


Container Vulnerability


Secret Leakage


License Issue

```

---

# 19. Dependency Scanning

Backend:

```
pip-audit

Dependabot

```

Frontend:

```
npm audit

Dependabot

```

---

# 20. Secret Management

GitHub Secrets:

```
DATABASE_URL

JWT_SECRET

API_KEY

SSH_PRIVATE_KEY

DOCKER_TOKEN

```

Tidak disimpan:

```
.env

Repository

Docker Image

```

---

# 21. Pull Request Automation

Saat PR dibuat:

```
Run Test

Run Lint

Check Security

Build Validation

```

PR hanya merge jika:

```
All Checks Passed

```

---

# 22. Branch Protection

Main branch:

```
Require Pull Request


Require Review


Require Status Check


Disable Direct Push

```

---

# 23. Release Automation

Trigger:

```
Git Tag

```

Example:

```
v1.0.0

```

Action:

```
Build Release Image

Generate Changelog

Deploy

```

---

# 24. Rollback Automation

Jika deployment gagal:

```
Detect Failure


 |

Stop Deployment


 |

Pull Previous Image


 |

Restart Container


 |

Notify Team

```

---

# 25. Notification Integration

Event:

```
Deployment Success

Deployment Failed

Test Failed

Security Alert

```

Channel:

```
Telegram

Slack

Email

```

---

# 26. Scheduled Workflow

Untuk:

```
Database Backup Check

Security Scan

Dependency Update

Health Monitoring

```

Example:

```
Every Night 02:00

```

---

# 27. Monorepo Strategy

YakinLulus.id menggunakan:

```
Single Repository


```

Dengan pipeline terpisah:

```
backend change

        |

backend-ci only


frontend change

        |

frontend-ci only

```

---

# 28. Deployment Matrix

Environment:

| Environment | Trigger       | Purpose           |
| ----------- | ------------- | ----------------- |
| Development | Push develop  | Developer testing |
| Staging     | Merge staging | QA/UAT            |
| Production  | Release main  | Real users        |

---

# 29. Recommended Workflow Files

```
.github/workflows/


01_backend_ci.yml


02_frontend_ci.yml


03_ai_service_ci.yml


04_docker_build.yml


05_security_scan.yml


06_staging_deploy.yml


07_production_deploy.yml


08_backup.yml

```

---

# 30. Final GitHub Actions Architecture

```
Developer


 |

Git Push


 |

GitHub Repository


 |

GitHub Actions


 |

+----------------+

|                |

CI Pipeline      CD Pipeline


|                |

Testing          Deployment


|                |

Quality Gate     Production


        |

        |

Monitoring

```

---

# Summary

GitHub Actions Implementation YakinLulus.id:

```
Automated Testing

+

Docker Automation

+

Secure Build

+

Controlled Deployment

+

Release Management

=

Professional Software Delivery Pipeline

```

GitHub Actions menjadi pusat automation engineering agar proses dari commit sampai production dapat berjalan konsisten, cepat, dan aman.

````
