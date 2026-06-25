# Phase 9: Workspace-Module References & Import (Backend)

> Many-to-many relationship defining which modules belong to which workspaces.

---

## Epic 6.1: Reference Model

### Feature 6.1.1: Schema Definition
- [ ] Create `models/workspace-module-ref.model.js`
- [ ] Fields: `workspaceId` (ObjectId, ref: Workspace, required), `moduleId` (ObjectId, ref: ModuleDefinition, required), `userId` (ObjectId, ref: User, required), `sortOrder` (Number, default: 0)
- [ ] Enable `{ timestamps: true }`
- [ ] Compound unique index: `workspaceId` + `moduleId` (no duplicate modules in same workspace)
- [ ] Index on `moduleId` for reverse lookups

---

## Epic 6.2: Reference Service

### Feature 6.2.1: Workspace Lookups
- [ ] Create `services/workspace-module-ref.service.js`
- [ ] `getModulesForWorkspace(userId, workspaceId)` — fetch refs, sort by `sortOrder`, populate `moduleId` with definition details
- [ ] `getWorkspacesForModule(userId, moduleId)` — fetch all workspaces using a specific module
- [ ] `getModuleUsageCount(userId, moduleId)` — return count of workspaces

### Feature 6.2.2: Assignment & Batch Import
- [ ] `assignModulesToWorkspace(userId, workspaceId, moduleIds)` — insert multiple references in a single transaction/batch
- [ ] Auto-calculate `sortOrder` for newly added modules to appear at the end

---

## Epic 6.3: Reference API

### Feature 6.3.1: Controller & Routes
- [ ] Create `controllers/workspace-module-ref.controller.js`
- [ ] Create `routes/workspace-module-ref.routes.js`
- [ ] `GET /api/v1/workspaces/:workspaceId/modules` — get modules for workspace
- [ ] `POST /api/v1/workspaces/:workspaceId/modules` — batch assign modules
- [ ] `GET /api/v1/modules/:moduleId/workspaces` — get workspaces using module
