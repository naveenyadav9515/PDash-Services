# Phase 8: Module System & Module Gallery (Backend)

> The catalog of available modules and the API to serve them to the Module Gallery.

---

## Epic 8.1: Module Definition Catalog

### Feature 8.1.1: Schema Definition
- [ ] Create `models/module-definition.model.js`
- [ ] Fields: `moduleType` (String, unique identifier, e.g. "expense_tracker"), `name` (String), `description` (String), `icon` (String), `category` (String), `isActive` (Boolean, default: true)
- [ ] Enable `{ timestamps: true }`
- [ ] Unique index on `moduleType`

---

## Epic 8.2: Module Definition Service

### Feature 8.2.1: Catalog Retrieval
- [ ] Create `services/module-definition.service.js`
- [ ] `getAllModules()` — fetch all `isActive: true` modules
- [ ] `getModuleById(moduleId)` — fetch single definition
- [ ] `getModulesByIds(moduleIds)` — fetch multiple using `$in`

### Feature 8.2.2: Admin Management
- [ ] `createModule(data)` — add new module to system
- [ ] `updateModule(moduleId, data)` — modify metadata
- [ ] `deactivateModule(moduleId)` — soft delete

---

## Epic 8.3: Module API

### Feature 8.3.1: Controller & Validators
- [ ] Create `controllers/module.controller.js`
- [ ] Create `validators/module.validator.js`: `createSchema`, `updateSchema`

### Feature 8.3.2: Routes
- [ ] Create `routes/module.routes.js`
- [ ] `GET /api/v1/modules` (Module Gallery view)
- [ ] `GET /api/v1/modules/:id`
- [ ] `POST /api/v1/modules` (Admin only)
- [ ] `PATCH /api/v1/modules/:id` (Admin only)
- [ ] `DELETE /api/v1/modules/:id` (Admin only, soft delete)
