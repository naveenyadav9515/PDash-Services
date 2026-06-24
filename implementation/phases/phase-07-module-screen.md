# Phase 7: Module Screen — Fixed Cards & User Widgets (Backend)

> Data structures to support individual module screens, their settings, and user widget configurations.

---

## Epic 7.1: Module Configuration Models

### Feature 7.1.1: Module Settings
- [ ] Create `models/module-settings.model.js`
- [ ] Fields: `userId`, `moduleId`, `settings` (Mixed/Object type for flexible schema)
- [ ] Compound unique index: `userId` + `moduleId`

### Feature 7.1.2: Widget Configuration
- [ ] Create `models/widget-config.model.js`
- [ ] Fields: `userId`, `moduleId`, `widgets` (Array of `{ widgetType, sortOrder, size, config }`)
- [ ] Compound unique index: `userId` + `moduleId`

---

## Epic 7.2: Module Data Service

### Feature 7.2.1: Settings & Widgets Logic
- [ ] Create `services/module-data.service.js`
- [ ] `getModuleSettings(userId, moduleId)`
- [ ] `updateModuleSettings(userId, moduleId, settings)` — upsert pattern
- [ ] `getWidgetConfig(userId, moduleId)`
- [ ] `updateWidgetConfig(userId, moduleId, widgets)` — upsert pattern

---

## Epic 7.3: Module Data API

### Feature 7.3.1: Controller & Routes
- [ ] Create `controllers/module-data.controller.js`
- [ ] Create `routes/module-data.routes.js`
- [ ] `GET /api/v1/modules/:moduleId/settings`
- [ ] `PATCH /api/v1/modules/:moduleId/settings`
- [ ] `GET /api/v1/modules/:moduleId/widgets`
- [ ] `PUT /api/v1/modules/:moduleId/widgets`
