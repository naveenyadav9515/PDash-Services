# P-Dash — Backend (Express.js) Implementation Plan

This document is the step-by-step execution blueprint for implementing the backend Express.js application in strict compliance with the **Enterprise Backend Guidelines** and the **V2 Architecture Blueprint**.

> **Foundation First:** Phases 0–7 build the complete workspace/module/reference foundation. Individual module implementations (Expense Tracker, Notes, etc.) will be added in later phases only after the foundation is stable.

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
  - Include `maxWorkspaces` configuration (default: 6, configurable via env).
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
  - Auto-reconnect configuration with retry logic (5 retries, 5s delay).
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
  - Fields: `firstName`, `lastName`, `email`, `password`, `role`, `isActive`.
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

### 3.5. Validation Schemas
- [ ] Create `validators/auth.validator.js`:
  - `registerSchema` — validate email, password, names.
  - `loginSchema` — validate email, password.
  - `switchSchema` — validate userId.

---

## Phase 4: Workspace System

### 4.1. Workspace Model
- [ ] Create `models/workspace.model.js`:
  - Fields: `userId`, `name`, `icon`, `sortOrder`, `archived` (default: false).
  - Enable `{ timestamps: true }`.
  - Compound index: `userId` + `sortOrder`.
  - Validation: `name` required, max 30 characters. `icon` required.

### 4.2. Workspace Service
- [ ] Create `services/workspace.service.js`:
  - `createWorkspace(userId, data)` — create with auto-increment sortOrder. Enforce `config.maxWorkspaces` limit.
  - `getWorkspaces(userId)` — fetch all active (non-archived) workspaces sorted by `sortOrder`.
  - `getWorkspaceById(userId, workspaceId)` — fetch single workspace.
  - `updateWorkspace(userId, workspaceId, data)` — rename, change icon.
  - `reorderWorkspaces(userId, orderedIds)` — bulk update `sortOrder` values.
  - `archiveWorkspace(userId, workspaceId)` — set `archived: true`.
  - `restoreWorkspace(userId, workspaceId)` — set `archived: false`.
  - `getArchivedWorkspaces(userId)` — fetch archived workspaces.

### 4.3. Workspace Controller & Routes
- [ ] Create `controllers/workspace.controller.js`.
- [ ] Create `routes/workspace.routes.js`:
  - `GET    /api/v1/workspaces` — list active workspaces.
  - `POST   /api/v1/workspaces` — create workspace.
  - `GET    /api/v1/workspaces/archived` — list archived workspaces.
  - `GET    /api/v1/workspaces/:id` — get single workspace.
  - `PATCH  /api/v1/workspaces/:id` — update workspace (name, icon).
  - `PATCH  /api/v1/workspaces/reorder` — bulk reorder workspaces.
  - `PATCH  /api/v1/workspaces/:id/archive` — archive workspace.
  - `PATCH  /api/v1/workspaces/:id/restore` — restore archived workspace.

### 4.4. Workspace Validation
- [ ] Create `validators/workspace.validator.js`:
  - `createSchema` — validate name, icon.
  - `updateSchema` — validate optional name, icon.
  - `reorderSchema` — validate array of workspace IDs.

### 4.5. Workspace Configuration
- [ ] Add `maxWorkspaces` to `config/index.js` (default: 6).
- [ ] Enforce limit in workspace creation service.
- [ ] Do NOT hardcode workspace limits anywhere else in the application.

---

## Phase 5: Module System

### 5.1. Module Definition Model
- [ ] Create `models/module-definition.model.js`:
  - Fields: `moduleType` (unique identifier, e.g., "expense_tracker", "notes"), `name`, `description`, `icon`, `category`, `isActive` (default: true).
  - Enable `{ timestamps: true }`.
  - Unique index on `moduleType`.
  - This model represents the **catalog** of available modules (~30+ entries).

