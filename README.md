# Portfolio & Benchmark Hierarchy Studio

A React + TypeScript prototype for building, exploring, and reorganizing investment hierarchies. All data stays in the browser.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Production build: `npm run build`.

## Features

- **Manual:** editable trees, add, rename, duplicate, delete with child promotion, and drag a node onto any other manual node to reparent its entire subtree. Cycles are prevented.
- **Automatic:** select hierarchy dimensions in order; build a unique tree from the labeled holdings for each effective date.
- **Hybrid:** manually curated top branches, with generated lower dimensions.
- **Portfolio:** leaf assignments and inherited holdings. Inspect the securities at each ancestor and configure manual leaf assignments.
- **Benchmark:** independently defined benchmark nodes, even when constituent sets differ from child nodes.
- **Time:** switch between January and February 2026 to see changed manager assignments and positions.
- **Data:** built-in sample datasets, CSV upload, CSV download, hierarchy JSON export/import, local browser persistence, undo/redo, and validation tab.

### CSV input schema

`date,assetId,assetName,assetClass,region,style,manager,weight`

Each row is a dated security position; `weight` is a fraction (e.g. `0.1` for 10%). Two dates and multiple regions are included as examples.

## Known prototype boundaries

- No backend, authentication or real financial market data.
- Simple benchmark independent samples are synthetic demonstrations, not a general benchmark composition engine.
- Manual node deletion currently promotes direct children; explicit subtree deletion and advanced reparent previews can be added later.
- Custom manually defined leaves can be populated from the node inspector. Manual classification is intentionally decoupled from the input dataset's manager labels.
- The sample CSV parser is intended for standard exported datasets; add a production-grade CSV parser for multiline quoted values.
- Exported JSON is a configuration snapshot, not a performance attribution report.

This branch is intended for visual review before merging into `main`.
