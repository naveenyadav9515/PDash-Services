# Enterprise Backend (Express.js) — Architectural & Development Guidelines

This document defines the strict engineering standards, architectural patterns, and development practices governing all backend changes in the **Lumina Personal Hub** Express.js application. Every API endpoint, service, model, and middleware must comply with these guidelines to ensure production-grade security, scalability, reliability, maintainability, and operational excellence.

---

# Section 1: Project Structure & Layered Architecture

## 1.1. Directory Structure

The backend must strictly enforce a layered separation of concerns. Do not mix routing, request validation, business logic, or database operations within a single file.

```
backend/
├── config/                  # Centralized configuration & environment setup
│   ├── index.js             # Config loader, validator, and exporter
│   ├── database.js          # MongoDB/Mongoose connection manager
│   ├── logger.js            # Structured logging configuration (Winston)
│   └── cors.js              # CORS configuration with dynamic origins
├── controllers/             # HTTP Controller layer (handles req, res, next)
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── config.controller.js
│   └── [module].controller.js
├── services/                # Business Logic layer (framework-independent)
│   ├── auth.service.js
│   ├── user.service.js
│   ├── config.service.js
│   └── [module].service.js
├── models/                  # Mongoose schema definitions
│   ├── user.model.js
│   ├── config.model.js
│   └── [module].model.js
├── routes/                  # Express API route registrations
│   ├── index.js             # Central route aggregator
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── config.routes.js
│   └── [module].routes.js
├── middleware/              # Cross-cutting middleware
│   ├── error-handler.js     # Centralized error handling middleware
│   ├── auth.middleware.js   # JWT verification and session validation
│   ├── validate.js          # Request validation middleware (Joi/Zod)
│   ├── rate-limiter.js      # Rate limiting middleware
│   └── request-logger.js   # HTTP request logging middleware
├── utils/                   # Common utilities and helper classes
│   ├── AppError.js          # Custom operational error class
│   ├── response.util.js     # Standardized response envelope builder
│   ├── pagination.util.js   # Pagination helper
│   └── [name].util.js
├── validators/              # Request validation schemas (Joi/Zod)
│   ├── user.validator.js
│   ├── config.validator.js
│   └── [module].validator.js
├── seeds/                   # Database seeding scripts
│   └── seed.js
├── tests/                   # Test files (mirror src structure)
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── index.js                 # Application entry point
├── app.js                   # Express app setup (middleware registration)
└── package.json
```

## 1.2. Layer Responsibilities

Each layer has a strict, non-negotiable responsibility:

| Layer | Responsibility | Forbidden Actions |
|-------|---------------|-------------------|
| **Routes** | Define HTTP endpoints, attach validation middleware, delegate to controllers | Business logic, direct DB calls, response formatting |
| **Controllers** | Extract request params/body, call services, send formatted responses | Direct DB queries, business logic, error response construction |
| **Services** | Execute business logic, orchestrate data operations, throw `AppError` | Access `req`/`res` objects, format HTTP responses, call other controllers |
| **Models** | Define Mongoose schemas, virtual fields, pre/post hooks, static methods | Business logic, HTTP concerns, request validation |
| **Middleware** | Cross-cutting concerns (auth, validation, logging, error handling) | Feature-specific business logic |
| **Utils** | Stateless, pure helper functions | State, side effects, DB access |

## 1.3. Separation Rules

* **Controllers must NOT** contain business logic. They delegate to services.
* **Services must NOT** access `req`, `res`, or `next`. They receive plain data parameters and return plain data or throw errors.
* **Routes must NOT** contain inline handler logic. They reference controller methods.
* **Models must NOT** import services or controllers.

---

# Section 2: Configuration & Environment Management

## 2.1. Zero Hardcoding Policy

* All configurations (ports, DB URIs, JWT secrets, API keys, domains, origins, rate limits) must be loaded from environment variables using `dotenv`.
* **Forbidden**: Any hardcoded value that might change between environments (dev, staging, production).

## 2.2. Centralized Configuration Module

* All environment variables must be read, validated, and exported from a single configuration module (`config/index.js`).
* **Forbidden**: Calling `process.env` directly inside controllers, services, routes, or middleware. Always import from the config module.

