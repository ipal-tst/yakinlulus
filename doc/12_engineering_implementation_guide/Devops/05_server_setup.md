```markdown id="s5v9kx"
# 12_engineering_implementation_guide/devops/05_server_setup.md

# Production Server Setup Architecture

## 1. Tujuan

Dokumen ini menjelaskan standar setup server untuk deployment production YakinLulus.id.

Server setup mencakup:

```

Operating System

*

Network Configuration

*

Security Hardening

*

Docker Runtime

*

Application Deployment Environment

```

Tujuan:

```

Reliable Infrastructure

*

Secure Operation

*

Easy Maintenance

*

Production Scalability

```

---

# 2. Server Architecture Overview


```

```
                Internet


                   |

                   |

                Firewall


                   |

                   |

                Nginx


                   |

    +--------------+--------------+

    |              |              |

 Frontend      Backend API     WebSocket


                   |

                   |

          Internal Network


                   |

    +--------------+--------------+

    |              |              |

Database        Redis          Worker


                   |

                   |

              AI Service
```

```

---

# 3. Recommended Server Stack


Operating System:


```

Ubuntu Server LTS

```

Recommended:

```

Ubuntu Server 24.04 LTS

```

---

Runtime:


```

Docker Engine

Docker Compose

Nginx

Certbot

Git

```

---

Monitoring:

```

Prometheus

Grafana

Node Exporter

```

---

# 4. Server Specification


## MVP Production


Minimum:


```

CPU:

4 Core

RAM:

8 GB

Storage:

100 GB SSD

Network:

100 Mbps

```

---

Recommended:


```

CPU:

8 Core

RAM:

16 GB

Storage:

200 GB SSD

Network:

1 Gbps

```

---

# 5. Server Role Separation


## Small Deployment


Single Server:


```

Application

Database

Worker

Redis

Nginx

```

Suitable:

```

MVP

Early Production

Low Traffic

```

---

## Medium Deployment


Separated:


```

Server 1:

Frontend + Backend

Server 2:

Database

Server 3:

Worker + AI

```

---

## Enterprise Deployment


```

Load Balancer

```
    |
```

Application Cluster

```
    |
```

Database Cluster

```
    |
```

AI Processing Cluster

````

---

# 6. Initial Server Setup


Update system:


```bash
sudo apt update

sudo apt upgrade -y
````

---

Install essential tools:

```bash
sudo apt install \
curl \
git \
vim \
htop \
net-tools \
ufw \
-y
```

---

# 7. Create Deployment User

Tidak menggunakan root.

Create user:

```bash
sudo adduser deployer
```

Add sudo:

```bash
sudo usermod -aG sudo deployer
```

---

# 8. SSH Configuration

Disable password login:

```
PasswordAuthentication no

```

Use SSH Key:

```
Developer Machine

        |

        |

SSH Key

        |

        |

Server

```

---

# 9. Firewall Configuration

Menggunakan UFW.

Enable:

```bash
sudo ufw enable
```

Allow SSH:

```bash
sudo ufw allow 22
```

Allow HTTP:

```bash
sudo ufw allow 80
```

Allow HTTPS:

```bash
sudo ufw allow 443
```

---

# 10. Docker Installation

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

---

Add user:

```bash
sudo usermod -aG docker deployer
```

---

Verify:

```bash
docker version
```

---

# 11. Docker Compose Installation

Check:

```bash
docker compose version
```

---

Required:

```
Docker Compose v2

```

---

# 12. Directory Structure

Production directory:

```
/opt/


└── yakinlulus/


    ├── backend/


    ├── frontend/


    ├── ai-service/


    ├── docker-compose.yml/


    ├── env/


    ├── backup/


    └── logs/

```

---

# 13. Application Deployment Directory

Example:

```
/opt/yakinlulus


docker-compose.prod.yml


.env.production


```

---

# 14. Environment Configuration

Production menggunakan:

```
.env.production

```

Berisi:

```
DATABASE_URL

REDIS_URL

JWT_SECRET

AI_API_KEY

STORAGE_KEY

```

---

# 15. Nginx Installation

Install:

```bash
sudo apt install nginx -y
```

---

Check:

```bash
systemctl status nginx
```

---

# 16. Nginx Architecture

```
Client


 |

HTTPS


 |

Nginx


 |

Docker Network


 |

Application Container

```

---

# 17. SSL Configuration

Menggunakan:

```
Let's Encrypt

Certbot

```

Install:

```bash
sudo apt install certbot python3-certbot-nginx
```

---

Generate:

```bash
certbot --nginx
```

---

# 18. Domain Configuration

Example:

```
app.yakinlulus.id


api.yakinlulus.id

```

---

DNS:

```
Domain

        |

        |

Server IP

```

---

# 19. Application Deployment Flow

```
Server Ready


 |

Clone Repository


 |

Configure Environment


 |

Pull Docker Image


 |

Run Migration


 |

Start Container


 |

Health Check

```

---

# 20. Deployment Command

Example:

```bash
docker compose \
-f docker-compose.prod.yml \
up -d
```

---

Check:

```bash
docker ps
```

---

# 21. Database Deployment

Migration:

```bash
docker exec backend \
python manage.py migrate
```

---

Seed:

```bash
python manage.py seed
```

---

# 22. Backup Directory

Structure:

```
backup/


├── database/


├── media/


└── configuration/

```

---

# 23. Log Management

Application:

```
/opt/yakinlulus/logs

```

Docker:

```bash
docker logs container_name
```

---

# 24. Server Security Hardening

Required:

```
Disable Root Login

SSH Key Authentication

Firewall Enabled

Automatic Security Update

Minimal Installed Package

```

---

# 25. Fail2Ban Installation

Protection:

```
SSH Brute Force

Login Attack

```

Install:

```bash
sudo apt install fail2ban
```

---

# 26. Automatic Update

Enable:

```
Unattended Upgrade

```

Purpose:

```
Security Patch

Critical Fix

```

---

# 27. Time Synchronization

Required for:

```
Log Accuracy

JWT Validation

Certificate

Database

```

Install:

```bash
sudo apt install chrony
```

---

# 28. Server Monitoring Preparation

Install:

```
Node Exporter

Docker Metrics

Log Collector

```

Metrics:

```
CPU

Memory

Disk

Network

Container Status

```

---

# 29. Production Checklist

Before Go Live:

```
☑ Server Updated

☑ Firewall Configured

☑ SSH Secured

☑ Docker Installed

☑ Domain Connected

☑ SSL Active

☑ Environment Configured

☑ Backup Configured

☑ Monitoring Active

☑ Deployment Tested

```

---

# 30. Disaster Recovery Preparation

Server failure:

```
New Server


 |

Install Docker


 |

Pull Repository


 |

Restore Backup


 |

Deploy Container


 |

Restore Service

```

---

# 31. Future Infrastructure Evolution

MVP:

```
Single Ubuntu Server

Docker Compose

Nginx

```

---

Growth:

```
Multiple Application Server

Managed Database

Load Balancer

```

---

Enterprise:

```
Kubernetes

Cloud Infrastructure

Infrastructure as Code

Auto Scaling

```

---

# Summary

Production Server Setup YakinLulus.id:

```
Secure Server

+

Docker Runtime

+

Reverse Proxy

+

SSL

+

Application Deployment

+

Monitoring Ready

=

Production Infrastructure Foundation

```

Server setup ini menjadi fondasi agar platform YakinLulus.id dapat berjalan stabil dari tahap MVP sampai skala enterprise.

````
