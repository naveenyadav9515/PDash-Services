# Lumina Personal Hub — Backend (Express.js) Implementation Plan

This document is the step-by-step execution blueprint for implementing the backend Express.js application in strict compliance with the **Enterprise Backend Guidelines**. Each phase is broken into actionable tasks with clear deliverables.

---

## Phase 0: Project Scaffolding & Foundation Setup

### 0.1. Project Initialization
- [ ] Initialize Node.js project with `npm init`.
- [ ] Install core dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `compression`, `winston`, `morgan`, `bcrypt`, `jsonwebtoken`.
- [ ] Install dev dependencies: `nodemon`, `eslint`, `prettier`, `jest`, `supertest`, `mongodb-memory-server`.
- [ ] Configure `package.json` scripts: `start`, `dev`, `test`, `test:coverage`, `lint`, `seed`.

### 0.2. Directory Structure Creation
- [ ] Create the full directory tree as defined in Guidelines Section 1:
  - `config/` — `index.js`, `database.js`, `logger.js`, `cors.js`
  - `controllers/`, `services/`, `models/`, `routes/`, `middleware/`, `utils/`, `validators/`, `seeds/`, `tests/`
- [ ] Separate `app.js` (Express app setup) from `index.js` (server bootstrap) for testability.

### 0.3. Linting & Formatting Setup
- [ ] Configure ESLint with Node.js recommended rules.
- [ ] Configure Prettier with `.prettierrc`.
- [ ] Set up Husky + lint-staged for pre-commit hooks.
- [ ] Add `.editorconfig` for cross-IDE consistency.

### 0.4. Git Configuration
- [ ] Create comprehensive `.gitignore` (node_modules, .env, coverage, logs, dist).
- [ ] Create `.env.example` with all required environment variable keys.
- [ ] Commit initial project scaffold.

---

## Phase 1: Configuration & Core Infrastructure

### 1.1. Environment Configuration Module
- [ ] Create `config/index.js`:
  - Load all environment variables via `dotenv`.
  - Validate required variables at startup (fail-fast).
  - Export structured config object (port, DB, JWT, CORS, rate limits).
  - Parse comma-separated values (CORS origins) into arrays.
- [ ] Create `.env` for local development with all required keys.

### 1.2. Structured Logging
- [ ] Create `config/logger.js` with Winston:
  - Development: colorized console output with timestamps.
  - Production: JSON-structured format for log aggregation.
  - Log levels: `error`, `warn`, `info`, `debug`.
  - File transports for error logs in production.
- [ ] Create `middleware/request-logger.js` using Morgan + Winston transport:
  - Log: method, URL, status code, response time, content length.
  - Redact sensitive data from logs.

### 1.3. Database Connection Manager
- [ ] Create `config/database.js`:
  - Mongoose connection with pooling options.
  - Connection event listeners (connected, disconnected, error) with structured logging.
  - Auto-reconnect configuration.
  - Graceful shutdown on `SIGINT`/`SIGTERM`.
- [ ] Verify connection on startup with health check.

### 1.4. Custom Error Infrastructure
- [ ] Create `utils/AppError.js`:
  - Extend `Error` with `statusCode`, `code`, `isOperational`, `details`.
  - Factory methods: `AppError.badRequest()`, `AppError.notFound()`, `AppError.unauthorized()`, `AppError.forbidden()`.
- [ ] Create `utils/catchAsync.js` — async wrapper to eliminate try-catch in controllers.
- [ ] Create `utils/response.util.js`:
  - `sendSuccess(res, data, statusCode)` — success envelope.
  - `sendCreated(res, data)` — 201 envelope.
  - `sendNoContent(res)` — 204 response.
- [ ] Create `utils/pagination.util.js`:
  - Parse pagination query params with defaults and limits.
  - Build pagination metadata for response envelope.

### 1.5. Centralized Error Handling Middleware
- [ ] Create `middleware/error-handler.js`:
  - Mongoose `ValidationError` → `400 VALIDATION_ERROR` with field details.
  - Mongoose `CastError` → `400 INVALID_ID`.
  - MongoDB `11000` → `409 DUPLICATE_KEY`.
  - JWT `JsonWebTokenError` → `401 INVALID_TOKEN`.
  - JWT `TokenExpiredError` → `401 TOKEN_EXPIRED`.
  - Operational errors → formatted response with status code.
  - Programmer errors → `500` with generic message, full stack trace logged.
  - Stack traces never exposed in production.

### 1.6. Correlation ID Middleware
- [ ] Create middleware to generate UUID for each request.
- [ ] Attach to `req.requestId`.
- [ ] Include in all log entries.
- [ ] Return as `X-Request-Id` response header.

