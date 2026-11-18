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

## Deploy Report Chart on Render + MongoDB Atlas

The Express backend and Vite frontend are served from a **single Render Web Service**, so no frontend CORS configuration is needed.

1. On [MongoDB Atlas](https://cloud.mongodb.com/), open **Database Access** and create a database user with read/write permissions on the `report_chart` database (or reuse your appropriately scoped user).
2. Under **Network Access**, permit the Render service's outbound IP ranges. Avoid `0.0.0.0/0` for production; allowing every IP increases the risk. Confirm Render's actual outbound addresses in its service networking information.
3. On [Render](https://dashboard.render.com/), use **New > Blueprint**, connect `KayalvizhiT513/portfolio-benchmark-hierarchy-builder`, and select the branch containing `render.yaml` (merge this PR to main first for a normal production deployment).
4. Render will create one Node Web Service using `npm install && npm run build` and `npm start`. Enter both secret values in Render, not GitHub:
   - `MONGODB_URI`: complete Atlas URI with database username and URL-encoded password.
   - `REPORT_CHART_EDITOR_KEY`: a separate, long, randomly generated secret used to protect report-chart API operations.
5. `MONGODB_DB_NAME=report_chart` and `NODE_ENV=production` are provided automatically by `render.yaml`.
6. Deploy and open `https://YOUR-SERVICE.onrender.com/api/health`. This checks the running server and reports whether MongoDB is configured (it does not guarantee that Atlas accepts connections).
7. Open the service root URL, click **Save Report Chart**, and enter the editor key once per browser tab. Click **Open saved** to retrieve a saved graph and its dataset from MongoDB.

Alternatively configure a standard **Web Service** directly with the same build/start commands and environment variables. Keep **Root Directory** blank when using the project root.

**Security:** `REPORT_CHART_EDITOR_KEY` is a single-user shared secret, not a production multi-user authentication system. Anyone who knows it can read and change saved reports. Prefer real user authentication and ownership checks before allowing multiple users or confidential financial datasets. Neither MongoDB credentials nor the editor key should be embedded in Vite frontend environment variables.

The browser's existing 24-hour local cache remains a temporary workspace, independent from report charts explicitly saved to MongoDB.


## Rule-based leaves and group-by levels

In **Manual** or **Hybrid** mode select a *manually defined leaf* in the Node Inspector.

- **Rule-based leaf:** Use the AND/OR rule editor, add nested groups, enable *Exclude matching (NOT)*, and list asset IDs to exclude. Securities matching the configured rule flow upward to their ancestors.
- **Group-by level:** Choose an attribute from the Group by dropdown. Distinct values become generated child nodes. Such branches cannot be moved by drag-and-drop because the attribute is the source of truth. Their parents still aggregate the child positions.
- **Automatic hierarchy:** generation is blocked if any row has null/empty values for the selected hierarchy dimensions. Check the Validation tab and fix source data rather than creating an "Unclassified" branch.
- **Manual moves:** normal manual branches remain draggable. A branch that contains or lies under a group-by boundary is locked.

The editor supports prototype-grade rule evaluation on browser-held data. For larger datasets, production use should add server-side validation, access-controlled dataset storage, and performance limits.

