# Phase 7: Workspace System (Backend)

> Core collection for organizing modules. Workspace CRUD, sorting, and config-driven limits.

---

## Epic 7.1: Workspace Model

### Feature 7.1.1: Schema Definition
- [ ] Create `models/workspace.model.js`
- [ ] Fields: `userId` (ObjectId, ref: User, required), `name` (String, max: 30, required), `icon` (String, required), `sortOrder` (Number, default: 0), `archived` (Boolean, default: false)
- [ ] Enable `{ timestamps: true }`
- [ ] Compound index: `userId` + `sortOrder` for efficient ordering

---

## Epic 7.2: Workspace Service

### Feature 7.2.1: Core CRUD Operations
- [ ] Create `services/workspace.service.js`
- [ ] `createWorkspace(userId, data)` — auto-increment `sortOrder`, enforce `maxWorkspaces` limit from config
- [ ] `getWorkspaces(userId)` — fetch active (non-archived) workspaces, sort by `sortOrder` ASC
- [ ] `getWorkspaceById(userId, workspaceId)` — fetch single workspace
- [ ] `updateWorkspace(userId, workspaceId, data)` — allow updating `name`, `icon`

### Feature 7.2.2: Sorting & Lifecycle
- [ ] `reorderWorkspaces(userId, orderedIds)` — bulk update `sortOrder` given an array of IDs
- [ ] `archiveWorkspace(userId, workspaceId)` — set `archived: true`
- [ ] `restoreWorkspace(userId, workspaceId)` — set `archived: false`
- [ ] `getArchivedWorkspaces(userId)` — fetch workspaces where `archived: true`

---

## Epic 7.3: Workspace API

### Feature 7.3.1: Controller & Validators
- [ ] Create `controllers/workspace.controller.js`
- [ ] Create `validators/workspace.validator.js`: `createSchema`, `updateSchema`, `reorderSchema`

### Feature 7.3.2: Routes
- [ ] Create `routes/workspace.routes.js`
- [ ] `GET /api/v1/workspaces`
- [ ] `POST /api/v1/workspaces`
- [ ] `GET /api/v1/workspaces/archived`
- [ ] `GET /api/v1/workspaces/:id`
- [ ] `PATCH /api/v1/workspaces/:id`
- [ ] `PATCH /api/v1/workspaces/reorder`
- [ ] `PATCH /api/v1/workspaces/:id/archive`
- [ ] `PATCH /api/v1/workspaces/:id/restore`
