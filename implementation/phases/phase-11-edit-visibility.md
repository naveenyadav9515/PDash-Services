# Phase 11: Edit Mode & Module Visibility Management (Backend)

> The Three-Tier Removal operations and reordering.

---

## Epic 8.1: Removal Operations

### Feature 8.1.1: Operation 1 & 2 (References)
- [ ] Implement `removeModuleFromWorkspace(userId, workspaceId, moduleId)` — Operation 1 (delete single reference)
- [ ] Implement `removeModuleFromAllWorkspaces(userId, moduleId)` — Operation 2 (delete all references for this user/module)
- [ ] Expose routes in `workspace-module-ref.routes.js`

### Feature 8.1.2: Operation 3 (Clear Data)
- [ ] Implement `clearModuleData(userId, moduleId)` in `module-data.service.js`
- [ ] Delete `ModuleSettings` and `WidgetConfig` for this user/module
- [ ] Provide hooks for individual modules to delete their specific `ModuleData` collections
- [ ] Require confirmation token in payload
- [ ] Expose `DELETE /api/v1/modules/:moduleId/data`

---

## Epic 8.2: Reordering

### Feature 8.2.1: Sorting APIs
- [ ] Implement `reorderModulesInWorkspace(userId, workspaceId, orderedModuleIds)`
- [ ] Validate all IDs belong to the workspace
- [ ] Update `sortOrder` in batch
- [ ] Expose `PATCH /api/v1/workspaces/:workspaceId/modules/reorder`
