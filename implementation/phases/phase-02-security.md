# Phase 2: Security & HTTP Layer (Backend)

> Apply security middleware: headers, CORS, rate limiting, and input sanitization.

---

## Epic 2.1: Security Headers

### Feature 2.1.1: Helmet Configuration
- [ ] Install and apply `helmet` middleware
- [ ] Enable XSS protection header
- [ ] Enable content-type nosniff
- [ ] Enable HSTS (Strict-Transport-Security)
- [ ] Enable frame guard (X-Frame-Options: DENY)
- [ ] Configure Content Security Policy for API server

---

## Epic 2.2: CORS Configuration

### Feature 2.2.1: Dynamic Origin Validation
- [ ] Create `config/cors.js`
- [ ] Load allowed origins from environment config (comma-separated)
- [ ] Configure allowed methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
- [ ] Configure allowed headers: Content-Type, Authorization, X-Request-Id
- [ ] Enable credentials support
- [ ] Dynamic origin validation function (check against allowed list)
- [ ] Never use `origin: '*'` in production

---

## Epic 2.3: Rate Limiting

### Feature 2.3.1: Rate Limiter Middleware
- [ ] Create `middleware/rate-limiter.js`
- [ ] General API limiter: 100 requests / 15 minutes per IP
- [ ] Auth endpoints limiter: 5 requests / 15 minutes per IP
- [ ] Make limits configurable via environment variables
- [ ] Return `429 Too Many Requests` with `Retry-After` header

---

## Epic 2.4: Input Sanitization

### Feature 2.4.1: Request Body Protection
- [ ] Apply `express-mongo-sanitize` to strip `$` operators from user input
- [ ] Apply XSS sanitization middleware
- [ ] Apply HPP (HTTP Parameter Pollution) protection
- [ ] Set request body size limit: `express.json({ limit: '10kb' })`


---

## Integrated DevOps & CI/CD (Backend)

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

### Feature 13.2.1: GitHub Actions & Environments
- [ ] Workflow 1 (Staging): Merge from `feature/*` to `staging` builds image, deploys to **Staging URL**, executes automated Prod-to-Staging DB sync script, and auto-deletes the feature branch
- [ ] Workflow 2 (Production): Merge from `staging` to `release` builds production image and auto-deploys to **Prod URL**
- [ ] Enforce branch protection rules on `release` and `staging`

---

## Epic 13.3: Disaster Recovery & Backups

### Feature 13.3.1: Automated DB Backups
- [ ] Create a Cron Job script (`scripts/backup-db.js`)
- [ ] Execute `mongodump` to extract all MongoDB collections
- [ ] Encrypt the dump archive using AES-256
- [ ] Upload the encrypted archive to a secure Cloud Storage bucket (e.g., AWS S3)
- [ ] Configure backup frequency (e.g., daily at 3:00 AM) and retention policy (keep last 30 days)
