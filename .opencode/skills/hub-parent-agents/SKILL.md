---
name: hub-parent-agents
description: Use ONLY when the user requests any coding task, feature implementation, bug fix, or source code change in the hub-parent-template project. Enforces mandatory pre-code protocol, required reading list, step docs order, pnpm check commands, and microservice boundary rules from AGENTS.md before any source modification.
---

# hub-parent-agents Skill

This skill enforces the **mandatory workflow** from `AGENTS.md` before any code change in the `hub-parent-template` monorepo.

## Trigger

Use when the user asks to:
- Implement a feature, fix a bug, refactor code, or modify any source file
- Work on `apps/frontend`, `apps/backend`, `apps/api`, or `packages/*`
- Any task that involves reading or changing `.ts`, `.tsx`, `.js`, `.svelte`, `.vue`, `.css`, `.html`, or config files within the project

## Mandatory Pre-Code Protocol

Before editing **any** source file, the agent MUST follow this sequence:

### Step 1: Read the Pre-Code Protocol

1. Read `docs/hub-parent/PRE_CODE_PROTOCOL.md`
2. Read any additional documents referenced inside that protocol file

### Step 2: Read Required Docs (in order)

Before making changes, read these files:

1. `docs/hub-parent/README.md`
2. `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`
3. `docs/hub-parent/AGENTS_GUIDE.md`
4. `docs/hub-parent/FRONTEND_UX.md` (only when working on `apps/frontend`)
5. `.graphify/markdown/SUMMARY_FOR_AI.md` (monorepo index)
6. `packages/.graphify/markdown/SUMMARY_FOR_AI.md` (workspace packages)
7. `apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md` (when touching frontend)
8. `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md` (when touching backend)
9. `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md` (when touching api)

After reading the `.graphify` summaries, use the **topic guide** section within those files to pick the right companion docs: `FOLDER_TREE.md`, `GRAPH_STATS.md`, `API_DOMAIN_IMPORTS.md`, or `WORKSPACE_DEPS.md` from the same `markdown/` directory.

### Step 3: Read Step Docs (relevant ones)

The step docs at `docs/steps/` are the primary roadmap for the agent:

- `docs/steps/step1_system_overview.md`
- `docs/steps/step2_clean_code_guidelines.md`
- `docs/steps/step3_hub_parent_docs.md`
- `docs/steps/step4_graphify_reading.md`
- `docs/steps/step5_feature_implementation_guides.md`
- `docs/steps/step6_code_execution_and_change_tracking.md`
- `docs/steps/step7_review_pr_and_system_memory.md`
- `docs/steps/step8_architecture_maintenance.md`
- `docs/steps/step9_follow_up_rollback_legacy_tracking.md`
- `docs/steps/step10_agent_task_automation.md`

Read the steps relevant to the current task. At minimum, read step1 and step2 for context.

### Step 4: Page/Feature-Specific Docs

If the task relates to a specific page or feature, read the corresponding docs in `docs/pages/` before touching source.

## Mandatory Commands

### Before/after any code change:

```bash
pnpm check
```

### After architecture/module/route changes:

1. Run `node scripts/graphify-update.cjs apps/<app>` for each affected app
2. Then run:

```bash
pnpm check:full
```

(`check:full` = `pnpm check` + `pnpm graphify:ai-summary`)

> Do NOT auto-run `update.cjs` — follow the checklist in `.graphify/README.md` first.

## Microservice Rules (enforce strictly)

- **NO cross-imports** between `apps/*` source files. Each app is isolated.
- Frontend/Backend communicate with API **only via HTTP + `@workspace/api-client`**.
- Shared logic goes in `packages/*` **only when genuinely reused**.
- Boundaries enforced by:
  - `packages/eslint-config/service-boundaries.js`
  - `scripts/verify-service-boundaries.mjs`

## Workflow Summary

1. User requests a task
2. Agent reads `docs/hub-parent/PRE_CODE_PROTOCOL.md` + referenced docs
3. Agent reads required docs list (above) relevant to the task scope
4. Agent reads applicable step docs
5. Agent reads `docs/pages/` docs if page/feature-specific
6. Agent implements the change
7. Agent runs `pnpm check` (and `pnpm check:full` if architecture changed)
8. Agent verifies no service boundary violations

## Notes

- `docs/steps/*.md` is the **primary roadmap** for the agent
- `docs/hub-parent/` and `docs/pages/` are **supplementary**
- Only open `apps/*/.graphify/snapshot/context.json` when a specific excerpt is needed (files are large, embed full source)
- After architecture refactor: run graphify update → `pnpm graphify:ai-summary` → cross-check `.graphify/README.md` checklist
