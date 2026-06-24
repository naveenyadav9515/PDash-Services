# Phase 9: Global Search (Backend)

> API for searching across all entities.

---

## Epic 9.1: Search Service

### Feature 9.1.1: Search Logic
- [ ] Create `services/search.service.js`
- [ ] Implement `search(userId, query)`
- [ ] Search `Workspace` collection (regex on name)
- [ ] Search `ModuleDefinition` collection (regex on name/description) joined with user references
- [ ] Provide extensible interface for individual modules to hook into the global search

### Feature 9.1.2: Controller & Routes
- [ ] Create `controllers/search.controller.js`
- [ ] `GET /api/v1/search?q=<query>`
- [ ] Format results into categories: `{ workspaces: [], modules: [], content: [] }`
