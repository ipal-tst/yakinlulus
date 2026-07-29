```markdown id="p4v7kx"
# 12_engineering_implementation_guide/devops/02_container_strategy.md

# Container Strategy Architecture

## 1. Tujuan

Dokumen ini menjelaskan strategi penggunaan container pada platform YakinLulus.id.

Container Strategy menentukan bagaimana seluruh service aplikasi dikemas, dijalankan, dikembangkan, dan di-scale.

Tujuan utama:

```

Service Isolation

*

Operational Consistency

*

Scalable Deployment

*

Resource Optimization

*

Easy Maintenance

```

---

# 2. Container Architecture Principle

YakinLulus.id menggunakan pendekatan:

```

One Service

```
    |
```

One Container

```
    |
```

Independent Lifecycle

```

Setiap komponen memiliki:

- runtime sendiri;
- dependency sendiri;
- deployment lifecycle sendiri;
- scaling strategy sendiri.

---

# 3. High Level Container Architecture


```

```
                     Internet


                        |

                        |

                     Nginx


                        |

      +-----------------+-----------------+

      |                 |                 |

  Frontend          Backend API        WebSocket


      |                 |                 |


      +-----------------+-----------------+

                        |


              Internal Service Network


                        |


 +------------+-----------+------------+


 |            |           |            |
```

PostgreSQL     Redis     Worker      AI Service

```

---

# 4. Container Classification


Container dibagi menjadi:


## Application Container


Menjalankan aplikasi utama.


```

Frontend

Backend API

Mobile Backend Gateway

```

---

## Processing Container


Menjalankan pekerjaan background.


```

Celery Worker

AI Worker

Import Worker

Embedding Worker

Notification Worker

```

---

## Infrastructure Container


Service pendukung:


```

PostgreSQL

Redis

Nginx

Object Storage

Monitoring Agent

```

---

# 5. Backend Container Strategy


Backend bertanggung jawab:


```

REST API

Business Logic

Authentication

Authorization

Database Transaction

```

Container:


```

backend-api

Runtime:

Python / Go

Process:

API Server

```

---

Deployment:


```

backend-api x N

```

Scaling berdasarkan:


```

CPU Usage

Request Rate

Response Time

```

---

# 6. Frontend Container Strategy


Frontend:


```

Next.js Application

```

Container:


```

frontend-web

```

Responsibilities:


```

UI Rendering

Static Asset Delivery

SSR

Client Routing

```

---

Production:


```

Frontend Container

```
    |

    |
```

Nginx Reverse Proxy

```

---

# 7. Worker Container Strategy


Background worker dipisahkan dari API.


Alasan:


```

Heavy Process Tidak Mengganggu Request API

```

Contoh:


```

Question Import

AI Generation

Embedding Processing

Report Generation

Email Notification

```

---

Architecture:


```

Queue

|

Worker Container

|

Process Job

|

Save Result

```

---

# 8. AI Service Container Strategy


AI dipisahkan karena:


```

High Resource Usage

Different Dependency

Independent Scaling

```

Container:


```

ai-service

rag-service

embedding-worker

question-generator-worker

```

---

Flow:


```

Backend API

|

AI Gateway

|

AI Container

|

LLM Provider

```

---

# 9. Database Container Strategy


## Development


Menggunakan:


```

PostgreSQL Container

```

Keuntungan:


```

Easy Setup

Environment Consistency

Local Testing

```

---

## Production


Rekomendasi:


```

Managed PostgreSQL

atau

Dedicated Database Server

```

Alasan:


```

High Availability

Backup Management

Performance

Security

```

---

# 10. Redis Container Strategy


Redis digunakan untuk:


```

Cache

Session

Queue Broker

Rate Limiting

Temporary Storage

```

Container:


```

redis-service

```

---

# 11. Nginx Container Strategy


Nginx sebagai:


```

Reverse Proxy

SSL Termination

Load Balancer

Static File Server

Security Layer

```

Flow:


```

Client

|

HTTPS

|

Nginx

|

Internal Containers

```

---

# 12. Container Network Strategy


Menggunakan private network.


Example:


```

public-network

```
|

|
```

nginx

```
|

|
```

private-network

