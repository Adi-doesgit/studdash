# 🎓 StudDash — Student Dashboard System

A fully containerized full-stack student dashboard with role-based access, PDF file handling, Kubernetes deployment, and DevOps monitoring.

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend   │────▶│  PostgreSQL  │
│  (Vite/React)│     │  (Express)  │     │   Database   │
│   nginx:80   │     │   :5000     │     │    :5432     │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────▼──────┐     ┌──────────────┐
                    │  Prometheus  │────▶│   Grafana    │
                    │    :9091     │     │    :3003     │
                    └─────────────┘     └──────────────┘
```

## 📋 Tech Stack

| Component  | Technology           |
|-----------|----------------------|
| Frontend  | Vite + React 18      |
| Backend   | Node.js + Express    |
| Database  | PostgreSQL 16        |
| Container | Docker + Compose     |
| Orchestration | Kubernetes (K8s) |
| Monitoring | Prometheus + Grafana |
| CI/CD     | GitHub Actions       |

## 🎯 Features

### Roles & Access

| Role    | Capabilities                        |
|---------|-------------------------------------|
| Student | View grades/GPA, download notes, upload assignments |
| Teacher | Upload notes (PDF), view student assignments |
| Admin   | Manage users, suspend/enable accounts |

### Security
- bcrypt password hashing
- JWT authentication with role-based middleware
- API rate limiting (100 req/15min)
- Graceful shutdown (SIGINT/SIGTERM)
- Docker secrets for sensitive config

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- Docker & Docker Compose
- Git

### Steps

```bash
# 1. Clone the repository
git clone <repo-url> && cd final1

# 2. Create secrets directory
mkdir -p secrets
echo "supersecret-jwt-key-change-in-production" > secrets/jwt_secret.txt

# 3. Start all services
docker-compose up --build

# 4. Access the application
#    Frontend: http://localhost:3000
#    Backend:  http://localhost:5050
#    Prometheus: http://localhost:9091
#    Grafana:    http://localhost:3003 (admin/admin)
```

### Default Credentials

| Username  | Password    | Role    |
|-----------|-------------|---------|
| admin     | admin123    | Admin   |
| teacher1  | password123 | Teacher |
| john      | password123 | Student |
| jane      | password123 | Student |
| alex      | password123 | Student |

### Reset Database

```bash
docker-compose down -v   # Delete volumes
docker-compose up --build # Recreate with fresh data
```

## ☸️ Kubernetes Deployment

### Prerequisites
- minikube or a Kubernetes cluster
- kubectl configured
- Docker images built and available

### Deploy

```bash
# 1. Build images (for minikube, use minikube's Docker daemon)
eval $(minikube docker-env)
docker build -t studdash-backend:latest ./backend
docker build -t studdash-frontend:latest ./frontend

# 2. Enable NGINX Ingress Controller
minikube addons enable ingress

# 3. Apply manifests (order matters)
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/postgres-pv.yml
kubectl apply -f k8s/uploads-pv.yml
kubectl apply -f k8s/postgres-deployment.yml

# Wait for PostgreSQL to be ready
kubectl -n studdash wait --for=condition=ready pod -l app=postgres --timeout=60s

kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/frontend-deployment.yml
kubectl apply -f k8s/ingress.yml

# 4. (Optional) Enable HPA — requires Metrics Server
minikube addons enable metrics-server
kubectl apply -f k8s/hpa.yml

# 5. Add host entry
echo "$(minikube ip) studdash.local" | sudo tee -a /etc/hosts

# 6. Access at http://studdash.local
```

### Verify Deployment

```bash
kubectl -n studdash get pods
kubectl -n studdash get services
kubectl -n studdash get ingress
```

### Re-initialize Database

```bash
# Delete PostgreSQL PVC to re-run init.sql on next startup
kubectl -n studdash delete pvc postgres-pvc
kubectl -n studdash delete pod -l app=postgres
kubectl apply -f k8s/postgres-pv.yml
# Wait for postgres to restart, then restart backend
kubectl -n studdash rollout restart deployment backend
```

## 📊 Monitoring

### Prometheus
- **URL**: http://localhost:9091 (Docker Compose) or via port-forward
- **Metrics**: `studdash_http_requests_total`, `studdash_http_request_duration_seconds`

### Grafana
- **URL**: http://localhost:3003 (Docker Compose)
- **Login**: admin / admin
- **Dashboard**: Pre-configured "StudDash Backend" dashboard with:
  - HTTP request rate
  - Response latency (p50, p95)
  - Error rate
  - CPU/memory usage
  - Event loop lag

## 🧪 Testing

```bash
# Run integration tests (requires running backend + PostgreSQL)
cd backend
npm test
```

Tests cover:
- `GET /health` → 200 OK
- `POST /api/auth/login` → 401 for invalid, 200 for valid
- `GET /api/grades` → 200 with GPA
- `GET /metrics` → 200

## 📁 Project Structure

```
final1/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # Environment + secrets config
│   │   ├── db/             # PostgreSQL pool + init.sql
│   │   ├── middleware/     # Auth, RBAC, file upload
│   │   ├── routes/         # Auth, grades, notes, assignments, admin
│   │   ├── index.js        # Entry point
│   │   ├── metrics.js      # Prometheus metrics
│   │   └── test.js         # Integration tests
│   └── Dockerfile
├── frontend/                # Vite + React
│   ├── src/
│   │   ├── api/            # Axios instance
│   │   ├── components/     # Navbar
│   │   ├── context/        # Auth context
│   │   ├── pages/          # All pages
│   │   ├── App.jsx         # Router + role-based routing
│   │   └── App.css         # Complete stylesheet
│   ├── nginx.conf
│   └── Dockerfile
├── k8s/                     # Kubernetes manifests
├── prometheus/              # Prometheus config
├── grafana/                 # Grafana provisioning
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## 🔐 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Build** — Install dependencies
2. **Test** — Start PostgreSQL service, run init.sql, start backend, run tests
3. **Docker Build** — Build frontend + backend images
4. **Security Scan** — Trivy vulnerability scan
5. **Push** — Push images to Docker Hub (main branch only)
6. **Deploy** — Manual `kubectl apply` (not auto-deployed)

### Required GitHub Secrets
- `DOCKER_HUB_USERNAME` — Docker Hub username
- `DOCKER_HUB_TOKEN` — Docker Hub access token

## ⚠️ Notes

- **File uploads**: PDF only, max 20MB
- **JWT tokens**: Expire after 24 hours, no blacklist
- **Database init**: Runs only on first boot with empty PVC. Delete PVC to re-run.
- **HPA**: Requires Metrics Server (`minikube addons enable metrics-server`)
- **K8s Secrets**: Generated with `echo -n "value" | base64` (no trailing newline)