### 5.2. Module Definition Service
- [ ] Create `services/module-definition.service.js`:
  - `getAllModules()` — fetch all active module definitions (Module Gallery).
  - `getModuleById(moduleId)` — fetch single module definition.
  - `getModulesByIds(moduleIds)` — fetch multiple modules by ID array.
  - `createModule(data)` — admin-only, add new module to gallery.
  - `updateModule(moduleId, data)` — admin-only, update module metadata.
  - `deactivateModule(moduleId)` — admin-only, soft deactivate.

### 5.3. Module Gallery Controller & Routes
- [ ] Create `controllers/module.controller.js`.
- [ ] Create `routes/module.routes.js`:
  - `GET    /api/v1/modules` — list all available modules (Module Gallery).
  - `GET    /api/v1/modules/:id` — get single module definition.
  - `POST   /api/v1/modules` — create module definition (admin only).
  - `PATCH  /api/v1/modules/:id` — update module definition (admin only).
  - `DELETE /api/v1/modules/:id` — deactivate module definition (admin only, soft delete).

### 5.4. Module Validation
- [ ] Create `validators/module.validator.js`:
  - `createSchema` — validate moduleType, name, description, icon.
  - `updateSchema` — validate optional fields.

---

## Phase 6: Workspace-Module References (Many-to-Many)

### 6.1. Workspace Module Reference Model
- [ ] Create `models/workspace-module-ref.model.js`:
  - Fields: `workspaceId`, `moduleId`, `userId`, `sortOrder`.
  - Enable `{ timestamps: true }`.
  - Compound unique index: `workspaceId` + `moduleId` (prevent duplicate references).
  - Index on `moduleId` for reverse lookups (which workspaces use this module).

### 6.2. Reference Service
- [ ] Create `services/workspace-module-ref.service.js`:
  - `getModulesForWorkspace(userId, workspaceId)` — get all module references for a workspace (populated with module details), sorted by `sortOrder`.
  - `getWorkspacesForModule(userId, moduleId)` — reverse lookup: which workspaces reference this module.
  - `getModuleUsageCount(userId, moduleId)` — count of workspaces referencing this module.
  - `assignModulesToWorkspace(userId, assignments)` — batch create references from Module Gallery (single API call for multiple drag-drop assignments).
  - `removeModuleFromWorkspace(userId, workspaceId, moduleId)` — **Operation 1**: remove single reference only.
  - `removeModuleFromAllWorkspaces(userId, moduleId)` — **Operation 2**: remove all references. Module data remains.
  - `reorderModulesInWorkspace(userId, workspaceId, orderedModuleIds)` — bulk update `sortOrder` within a workspace.

### 6.3. Reference Controller & Routes
- [ ] Create `controllers/workspace-module-ref.controller.js`.
- [ ] Create `routes/workspace-module-ref.routes.js`:
  - `GET    /api/v1/workspaces/:workspaceId/modules` — get modules for workspace.
  - `POST   /api/v1/workspaces/:workspaceId/modules` — batch assign modules (expects array of moduleIds).
  - `DELETE /api/v1/workspaces/:workspaceId/modules/:moduleId` — remove module from workspace.
  - `PATCH  /api/v1/workspaces/:workspaceId/modules/reorder` — reorder modules in workspace.
  - `GET    /api/v1/modules/:moduleId/workspaces` — get workspaces using this module.
  - `DELETE /api/v1/modules/:moduleId/workspaces` — remove module from all workspaces.

### 6.4. Reference Validation
- [ ] Create `validators/workspace-module-ref.validator.js`:
  - `assignSchema` — validate array of moduleIds.
  - `reorderSchema` — validate array of moduleIds with sortOrder.

---

## Phase 7: Module Data & Settings System

### 7.1. Module Settings Model
- [ ] Create `models/module-settings.model.js`:
  - Fields: `userId`, `moduleId`, `settings` (Mixed/Object, schema-less for flexibility).
  - Enable `{ timestamps: true }`.
  - Compound unique index: `userId` + `moduleId`.