---

## Phase 2: Security Middleware Stack

### 2.1. Helmet Configuration
- [ ] Apply Helmet with security headers:
  - XSS protection, content-type nosniff, HSTS, frame guard.
  - Configure CSP policy for API server.

### 2.2. CORS Configuration
- [ ] Create `config/cors.js`:
  - Load allowed origins from environment config.
  - Configure allowed methods, headers, credentials.
  - Dynamic origin validation function.
  - Never use `origin: '*'` in production.

### 2.3. Rate Limiting
- [ ] Create `middleware/rate-limiter.js`:
  - General API: 100 requests / 15 minutes per IP.
  - Auth endpoints: 5 requests / 15 minutes per IP.
  - Configurable via environment variables.
  - Return `429 Too Many Requests` with `Retry-After` header.

### 2.4. Input Sanitization
- [ ] Apply `express-mongo-sanitize` to strip `$` operators from input.
- [ ] Apply XSS sanitization middleware.
- [ ] Apply HPP (HTTP Parameter Pollution) protection.
- [ ] Set request body size limit: `express.json({ limit: '10kb' })`.

---

## Phase 3: Authentication & Authorization

### 3.1. User Model
- [ ] Create `models/user.model.js`:
  - Fields: `firstName`, `lastName`, `email`, `password`, `role`, `isActive`, `allowedFeatures`, `enabledFeatures`.
  - Enable `{ timestamps: true }`.
  - Define indexes: unique on `email`.
  - Schema-level `select: false` on `password`.
  - Pre-save hook for password hashing (bcrypt, 12 salt rounds).
  - Instance method: `comparePassword(candidatePassword)`.
  - Virtual: `fullName`.

### 3.2. Authentication Service
- [ ] Create `services/auth.service.js`:
  - `register(userData)` — create user with hashed password.
  - `login(email, password)` — verify credentials, generate JWT tokens.
  - `switchUser(userId)` — development-only session switcher.
  - `refreshToken(token)` — validate refresh token, issue new access token.

