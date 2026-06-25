# Phase 6: Offline-First Architecture (Backend)

> Backend support for optimistic UI and sync conflict resolution.

---

## Epic 6.1: Sync API Support

### Feature 6.1.1: Conflict Resolution
- [ ] Modify update endpoints (PATCH/PUT) to handle `updatedAt` timestamps provided by the client
- [ ] Implement simple "Last Write Wins" or versioning logic to handle cases where an offline device pushes outdated data
- [ ] Return specific status codes (e.g., 409 Conflict) if client data is severely out of sync
