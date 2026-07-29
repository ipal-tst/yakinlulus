# 12_engineering_implementation_guide/devops/01_docker_implementation.md

# Docker Implementation Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi Docker pada platform YakinLulus.id.

Docker digunakan sebagai standar packaging dan deployment agar seluruh komponen sistem memiliki lingkungan yang konsisten.

Tujuan utama:


Development Consistency

Environment Isolation

Easy Deployment

Scalable Infrastructure


---

# 2. Docker Role Dalam Architecture



Developer Machine

    |

    |

Docker Environment

    |

    |

Container Runtime

    |

    |

Production Server


---

# 3. Service Container Architecture


YakinLulus.id menggunakan pendekatan multi-container.


                Docker Host


                     |

    +----------------+----------------+

    |                |                |

 Backend          Frontend          Worker


    |                |                |

    |                |                |

Django/Go       Next.js          Celery Worker


    |

    |

PostgreSQL

    |

    |

 Redis


    |

    |

Object Storage


---

# 4. Container Principle


Setiap service memiliki:



Own Runtime

Own Dependency

Own Configuration

Own Lifecycle


---

# 5. Recommended Container


## Backend Container


Berisi:



API Server

Business Logic

Authentication

Database Access


Example:



backend-container

Python Runtime

Application Code

Dependencies


---

## Frontend Container


Berisi:



Next.js Application

Static Assets

Web Server


---

## Worker Container


Berisi:



Background Jobs

AI Processing

Email Processing

Import Processing

Embedding Generation


---

## Database Container


Development:



PostgreSQL Container


Production:



Managed PostgreSQL

atau

Dedicated Database Server


---

# 6. Docker Project Structure


Recommended:



project-root/

├── backend/

│

├── frontend/

│

├── worker/

│

├── docker/

│

│ ├── backend/

│ │ └── Dockerfile

│ │

│ ├── frontend/

│ │ └── Dockerfile

│ │

│ └── nginx/

│ └── nginx.conf

├── docker-compose.yml

└── .env


---

# 7. Backend Dockerfile


Example:


```dockerfile
FROM python:3.12-slim


WORKDIR /app


COPY requirements.txt .


RUN pip install -r requirements.txt


COPY .


CMD [
"gunicorn",
"app.wsgi"
]

8. Frontend Dockerfile

Example:

FROM node:24-alpine


WORKDIR /app


COPY package.json .


RUN npm install


COPY .


RUN npm run build


CMD [
"npm",
"start"
]

9. Docker Compose Architecture

Development:

docker-compose.yml


services:


 backend


 frontend


 postgres


 redis


 worker


 nginx

10. Example Compose
version: "3"


services:

 backend:

  build:
   ./backend

  ports:
   - "8000:8000"


 frontend:

  build:
   ./frontend

  ports:
   - "3000:3000"


 postgres:

  image:
   postgres:16


 redis:

  image:
   redis:7

11. Network Architecture

Docker network:

frontend


   |

   |

backend-network


   |

   |

backend


   |

   |

database-network


   |

   |

postgres

12. Volume Management

Persistent data:

Database Data

Uploaded Files

Logs

AI Vector Data


Example:

postgres_volume


media_volume


logs_volume

13. Environment Variable

Tidak menyimpan:

Password

API Key

Secret

Token


di Dockerfile.

Gunakan:

.env

Secret Manager

Environment Injection

14. Image Management

Flow:

Source Code


 |

Build Image


 |

Tag Version


 |

Push Registry


 |

Deploy Container

15. Container Registry

Pilihan:

Docker Hub

GitHub Container Registry

AWS ECR

Google Artifact Registry

16. Development Workflow
Developer


 |

Code Change


 |

docker compose up


 |

Test


 |

Commit


 |

CI Build

17. Production Workflow
Git Repository


 |

CI/CD Pipeline


 |

Build Image


 |

Security Scan


 |

Push Registry


 |

Deploy Server


 |

Health Check

18. Health Check

Setiap container memiliki:

Startup Check

Readiness Check

Liveness Check


Example:

GET /health

Response:

{
 status:"ok"
}

19. Logging

Container log:

stdout

stderr

application log

access log

error log

20. Security Practice

Docker security:

Use Minimal Image

Run Non Root User

Scan Vulnerability

Update Dependency

Limit Resource

21. Resource Management

Container limit:

CPU Limit

Memory Limit

Storage Limit

22. AI Service Container

Untuk AI:

ai-service


embedding-worker


rag-service


question-generator-worker

23. Production Scaling

Horizontal scaling:

backend-container x N


worker-container x N



Load balancer:

Nginx

HAProxy

Cloud Load Balancer

24. Kubernetes Future Migration

Docker menjadi dasar untuk:

Kubernetes

Docker Swarm

Cloud Container Platform

25. Implementation Recommendation

Development:

Docker Compose


Production MVP:

Docker Compose + Nginx


Enterprise:

Kubernetes

Summary

Docker Architecture YakinLulus.id:

Application Services

        +

Container Isolation

        +

Environment Consistency

        +

Automated Deployment

        +

Scalable Infrastructure


Docker menjadi fondasi deployment agar backend, frontend, worker, AI service, dan database dapat dikembangkan serta dijalankan secara konsisten dari development sampai production.