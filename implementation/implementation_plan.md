# P-Dash — Backend (Express.js) Implementation Plan

> **Structure:** Phase → Epic → Feature → Story
> **Stack:** MongoDB, Express.js, Node.js
> **Approach:** Foundation first (Phases 0–11), then individual module implementations.
> **Sync:** Phase numbers are synchronized with the UI implementation plan.

---

## Phase Overview

| Phase | Name | Status | Details |
|-------|------|--------|---------|
| 0 | [Project Scaffolding & Foundation](./phases/phase-00-scaffolding.md) | 🔲 Not Started | Project init, directory structure, tooling |
| 1 | [Core Infrastructure & Configuration](./phases/phase-01-infrastructure.md) | 🔲 Not Started | Env config, logging, DB connection, error handling |
| 2 | [Security & HTTP Layer](./phases/phase-02-security.md) | 🔲 Not Started | Helmet, CORS, rate limiting, sanitization |
| 3 | [Authentication & Authorization](./phases/phase-03-auth.md) | 🔲 Not Started | User model, JWT, login/register, RBAC |
| 4 | [Workspace System](./phases/phase-04-workspace.md) | 🔲 Not Started | Workspace CRUD, archive, reorder, limits |
| 5 | [Module System & Module Gallery](./phases/phase-05-module-gallery.md) | 🔲 Not Started | Module definitions, gallery catalog API |
| 6 | [Workspace-Module References & Import](./phases/phase-06-references.md) | 🔲 Not Started | Many-to-many refs, batch assign, removal ops |
| 7 | [Module Screen — Fixed Cards & User Widgets](./phases/phase-07-module-screen.md) | 🔲 Not Started | Module settings, widget config, card/widget data |
| 8 | [Edit Mode & Module Visibility Management](./phases/phase-08-edit-visibility.md) | 🔲 Not Started | Three-tier removal, reorder APIs |
| 9 | [Global Search](./phases/phase-09-search.md) | 🔲 Not Started | Cross-entity search API |
| 10 | [User Management, Settings & Admin](./phases/phase-10-admin.md) | 🔲 Not Started | User CRUD, app config, admin ops |
| 11 | [Seeding, Health Check & API Docs](./phases/phase-11-seeding-health.md) | 🔲 Not Started | Seed data, health endpoint, Swagger |
| 12 | [Testing](./phases/phase-12-testing.md) | 🔲 Not Started | Unit tests, integration tests, fixtures |
| 13 | [DevOps & CI/CD](./phases/phase-13-devops.md) | 🔲 Not Started | Docker, GitHub Actions, graceful shutdown |
| 14 | [Performance & Monitoring](./phases/phase-14-performance.md) | 🔲 Not Started | Compression, caching, metrics |
| 15 | [Polish & Hardening](./phases/phase-15-polish.md) | 🔲 Not Started | Security audit, code quality, documentation |
| 16 | [AI Insights & Data Synthesis](./phases/phase-16-ai-insights.md) | 🔲 Not Started | Cross-module data aggregation and LLM integration |
| 17 | [Notifications & Real-Time Sync](./phases/phase-17-notifications.md) | 🔲 Not Started | WebSockets and Web Push API |
| 18 | [File Storage & Media Mgt](./phases/phase-18-file-storage.md) | 🔲 Not Started | S3/Cloud storage and Multer setup |
| 19 | [Offline-First Architecture](./phases/phase-19-offline-sync.md) | 🔲 Not Started | Conflict resolution and sync APIs |
| 20 | [Localization & Data Export](./phases/phase-20-localization-export.md) | 🔲 Not Started | i18n readiness and data takeout generation |
| Future | [Individual Module Implementations](./phases/phase-future-modules.md) | 🔲 Not Started | F1–F12 module-specific APIs |

---

## Module List (F1–F12)

| Code | Module | Description |
|------|--------|-------------|
| F1 | Notes | Quick notes and bookmarks |
| F2 | Kitchen Utilities | Track utility levels (gas, water, power) |
| F3 | Expense Tracker | Track income, expenses, budgets |
| F4 | Travel Logger | Past journeys and future trip planning |
| F5 | Big Purchases | Savings goals with deadline tracking |
| F6 | Reminders | Manual + automated alerts |
| F7 | Kirana Planner | Weekly grocery list with master catalog |
| F8 | Plans | Social plans with friends and family |
| F9 | Rules | Personal rules with "rule of the day" |
| F10 | Movies | Watchlist with status tracking |
| F11 | Streak Loggers & Activity Details | Consistency tracking with activity logs |
| F12 | Splitwise | Shared expense splitting |
| — | Feature Log | Development feature logging |

---

## Data Model Reference

```
User           { id, firstName, lastName, email, password, role, isActive }
Workspace      { id, userId, name, icon, sortOrder, archived }
ModuleDefinition  { id, moduleType, name, description, icon, category, isActive }
WorkspaceModuleRef  { id, workspaceId, moduleId, userId, sortOrder }
ModuleSettings { id, userId, moduleId, settings: {} }
ModuleData     { id, userId, moduleId, data: {} }
WidgetConfig   { id, userId, moduleId, widgets: [] }
```

---

## Architecture Principles

1. Workspaces are collections — they reference modules, NOT own them.
2. Modules are reusable — one module, many workspace references, zero duplication.
3. References control visibility — removing a reference never deletes data.
4. Data controls persistence — only "Clear Module Data" deletes actual data.
5. Archive before delete — prefer `archived: true` over permanent deletion.
6. Configuration-driven limits — `maxWorkspaces` from config, never hardcoded.
7. Foundation first — workspace/module/reference system before any individual module.
