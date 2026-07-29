```markdown id="n6f3qd"
# 12_engineering_implementation_guide/devops/06_environment_configuration.md

# Environment Configuration Architecture

## 1. Tujuan

Dokumen ini menjelaskan strategi konfigurasi environment pada platform YakinLulus.id.

Environment configuration mengatur bagaimana aplikasi berjalan pada berbagai kondisi:

```

Development

*

Staging

*

Production

*

Testing

```

Tujuan:

```

Configuration Consistency

*

Security

*

Deployment Flexibility

*

Operational Control

```

---

# 2. Environment Strategy


YakinLulus.id menggunakan pemisahan environment:


```

Development

```
    |

    |
```

Staging

```
    |

    |
```

Production

```

Setiap environment memiliki:

```

Database

Configuration

Secret

Resource

Logging Level

Deployment Policy

```

---

# 3. Environment Architecture


```

```
                Source Code


                     |

                     |

          Configuration Injection


                     |

    +----------------+----------------+

    |                |                |
```

Development         Staging        Production

```
    |                |                |
```

Local DB          Test DB        Production DB

Debug ON          Debug OFF      Debug OFF

```

---

# 4. Environment Types


## Development Environment


Tujuan:


```

Coding

Debugging

Local Testing

Feature Development

```

Karakteristik:


```

DEBUG=true

Verbose Logging

Local Database

Mock Service Allowed

```

---

## Staging Environment


Tujuan:


```

QA Testing

UAT

Production Simulation

```

Karakteristik:


```

DEBUG=false

Production-like Config

Real Integration Testing

```

---

## Production Environment


Tujuan:


```

Real User Traffic

Business Operation

```

Karakteristik:


```

DEBUG=false

Strict Security

High Availability

Monitoring Enabled

```

---

# 5. Configuration Principle


Konfigurasi harus:


```

Separated From Code

Version Controlled Safely

Environment Specific

Secret Protected

Easy To Change

```

---

# 6. Twelve Factor App Principle


Mengikuti:


```

Config Stored In Environment

Not Hardcoded

````

Example:


Bad:


```python
DATABASE_PASSWORD="12345"
````

Good:

```python
DATABASE_PASSWORD=os.getenv(
"DATABASE_PASSWORD"
)
```

---

# 7. Configuration File Structure

Recommended:

```
project-root/


├── .env.example


├── .env.development


├── .env.staging


├── .env.production


└── config/

    ├── development.yaml

    ├── staging.yaml

    └── production.yaml

```

---

# 8. Environment Variable Category

## Application

```
APP_NAME

APP_ENV

APP_VERSION

DEBUG

```

---

## Database

```
DATABASE_HOST

DATABASE_PORT

DATABASE_NAME

DATABASE_USER

DATABASE_PASSWORD

```

---

## Authentication

```
JWT_SECRET

JWT_EXPIRE_TIME

SESSION_SECRET

```

---

## Storage

```
STORAGE_BUCKET

STORAGE_ACCESS_KEY

STORAGE_SECRET_KEY

```

---

## AI Service

```
LLM_PROVIDER

AI_API_KEY

EMBEDDING_MODEL

VECTOR_DATABASE_URL

```

---

## External Service

```
EMAIL_HOST

PAYMENT_KEY

NOTIFICATION_TOKEN

```

---

# 9. Development Configuration

Example:

```
APP_ENV=development

DEBUG=true

DATABASE_HOST=localhost

REDIS_HOST=localhost

LOG_LEVEL=DEBUG

```

---

# 10. Staging Configuration

Example:

```
APP_ENV=staging

DEBUG=false

DATABASE_HOST=staging-db

LOG_LEVEL=INFO

```

---

# 11. Production Configuration

Example:

```
APP_ENV=production

DEBUG=false

DATABASE_HOST=production-db

LOG_LEVEL=WARNING

```

---

# 12. Docker Environment Injection

Docker Compose:

```yaml
services:

 backend:

  environment:

   APP_ENV: production

   DATABASE_URL: ${DATABASE_URL}