```
|

+-------- backend


|

+-------- database


|

+-------- redis
```

```

---

# 13. Network Isolation


Rule:


```

Database Tidak Bisa Diakses Public

Redis Tidak Bisa Diakses Public

Backend Hanya Melalui Gateway

```

---

# 14. Storage Strategy


Jenis storage:


## Persistent Storage


Untuk:


```

Database

Uploaded File

AI Knowledge Base

Backup

```

---

## Temporary Storage


Untuk:


```

Cache

Processing File

Temporary Export

```

---

# 15. Volume Management


Example:


```

volumes:

postgres_data

media_storage

backup_storage

logs_storage

```

---

# 16. Environment Separation


Setiap environment memiliki container berbeda.


```

Development

|

Staging

|

Production

```

---

Example:


Development:


```

docker-compose.dev.yml

```

Staging:


```

docker-compose.staging.yml

```

Production:


```

docker-compose.prod.yml

```

---

# 17. Container Configuration


Konfigurasi melalui:


```

Environment Variable

Config File

Secret Manager

```

---

Tidak menyimpan:


```

Password

API Key

Database Credential

Private Token

```

dalam image.

---

# 18. Container Resource Management


Setiap container memiliki limit:


```

CPU

Memory

Storage

Process Count

```

---

Example:


Backend:


```

CPU:

2 Core

Memory:

2GB

```

---

Worker:


```

CPU:

4 Core

Memory:

8GB

```

---

# 19. Container Health Management


Setiap container memiliki:


```

Health Check

Readiness Check

Restart Policy

```

---

Example:


```

GET /health

Response:

{
status:"healthy"
}

```

---

# 20. Restart Strategy


Policy:


```

Always Restart

```

atau:


```

Restart On Failure

```

---

Example:


```

Container Crash

```
    |
```

Docker Detect

```
    |
```

Restart Container

```

---

# 21. Logging Strategy


Setiap container menghasilkan:


```

Application Log

Access Log

Error Log

Audit Log

```

---

Centralized:


```

Container Logs

|

Log Collector

|

Monitoring System

```

---

# 22. Security Strategy


Container security:


```

Minimal Base Image

Non Root User

Read Only File System

Image Scanning

Dependency Update

Network Restriction

```

---

# 23. Image Management Strategy


Image lifecycle:


```

Source Code

|

Build Image

|

Security Scan

|

Version Tag

|

Registry

|

Deployment

```

---

Version:


```

backend:v1.0.0

frontend:v1.0.0

ai-service:v1.0.0

```

---

# 24. Container Registry


Pilihan:


```

GitHub Container Registry

Docker Hub

AWS ECR

Google Artifact Registry

```

---

# 25. Scaling Strategy


Horizontal scaling:


```

backend-api x N

worker x N

ai-service x N

```

---

Vertical scaling:


```

Increase CPU

Increase Memory

Increase Storage

```

---

# 26. Production Deployment Pattern


MVP:


```

Single Server

Docker Compose

Nginx

PostgreSQL

Redis

```

---

Growth:


```

Multiple Server

Load Balancer

Separated Database

Dedicated Worker

```

---

Enterprise:


```

Kubernetes Cluster

Auto Scaling

Service Mesh

```

---

# 27. Container Monitoring


Metrics:


```

CPU Usage

Memory Usage

Container Restart

Network Traffic

Disk Usage

```

---

# 28. Disaster Recovery


Container recovery:


```

Server Failure

|

Deploy New Host

|

Pull Image

|

Restore Volume

|

Start Container

```

---

# 29. Recommended Stack


Development:


```

Docker Desktop

Docker Compose

```

Production MVP:


```

Ubuntu Server

Docker Engine

Docker Compose

Nginx

Let's Encrypt

```

Future:


```

Kubernetes

Terraform

Cloud Infrastructure

```

---

# Summary


Container Strategy YakinLulus.id:


```

Modular Services

*

Container Isolation

*

Private Networking

*

Independent Scaling

*

Secure Deployment

*

Operational Reliability

```


Dengan strategi ini, backend, frontend, CBT engine, AI service, worker, dan infrastructure dapat berkembang secara independen tanpa saling mengganggu.
```
