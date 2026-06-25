# Phase 14: Localization & Data Portability (Backend)

> i18n support and user data takeout.

---

## Epic 20.1: Data Portability

### Feature 20.1.1: Data Takeout Service
- [ ] Create `services/data-export.service.js`
- [ ] Aggregate all user data across `Workspace`, `ModuleData`, `ModuleSettings`, and `WidgetConfig`
- [ ] Convert aggregated JSON into CSV format (or zip file)

### Feature 20.1.2: Export API
- [ ] `GET /api/v1/users/me/export` — Trigger backup generation and return downloadable file
- [ ] Enforce rate limits (e.g., 1 export per hour) to prevent server strain
