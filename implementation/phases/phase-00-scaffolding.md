# Phase 0: Project Scaffolding & Foundation (Backend)

> Initialize the Node.js/Express project with proper structure, dependencies, and code quality tooling.

---

## Epic 0.1: Project Initialization

### Feature 0.1.1: Package & Dependencies Setup
- [ ] Initialize Node.js project with `npm init` (name: pdash-services, version: 1.0.0)
- [ ] Install production dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `compression`, `winston`, `morgan`, `bcrypt`, `jsonwebtoken`
- [ ] Install dev dependencies: `nodemon`, `eslint`, `prettier`, `jest`, `supertest`, `mongodb-memory-server`
- [ ] Configure `package.json` scripts: `start`, `dev`, `test`, `test:coverage`, `lint`, `seed`

### Feature 0.1.2: Directory Structure
- [ ] Create `config/` directory — `index.js`, `database.js`, `logger.js`, `cors.js`
- [ ] Create `controllers/` directory — route handler functions
- [ ] Create `services/` directory — business logic layer
- [ ] Create `models/` directory — Mongoose schema definitions
- [ ] Create `routes/` directory — Express route definitions
- [ ] Create `middleware/` directory — custom middleware functions
- [ ] Create `utils/` directory — shared utility functions
- [ ] Create `validators/` directory — request validation schemas
- [ ] Create `seeds/` directory — database seed scripts
- [ ] Create `tests/` directory — test files mirroring source structure

### Feature 0.1.3: Application Entry Points
- [ ] Create `app.js` — Express app setup (middleware registration, route mounting)
- [ ] Create `index.js` — server bootstrap (start listener, connect DB, handle signals)
- [ ] Keep `app.js` and `index.js` separate for testability (Supertest imports `app.js` without starting the server)

---

## Epic 0.2: Code Quality Tooling

### Feature 0.2.1: Linting
- [ ] Install `eslint` with Node.js recommended config
- [ ] Create `.eslintrc.json` with strict rules (no-unused-vars, no-console in prod, consistent-return)
- [ ] Add `lint` script to `package.json`

### Feature 0.2.2: Formatting
- [ ] Install `prettier`
- [ ] Create `.prettierrc` with project settings (singleQuote, trailingComma, printWidth: 100)
- [ ] Create `.prettierignore` (node_modules, coverage, dist)

### Feature 0.2.3: Git Hooks
- [ ] Install `husky` and `lint-staged`
- [ ] Configure pre-commit hook to run lint + format on staged files
- [ ] Add `.editorconfig` for cross-IDE consistency

---

## Epic 0.3: Version Control Configuration

### Feature 0.3.1: Git Setup
- [ ] Create comprehensive `.gitignore` (node_modules, .env, coverage, logs, dist)
- [ ] Create `.env.example` with all required environment variable keys (no actual secrets)
- [ ] Commit initial project scaffold with clean history