### 3.3. Auth Controller & Routes
- [ ] Create `controllers/auth.controller.js` using `catchAsync` wrapper.
- [ ] Create `routes/auth.routes.js`:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/switch` (dev only)

### 3.4. Auth Middleware
- [ ] Create `middleware/auth.middleware.js`:
  - Extract JWT from `Authorization: Bearer` header.
  - Verify token signature and expiry.
  - Attach decoded user to `req.user`.
  - Return `401 Unauthorized` for invalid/missing tokens.
- [ ] Create `restrictTo(...roles)` middleware factory for RBAC.
- [ ] Create `featureAccess(featureKey)` middleware for feature-flag checks.

### 3.5. Validation Schemas
- [ ] Create `validators/auth.validator.js`:
  - `registerSchema` — validate email, password, names.
  - `loginSchema` — validate email, password.
  - `switchSchema` — validate userId.

---

## Phase 4: Global Configuration Module

### 4.1. Config Model
- [ ] Create `models/config.model.js`:
  - Global feature toggles (notes, kitchen, finance, travel, reminders, rules, movies).
  - Master grocery catalog with name, category, defaultPrice.
  - Enable `{ timestamps: true }`.

### 4.2. Config Service, Controller & Routes
- [ ] Create `services/config.service.js`:
  - `getConfig()` — fetch global configuration (with caching).
  - `updateFeatureFlags(flags)` — admin-only bulk toggle.
  - `getMasterGroceries(filters)` — paginated grocery list.
  - `addMasterGrocery(item)` / `updateMasterGrocery(id, data)` / `deleteMasterGrocery(id)`.
- [ ] Create `controllers/config.controller.js`.
- [ ] Create `routes/config.routes.js`:
  - `GET /api/v1/config`
  - `PATCH /api/v1/config/features` (admin only)
  - `GET /api/v1/config/groceries`
  - `POST /api/v1/config/groceries` (admin only)
  - `PATCH /api/v1/config/groceries/:id` (admin only)
  - `DELETE /api/v1/config/groceries/:id` (admin only)
- [ ] Create `validators/config.validator.js`.

---

## Phase 5: User Management Module

### 5.1. User Service, Controller & Routes
- [ ] Create `services/user.service.js`:
  - `getAllUsers(filters, pagination)` — admin-only paginated list.
  - `getUserById(id)` — fetch single user (exclude password).
  - `updateUser(id, data)` — update profile fields.
  - `updateUserFeatures(id, allowedFeatures)` — admin assign features.
  - `updateUserSettings(id, enabledFeatures)` — user toggle display features.
  - `deactivateUser(id)` — soft deactivate.
- [ ] Create `controllers/user.controller.js`.
- [ ] Create `routes/user.routes.js`:
  - `GET /api/v1/users` (admin only)
  - `GET /api/v1/users/:id`
  - `PATCH /api/v1/users/:id`
  - `PATCH /api/v1/users/:id/features` (admin only)
  - `PATCH /api/v1/users/:id/settings`
  - `DELETE /api/v1/users/:id` (admin only, soft delete)
- [ ] Create `validators/user.validator.js`.

---

## Phase 6: Feature Module APIs

### 6.1. Notes Module (F1)
- [ ] Create `models/note.model.js`: `userId`, `title`, `content`, `category`, `isPinned`, `tags[]`, `isDeleted`.
- [ ] Create `services/note.service.js`: CRUD + search + pin/unpin + filter by category/tag.
- [ ] Create `controllers/note.controller.js`.
- [ ] Create `routes/note.routes.js`: Full CRUD at `/api/v1/notes`.
- [ ] Create `validators/note.validator.js`.

### 6.2. Kitchen Utilities Module (F2)
- [ ] Create `models/kitchen.model.js`: `userId`, `utilityType` (gas/water/power), `currentLevel`, `threshold`, `lastRefillDate`.
- [ ] Create service, controller, routes, validators.
- [ ] Routes: `/api/v1/kitchen-utilities`.
- [ ] Threshold alerts integration point with Reminders.

### 6.3. Expense Tracker Module (F3)
- [ ] Create `models/expense.model.js`: `userId`, `type` (income/expense), `amount`, `category`, `description`, `date`, `tags[]`.
- [ ] Create service with aggregation queries for category breakdown and monthly trends.
- [ ] Create controller, routes (`/api/v1/expenses`), validators.

### 6.4. Travel Logger Module (F4)
- [ ] Create `models/travel.model.js`: `userId`, `title`, `type` (past/future), `startDate`, `endDate`, `description`, `checklist[]`, `status`.
- [ ] Create service, controller, routes (`/api/v1/travels`), validators.

### 6.5. Big Purchases Module (F5)
- [ ] Create `models/purchase.model.js`: `userId`, `itemName`, `targetAmount`, `savedAmount`, `deadline`, `monthlySavingsRequired` (virtual).
- [ ] Create service with savings calculation logic.
- [ ] Create controller, routes (`/api/v1/purchases`), validators.

### 6.6. Reminders Module (F6)
- [ ] Create `models/reminder.model.js`: `userId`, `title`, `message`, `type` (manual/automated), `source`, `priority`, `dueDate`, `isDismissed`.
- [ ] Create service with alert aggregation (manual + automated from other modules).
- [ ] Create controller, routes (`/api/v1/reminders`), validators.

### 6.7. Kirana Planner Module (F7)
- [ ] Create `models/kirana.model.js`: `userId`, `importedGroups[]`, `weeklyList[]` (items with quantity, checked status).
- [ ] Create service with master catalog import flow.
- [ ] Create controller, routes (`/api/v1/kirana`), validators.

### 6.8. Plans Module (F8)
- [ ] Create `models/plan.model.js`: `userId`, `title`, `personName`, `relationship`, `date`, `type` (past/upcoming), `notes`.
- [ ] Create service, controller, routes (`/api/v1/plans`), validators.

### 6.9. Rules Module (F9)
- [ ] Create `models/rule.model.js`: `userId`, `title`, `description`, `category`, `isActive`.
- [ ] Create service with "random rule of the day" logic.
- [ ] Create controller, routes (`/api/v1/rules`), validators.

### 6.10. Movies Module (F10)
- [ ] Create `models/movie.model.js`: `userId`, `title`, `genre`, `rating`, `status` (toWatch/watching/watched), `notes`.
- [ ] Create service, controller, routes (`/api/v1/movies`), validators.

---

## Phase 7: Database Seeding

### 7.1. Seed Script
- [ ] Create `seeds/seed.js`:
  - Drop existing data (development only).
  - Seed Admin user (role: admin, all features allowed).
  - Seed Regular user (role: user, subset of features).
  - Seed global configuration with default feature toggles.
  - Seed master grocery catalog with categories (Staples, Dairy, Toiletries, etc.).
  - Seed sample data for each feature module.
- [ ] Make seed script idempotent (check before insert).
- [ ] Add `npm run seed` script to `package.json`.

---

## Phase 8: Health Check & API Documentation

### 8.1. Health Check Endpoint
- [ ] Create `GET /api/v1/health` endpoint:
  - Application status (up/down).
  - Database connection status (connected/disconnected).
  - Server uptime.
  - Version / commit hash (from environment).
  - Timestamp.
- [ ] No authentication required on health endpoint.
- [ ] Used by Docker health checks and load balancers.

### 8.2. API Documentation
- [ ] Install `swagger-jsdoc` and `swagger-ui-express`.
- [ ] Add JSDoc/Swagger annotations to all route files.
- [ ] Serve Swagger UI at `/api/docs` (non-production only).
- [ ] Document all endpoints: URL, method, request/response schemas, error codes, auth requirements.

---

## Phase 9: Testing

### 9.1. Unit Testing
- [ ] Configure Jest with code coverage reporting.
- [ ] Set coverage thresholds: 80% services/utils, 70% controllers.
- [ ] Write unit tests for:
  - All service methods (mock Mongoose models).
  - All utility functions (AppError, response builder, pagination).
  - All validation schemas (valid and invalid inputs).
  - Auth middleware (mock JWT verification).

### 9.2. Integration Testing
- [ ] Set up `mongodb-memory-server` for isolated DB testing.
- [ ] Write integration tests using Supertest for:
  - Auth endpoints (register, login, switch).
  - User CRUD endpoints.
  - Config endpoints (feature flags, groceries).
  - All feature module CRUD endpoints.
  - Error handling (validation errors, not found, unauthorized).
  - Pagination and filtering.

### 9.3. Test Data & Fixtures
- [ ] Create test fixture factory functions for each model.
- [ ] Implement `beforeEach` / `afterEach` hooks for DB cleanup.
- [ ] Create shared test utilities (auth token generation, user creation).

---

## Phase 10: DevOps & Deployment

### 10.1. Docker Configuration
- [ ] Create multi-stage `Dockerfile`:
  - Stage 1: `node:20-alpine` — `npm ci --only=production`.
  - Stage 2: Copy app code, set `NODE_ENV=production`, expose port, define health check CMD.
  - Run as non-root user.
- [ ] Create `Dockerfile.dev` for development with hot reload (nodemon).
- [ ] Create `.dockerignore` (node_modules, .env, tests, .git, coverage, *.md).

### 10.2. Docker Compose
- [ ] Create `docker-compose.yml` with:
  - Backend service (Express app).
  - MongoDB service with persistent volume.
  - Network configuration.
  - Environment variable injection.
- [ ] Create `docker-compose.dev.yml` override for development (volume mounts, debug ports).

### 10.3. CI/CD Pipeline
- [ ] Create GitHub Actions workflow:
  - On PR: lint → test → security audit (`npm audit`) → build verification.
  - On merge to `main`: build Docker image → push to registry → deploy.
- [ ] Configure branch protection rules on `main`.

### 10.4. Graceful Shutdown
- [ ] Implement `SIGINT` / `SIGTERM` handlers in `index.js`:
  - Stop accepting new connections.
  - Wait for existing requests to complete (10s timeout).
  - Close Mongoose connection.
  - Exit cleanly.

---

## Phase 11: Performance & Monitoring

### 11.1. Response Compression
- [ ] Enable `compression` middleware with 1KB threshold.

### 11.2. Application Caching
- [ ] Implement in-memory cache for global config using `node-cache` (TTL: 5 minutes).
- [ ] Cache invalidation on config update endpoints.

### 11.3. Monitoring Setup
- [ ] Integrate application metrics tracking (request count, latency, error rate).
- [ ] Set up structured log shipping to log aggregation service.
- [ ] Configure alerting for error rate spikes, slow responses, and DB connection failures.
- [ ] Monitor slow database queries (> 200ms) and log warnings.

---

## Phase 12: Polish & Hardening

### 12.1. Security Audit
- [ ] Run `npm audit` and fix all vulnerabilities.
- [ ] Review all endpoints for proper auth/RBAC enforcement.
- [ ] Verify no sensitive data leaks in API responses.
- [ ] Test rate limiting under load.

### 12.2. Code Quality Review
- [ ] Ensure JSDoc coverage on all public functions.
- [ ] Verify all controllers use `catchAsync` wrapper.
- [ ] Verify all responses use `response.util.js` helpers.
- [ ] Verify all validation schemas cover all input vectors (body, params, query).

### 12.3. Documentation
- [ ] Update README with setup instructions, environment variables, and API overview.
- [ ] Create `CONTRIBUTING.md` with development workflow and coding standards.
- [ ] Maintain CHANGELOG for all releases.
- [ ] Verify Swagger documentation is complete and accurate.
