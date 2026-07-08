# Phase 0: Project Scaffolding & Foundation (Backend)

> Initialize the Node.js/Express project with proper structure, dependencies, and code quality tooling.

---

## Epic 0.1: Project Initialization

### Feature 0.1.1: Package & Dependencies Setup
- [x] **Completed** - Initialize Node.js project with `npm init` (name: onespace-services, version: 1.0.0)
- [x] **Completed** - Install production dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `compression`, `winston`, `morgan`, `bcrypt`, `jsonwebtoken`
- [x] **Completed** - Install dev dependencies: `nodemon`, `eslint`, `prettier`, `jest`, `supertest`, `mongodb-memory-server`
- [x] **Completed** - Configure `package.json` scripts: `start`, `dev`, `test`, `test:coverage`, `lint`, `seed`

### Feature 0.1.2: Directory Structure
- [x] **Completed** - Create `config/` directory — `index.js`, `database.js`, `logger.js`, `cors.js`
- [x] **Completed** - Create `controllers/` directory — route handler functions
- [x] **Completed** - Create `services/` directory — business logic layer
- [x] **Completed** - Create `models/` directory — Mongoose schema definitions
- [x] **Completed** - Create `routes/` directory — Express route definitions
- [x] **Completed** - Create `middleware/` directory — custom middleware functions
- [x] **Completed** - Create `utils/` directory — shared utility functions
- [x] **Completed** - Create `validators/` directory — request validation schemas
- [x] **Completed** - Create `seeds/` directory — database seed scripts
- [x] **Completed** - Create `tests/` directory — test files mirroring source structure

### Feature 0.1.3: Application Entry Points
- [x] **Completed** - Create `app.js` — Express app setup (middleware registration, route mounting)
- [x] **Completed** - Create `index.js` — server bootstrap (start listener, connect DB, handle signals)
- [x] **Completed** - Keep `app.js` and `index.js` separate for testability (Supertest imports `app.js` without starting the server)

---

## Epic 0.2: Code Quality Tooling

### Feature 0.2.1: Linting
- [x] **Completed** - Install `eslint` with Node.js recommended config
- [x] **Completed** - Create `.eslintrc.json` with strict rules (no-unused-vars, no-console in prod, consistent-return)
- [x] **Completed** - Add `lint` script to `package.json`

### Feature 0.2.2: Formatting
- [x] **Completed** - Install `prettier`
- [x] **Completed** - Create `.prettierrc` with project settings (singleQuote, trailingComma, printWidth: 100)
- [x] **Completed** - Create `.prettierignore` (node_modules, coverage, dist)

### Feature 0.2.3: Git Hooks
- [x] **Completed** - Install `husky` and `lint-staged`
- [x] **Completed** - Configure pre-commit hook to run lint + format on staged files
- [x] **Completed** - Add `.editorconfig` for cross-IDE consistency

---

## Epic 0.3: Version Control Configuration

### Feature 0.3.1: Git Setup
- [x] **Completed** - Create comprehensive `.gitignore` (node_modules, .env, coverage, logs, dist)
- [x] **Completed** - Create `.env.example` with all required environment variable keys (no actual secrets)
- [x] **Completed** - Commit initial project scaffold with clean history
