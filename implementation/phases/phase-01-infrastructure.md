# Phase 1: Core Infrastructure & Configuration (Backend)

> Set up environment config, structured logging, database connection with retry logic, custom error handling, and response utilities.

---

## Epic 1.1: Environment Configuration

### Feature 1.1.1: Config Module
- [x] **Completed** - Create `config/index.js` that loads all env vars via `dotenv`
- [x] **Completed** - Validate required variables at startup — fail-fast if missing (PORT, MONGO_URI, JWT_SECRET)
- [x] **Completed** - Export structured config object: `{ port, db.uri, jwt.secret, jwt.expiresIn, cors.origins, rateLimit.windowMs, rateLimit.max, maxWorkspaces }`
- [x] **Completed** - Parse comma-separated CORS origins into arrays
- [x] **Completed** - Set `maxWorkspaces` default to 6 (configurable via `MAX_WORKSPACES` env var)

### Feature 1.1.2: Environment Files
- [x] **Completed** - Create `.env` for local development with all required keys
- [x] **Completed** - Create `.env.example` as a template (no real values)

---

## Epic 1.2: Structured Logging

### Feature 1.2.1: Winston Logger
- [x] **Completed** - Create `config/logger.js` with Winston
- [x] **Completed** - Development format: colorized console output with timestamps
- [x] **Completed** - Production format: JSON-structured for log aggregation
- [x] **Completed** - Log levels: `error`, `warn`, `info`, `debug`
- [x] **Completed** - File transport for error logs in production (`logs/error.log`)

### Feature 1.2.2: Request Logger Middleware
- [x] **Completed** - Create `middleware/request-logger.js` using Morgan piped to Winston
- [x] **Completed** - Log: HTTP method, URL, status code, response time (ms), content length
- [x] **Completed** - Redact sensitive data (passwords, tokens) from log output

---

## Epic 1.3: Database Connection

### Feature 1.3.1: Connection Manager
- [x] **Completed** - Create `config/database.js` with Mongoose connection
- [x] **Completed** - Configure connection pooling options
- [x] **Completed** - Add event listeners: `connected`, `disconnected`, `error` with structured logging

### Feature 1.3.2: Connection Resilience
- [x] **Completed** - Implement retry logic (5 retries, 5s delay between attempts)
- [x] **Completed** - Set `serverSelectionTimeoutMS: 5000` for fast failure
- [x] **Completed** - Implement graceful shutdown on `SIGINT`/`SIGTERM` — close Mongoose connection
- [x] **Completed** - Verify connection on startup with health check query

---

## Epic 1.4: Error Handling Infrastructure

### Feature 1.4.1: Custom Error Class
- [x] **Completed** - Create `utils/AppError.js` extending native `Error`
- [x] **Completed** - Add properties: `statusCode`, `code`, `isOperational`, `details`
- [x] **Completed** - Add factory methods: `AppError.badRequest(message)`, `AppError.notFound(resource)`, `AppError.unauthorized()`, `AppError.forbidden()`

### Feature 1.4.2: Async Error Wrapper
- [x] **Completed** - Create `utils/catchAsync.js` — wraps async route handlers to eliminate try-catch blocks
- [x] **Completed** - Usage: `router.get('/', catchAsync(async (req, res) => { ... }))`

### Feature 1.4.3: Response Utilities
- [x] **Completed** - Create `utils/response.util.js` with standardized response envelope functions
- [x] **Completed** - `sendSuccess(res, data, statusCode=200)` — `{ status: 'success', data }`
- [x] **Completed** - `sendCreated(res, data)` — 201 with `{ status: 'success', data }`
- [x] **Completed** - `sendNoContent(res)` — 204 with empty body

### Feature 1.4.4: Centralized Error Handler Middleware
- [x] **Completed** - Create `middleware/error-handler.js` as the last middleware in Express pipeline
- [x] **Completed** - Handle Mongoose `ValidationError` → `400 VALIDATION_ERROR` with field details
- [x] **Completed** - Handle Mongoose `CastError` → `400 INVALID_ID`
- [x] **Completed** - Handle MongoDB `11000` duplicate key → `409 DUPLICATE_KEY`
- [x] **Completed** - Handle JWT `JsonWebTokenError` → `401 INVALID_TOKEN`
- [x] **Completed** - Handle JWT `TokenExpiredError` → `401 TOKEN_EXPIRED`
- [x] **Completed** - Handle operational errors → formatted response with correct status code
- [x] **Completed** - Handle programmer errors → `500` with generic message, full stack logged
- [x] **Completed** - Never expose stack traces in production

---

## Epic 1.5: Request Utilities

### Feature 1.5.1: Pagination
- [x] **Completed** - Create `utils/pagination.util.js`
- [x] **Completed** - Parse query params: `page` (default: 1), `limit` (default: 20, max: 100)
- [x] **Completed** - Calculate `skip` value for Mongoose queries
- [x] **Completed** - Build pagination metadata: `{ page, limit, totalDocs, totalPages, hasNext, hasPrev }`

### Feature 1.5.2: Correlation ID
- [x] **Completed** - Create `middleware/correlation-id.js`
- [x] **Completed** - Generate UUID for each incoming request
- [x] **Completed** - Attach to `req.requestId`
- [x] **Completed** - Include in all log entries for request tracing
- [x] **Completed** - Return as `X-Request-Id` response header


---