```

---

# 13. Environment File Usage

Development:

```
docker compose \
--env-file .env.development

```

---

Production:

```
docker compose \
--env-file .env.production

```

---

# 14. Backend Configuration

Backend harus memiliki:

```
Config Loader

Environment Validator

Default Value

Runtime Check

```

---

Example:

```
Application Start


        |

Load Environment


        |

Validate Required Variable


        |

Start Service

```

---

# 15. Frontend Configuration

Frontend variables:

```
NEXT_PUBLIC_API_URL

NEXT_PUBLIC_APP_NAME

NEXT_PUBLIC_ENVIRONMENT

```

---

Important:

Frontend tidak boleh berisi:

```
Database Credential

Private API Key

Secret Token

```

---

# 16. Database Environment Separation

Environment berbeda:

```
Development DB


     |

     |

Staging DB


     |

     |

Production DB

```

Tidak boleh:

```
Production DB

dipakai development

```

---

# 17. Redis Configuration

Development:

```
Local Redis

```

Production:

```
Dedicated Redis Instance

Authentication Enabled

Persistence Configured

```

---

# 18. Storage Configuration

Development:

```
Local Storage

```

Production:

```
Object Storage

S3 Compatible Storage

```

---

# 19. AI Environment Configuration

AI Service:

```
LLM Provider

Model Name

API Credential

Token Limit

Embedding Configuration

```

---

Example:

```
AI_MODEL=gpt-model

EMBEDDING_MODEL=text-embedding

VECTOR_DB=pgvector

```

---

# 20. Logging Configuration

Development:

```
DEBUG

Full Stack Trace

Verbose Log

```

---

Production:

```
Error Log

Security Log

Audit Log

Performance Log

```

---

# 21. Feature Flag Configuration

Digunakan untuk:

```
Enable Feature

Disable Feature

Beta Testing

A/B Testing

```

Example:

```
ENABLE_AI_TUTOR=true

ENABLE_PAYMENT=false

```

---

# 22. Configuration Validation

Saat startup:

```
Load Config


 |

Check Required Variable


 |

Validate Format


 |

Application Start

```

---

Example:

```
Missing JWT_SECRET


        |

Application Startup Failed

```

---

# 23. Local Developer Setup

Flow:

```
Clone Repository


 |

Copy .env.example


 |

Configure Local Value


 |

Run Docker Compose


 |

Start Development

```

---

# 24. CI/CD Environment Integration

Pipeline:

```
GitHub Actions


        |

Environment Secret


        |

Docker Build


        |

Deployment

```

---

# 25. Environment Secret Mapping

Example:

```
GitHub Secret


        |

CI/CD


        |

Container Environment


        |

Application

```

---

# 26. Configuration Version Control

Yang disimpan:

```
.env.example

Configuration Template

Documentation

```

---

Yang tidak disimpan:

```
.env.production

Secret Key

Password

Private Token

```

---

# 27. Configuration Backup

Backup:

```
Environment Template

Secret Metadata

Infrastructure Configuration

```

---

# 28. Environment Monitoring

Monitor:

```
Configuration Drift

Missing Variable

Invalid Config

Expired Secret

```

---

# 29. Production Readiness Checklist

```
☑ Environment Separation

☑ Secret Externalized

☑ Config Validation

☑ Database Separation

☑ Logging Configured

☑ Feature Flag Ready

☑ Backup Strategy

☑ CI/CD Integration

```

---

# 30. Recommended Stack

Configuration:

```
Environment Variable

Docker Compose

GitHub Environment

Secret Manager

```

Future:

```
Hashicorp Vault

AWS Secrets Manager

Kubernetes ConfigMap

Kubernetes Secret

```

---

# Summary

Environment Configuration Architecture YakinLulus.id:

```
Separated Environment

+

Secure Configuration

+

Externalized Secret

+

Validated Runtime

+

Deployment Flexibility

=

Reliable Application Operation

```

Dengan strategi ini, perubahan konfigurasi dapat dilakukan tanpa mengubah source code dan tetap aman dari kebocoran credential.

````
