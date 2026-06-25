# Phase 12: User Management, Settings & Admin (Backend)

> Profile updates, admin dashboard APIs, and global configuration.

---

## Epic 10.1: User Profile & Admin API

### Feature 10.1.1: User CRUD & Restrictions
- [ ] Create `services/user.service.js`
- [ ] `getAllUsers(filters, pagination)` — admin only, supports filtering by active/inactive status
- [ ] `getUserById(id)` — exclude password
- [ ] `updateUser(id, data)` — admin capability to edit user data directly
- [ ] `deactivateUser(id)` — suspend account (soft delete)
- [ ] `forceLogout(id)` — invalidate all active JWT refresh tokens for a user

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

---

## Epic 10.3: System Analytics & Insights

### Feature 10.3.1: Admin Insights API
- [ ] Create `services/admin-analytics.service.js`
- [ ] `GET /api/v1/admin/stats` — Returns aggregate metrics: total users, active vs inactive users, total workspaces created, most used modules, and database storage usage
- [ ] Ensure all analytics endpoints are strictly protected by `restrictTo('admin')` RBAC middleware