### 7.2. Widget Configuration Model
- [ ] Create `models/widget-config.model.js`:
  - Fields: `userId`, `moduleId`, `widgets` (Array of widget objects: `{ widgetType, sortOrder, size, config }`).
  - Enable `{ timestamps: true }`.
  - Compound unique index: `userId` + `moduleId`.

### 7.3. Module Data Service
- [ ] Create `services/module-data.service.js`:
  - `getModuleSettings(userId, moduleId)` — fetch settings.
  - `updateModuleSettings(userId, moduleId, settings)` — upsert settings.
  - `getWidgetConfig(userId, moduleId)` — fetch widget configuration.
  - `updateWidgetConfig(userId, moduleId, widgets)` — upsert widget config.
  - `clearModuleData(userId, moduleId)` — **Operation 3**: destructive delete of module data, settings, and widget config. Requires confirmation token.

### 7.4. Module Data Controller & Routes
- [ ] Create `controllers/module-data.controller.js`.
- [ ] Create `routes/module-data.routes.js`:
  - `GET    /api/v1/modules/:moduleId/settings` — get module settings.
  - `PATCH  /api/v1/modules/:moduleId/settings` — update module settings.
  - `GET    /api/v1/modules/:moduleId/widgets` — get widget configuration.
  - `PUT    /api/v1/modules/:moduleId/widgets` — update widget configuration.
  - `DELETE /api/v1/modules/:moduleId/data` — **Operation 3**: clear all module data (requires confirmation).

### 7.5. Module Data Validation
- [ ] Create `validators/module-data.validator.js`:
  - `settingsSchema` — validate settings object.
  - `widgetsSchema` — validate widgets array structure.
  - `clearDataSchema` — validate confirmation token.

---

## Phase 8: Global Configuration & Search

### 8.1. Application Config Model
- [ ] Create `models/app-config.model.js`:
  - Configuration-driven workspace limits.
  - Global application settings.
  - Enable `{ timestamps: true }`.

### 8.2. Config Service, Controller & Routes
- [ ] Create `services/config.service.js`:
  - `getConfig()` — fetch global configuration (with caching).
  - `updateConfig(data)` — admin-only update.
- [ ] Create `controllers/config.controller.js`.
- [ ] Create `routes/config.routes.js`:
  - `GET   /api/v1/config` — get global config.
  - `PATCH /api/v1/config` — update global config (admin only).
- [ ] Create `validators/config.validator.js`.

### 8.3. Global Search
- [ ] Create `services/search.service.js`:
  - `search(userId, query)` — search across workspace names, module names, and relevant module content.
  - Return categorized results: workspaces, modules, content.
- [ ] Create `controllers/search.controller.js`.
- [ ] Create `routes/search.routes.js`:
  - `GET /api/v1/search?q=<query>` — global search endpoint.

---

## Phase 9: User Management

### 9.1. User Service, Controller & Routes
- [ ] Create `services/user.service.js`:
  - `getAllUsers(filters, pagination)` — admin-only paginated list.
  - `getUserById(id)` — fetch single user (exclude password).
  - `updateUser(id, data)` — update profile fields.
  - `deactivateUser(id)` — soft deactivate.
- [ ] Create `controllers/user.controller.js`.
- [ ] Create `routes/user.routes.js`:
  - `GET    /api/v1/users` (admin only)
  - `GET    /api/v1/users/:id`
  - `PATCH  /api/v1/users/:id`
  - `DELETE /api/v1/users/:id` (admin only, soft delete)
- [ ] Create `validators/user.validator.js`.

---

## Phase 10: Database Seeding

### 10.1. Seed Script
- [ ] Create `seeds/seed.js`:
  - Drop existing data (development only).
  - Seed Admin user (role: admin).
  - Seed Regular user (role: user).
  - Seed global configuration with `maxWorkspaces: 6`.
  - Seed Module Gallery with core module definitions (F1–F12):
    - Notes (F1)
    - Kitchen Utilities (F2)
    - Expense Tracker (F3)
    - Travel Logger (F4)
    - Big Purchases (F5)
    - Reminders (F6)
    - Kirana Planner (F7)
    - Plans (F8)
    - Rules (F9)
    - Movies (F10)
    - Streak Loggers & Activity Details (F11)
    - Splitwise (F12)
    - Feature Log (development feature)
    - (additional modules as needed in future)
  - Seed sample workspaces for test users (Home, Finance, Fitness, Travel).
  - Seed sample workspace-module references.
