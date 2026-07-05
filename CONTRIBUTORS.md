# Contributors and Ownership

RetailPulse-Zidio was completed as a four-member Zidio internship project. The final integrated branch is `main`.

## Core Ownership

| Member | Project Responsibility | Final Deliverables |
| --- | --- | --- |
| Rashad Roushan | Platform integration, dashboard, deployment, GitHub management | React/Vite dashboard, data integration adapter, Remotion Play Data stories, responsive UI, Vercel deployment, integration evidence |
| Kaviya S | Data engineering and dataset preparation | Dataset preparation, customer inventory enrichment, forecasting-ready datasets, data documentation support |
| Rohinee Solunke | Data cleaning, feature engineering, EDA | `cleaned_data.csv`, `features_data_sample.csv`, feature engineering pipeline, EDA and data pipeline documentation |
| Sachin Yadav | Demand forecasting, churn prediction, inventory optimization | Prophet forecast outputs, churn predictions, high-risk customers, inventory recommendations, ML documentation |

## Dashboard Integration Ownership

Rashad Roushan owns the final platform integration layer. The dashboard reads the team outputs from dashboard-safe CSV/JSON files, validates required columns through the data contract checker, and presents the complete project through the deployed interface.

Key dashboard integration files:

- `dashboard/src/App.tsx`
- `dashboard/src/data/retailpulse-data.ts`
- `dashboard/src/chart-animations.tsx`
- `dashboard/src/App.css`
- `dashboard/public/data/`

## Final Integrated Branch

The final project build is on:

```text
main
```

Feature branches remain available for reviewing individual teammate work.
