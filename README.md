# DevTools

Open-source browser tools for developers.

This repository currently includes **JSON Diff**, a web tool for comparing two JSON documents and highlighting semantic changes.

## Features

- Side-by-side JSON editors powered by Monaco Editor
- Semantic JSON diffing (add / modify / remove)
- Inline visual decorations for changed lines
- Change summary badges (total, added, modified, removed)
- Invalid JSON detection with clear feedback
- Auto-save editor content to local storage
- Fast updates with debounced diff calculation

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Monaco Editor
- React Router
- Tailwind CSS 4

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Publish to GitHub Pages

This repository is configured to deploy automatically when `main` is pushed.

1. Commit and push your changes to `main`.
2. GitHub Actions will build the app and publish the `dist/` output to the `gh-pages` branch.
3. Enable Pages in repository settings if not already enabled.

The site will be available at:

`https://salitha-pathi.github.io/browser-dev-tools`

## Quality Checks

```bash
npm run lint
npm run format:check
npm run check
```

## Project Structure

```text
src/
  components/
  config/
  hooks/
  pages/
    json-diff/
      diff/
      monaco/
      sourceMap/
  utils/
```

## Roadmap

- Add more developer-focused tools under a shared UI shell
- Improve diff navigation (next/previous change jumping)
- Add copy/export options for change sets

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