- [ ] Make seed script idempotent (check before insert).
- [ ] Add `npm run seed` script to `package.json`.

---

## Phase 11: Health Check & API Documentation

### 11.1. Health Check Endpoint
- [ ] Create `GET /api/v1/health` endpoint:
  - Application status (up/down).
  - Database connection status (connected/disconnected).
  - Server uptime.
  - Version / commit hash (from environment).
  - Timestamp.
- [ ] No authentication required on health endpoint.
- [ ] Used by Docker health checks and load balancers.

### 11.2. API Documentation
- [ ] Install `swagger-jsdoc` and `swagger-ui-express`.
- [ ] Add JSDoc/Swagger annotations to all route files.
- [ ] Serve Swagger UI at `/api/docs` (non-production only).
- [ ] Document all endpoints: URL, method, request/response schemas, error codes, auth requirements.

---

## Phase 12: Testing

### 12.1. Unit Testing
- [ ] Configure Jest with code coverage reporting.
- [ ] Set coverage thresholds: 80% services/utils, 70% controllers.
- [ ] Write unit tests for:
  - Workspace service methods (CRUD, archive, reorder, limit enforcement).
  - Module definition service methods.
  - Workspace-module reference service methods (assign, remove, reorder).
  - Module data service methods (settings, widgets, clear data).
  - Search service methods.
  - All utility functions (AppError, response builder, pagination).
  - All validation schemas (valid and invalid inputs).
  - Auth middleware (mock JWT verification).

### 12.2. Integration Testing
- [ ] Set up `mongodb-memory-server` for isolated DB testing.
- [ ] Write integration tests using Supertest for:
  - Auth endpoints (register, login, switch).
  - Workspace CRUD endpoints (create, update, archive, restore, reorder).
  - Module Gallery endpoints.
  - Workspace-module reference endpoints (assign, remove, batch operations).
  - Module settings and widget config endpoints.
  - Clear module data endpoint (Operation 3).
  - Search endpoint.
  - Error handling (validation errors, not found, unauthorized).
  - Workspace limit enforcement.
  - Pagination and filtering.

### 12.3. Test Data & Fixtures
- [ ] Create test fixture factory functions for each model.
- [ ] Implement `beforeEach` / `afterEach` hooks for DB cleanup.
- [ ] Create shared test utilities (auth token generation, user creation).

---

## Phase 13: DevOps & Deployment

### 13.1. Docker Configuration
- [ ] Create multi-stage `Dockerfile`:
  - Stage 1: `node:20-alpine` — `npm ci --only=production`.
  - Stage 2: Copy app code, set `NODE_ENV=production`, expose port, define health check CMD.
  - Run as non-root user.
- [ ] Create `Dockerfile.dev` for development with hot reload (nodemon).
- [ ] Create `.dockerignore` (node_modules, .env, tests, .git, coverage, *.md).

### 13.2. Docker Compose
- [ ] Create `docker-compose.yml` with:
  - Backend service (Express app).
  - MongoDB service with persistent volume.
  - Network configuration.
  - Environment variable injection.
- [ ] Create `docker-compose.dev.yml` override for development (volume mounts, debug ports).

### 13.3. CI/CD Pipeline
- [ ] Create GitHub Actions workflow:
  - On PR: lint → test → security audit (`npm audit`) → build verification.
  - On merge to `main`: build Docker image → push to registry → deploy.
- [ ] Configure branch protection rules on `main`.

