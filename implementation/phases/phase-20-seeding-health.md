# Phase 20: Seeding, Health Check & API Docs (Backend)

> Database seeding for dev/test, health endpoint, and Swagger docs.

---

## Epic 20.1: Seeding Strategy

### Feature 20.1.1: Seed Script
- [ ] Create `seeds/seed.js`
- [ ] Drop existing data (dev only)
- [ ] Seed Admin and User accounts
- [ ] Seed Module Gallery (F1–F12 + Feature Log)
- [ ] Make script idempotent
- [ ] Configure `npm run seed`

---

## Epic 20.2: Health & Docs

### Feature 20.2.1: Health Check Endpoint
- [ ] `GET /api/v1/health`
- [ ] Return status, DB connection status, uptime, version
- [ ] Publicly accessible (for Docker/LB)

### Feature 20.2.2: Swagger API Docs
- [ ] Install `swagger-jsdoc` and `swagger-ui-express`
- [ ] Add JSDoc annotations to route files
- [ ] Serve at `/api/docs` (disable in production)
