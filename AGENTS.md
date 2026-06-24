# Repository Guidelines

## Project Structure & Module Organization

RetailPulse is an AI-powered retail analytics platform with two separate frontend layers and a shared data science core:

- **`src/`** — Framework-agnostic Python modules (`forecasting.py`, `inventory.py`). All analytics logic lives here as pure functions over DataFrames, decoupled from any UI. This is the FastAPI-ready backend layer.
- **`dashboard/`** — Contains two coexisting frontends:
  - **Streamlit app** (`app.py`, `views/`, `utils/`) — the primary deployed dashboard. Pages are plain `render(ctx)` functions in `views/` rather than Streamlit's native multipage feature, giving full control over a shared application context (`ctx`).
  - **React/TypeScript/Vite app** (`src/`, `package.json`) — a premium 3D/animated frontend using Three.js, GSAP and Framer Motion.
- **`data/raw/`** / **`data/processed/`** — Drop real CSVs here (`transactions.csv`, `customers.csv`, `products.csv`, `daily.csv`) to override the built-in seeded synthetic data generator.
- **`notebooks/`** — Jupyter notebooks for exploratory data science work.

The `utils/` layer inside `dashboard/` (`data_loader`, `ml_models`, `charts`, `components`, `styling`) is intentionally framework-agnostic — the same functions back the Streamlit UI and can be wired directly to a FastAPI service.

## Build, Test, and Development Commands

**Streamlit dashboard (Python 3.11):**
```bash
cd dashboard
pip install -r requirements.txt
streamlit run app.py
```

**React/Vite frontend:**
```bash
cd dashboard
npm install
npm run dev        # dev server at http://127.0.0.1:5173
npm run build      # tsc + vite build → dist/
npm run preview    # preview built output at http://127.0.0.1:4173
```

Prophet is an optional dependency — if unavailable the forecasting page falls back to a built-in numpy seasonal-trend model automatically. No action required.

## Coding Style & Naming Conventions

**Python:**
- Use `from __future__ import annotations` in all modules.
- Type-annotate public function signatures; use `TYPE_CHECKING` guards for heavy optional imports (see `src/forecasting.py`).
- Module-level `__all__` lists for public APIs.
- Logging via `logging.getLogger(__name__)` with a `NullHandler` — callers configure handlers.

**TypeScript (React frontend):**
- TypeScript strict mode is enabled (`"strict": true` in `tsconfig.json`, target ES2022).
- `allowJs: false` — no plain JavaScript in the `src/` tree.
- JSX transform: `react-jsx` (no `React` import needed in components).

**CSS / Styling:**
- Tailwind CSS for the React frontend.
- Streamlit theming is controlled programmatically via `utils/styling.py` CSS injection — do not use Streamlit's native theme config.

## Forecasting Target

The demand forecasting model should achieve **MAPE ≤ 12%** on backtest evaluation. This is the spec target referenced in `utils/ml_models.py`.

## Commit Guidelines

Observed pattern from git history: short imperative phrases in sentence case.

```
Added forecasting and inventory documentation
Initial forecasting and inventory module setup
Initial project structure setup
```