```javascript
// config/index.js — Example structure
const config = {
  port: process.env.PORT || 3000,
  db: {
    uri: process.env.MONGODB_URI,
    options: { /* connection options */ }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    origins: process.env.CORS_ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || []
  }
};
module.exports = config;
```

## 2.3. Startup Validation (Fail-Fast)

* Critical environment variables (`MONGODB_URI`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`) must be validated at application startup.
* If any required variable is missing or invalid, the application must **immediately terminate** with a clear error message — not silently use defaults.

```javascript
const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ALLOWED_ORIGINS'];
requiredVars.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`FATAL: Missing required environment variable: ${key}`);
  }
});
```

## 2.4. Array-Based Config Parsing

* Configurations managing multiple values (CORS origins, allowed domains, admin emails) must be declared as comma-separated strings in `.env`, then split, trimmed, and validated in `config/index.js`.
* **Forbidden**: Static hardcoded arrays in middleware or route files.

## 2.5. Environment File Management

* **`.env`**: Local development configuration. Must be in `.gitignore`.
* **`.env.example`**: Template with all required keys (no values). Must be committed to version control.
* **Production**: Environment variables injected via Docker, CI/CD, or cloud provider. Never deploy `.env` files to production.

---

# Section 3: Standardized API Response Envelope

## 3.1. Response Format

All API responses must follow a strict, standardized JSON envelope structure for consistency across all clients.

### Success Response (HTTP 200/201)
```json
{
  "success": true,
  "timestamp": "2026-06-17T10:00:00.000Z",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response (HTTP 4xx/5xx)
```json
{
  "success": false,
  "timestamp": "2026-06-17T10:00:00.000Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided request body was invalid.",
    "details": [
      { "field": "email", "message": "Email is required." }
    ]
  }
}
```

## 3.2. Response Utility

* Create a `response.util.js` utility with helper methods:
  - `sendSuccess(res, data, statusCode = 200)` — formats and sends success envelope.
  - `sendCreated(res, data)` — sends 201 with success envelope.
  - `sendNoContent(res)` — sends 204 with no body.
* **Forbidden**: Manually constructing response JSON in controllers. Always use the utility.

## 3.3. Pagination Envelope

* All list endpoints must support pagination with query params: `page`, `limit`, `sort`, `order`.
* Response must include: `items`, `total`, `page`, `limit`, `totalPages`.
* Default: `page=1`, `limit=20`. Max limit: `100`.
* Create a `pagination.util.js` for consistent pagination logic.

## 3.4. HTTP Status Code Standards

| Scenario | Status Code |
|----------|-------------|
| Successful GET | `200 OK` |
| Successful POST (creation) | `201 Created` |
| Successful DELETE | `204 No Content` |
| Successful PUT/PATCH | `200 OK` |
| Validation error | `400 Bad Request` |
| Authentication failure | `401 Unauthorized` |
| Authorization failure | `403 Forbidden` |
| Resource not found | `404 Not Found` |
| Duplicate resource | `409 Conflict` |
| Rate limit exceeded | `429 Too Many Requests` |
| Server error | `500 Internal Server Error` |

---

# Section 4: Error Handling

## 4.1. Custom Error Class

* Create an `AppError` class extending `Error` with `statusCode`, `code`, `isOperational`, and `details` properties.
* All known/expected errors must be thrown as `AppError` instances.

```javascript
class AppError extends Error {
  constructor(message, statusCode, code, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

## 4.2. Centralized Error Middleware

* All errors must be forwarded to a centralized error-handling middleware using `next(error)`.
* **Forbidden**: Try-catch blocks that directly send HTTP responses inside controllers.
* Controllers must use `try { ... } catch(err) { next(err); }` or an async wrapper utility.

## 4.3. Async Wrapper

* Create a `catchAsync` utility to eliminate repetitive try-catch blocks in controllers:

```javascript
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

## 4.4. Operational vs. Programmer Errors

* **Operational Errors**: Predictable failures (validation, not found, auth). Thrown as `AppError`. Handled gracefully with appropriate HTTP status and message.
* **Programmer Errors**: Unanticipated bugs (null reference, type errors). Logged with full stack trace at `error` level. Return generic `500 Internal Server Error`. Stack traces must **NEVER** be exposed in production responses.

## 4.5. Database Error Normalization

The centralized error middleware must convert Mongoose-specific errors into `AppError` instances:

| Mongoose Error | HTTP Status | Error Code | Handling |
|---------------|-------------|------------|----------|
| `ValidationError` | `400` | `VALIDATION_ERROR` | Extract field-level errors into `details` array |
| `CastError` (invalid ObjectId) | `400` | `INVALID_ID` | Format as "Invalid ID format" |
| `MongoError` code `11000` | `409` | `DUPLICATE_KEY` | Extract duplicate field name |
| `DocumentNotFoundError` | `404` | `RESOURCE_NOT_FOUND` | Format as "Resource not found" |

## 4.6. Unhandled Rejections & Exceptions

* Register global handlers for `unhandledRejection` and `uncaughtException` in the entry point.
* Log the error with full stack trace.
* Gracefully shut down the server (close DB connections, finish pending requests, then exit).

---

# Section 5: Structured Logging

## 5.1. Logger Setup

* **Forbidden**: `console.log`, `console.error`, `console.warn` anywhere in production code.
* **Required**: Use Winston (or equivalent structured logger) configured in `config/logger.js`.

## 5.2. Log Levels

| Level | Usage |
|-------|-------|
| `error` | Application errors, unhandled exceptions (includes stack trace) |
| `warn` | Recoverable issues, deprecation warnings, rate limit hits |
| `info` | Normal operational events (server start, DB connected, request completed) |
| `debug` | Detailed diagnostic info (only enabled in development) |

## 5.3. Log Format

* **Development**: Colorized, human-readable console output with timestamps.
* **Production**: JSON-structured logs for machine parsing (ELK, CloudWatch, Datadog).
* **Metadata**: Include contextual metadata (request ID, user ID, endpoint, duration, status code).

## 5.4. Request Logging

* Implement HTTP request logging middleware (using Morgan or custom Winston transport).
* Log: method, URL, status code, response time, content length.
* Redact sensitive data (passwords, tokens) from logs.
* **Forbidden**: Logging full request/response bodies in production (performance and security risk).

## 5.5. Correlation IDs

* Generate a unique request ID (UUID) for each incoming request via middleware.
* Attach the request ID to all log entries within that request lifecycle.
* Return the request ID in response headers (`X-Request-Id`) for client-side debugging.

---

# Section 6: Authentication & Authorization

## 6.1. JWT Token Strategy

* Use JSON Web Tokens (JWT) for stateless authentication.
* **Access Token**: Short-lived (15 min – 1 hour). Used for API authentication.
* **Refresh Token**: Long-lived (7–30 days). Stored in `httpOnly` cookie. Used to obtain new access tokens.
* **Token Payload**: Include only essential claims: `userId`, `role`, `iat`, `exp`. Never include sensitive data.

## 6.2. Authentication Middleware

* Create `middleware/auth.middleware.js` to verify JWT on protected routes.
* Extract token from `Authorization: Bearer <token>` header.
* Verify token signature and expiry.
* Attach decoded user payload to `req.user`.
* Return `401 Unauthorized` for invalid/expired tokens.

## 6.3. Role-Based Access Control (RBAC)

* Create a `restrictTo(...roles)` middleware factory that checks `req.user.role` against allowed roles.
* Apply to routes: `router.delete('/users/:id', auth, restrictTo('admin'), controller.delete)`.
* Return `403 Forbidden` when user lacks required role.

## 6.4. Feature-Based Access Control

* Create middleware that checks if the requested feature is:
  1. Globally enabled (from system config).
  2. Allowed for the user (from user's `allowedFeatures`).
* Return `403 Forbidden` with appropriate error code if feature is disabled.

## 6.5. Password Security

* **Hashing**: Use `bcrypt` with minimum 12 salt rounds. Never store plaintext passwords.
* **Comparison**: Use `bcrypt.compare()` for timing-safe comparison.
* **Password Rules**: Enforce minimum length (8 chars), complexity requirements.
* **Forbidden**: Logging, returning, or exposing password hashes in any API response.

---

# Section 7: Database & Mongoose

## 7.1. Connection Management

* Configure Mongoose connection in `config/database.js` with:
  - Connection pooling options.
  - Auto-reconnect on disconnect.
  - Connection event listeners (connected, disconnected, error) with structured logging.
* **Graceful Shutdown**: Close DB connection on `SIGINT`/`SIGTERM` before process exit.

## 7.2. Schema Design Standards

* **Timestamps**: Always enable `{ timestamps: true }` on every schema.
* **Indexes**: Define indexes for fields used in queries, sorting, and unique constraints.
* **Virtuals**: Use virtual fields for computed properties (e.g., `fullName` from `firstName` + `lastName`).
* **User Scoping**: All feature data schemas must include a `userId` field referencing the `User` model for multi-tenant data isolation.
* **Soft Deletes**: Implement soft delete pattern with `isDeleted` boolean and `deletedAt` timestamp instead of physical deletion.
* **Schema Validation**: Use Mongoose's built-in validators (`required`, `enum`, `min`, `max`, `match`) for data integrity.

## 7.3. Query Optimization

* **Select Only Needed Fields**: Use `.select()` to return only required fields. Never return entire documents when a subset is needed.
* **Lean Queries**: Use `.lean()` for read-only queries that don't need Mongoose document methods.
* **Population Control**: Avoid deep/nested `.populate()`. Limit populated fields with `.select()`.
* **Aggregation**: Use MongoDB aggregation pipeline for complex queries instead of fetching and processing in application code.
* **Pagination**: Always paginate list queries. Never return unbounded result sets.

## 7.4. Data Seeding

* Create seed scripts in `seeds/` directory for initial data setup:
  - Default Admin and User records.
  - Global system configuration.
  - Master grocery catalog.
  - Sample feature data for development/testing.
* Seed scripts must be idempotent (safe to run multiple times without creating duplicates).

---

# Section 8: Request Validation

## 8.1. Validation Library

* Use **Joi** or **Zod** for request validation schemas.
* Define validation schemas in `validators/[module].validator.js`.
* **Forbidden**: Manual validation logic in controllers or services.

## 8.2. Validation Middleware

* Create a generic `validate(schema)` middleware that:
  - Validates `req.body`, `req.params`, and `req.query` against the provided schema.
  - Returns `400 Bad Request` with field-level error details on validation failure.
  - Strips unknown fields (whitelist mode) to prevent mass assignment attacks.

## 8.3. Validation Scope

* Validate ALL incoming data:
  - **Body**: POST/PUT/PATCH request payloads.
  - **Params**: URL parameters (e.g., `:id` must be a valid MongoDB ObjectId).
  - **Query**: Query string parameters (pagination, filters, sort).

## 8.4. Sanitization

* Sanitize all string inputs to prevent NoSQL injection:
  - Strip `$` prefixed keys from request body.
  - Use `express-mongo-sanitize` middleware.
* Sanitize HTML content to prevent stored XSS:
  - Use `xss-clean` or equivalent library.

---

# Section 9: API Design Standards

## 9.1. RESTful Conventions

| Action | Method | URL Pattern | Example |
|--------|--------|-------------|---------|
| List all | `GET` | `/api/[resource]` | `GET /api/notes` |
| Get one | `GET` | `/api/[resource]/:id` | `GET /api/notes/123` |
| Create | `POST` | `/api/[resource]` | `POST /api/notes` |
| Full update | `PUT` | `/api/[resource]/:id` | `PUT /api/notes/123` |
| Partial update | `PATCH` | `/api/[resource]/:id` | `PATCH /api/notes/123` |
| Delete | `DELETE` | `/api/[resource]/:id` | `DELETE /api/notes/123` |

## 9.2. URL Conventions

* Use **lowercase** with **hyphens** for multi-word resources: `/api/big-purchases`, `/api/kitchen-utilities`.
* Use **plural nouns** for resource collections: `/api/notes`, `/api/users`.
* Nest sub-resources when there's a clear parent-child relationship: `/api/users/:userId/notes`.
* **Version prefix**: `/api/v1/` for future API versioning readiness.

## 9.3. Query Parameters

* **Filtering**: `?category=work&status=active`
* **Sorting**: `?sort=createdAt&order=desc`
* **Pagination**: `?page=1&limit=20`
* **Field Selection**: `?fields=title,content,createdAt`
* **Search**: `?search=keyword` (full-text search)

## 9.4. Idempotency

* `GET`, `PUT`, `DELETE` must be idempotent.
* `POST` is not idempotent — consider idempotency keys for critical creation endpoints.
* `PATCH` should be idempotent when using merge-patch semantics.

---

# Section 10: Security

## 10.1. Security Middleware Stack

Apply these security middlewares to the Express app:

* **Helmet**: Set security-related HTTP headers (XSS protection, content-type nosniff, HSTS, frame guard).
* **CORS**: Configure with dynamic allowed origins from environment config.
* **Rate Limiter**: Apply rate limiting (e.g., 100 requests/15 min per IP for general, 5/15 min for auth endpoints).
* **Mongo Sanitize**: Prevent NoSQL injection by sanitizing `$` operators from input.
* **XSS Clean**: Sanitize user input against XSS payloads.
* **HPP**: Prevent HTTP Parameter Pollution.
* **Request Size Limit**: Set `express.json({ limit: '10kb' })` to prevent large payload attacks.

## 10.2. CORS Configuration

* Origins must be loaded from environment variables (comma-separated), not hardcoded.
* In production, only allow specific domains. Never use `origin: '*'` in production.
* Configure allowed methods, headers, and credentials support.

## 10.3. Data Protection

* **Password Fields**: Exclude from all query results using schema-level `select: false`.
* **Sensitive Fields**: Never expose internal IDs, version keys (`__v`), or system metadata in API responses unless necessary.
* **File Uploads**: Validate file type, size, and content. Store outside the application directory.
* **SQL/NoSQL Injection**: Use parameterized queries and input sanitization.

## 10.4. Dependency Security

* Run `npm audit` regularly to check for known vulnerabilities.
* Pin dependency versions in `package-lock.json`.
* Use `npm audit fix` or manually update vulnerable packages.
* **Forbidden**: Using deprecated or unmaintained packages with known CVEs.

---

# Section 11: Performance & Scalability

## 11.1. Response Compression

* Enable gzip/brotli compression using the `compression` middleware.
* Set appropriate compression threshold (minimum 1KB).

## 11.2. Caching Strategy

* **HTTP Caching**: Set `Cache-Control` headers on static/rarely-changing responses.
* **Application Caching**: Use in-memory cache (e.g., `node-cache`) for frequently accessed, rarely changing data (global config, master catalogs).
* **Cache Invalidation**: Invalidate cache entries on data mutations.
* **ETags**: Enable ETag support for conditional requests.

## 11.3. Database Performance

* Index all frequently queried fields.
* Use `.lean()` for read-only queries.
* Implement connection pooling.
* Monitor and log slow queries (> 200ms).
* Use aggregation pipeline for complex data transformations.

## 11.4. Async Best Practices

* Use `async/await` for all asynchronous operations. Avoid raw callbacks.
* Use `Promise.all()` for parallel independent operations.
* Use `Promise.allSettled()` when partial failures are acceptable.
* **Forbidden**: Nested callbacks (callback hell) and unhandled promise rejections.

---

# Section 12: Testing

## 12.1. Testing Strategy

| Test Type | Scope | Tools | Coverage Target |
|-----------|-------|-------|-----------------|
| **Unit** | Services, utils, validators | Jest / Mocha + Chai | 80% |
| **Integration** | API endpoints (routes + controllers + DB) | Supertest + Jest | 70% |
| **E2E** | Full API workflows | Postman / Newman | Critical paths |

## 12.2. Unit Testing Standards

* Test files must be co-located or in a mirrored `tests/unit/` directory.
* Mock external dependencies (DB, HTTP calls, third-party services).
* Test both success and error paths.
* Test edge cases (empty inputs, boundary values, malformed data).
* Naming: `describe('UserService')` → `it('should throw AppError when user not found')`.

## 12.3. Integration Testing

* Use an in-memory MongoDB instance (e.g., `mongodb-memory-server`) for isolated DB testing.
* Test full request → response cycle using Supertest.
* Verify response envelope structure, status codes, and data integrity.
* Test authentication and authorization on protected endpoints.

## 12.4. Test Data Management

* Use factory functions or fixtures for test data creation.
* Clean up test data after each test suite.
* Never rely on test execution order.
* Use separate test database / in-memory database.

---

# Section 13: Code Quality & Documentation

## 13.1. Self-Documentation

* **JSDoc**: Every controller method, service function, middleware, and utility must have JSDoc comments with `@param`, `@returns`, `@throws` tags.
* **Inline Comments**: Use sparingly for complex logic. Code should be self-explanatory through naming.

## 13.2. Naming Conventions

* **Files**: Use strict suffix conventions:
  - Controllers: `[module].controller.js`
  - Services: `[module].service.js`
  - Models: `[module].model.js`
  - Routes: `[module].routes.js`
  - Middleware: `[name].middleware.js` or `[name].js`
  - Validators: `[module].validator.js`
  - Utils: `[name].util.js`
* **Variables/Functions**: camelCase (`getUserById`, `isActive`).
* **Constants**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`, `DEFAULT_PAGE_SIZE`).
* **Classes**: PascalCase (`AppError`, `UserService`).

## 13.3. DRY & Utility Extraction

* Move all pure computations, data mapping, and formatting logic into dedicated utility files.
* Utility functions must be stateless, pure, and individually testable.
* **Forbidden**: Duplicating logic across controllers or services. Extract to utils.

## 13.4. Linting & Formatting

* **ESLint**: Configure with recommended rules for Node.js. Zero tolerance for lint errors.
* **Prettier**: Enforce consistent formatting with `.prettierrc`.
* **Pre-Commit Hooks**: Use Husky + lint-staged to run linting and formatting before every commit.

---

# Section 14: DevOps & Deployment

## 14.1. Docker Configuration

* **Multi-Stage Dockerfile**:
  - Stage 1: Install dependencies (`npm ci --only=production`).
  - Stage 2: Copy application code, set `NODE_ENV=production`, expose port, define health check.
* **`.dockerignore`**: Exclude `node_modules`, `.env`, `tests/`, `.git`, `*.md`.
* **Non-Root User**: Run the container as a non-root user for security.

## 14.2. Health Check Endpoint

* Implement `GET /api/health` endpoint that returns:
  - Application status (up/down).
  - Database connection status.
  - Uptime.
  - Version/commit hash.
* Used by Docker health checks, load balancers, and monitoring systems.

## 14.3. Graceful Shutdown

* Handle `SIGINT` and `SIGTERM` signals.
* Stop accepting new connections.
* Wait for existing requests to complete (with timeout).
* Close database connections.
* Exit process cleanly.

## 14.4. CI/CD Integration

* **On PR**: lint → test → security audit (`npm audit`).
* **On Merge to Main**: build Docker image → push to registry → deploy.
* **Environment Promotion**: dev → staging → production with identical Docker images.

---

# Section 15: API Versioning & Documentation

## 15.1. Versioning Strategy

* Use URL path versioning: `/api/v1/resource`.
* Maintain backward compatibility within a major version.
* Deprecate old versions with advance notice and sunset headers.

## 15.2. API Documentation

* Document all endpoints using **Swagger/OpenAPI** specification.
* Include: endpoint URL, method, request body schema, response schema, error codes, authentication requirements.
* Serve Swagger UI at `/api/docs` in non-production environments.
* **Forbidden**: Undocumented endpoints in production.

---

# Section 16: Monitoring & Observability

## 16.1. Application Metrics

* Track and expose key metrics:
  - Request count, latency (p50, p95, p99), error rate.
  - Database connection pool usage.
  - Memory and CPU usage.

## 16.2. Alerting

* Set up alerts for:
  - Error rate exceeding threshold (> 5% of requests).
  - Response time exceeding SLA (> 2 seconds p95).
  - Database connection failures.
  - Application crashes/restarts.

## 16.3. Distributed Tracing

* Use correlation/request IDs for request tracing across services.
* Include request IDs in all log entries and error responses.

---

# Section 17: Git & Version Control

## 17.1. Commit Standards

* **Conventional Commits**: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
  - Example: `feat(notes): add pagination to notes list endpoint`
* **Atomic Commits**: Each commit represents a single logical change.

## 17.2. Branch Strategy

* **Main**: `main` — production-ready code only.
* **Development**: `develop` — integration branch.
* **Feature**: `feature/[ticket-id]-short-description`
* **Hotfix**: `hotfix/[ticket-id]-short-description`

## 17.3. Pull Request Standards

* PR must include: description, API contract changes, testing steps, checklist.
* Minimum one code review approval before merge.
* All CI checks must pass before merge.
* Squash merge feature branches for clean history.
