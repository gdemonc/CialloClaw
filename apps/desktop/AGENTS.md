# Desktop AGENTS

This file defines desktop-local engineering rules for `apps/desktop`.
Always follow the repository root `AGENTS.md` first. When the two differ,
the root file wins and this file only adds narrower desktop guidance.

## Scope

- `apps/desktop/src/**`
- `apps/desktop/src-tauri/**`
- `apps/desktop/*.html`
- `apps/desktop/package.json`

## Coding Rules

- Use English code comments only.
- Use TSDoc / JSDoc for exported functions, hooks, React components, and notable helpers.
- Prefer the smallest correct change.
- Do not change backend or protocol behavior when a desktop-only solution is enough.
- Keep formal task, RPC, and delivery boundaries intact.
- Frontend-only shortcuts or mock behaviors must stay clearly local and must not pretend to be formal backend behavior.

## Verification Rules

- Run `pnpm --dir apps/desktop typecheck` after desktop code changes.
- Run `pnpm --dir apps/desktop lint` after desktop code changes.
- Run `cargo check` in `apps/desktop/src-tauri` after Rust or plugin changes.

## Commit Rules

- One small feature or refactor per commit.
- Do not mix unrelated desktop changes into the same commit.
- When the worktree is already dirty, stage only the files or hunks required for the current desktop task.

## Common Mistakes To Avoid

- Forgetting to type event or payload parameters.
- Mixing helper-window local state with formal business state.
- Adding Chinese comments in touched desktop files.
- Refactoring hooks in a way that changes interaction behavior.
- Editing `useShellBallInteraction` when a lower-risk change in the coordinator or helper window is enough.
- Introducing desktop shortcuts that silently call backend flows.
- Forgetting Tauri capability permissions when adding official plugins.
