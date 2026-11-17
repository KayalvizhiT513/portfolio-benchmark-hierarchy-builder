# Portfolio & Benchmark Hierarchy Studio

An interactive React + TypeScript prototype for designing eight-level investment hierarchies.

## Start locally

```bash
npm install
npm run dev
```

## The three hierarchy modes

| Level | Manual | Automatic | Hybrid |
|---|---|---|---|
| 1 Total portfolio / benchmark | Editable | Data-driven root | Editable |
| 2 Asset class | Editable | Data-driven | Editable |
| 3 Strategy | Editable | Data-driven | Editable |
| 4 Region | Editable | Data-driven | Editable |
| 5 Style | Editable | Data-driven | Data-driven |
| 6 Sector | Editable | Data-driven | Data-driven |
| 7 Fund | Editable | Data-driven | Data-driven |
| 8 Manager | Editable | Data-driven | Data-driven |

These are illustrative institutional dimensions, not an official GIC taxonomy. Change the data labels and their order as needed. Drag manual cards onto other manual cards to restructure the tree. Generated nodes are rebuilt from current-date source records and are not directly draggable.

## Build an independent custom benchmark

1. Select **Benchmark → Manual** (or **Hybrid**).
2. Select a manual node or add a new one, then check **Independent benchmark definition** in the inspector.
3. Edit the independent **Region** and **Investment style** filters.
4. Pick a weighting rule:
   - **Equal weight**: each eligible security receives 1/N.
   - **Normalize source weights**: rescale source weights to sum to 100%.
   - **Custom weights**: enter explicit percentages for eligible securities (must sum to 100%).
5. Toggle included securities in the inspector. No explicit selection means all securities matching the filters.
6. Check **Holdings** and **Validation** to inspect the resulting benchmark.
7. Select a parent or child and assign a completely different rule, if desired.

**Important:** this first version supports directly defined constituent sets and rule-based selection at any manual benchmark node. A full weighted **composite of child benchmarks** is a distinct calculation and is not implemented yet; parent independent rules do not automatically combine child returns or constituent weights.

### Examples

- **US equal weight**: Region = US; Style = All; Method = Equal.
- **India source-weighted**: Region = India; Style = All; Method = Normalize source weights.
- **US custom**: Region = US; Method = Custom; set IDX001 to 60%, IDX002 to 40% on January 2026. On February, revisit constituent weights if desired.
- **Parent-child independence**: Make a root benchmark use All regions, equal-weight; give the US child a US-only source-weighted rule. Their holdings will differ.

## Sample and imported data

CSV columns:

`date,assetId,assetName,assetClass,strategy,region,style,sector,fund,manager,weight`

`strategy`, `sector`, and `fund` can be omitted; the demo fills them with synthetic classification labels. Weight is a fraction (e.g. 0.25 means 25%). The included synthetic portfolio changes managers between January and February 2026.

## Temporary browser storage

Dataset uploads and hierarchy edits are saved to the browser's local storage for **up to 24 hours from the original save time**, then are removed the next time the application initializes after expiry. The browser can clear storage sooner; this is not durable backup.

**Use Export configuration to save a JSON copy on your computer.** The exported JSON includes source data, node definitions, and independent benchmark rules; import it later from the top toolbar.

## Current prototype boundaries

- Data does not leave the browser; there is no backend or authentication.
- Date-dependent benchmark rules are not yet versioned independently. Editing a rule applies it to every date; displayed constituents vary by date.
- The demo CSV reader supports basic delimited rows but not quoted multiline CSV.
- Node hierarchy editing works on manually defined nodes. Generated nodes derive from datasets.
- Composite benchmark weighting, attribution calculations, and advanced validation are not yet implemented.
