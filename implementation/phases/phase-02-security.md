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
