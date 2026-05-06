---
marp: true
theme: default
paginate: true
backgroundColor: #0f172a
color: #f1f5f9
style: |
  section { font-family: 'Inter', 'Segoe UI', sans-serif; }
  h1 { color: #818cf8; font-size: 2.2em; }
  h2 { color: #6366f1; border-bottom: 2px solid #334155; padding-bottom: 8px; }
  h3 { color: #a5b4fc; }
  table { font-size: 0.75em; }
  th { background: #1e293b; color: #94a3b8; }
  td { border-color: #334155; }
  code { background: rgba(99,102,241,0.15); color: #a5b4fc; }
  blockquote { border-left: 4px solid #6366f1; font-style: italic; color: #94a3b8; }
  a { color: #818cf8; }
  strong { color: #f1f5f9; }
---

# 🎓 StudDash
## Student Dashboard System

**Minimal · Containerized · Kubernetes-Ready**

Role-based web app for managing marks, notes & assignments

---

# 🧩 Project Overview

**Problem:** No centralized system for student marks, notes, and assignments

**Solution:** Role-based web application with 3 user types

| Role | Capabilities |
|------|-------------|
| 👑 **Admin** | Manage users (suspend/enable), view system metrics |
| 📚 **Teacher** | Upload PDF notes, view student submissions |
| 🎓 **Student** | View marks + GPA, upload PDF assignments |

---

# 🧰 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React + Vite, Nginx Alpine |
| **Backend** | Node.js 20 + Express |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT + bcrypt |
| **File Upload** | Multer (PDF, 20MB max) |
| **Monitoring** | Prometheus + Grafana |
| **Containers** | Docker + Compose |
| **Orchestration** | Kubernetes (Kind) |
| **CI/CD** | GitHub Actions + Trivy |

---

# 🏗️ Architecture — Request Flow

```
Browser → NGINX Ingress → Frontend (Nginx + React)     [Static]
Browser → NGINX Ingress → Backend (Express) → PostgreSQL [API]
Prometheus → scrape /metrics → Grafana Dashboard        [Monitoring]
```

### 5 Containers (Docker Compose)

| Container | Port | Purpose |
|-----------|------|---------|
| Frontend | 3000→80 | Serves React SPA |
| Backend | 5050→5000 | REST API |
| PostgreSQL | 5432 | Database |
| Prometheus | 9091→9090 | Metrics |
| Grafana | 3003→3000 | Dashboards |

---

# ☸️ Kubernetes Architecture

### Components in namespace `studdash`

| Resource | Count | Details |
|----------|-------|---------|
| **Deployments** | 3 | Frontend ×2, Backend ×2, Postgres ×1 |
| **Services** | 3 | ClusterIP — internal routing |
| **Ingress** | 1 | NGINX: `/` → frontend, `/api` → backend |
| **PVCs** | 2 | 1Gi each — DB data + uploads |
| **Secrets** | 1 | DB creds + JWT key |
| **HPA** | 1 | Auto-scale on CPU |

### Health: Liveness + Readiness probes on `/health`

---

# 🗄️ Database Schema

### 6 Tables in PostgreSQL 16

| Table | Key Columns | FK |
|-------|------------|-----|
| **users** | username, password, role, is_active | — |
| **subjects** | code, name, credits | — |
| **registrations** | student_id, subject_id | → users, subjects |
| **grades** | student_id, subject_id, grade | → users, subjects |
| **notes** | teacher_id, title, filename | → users |
| **assignments** | student_id, title, filename | → users |

**Seed data:** 1 admin, 1 teacher, 3 students, 7 subjects

---

# 🔗 REST API Design

| Endpoint | Methods | Role |
|----------|---------|------|
| `/api/auth` | POST login, register | Public |
| `/api/grades` | GET | Student |
| `/api/notes` | GET, POST | Student / Teacher |
| `/api/assignments` | GET, POST | Student / Teacher |
| `/api/admin/users` | GET, PATCH | Admin |

### Middleware Chain
```
Request → authenticate(JWT) → requireRole(RBAC) → Handler
```

**Multer:** PDF-only, 20MB max, disk storage

---

# 🔐 Security Model

| Layer | Mechanism |
|-------|-----------|
| **Passwords** | bcrypt, 10 salt rounds |
| **Authentication** | JWT Bearer tokens |
| **Authorization** | RBAC middleware (`requireRole`) |
| **Frontend** | ProtectedRoute component |
| **Rate Limiting** | 100 req / 15 min per IP |
| **Container** | Non-root user (`appuser`) |
| **Secrets** | Docker Secrets + K8s Secrets |
| **Scanning** | Trivy CVE detection in CI |

---

# 🔄 CI/CD Pipeline (GitHub Actions)

```
Push → Checkout → Setup Node → Init DB → Install → Test
  → Build Docker Images → Trivy Scan → Push to Docker Hub
```

| Step | Tool | Purpose |
|------|------|---------|
| Test | `node src/test.js` | Integration tests |
| Build | `docker build` | Multi-stage images |
| Scan | **Trivy** | HIGH/CRITICAL CVEs |
| Push | Docker Hub | Registry (main only) |
| Deploy | `kubectl apply` | Manual K8s deploy |

**Why?** Eliminates "works on my machine", ensures verified builds

---

# 📊 Monitoring Stack

### Prometheus
- Scrapes `backend:5000/metrics` every **15 seconds**
- Custom metrics:
  - `studdash_http_requests_total` (Counter)
  - `studdash_http_request_duration_seconds` (Histogram)
  - Default Node.js metrics (CPU, memory, event loop)

### Grafana
- Pre-provisioned datasource + dashboard
- Embedded in Admin Panel via iframe
- Shows: request rate, latency, CPU usage

---

# 🖥️ Frontend Architecture

### Built with Vite + React

```
ProtectedRoute → checks isAuthenticated + user.role → renders page
```

| Route | Access |
|-------|--------|
| `/login`, `/register` | Public |
| `/dashboard`, `/notes`, `/submit-assignment` | Student |
| `/upload-notes`, `/assignments` | Teacher |
| `/admin`, `/admin/metrics` | Admin |

### Key patterns
- **AuthContext** — global auth state (token + user + role)
- **Role-based Navbar** — shows only relevant links
- **Axios interceptor** — auto-attaches JWT to all requests

---

# 🐳 Dockerization

### Multi-Stage Builds

**Frontend:**
```
Stage 1: node:20-alpine → npm build → /app/dist
Stage 2: nginx:alpine → copy dist + nginx.conf → serve
```

**Backend:**
```
Stage 1: node:20-alpine → npm install --omit=dev
Stage 2: node:20-alpine → non-root user → copy modules + src
```

### Docker Compose
- `docker-compose up --build` — all 5 services
- Health checks on PostgreSQL + backend
- Named volumes for persistence
- Bridge network for inter-service communication

---

# ⚡ Graceful Shutdown

```javascript
process.on('SIGTERM', () => {
  server.close(() => {       // Stop accepting connections
    pool.end();              // Drain PostgreSQL connections
    process.exit(0);         // Clean exit
  });
  setTimeout(() => process.exit(1), 10000); // Force after 10s
});
```

### Why it matters in Kubernetes:
- Pods receive SIGTERM during rolling updates
- Prevents data corruption & connection leaks
- 10-second timeout ensures pod doesn't hang

---

# 🧩 Closing

> *"This system is designed to be minimal yet scalable, combining clean architecture, containerization, CI/CD automation, and real-time monitoring to deliver a production-like environment."*

### Key Takeaways
✅ Role-based access at every layer (API + frontend)
✅ Multi-stage Docker builds (small, secure images)
✅ Automated CI/CD with security scanning
✅ Kubernetes with health probes, HPA, persistent storage
✅ Real-time monitoring with Prometheus + Grafana

---

# 🙏 Thank You

**StudDash — Student Dashboard System**

Questions?
