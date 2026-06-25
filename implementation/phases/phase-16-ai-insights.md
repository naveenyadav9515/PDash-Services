# Phase 16: AI Insights & Data Synthesis (Backend)

> Centralized AI engine to aggregate cross-module lifestyle data and generate intelligent insights.

---

## Epic 16.1: Data Aggregation Engine

### Feature 16.1.1: Cross-Module Data Fetcher
- [ ] Create `services/data-aggregation.service.js`
- [ ] Implement robust logic to pull user data across disparate collections (`ModuleData`, `ModuleSettings`) based on user consent and reference mappings
- [ ] Normalize data into a secure, readable context string/JSON for the AI model

---

## Epic 16.2: AI Service Integration

### Feature 16.2.1: LLM Connection
- [ ] Create `services/ai.service.js`
- [ ] Integrate with selected LLM provider (e.g., OpenAI API, Google Gemini API)
- [ ] Implement intelligent caching layer (e.g., cache insights for 12 hours unless critical data changes) to minimize API costs

### Feature 16.2.2: Prompt Engineering & Context
- [ ] Design system prompts defining the AI's persona as a helpful lifestyle assistant
- [ ] Ensure strict data anonymization and context limits before sending data to the LLM

---

## Epic 16.3: Insights API

### Feature 16.3.1: Controller & Routes
- [ ] Create `controllers/ai-insights.controller.js`
- [ ] `GET /api/v1/insights/daily` — Returns summarized daily lifestyle insights
- [ ] `GET /api/v1/insights/widget` — Returns short, actionable widgets alerts (e.g., "Grocery expenses are up 15%, but you haven't logged trips")
- [ ] Create `routes/ai-insights.routes.js`