### 13.4. Graceful Shutdown
- [ ] Implement `SIGINT` / `SIGTERM` handlers in `index.js`:
  - Stop accepting new connections.
  - Wait for existing requests to complete (10s timeout).
  - Close Mongoose connection.
  - Exit cleanly.

---

## Phase 14: Performance & Monitoring

### 14.1. Response Compression
- [ ] Enable `compression` middleware with 1KB threshold.

### 14.2. Application Caching
- [ ] Implement in-memory cache for global config using `node-cache` (TTL: 5 minutes).
- [ ] Cache module gallery data (TTL: 10 minutes).
- [ ] Cache invalidation on config/module update endpoints.

### 14.3. Monitoring Setup
- [ ] Integrate application metrics tracking (request count, latency, error rate).
- [ ] Set up structured log shipping to log aggregation service.
- [ ] Configure alerting for error rate spikes, slow responses, and DB connection failures.
- [ ] Monitor slow database queries (> 200ms) and log warnings.

---

## Phase 15: Polish & Hardening

### 15.1. Security Audit
- [ ] Run `npm audit` and fix all vulnerabilities.
- [ ] Review all endpoints for proper auth/RBAC enforcement.
- [ ] Verify no sensitive data leaks in API responses.
- [ ] Test rate limiting under load.

### 15.2. Code Quality Review
- [ ] Ensure JSDoc coverage on all public functions.
- [ ] Verify all controllers use `catchAsync` wrapper.
- [ ] Verify all responses use `response.util.js` helpers.
- [ ] Verify all validation schemas cover all input vectors (body, params, query).

### 15.3. Documentation
- [ ] Update README with setup instructions, environment variables, and API overview.
- [ ] Create `CONTRIBUTING.md` with development workflow and coding standards.
- [ ] Maintain CHANGELOG for all releases.
- [ ] Verify Swagger documentation is complete and accurate.

---

## Future Phases: Individual Module Implementations

> These phases will be added AFTER the foundation is stable and tested.

### Module Implementation Template
Each module follows the same pattern:
- [ ] Create `models/<module>.model.js` with module-specific data schema.
- [ ] Create `services/<module>.service.js` with CRUD + module-specific logic.
- [ ] Create `controllers/<module>.controller.js`.
- [ ] Create `routes/<module>.routes.js` at `/api/v1/modules/<moduleType>/data`.
- [ ] Create `validators/<module>.validator.js`.
- [ ] Define Fixed Cards data (mandatory, system-controlled).
- [ ] Define Widget Gallery options (optional, user-controlled).
- [ ] Write unit + integration tests.

### Planned Modules (to be implemented individually):
- Notes (F1)
- Kitchen Utilities (F2)
- Expense Tracker (F3)
- Travel Logger (F4)
- Big Purchases (F5)
- Reminders (F6)
- Kirana Planner (F7)
- Plans (F8)
- Rules (F9)
- Movies (F10)
- Streak Loggers & Activity Details (F11)
- Splitwise (F12)
- Feature Log (development feature)

---

## Data Model Reference

```
Workspace
  { id, userId, name, icon, sortOrder, archived }

ModuleDefinition (Gallery)
  { id, moduleType, name, description, icon, category, isActive }

WorkspaceModuleReference (Many-to-Many)
  { id, workspaceId, moduleId, userId, sortOrder }

ModuleSettings
  { id, userId, moduleId, settings: {} }

ModuleData (per module type — varies)
  { id, userId, moduleId, data: {} }

WidgetConfiguration
  { id, userId, moduleId, widgets: [] }
```

---

## Architecture Principles

1. Workspaces are collections — they reference modules, they do NOT own modules.
2. Modules are reusable — one module, many workspace references, zero duplication.
3. References control visibility — removing a reference never deletes data.
4. Data controls persistence — only "Clear Module Data" (Operation 3) deletes actual data.
5. Archive before delete — prefer `archived: true` over permanent deletion.
6. Configuration-driven limits — `maxWorkspaces` from config, never hardcoded.
7. Foundation first — workspace/module/reference system before any individual module.
