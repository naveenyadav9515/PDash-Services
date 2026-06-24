# Phase 13: DevOps & CI/CD (Backend)

> Dockerization, compose setup, and deployment pipelines.

---

## Epic 13.1: Containerization

### Feature 13.1.1: Docker Setup
- [ ] Create multi-stage `Dockerfile` (build, production)
- [ ] Create `Dockerfile.dev` with hot reload support
- [ ] Create `.dockerignore`

### Feature 13.1.2: Local Environment
- [ ] Create `docker-compose.yml` (App + MongoDB + Redis if needed)
- [ ] Setup volume mounts for persistent local dev DB

---

## Epic 13.2: Pipelines

### Feature 13.2.1: GitHub Actions
- [ ] Create workflow: PR triggers lint + test + audit
- [ ] Create workflow: Merge to `main` builds and pushes image
- [ ] Enforce branch protection rules
