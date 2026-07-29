```markdown id="p7k4sd"
# 12_engineering_implementation_guide/devops/07_secret_management.md

# Secret Management Architecture

## 1. Tujuan

Dokumen ini menjelaskan strategi pengelolaan secret dan credential pada platform YakinLulus.id.

Secret management bertujuan menjaga informasi sensitif seperti:

```

Database Credential

API Key

JWT Secret

Encryption Key

SSH Key

Cloud Credential

Third Party Token

```

agar tidak bocor dan tetap dapat digunakan secara aman oleh aplikasi.

---

# 2. Secret Management Principle


Prinsip utama:


```

Never Hardcode Secret

*

Never Commit Secret

*

Least Privilege Access

*

Rotate Regularly

*

Audit Every Access

```

---

# 3. Secret Category


Secret YakinLulus.id:


```

Application Secret

Database Secret

Infrastructure Secret

External Service Secret

AI Service Secret

Deployment Secret

```

---

# 4. Application Secret


Digunakan oleh backend/frontend service.


Contoh:


```

JWT_SECRET

SESSION_SECRET

ENCRYPTION_KEY

CSRF_SECRET

APP_SECRET_KEY

```

---

# 5. Database Secret


Credential database:


```

DATABASE_HOST

DATABASE_PORT

DATABASE_NAME

DATABASE_USERNAME

DATABASE_PASSWORD

DATABASE_URL

```

---

# 6. Infrastructure Secret


Untuk operasi server:


```

SSH_PRIVATE_KEY

SERVER_PASSWORD

DOCKER_TOKEN

REGISTRY_TOKEN

CLOUD_ACCESS_KEY

```

---

# 7. External Service Secret


Integrasi:


```

Email Provider API Key

Payment Gateway Key

Notification Token

Storage Credential

Analytics Key

```

---

# 8. AI Service Secret


AI integration:


```

LLM_API_KEY

Embedding_API_KEY

Vector_DB_CREDENTIAL

AI_SERVICE_TOKEN

```

---

# 9. Secret Lifecycle


Setiap secret memiliki lifecycle:


```

Create

|

Store

|

Distribute

|

Use

|

Rotate

|

Expire

|

Remove

```

---

# 10. Secret Storage Architecture


MVP:


```

GitHub Secrets

*

Environment Variable

*

Docker Secret

```

---

Future:


```

Hashicorp Vault

AWS Secrets Manager

Google Secret Manager

Azure Key Vault

```

---

# 11. Development Secret Strategy


Developer lokal:


```

.env.local

````

Contoh:


```env
DATABASE_URL=postgresql://localhost/yakinlulus

JWT_SECRET=development-secret

````

---

Rules:

```
Tidak masuk Git

Tidak dikirim ke public

Hanya local machine

```

---

# 12. Environment Secret Separation

Setiap environment memiliki secret sendiri:

```
Development


DATABASE_PASSWORD_DEV



Staging


DATABASE_PASSWORD_STAGING



Production


DATABASE_PASSWORD_PRODUCTION

```

---

Tidak diperbolehkan:

```
Development

        |

        |

Production Secret

```

---

# 13. GitHub Secrets Architecture

Flow:

```
GitHub Repository


        |

        |

GitHub Secret Storage


        |

        |

GitHub Actions


        |

        |

Deployment Environment


        |

        |

Application Container

```

---

# 14. GitHub Environment Secret

Environment:

```
development

staging

production

```

Masing-masing:

```
DATABASE_URL

JWT_SECRET

API_KEY

SSH_KEY

```

---

# 15. Secret Injection

Pipeline:

```
CI/CD Start


 |

Read Secret


 |

Inject Environment


 |

Build Container


 |

Deploy

```

---

# 16. Docker Secret Strategy

Production:

```
Host Secret


      |

      |

Docker Runtime


      |

      |

Container

```

---

Tidak:

```
Secret

 |

Docker Image

```

---

# 17. Secret File Management

Directory:

```
/opt/yakinlulus/


├── env/


│   ├── production.env


│   └── staging.env


```

Permission:

```
chmod 600 production.env

```

---

# 18. Secret Permission

Principle:

```
Application hanya membaca secret yang diperlukan

```

Contoh:

Backend API:

```
DATABASE_URL

JWT_SECRET

STORAGE_KEY

```

Tidak membutuhkan:

```
SSH_PRIVATE_KEY

```

---

# 19. Secret Rotation Strategy

Rotation dilakukan untuk:

```
Compromised Secret

Expired Secret

Employee Change

Security Policy

```

---

Flow:

```
Generate New Secret


 |

Update Secret Store


 |

Deploy Application


 |

Verify


 |

Revoke Old Secret

```

---

# 20. JWT Secret Management

JWT secret:

```
High Sensitivity

Long Random String

Never Shared

```

Recommended:

```
Minimum 256 bit entropy

```

---

# 21. Database Credential Security

Database:

```
Separate User


Limited Permission


No Root Access


Connection Encryption

```

---

Example:

```
application_user


READ/WRITE Application Database


```

Bukan:

```
postgres superuser

```

---

# 22. API Key Security

Rules:

```
Scope Limited

Rate Limited

Expiration Enabled

Usage Monitored

```

---

# 23. SSH Key Management

Deployment:

```
Developer


 |

SSH Private Key


 |

GitHub Secret


 |

CI/CD Runner


 |

Production Server

```

---

Security:

```
No Password Login

Key Rotation

Restricted User

```

---

# 24. Secret Scanning

Tools:

```
GitHub Secret Scanning

TruffleHog

Gitleaks

Dependabot

```

---

Pipeline:

```
Commit


 |

Scan


 |

Detect Secret


 |

Block Merge

```

---

# 25. Prevent Secret Leakage

Forbidden:

```
console.log(API_KEY)


print(password)


commit .env


upload credential file

```

---

# 26. Logging Security

Tidak boleh log:

```
Password

Token

API Key

Cookie

Session ID

```

---

Allowed:

```
Request ID

User ID

Timestamp

Operation Status

```

---

# 27. Backup Secret

Backup:

```
Encrypted

Restricted Access

Audited

Offline Copy

```

---

Tidak:

```
Plain Text Backup

Public Storage

Shared Drive

```

---

# 28. Production Secret Checklist

```
☑ No Hardcoded Secret

☑ Environment Based Configuration

☑ Secret Storage Implemented

☑ Access Restricted

☑ Rotation Procedure

☑ Audit Logging

☑ Secret Scanning Enabled

```

---

# 29. Recommended Implementation

MVP:

```
GitHub Secrets

+

Docker Environment Variable

+

Encrypted Backup

```

---

Growth:

```
Hashicorp Vault

+

Automatic Rotation

+

Centralized Audit

```

---

# 30. Final Secret Management Architecture

```
Secret Provider


        |

        |

CI/CD Pipeline


        |

        |

Deployment Runtime


        |

        |

Application


        |

        |

Audit System

```

---

# Summary

Secret Management YakinLulus.id:

```
Secure Storage

+

Controlled Access

+

Automatic Injection

+

Rotation Strategy

+

Audit Capability

=

Protected Application Credential

```

Secret management menjadi komponen penting agar platform YakinLulus.id dapat beroperasi secara aman dalam lingkungan production.

