# agent.md

This file defines project-specific guidance for coding agents working in this repository.

## Project Purpose

Browser DevTools is a React + TypeScript web app that hosts developer tools under a shared shell.

Current status:

- Implemented tools:
  - JSON Diff
  - Text Escape Lab
- New tools must be added in the same architecture: isolated tool folder + shared shell integration.

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- Tailwind CSS 4
- Monaco Editor (for JSON Diff)
- fast-json-patch (semantic JSON diff operations)
- json-source-map (map JSON pointers to source ranges)
- Base UI primitives via local wrappers in src/components/ui
- Native browser APIs for encoding/decoding where possible (URL, Base64, TextEncoder/TextDecoder)

## Folder Conventions

- src/pages/<tool-id>: tool-specific implementation (primary location for each tool)
- src/components: shared components and layout
- src/components/ui: reusable UI primitives/wrappers
- src/config/tools.ts: source of truth for tool registry
- src/router.tsx: route definitions
- src/hooks, src/utils, src/lib: shared hooks and utilities
- src/common: reserved for future shared code (currently minimal)

Important rule:

- Keep each tool self-contained in a single folder under src/pages whenever possible.
- Only extract to shared folders when code is truly reusable by multiple tools.

Current tool boundaries:

- src/pages/json-diff: Monaco-based JSON semantic diff tool.
- src/pages/text-escape: multi-mode text escape/unescape tool.

## App Shell Behavior

- AppLayout provides header, sidebar, main area, and footer.
- Sidebar renders tool links from src/config/tools.ts.
- Default route redirects to /json-diff.
- Document title is derived from route + tools config.

When adding a new tool:

1. Create src/pages/<new-tool-id>/ with the tool code.
2. Add tool metadata to src/config/tools.ts.
3. Add a route in src/router.tsx.
4. Reuse existing layout and UI wrappers.
5. Keep integration additive; do not change behavior of existing tools unless explicitly requested.

## Text Escape Lab Design Notes

Text Escape Lab follows a registry pattern in src/pages/text-escape/converters.ts.

- Each converter mode defines:
  - id, label, description
  - escape(input, context)
  - unescape(input, context)
- Shared context includes mode-specific toggles (for example JSON include-quotes and JS quote style).
- Converter behavior should be spec-aware and minimal:
  - Escape only what is required for the target format.
  - Reject malformed input with clear, user-facing error messages.
- Prefer native platform behavior before introducing dependencies.

When extending Text Escape Lab:

1. Add or update a converter in src/pages/text-escape/converters.ts.
2. Keep mode behavior reversible where standards allow.
3. Avoid mode-specific hacks in the page component; keep logic inside converters.
4. Preserve backward compatibility for existing mode IDs saved in local storage.

## Coding Guidelines

- Preserve existing architecture and naming style.
- Prefer small, focused components.
- Keep tool logic inside its tool folder unless shared reuse is clear.
- Handle invalid input states gracefully (as JSON Diff does).
- Avoid introducing global side effects.
- Keep feature work scoped and additive; avoid broad refactors unless explicitly requested.
- For parsing and escaping logic, document assumptions in short comments only where behavior is non-obvious.

## Persistence Expectations

- Browser persistence is expected for user-entered inputs and user-selected tool settings.
- Use the shared local-storage hook pattern already used by JSON Diff and Text Escape Lab.
- Derived output should generally not be persisted when it can be recomputed from persisted input + settings.
- If a feature intentionally does not persist state, document that choice in the tool folder.

## Quality Commands

Use these before finishing changes:

- npm run lint
- npm run format:check
- npm run check

## Notes for Agents

- Do not move existing JSON Diff internals out of src/pages/json-diff unless requested.
- Do not move existing Text Escape internals out of src/pages/text-escape unless requested.
- Avoid broad refactors unless there is a direct task requirement.
- Maintain compatibility with GitHub Pages base path configured in Vite.
- If introducing new modes or routes, ensure sidebar labels, route path, and page title remain consistent.

## Chat Completions Guidance

This section captures the current working patterns and UI/UX decisions for the Chat Completions tool.

### Scope

- Applies to Chat Completions files under src/pages/chat-completions/.
- Prefer localized edits over broad refactors.
- Preserve component boundaries:
  - ChatCompletions.tsx owns state, request execution, and tab orchestration.
  - Tab panels own tab-specific UI and transforms.

### Product Direction

- Keep a dense, developer-first UI with high information value.
- Keep preview surfaces clean and copy-friendly.
- Move metadata into compact badges or hover details instead of mixing into main content blocks.
- Prefer low-friction operations for common tasks.

### Response Tab Contracts

Source of truth:

- Treat raw response text as the source of truth.
- Do not precompute transformed response body only at request success time.
- Derive preview and formatted raw views from current raw response text.

Preview extraction:

- Handle multiple OpenAI-style response shapes (chat completions, legacy choices text, responses output forms).
- Extract assistant output text first.
- If assistant output text is absent and tool calls exist, preview should show copy-ready tool arguments (without decorative scaffolding lines).
- Keep summary/protocol metadata out of preview body.

Preview formatting toggle:

- "Format as JSON" in Preview must format whatever is currently displayed in Preview.
- If JSON formatting fails, return the original text unchanged.

Raw formatting toggle:

- Raw view may try JSON pretty print.
- If parse fails, show original raw text unchanged.

Metadata display:

- Show status/meta badges only when data exists.
- Use one shared "More" hover control for extra details instead of many inline info icons.

### Messages Tab Contracts

Layout model:

- Use two-pane workbench:
  - Left pane: non-editable vertical tab-style message list (role + name).
  - Right pane: editable details for selected message.
- Editing role/name/content on the right must immediately update left list labels.

Interaction patterns:

- Keep delete as two-click confirmation.
- Keep escape/unescape actions in gear menu.
- Ensure selection remains valid after add/remove (fallback to adjacent message when deleting active one).

Monaco behavior:

- Avoid clipping and line-number gutter issues by giving editor containers stable heights and proper flex constraints.
- Use explicit editor container sizing and Monaco automatic layout.
- If needed, trigger editor.layout() on mount for initial stability.

### Layout and Sizing Guidance

- Favor responsive, generic sizing with clamp(...), rem, and vh.
- Avoid one-off pixel tuning for large editor areas.
- Increase screen usage while avoiding unnecessary nested scrollbars.
- Provide mobile fallbacks that stack panes and keep editors usable.

### Validation Workflow

- After meaningful edits, run npm run check.
- If formatting fails, run Prettier on touched files and rerun checks.
