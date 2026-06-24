# Phase 12: Testing (Backend)

> Unit tests, integration tests, and coverage.

---

## Epic 12.1: Unit Testing

### Feature 12.1.1: Setup & Service Tests
- [ ] Configure Jest with code coverage reporting
- [ ] Test Workspace service (CRUD, limit enforcement)
- [ ] Test Reference service (batch assign)
- [ ] Test Utility functions (AppError, Pagination)

---

## Epic 12.2: Integration Testing

### Feature 12.2.1: API Tests
- [ ] Setup `mongodb-memory-server`
- [ ] Test Auth endpoints (login, register, RBAC)
- [ ] Test Workspace endpoints
- [ ] Test Module Removal Operations (Tier 1, 2, 3)
- [ ] Implement `beforeEach` DB cleanup hooks
