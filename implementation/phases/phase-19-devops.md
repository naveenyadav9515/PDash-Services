# Phase 19: DevOps & CI/CD (Backend)

> Dockerization, compose setup, and deployment pipelines.

---

## Epic 19.1: Containerization

### Feature 19.1.1: Docker Setup
- [ ] Create multi-stage `Dockerfile` (build, production)
- [ ] Create `Dockerfile.dev` with hot reload support
- [ ] Create `.dockerignore`

### Feature 19.1.2: Local Environment
- [ ] Create `docker-compose.yml` (App + MongoDB + Redis if needed)
- [ ] Setup volume mounts for persistent local dev DB

---

## Epic 19.2: Pipelines

### Feature 19.2.1: GitHub Actions & Environments
- [ ] Workflow 1 (Staging): Merge from `feature/*` to `staging` builds image, deploys to **Staging URL**, executes automated Prod-to-Staging DB sync script, and auto-deletes the feature branch
- [ ] Workflow 2 (Production): Merge from `staging` to `release` builds production image and auto-deploys to **Prod URL**
- [ ] Enforce branch protection rules on `release` and `staging`

---

## Epic 19.3: Disaster Recovery & Backups

### Feature 19.3.1: Automated DB Backups
- [ ] Create a Cron Job script (`scripts/backup-db.js`)
- [ ] Execute `mongodump` to extract all MongoDB collections
- [ ] Encrypt the dump archive using AES-256
- [ ] Upload the encrypted archive to a secure Cloud Storage bucket (e.g., AWS S3)
- [ ] Configure backup frequency (e.g., daily at 3:00 AM) and retention policy (keep last 30 days)

