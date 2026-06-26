# Phase 2: Security & HTTP Layer (Backend)

> Apply security middleware: headers, CORS, rate limiting, and input sanitization.

---

## Epic 2.1: Security Headers

### Feature 2.1.1: Helmet Configuration
- [x] **Completed** - Install and apply `helmet` middleware
- [x] **Completed** - Enable XSS protection header
- [x] **Completed** - Enable content-type nosniff
- [x] **Completed** - Enable HSTS (Strict-Transport-Security)
- [x] **Completed** - Enable frame guard (X-Frame-Options: DENY)
- [x] **Completed** - Configure Content Security Policy for API server

---

## Epic 2.2: CORS Configuration

### Feature 2.2.1: Dynamic Origin Validation
- [x] **Completed** - Create `config/cors.js`
- [x] **Completed** - Load allowed origins from environment config (comma-separated)
- [x] **Completed** - Configure allowed methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
- [x] **Completed** - Configure allowed headers: Content-Type, Authorization, X-Request-Id
- [x] **Completed** - Enable credentials support
- [x] **Completed** - Dynamic origin validation function (check against allowed list)
- [x] **Completed** - Never use `origin: '*'` in production

---

## Epic 2.3: Rate Limiting

### Feature 2.3.1: Rate Limiter Middleware
- [x] **Completed** - Create `middleware/rate-limiter.js`
- [x] **Completed** - General API limiter: 100 requests / 15 minutes per IP
- [x] **Completed** - Auth endpoints limiter: 5 requests / 15 minutes per IP
- [x] **Completed** - Make limits configurable via environment variables
- [x] **Completed** - Return `429 Too Many Requests` with `Retry-After` header

---

## Epic 2.4: Input Sanitization

### Feature 2.4.1: Request Body Protection
- [x] **Completed** - Apply `express-mongo-sanitize` to strip `$` operators from user input
- [x] **Completed** - Apply XSS sanitization middleware
- [x] **Completed** - Apply HPP (HTTP Parameter Pollution) protection
- [x] **Completed** - Set request body size limit: `express.json({ limit: '10kb' })`

## Epic 2.5: API Documentation (Swagger)

### Feature 2.5.1: Swagger Setup
- [x] **Completed** - Install `swagger-ui-express` and `swagger-jsdoc` on backend
- [x] **Completed** - Configure Swagger options in `config/swagger.js`
- [x] **Completed** - Mount Swagger UI at `/api-docs` endpoint in `app.js`

---

## Epic 2.6: Google OAuth Verification

### Feature 2.6.1: Backend Token Verification
- [x] **Completed** - Implement Node.js endpoint `/api/auth/google` on `PDash-Services`
- [x] **Completed** - Verify the Google ID Token payload using `google-auth-library`
- [x] **Completed** - If user exists, log them in. If not, auto-register them using their Google Email/Name.
- [x] **Completed** - Return our standard local JWT token so the frontend session management stays unified.
