# Phase 3: Authentication & Authorization (Backend)

> User model, JWT-based auth, login/register endpoints, auth middleware, and RBAC.

---

## Epic 3.1: User Model

### Feature 3.1.1: User Schema Definition
- [ ] Create `models/user.model.js`
- [ ] Define fields: `firstName` (String, required), `lastName` (String, required), `email` (String, required, unique), `password` (String, required, select: false), `role` (String, enum: ['user', 'admin'], default: 'user'), `isActive` (Boolean, default: true)
- [ ] Enable `{ timestamps: true }` for `createdAt` / `updatedAt`
- [ ] Define unique index on `email`

### Feature 3.1.2: Password Security
- [ ] Pre-save hook: hash password using bcrypt (12 salt rounds) only when password is modified
- [ ] Instance method: `comparePassword(candidatePassword)` — returns boolean

### Feature 3.1.3: Virtual Fields
- [ ] Define virtual `fullName` — returns `${firstName} ${lastName}`

---

## Epic 3.2: Authentication Service

### Feature 3.2.1: Registration
- [ ] Create `services/auth.service.js`
- [ ] `register(userData)` — create user with auto-hashed password, return user (without password)

### Feature 3.2.2: Login
- [ ] `login(email, password)` — find user by email (include password field), verify password, generate JWT access token + refresh token

### Feature 3.2.3: Token Management
- [ ] `generateAccessToken(userId)` — JWT with configurable expiry (default: 1h)
- [ ] `generateRefreshToken(userId)` — JWT with longer expiry (default: 7d)
- [ ] `refreshToken(token)` — validate refresh token, issue new access token

### Feature 3.2.4: Dev-Only User Switcher
- [ ] `switchUser(userId)` — development-only, generate tokens for a different user without password
- [ ] Guard with environment check: only available when `NODE_ENV !== 'production'`

---

## Epic 3.3: Auth Controller & Routes

### Feature 3.3.1: Auth Controller
- [ ] Create `controllers/auth.controller.js`
- [ ] All handlers wrapped with `catchAsync`
- [ ] Use `response.util.js` for standardized responses

### Feature 3.3.2: Auth Routes
- [ ] Create `routes/auth.routes.js`
- [ ] `POST /api/v1/auth/register` — register new user
- [ ] `POST /api/v1/auth/login` — login and return tokens
- [ ] `POST /api/v1/auth/refresh` — refresh access token
- [ ] `POST /api/v1/auth/switch` — dev-only user switch

---

## Epic 3.4: Auth Middleware

### Feature 3.4.1: JWT Verification Middleware
- [ ] Create `middleware/auth.middleware.js`
- [ ] Extract JWT from `Authorization: Bearer <token>` header
- [ ] Verify token signature and expiry
- [ ] Fetch user from DB, attach to `req.user`
- [ ] Return `401 Unauthorized` for invalid/missing tokens

### Feature 3.4.2: Role-Based Access Control
- [ ] Create `restrictTo(...roles)` middleware factory
- [ ] Compare `req.user.role` against allowed roles
- [ ] Return `403 Forbidden` if role not authorized

---

## Epic 3.5: Validation Schemas

### Feature 3.5.1: Auth Validators
- [ ] Create `validators/auth.validator.js`
- [ ] `registerSchema` — validate: email (valid format), password (min 8 chars), firstName (required), lastName (required)
- [ ] `loginSchema` — validate: email (required), password (required)
- [ ] `switchSchema` — validate: userId (valid MongoDB ObjectId)

---

## Epic 3.6: Transactional Email Service

### Feature 3.6.1: Email Infrastructure
- [ ] Install `nodemailer`
- [ ] Create `services/email.service.js`
- [ ] Configure SMTP transport (e.g., SendGrid, AWS SES)
- [ ] Create basic HTML templates for common emails (Welcome, Password Reset)

### Feature 3.6.2: Password Reset API
- [ ] `POST /api/v1/auth/forgot-password` — generate reset token (valid for 15 mins), save hashed token to DB, send email
- [ ] `PATCH /api/v1/auth/reset-password/:token` — verify token, hash new password, save, and log user in automatically
