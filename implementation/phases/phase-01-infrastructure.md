# Phase 1: Core Infrastructure & Configuration (Backend)

> Set up environment config, structured logging, database connection with retry logic, custom error handling, and response utilities.

---

## Epic 1.1: Environment Configuration

### Feature 1.1.1: Config Module
- [ ] Create `config/index.js` that loads all env vars via `dotenv`
- [ ] Validate required variables at startup — fail-fast if missing (PORT, MONGO_URI, JWT_SECRET)
- [ ] Export structured config object: `{ port, db.uri, jwt.secret, jwt.expiresIn, cors.origins, rateLimit.windowMs, rateLimit.max, maxWorkspaces }`
- [ ] Parse comma-separated CORS origins into arrays
- [ ] Set `maxWorkspaces` default to 6 (configurable via `MAX_WORKSPACES` env var)

### Feature 1.1.2: Environment Files
- [ ] Create `.env` for local development with all required keys
- [ ] Create `.env.example` as a template (no real values)

---

## Epic 1.2: Structured Logging

### Feature 1.2.1: Winston Logger
- [ ] Create `config/logger.js` with Winston
- [ ] Development format: colorized console output with timestamps
- [ ] Production format: JSON-structured for log aggregation
- [ ] Log levels: `error`, `warn`, `info`, `debug`
- [ ] File transport for error logs in production (`logs/error.log`)

### Feature 1.2.2: Request Logger Middleware
- [ ] Create `middleware/request-logger.js` using Morgan piped to Winston
- [ ] Log: HTTP method, URL, status code, response time (ms), content length
- [ ] Redact sensitive data (passwords, tokens) from log output

---

## Epic 1.3: Database Connection

### Feature 1.3.1: Connection Manager
- [ ] Create `config/database.js` with Mongoose connection
- [ ] Configure connection pooling options
- [ ] Add event listeners: `connected`, `disconnected`, `error` with structured logging

### Feature 1.3.2: Connection Resilience
- [ ] Implement retry logic (5 retries, 5s delay between attempts)
- [ ] Set `serverSelectionTimeoutMS: 5000` for fast failure
- [ ] Implement graceful shutdown on `SIGINT`/`SIGTERM` — close Mongoose connection
- [ ] Verify connection on startup with health check query

---

## Epic 1.4: Error Handling Infrastructure

### Feature 1.4.1: Custom Error Class
- [ ] Create `utils/AppError.js` extending native `Error`
- [ ] Add properties: `statusCode`, `code`, `isOperational`, `details`
- [ ] Add factory methods: `AppError.badRequest(message)`, `AppError.notFound(resource)`, `AppError.unauthorized()`, `AppError.forbidden()`

### Feature 1.4.2: Async Error Wrapper
- [ ] Create `utils/catchAsync.js` — wraps async route handlers to eliminate try-catch blocks
- [ ] Usage: `router.get('/', catchAsync(async (req, res) => { ... }))`

### Feature 1.4.3: Response Utilities
- [ ] Create `utils/response.util.js` with standardized response envelope functions
- [ ] `sendSuccess(res, data, statusCode=200)` — `{ status: 'success', data }`
- [ ] `sendCreated(res, data)` — 201 with `{ status: 'success', data }`
- [ ] `sendNoContent(res)` — 204 with empty body

### Feature 1.4.4: Centralized Error Handler Middleware
- [ ] Create `middleware/error-handler.js` as the last middleware in Express pipeline
- [ ] Handle Mongoose `ValidationError` → `400 VALIDATION_ERROR` with field details
- [ ] Handle Mongoose `CastError` → `400 INVALID_ID`
- [ ] Handle MongoDB `11000` duplicate key → `409 DUPLICATE_KEY`
- [ ] Handle JWT `JsonWebTokenError` → `401 INVALID_TOKEN`
- [ ] Handle JWT `TokenExpiredError` → `401 TOKEN_EXPIRED`
- [ ] Handle operational errors → formatted response with correct status code
- [ ] Handle programmer errors → `500` with generic message, full stack logged
- [ ] Never expose stack traces in production

---

## Epic 1.5: Request Utilities

### Feature 1.5.1: Pagination
- [ ] Create `utils/pagination.util.js`
- [ ] Parse query params: `page` (default: 1), `limit` (default: 20, max: 100)
- [ ] Calculate `skip` value for Mongoose queries
- [ ] Build pagination metadata: `{ page, limit, totalDocs, totalPages, hasNext, hasPrev }`

### Feature 1.5.2: Correlation ID
- [ ] Create `middleware/correlation-id.js`
- [ ] Generate UUID for each incoming request
- [ ] Attach to `req.requestId`
- [ ] Include in all log entries for request tracing
- [ ] Return as `X-Request-Id` response header
