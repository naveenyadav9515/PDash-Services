# AI-Safe Development Guidelines

When building an application using an AI coding assistant, the biggest risk is the AI experiencing "context loss." This happens when the AI forgets what was built previously and accidentally overwrites or corrupts working features.

To guarantee a safe, bulletproof development process, you must strictly follow these rules:

## 1. Micro-Branching (Never code on `main`)
The AI should **never** commit directly to the `main` branch. 
*   Before starting a phase, create a highly specific branch: `git checkout -b feature/phase-04-notifications`
*   If the AI corrupts the codebase, your `main` branch is still completely safe. You can easily delete the broken branch and start over.

## 2. Test-Driven Safety Nets (TDD)
We explicitly moved Testing to **Phase 1**. 
*   Once Phase 3 (Auth) is built, the AI will write Unit Tests for it.
*   When the AI is working on Phase 7 (Workspaces), you should continuously run the test suite (`npm run test`).
*   If the AI accidentally breaks the Auth code, the test suite will fail instantly, alerting you to the corruption *before* you merge the code.

## 3. Granular Prompts (Limit the AI's Vision)
Do not tell the AI: *"Build the Workspace Dashboard."* This forces the AI to guess the architecture.
Instead, use granular, file-specific prompts based on our PRDs:
> *"Read `implementation/phases/phase-07-workspace.md`. I want you to strictly implement Epic 7.1. Do not modify any files outside of the `workspace.model.js` and `workspace.service.js`. Do not touch the Auth code."*

## 4. Aggressive Commits (Save States)
Treat Git like a "Save Game" state in a video game.
*   If the AI writes a successful function, commit immediately: `git commit -m "feat: added workspace creation method"`
*   If the AI's next move breaks the app, do not ask the AI to fix it (it will often make it worse). Instead, instantly revert to your last save state: `git reset --hard HEAD`.

## 5. Continuous Integration (CI/CD)
We explicitly moved DevOps to **Phase 2**. 
*   Every time you merge a feature branch into `main`, GitHub Actions will automatically run the linter and the test suite. 
*   If the AI left behind broken syntax or regressions, the CI pipeline will block the merge, protecting your production environment.

---

## 6. Strict Directives for the AI Assistant (Self-Correction Rules)
*The AI is required to read and obey these rules before processing any code requests:*

1.  **Read the Blueprint First:** The AI must *always* use `view_file` to read the specific `phase-XX.md` file before generating code. Never guess the architecture.
2.  **Verify Existing Context:** The AI must check existing Data Models and Schemas before writing new business logic to ensure exact property name matches.
3.  **No Unprompted Refactoring:** The AI must strictly solve the active Epic. It is strictly forbidden from "cleaning up" or refactoring unrelated files, as this risks breaking hidden dependencies.
4.  **One Feature at a Time:** The AI must not attempt to build an entire Phase at once. Write the code for a single Feature, verify it works, instruct the user to `git commit`, and then move to the next.
5.  **Stop on Ambiguity:** If a user request conflicts with the `implementation_plan.md`, the AI must stop coding and ask for explicit clarification.
