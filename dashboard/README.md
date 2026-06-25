# 📊 RetailPulse — AI-Powered Customer Analytics & Demand Forecasting Platform

> **End-to-End Data Science & Analytics Solution for Retail Demand Prediction & Customer Insights**
> Predictive Demand • Customer Segmentation • Churn Analysis • Inventory Optimization

A production-grade, enterprise-style **Streamlit** dashboard that ingests sales,
customer and inventory data to deliver **demand forecasts, customer
segmentation, churn prediction and inventory optimization** — the kind of
analytics console used by retail executives at companies like Amazon, Walmart
or Shopify.

---

## ✨ Highlights

- **7 fully-featured pages** — Executive Overview, Customer Segmentation, Churn
  Prediction, Demand Forecasting, Inventory Optimization, Analytics & Reports,
  Settings.
- **Premium enterprise UI** — professional blue/white/dark theme, glassmorphism
  cards, smooth hover & entrance animations, loading spinners, fully responsive
  layout, and a **dark-mode toggle**.
- **Real ML under the hood** — RFM scoring, KMeans clustering, logistic churn
  model with feature importance, Prophet forecasting (with a dependency-free
  statistical fallback), and a classic `(s, Q)` inventory policy.
- **Runs out-of-the-box** — ships with a seeded **synthetic data generator**, so
  no external dataset is required. Drop real CSVs into `data/` to use your own.
- **Export everywhere** — CSV / Excel / PDF report downloads.
- **FastAPI-ready architecture** — the entire `utils/` analytics layer is pure
  functions over DataFrames, decoupled from Streamlit, so it can back a REST API.

---

## 🗂️ Project Structure

```
RetailPulse/
├── app.py                  # Entry point: theme, sidebar, routing, session state
├── pages/                  # One render(ctx) function per page
│   ├── overview.py         # 1. Executive Overview (KPIs + trends + filters)
│   ├── segmentation.py     # 2. RFM + KMeans customer segmentation
│   ├── churn.py            # 3. Churn risk + retention recommendation engine
│   ├── forecasting.py      # 4. Prophet demand forecast + what-if analysis
│   ├── inventory.py        # 5. Reorder/safety-stock optimization + alerts
│   ├── reports.py          # 6. Report generation & CSV/Excel/PDF export
│   └── settings.py         # 7. Theme / model / forecast / notification settings
├── utils/                  # Reusable, framework-agnostic building blocks
│   ├── styling.py          # Theme tokens + global CSS (glassmorphism, animations)
│   ├── data_loader.py      # Synthetic data generation + CSV loader + filters
│   ├── ml_models.py        # RFM, KMeans, churn, forecasting, inventory logic
│   ├── charts.py           # Reusable themed Plotly chart builders
│   └── components.py       # KPI cards, headers, alerts, export helpers
├── assets/                 # Logos / images
├── models/                 # Saved model artefacts (optional)
├── data/                   # Drop real CSVs here to override synthetic data
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

```bash
# 1. (recommended) create a virtual environment — Python 3.11
python3.11 -m venv .venv && source .venv/bin/activate

# 2. install dependencies
pip install -r requirements.txt

# 3. run the dashboard
streamlit run app.py
```

Then open the URL Streamlit prints (default `http://localhost:8501`).

> **Note on Prophet:** Prophet is optional. If it isn't installed (or fails to
> build), the forecasting page automatically falls back to a built-in
> seasonal-trend model — the app still works end-to-end.

---

## 🧩 Pages Overview

| # | Page | What it does |
|---|------|--------------|
| 1 | **Executive Overview** | 8 KPI cards (revenue, sales, customers, active, churn, forecast accuracy, inventory health, growth), revenue/sales trends, monthly performance, top products, category mix, with date/product/region filters. |
| 2 | **Customer Segmentation** | RFM scoring, KMeans clusters, 6 business segments (Champions, Loyal, Potential Loyalists, New, At Risk, Lost), CLV & spending charts, per-segment playbook. |
| 3 | **Churn Prediction** | High/Medium/Low risk bands, churn probability distribution, feature importance, top at-risk table, and a retention recommendation engine (discount / loyalty / campaign). |
| 4 | **Demand Forecasting** | Prophet forecast with confidence intervals, 7/30/90/180-day horizon selector, seasonal/weekly/monthly decomposition, and live What-If sliders (demand %, marketing %, seasonal %). |
| 5 | **Inventory Optimization** | Safety stock, reorder point & quantity, over/under-stock detection, health gauge, status heatmap, colour-coded 🔴🟠🟢 alerts, reorder recommendations. |
| 6 | **Analytics & Reports** | Customer / Sales / Churn / Forecast / Inventory reports with live preview and CSV / Excel / PDF export. |
| 7 | **Settings** | Theme, model (clusters, service level), forecast (horizon, MAPE target) and notification preferences. |

---

## 🔬 Data Science Details

- **RFM**: quintile scoring of Recency, Frequency, Monetary → rule-based segments.
- **Segmentation**: `KMeans` on standardized RFM features (cluster count configurable).
- **Churn**: `LogisticRegression` (class-balanced) over behavioural features
  (recency, frequency, satisfaction, support tickets, login recency, email
  engagement…), with absolute coefficients shown as feature importance.
- **Forecasting**: `Prophet` (weekly + yearly seasonality, 90% interval) with a
  numpy linear-trend + weekday-seasonal fallback; reports backtest MAPE &
  accuracy (spec target: **MAPE ≤ 12%**).
- **Inventory**: classic `(s, Q)` model — `safety_stock = z·σ·√L`,
  `reorder_point = d·L + safety_stock`.

---

## 🔌 Using Your Own Data

Place these CSVs in `data/` and they'll be loaded automatically:

| File | Key columns |
|------|-------------|
| `transactions.csv` | `order_date, customer_id, product_id, product, category, region, quantity, discount, revenue, cost` |
| `customers.csv` | `customer_id, recency, frequency, monetary, avg_order_value, satisfaction, support_tickets, days_since_login, email_open_rate, tenure_days, clv` |
| `products.csv` | `product_id, product, category, unit_price, unit_cost, current_stock, avg_daily_demand, lead_time_days` |
| `daily.csv` | `date, revenue, sales, orders, profit` |

If any file is missing, the seeded synthetic generator is used instead.

---

## ☁️ Deployment

- **Streamlit Community Cloud**: push to GitHub → "New app" → point at `app.py`.
- **Docker** (sketch):
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  EXPOSE 8501
  CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
  ```
- **Hugging Face Spaces**: select the Streamlit SDK and push the repo.

---

## 🛣️ Roadmap

- Wire the `utils/` layer behind a FastAPI service for programmatic access.
- Add MLflow experiment tracking & Evidently AI drift monitoring.
- Automated retraining pipeline (Airflow) and CI/CD (GitHub Actions).

---

*Crafted with precision and modern data science principles • Zidio Development • 2026*
