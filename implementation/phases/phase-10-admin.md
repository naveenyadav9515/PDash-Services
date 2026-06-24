# Phase 10: User Management, Settings & Admin (Backend)

> Profile updates, admin dashboard APIs, and global configuration.

---

## Epic 10.1: User Profile & Admin API

### Feature 10.1.1: User CRUD
- [ ] Create `services/user.service.js`
- [ ] `getUserById(id)` — exclude password
- [ ] `updateUser(id, data)` — update names
- [ ] `getAllUsers(filters, pagination)` — admin only
- [ ] `deactivateUser(id)` — admin only (soft delete)

### Feature 10.1.2: Controller & Routes
- [ ] Create `controllers/user.controller.js`
- [ ] `GET /api/v1/users/me`
- [ ] `PATCH /api/v1/users/me`
- [ ] `GET /api/v1/users` (Admin)
- [ ] `DELETE /api/v1/users/:id` (Admin)

---

## Epic 10.2: Global Configuration

### Feature 10.2.1: App Config Model
- [ ] Create `models/app-config.model.js`
- [ ] Singleton pattern for global settings (e.g. `maxWorkspaces`, maintenance mode)

### Feature 10.2.2: Config API
- [ ] `GET /api/v1/config`
- [ ] `PATCH /api/v1/config` (Admin only)
