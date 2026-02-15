# Study Hub v2

A new React + TypeScript study material web app in a separate folder (`study-hub-v2/`).
It ingests the existing repository's subject files, normalizes them into JSON, and provides a comfort-first reading UX for lecture/tutorial/test/exam materials.

## Features

- Subject dashboard with counts by category.
- Global search + filters + sort.
- Category pages per subject.
- Advanced image reader:
  - zoom/pan/reset
  - fit width / fit height / fit page
  - fullscreen
  - keyboard shortcuts (`←`, `→`, `+`, `-`, `0`, `f`, `esc`)
  - thumbnail rail
  - optional continuous mode
  - lazy loading + missing image badge
- Generated normalized data:
  - `public/data/materials.json`
  - `public/data/manifest.json`

## Commands

```bash
npm install
npm run ingest
npm run dev
```

Build and test:

```bash
npm run test
npm run build
```

## Data Ingestion

`npm run ingest` runs `scripts/ingest-materials.mjs`.

It parses the parent repository folders/files and classifies materials by keywords:

- `module`, `lecture` -> `lecture`
- `tutorial` -> `tutorial`
- `test` -> `test`
- `exam` -> `exam`
- `notes` -> `notes`
- `lab` -> `lab`
- `quiz` -> `quiz`
- fallback -> `other`

For accordion-based exam/test pages, each accordion section becomes one material item using its label as `termDateLabel`.
