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
