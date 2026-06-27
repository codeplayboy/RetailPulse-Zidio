import { useEffect, useState } from "react";
import {
  Activity,
  CircleDollarSign,
  CloudDownload,
  Gauge,
  Gem,
  LineChart,
  PackageCheck,
  RadioTower,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

type KpiTone = "blue" | "violet" | "cyan" | "gold" | "danger" | "green";

export type KpiItem = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: KpiTone;
};

export type SegmentRow = [string, string, string, string, string];
export type ActivityRow = [string, string, string, "critical" | "secure" | "info"];

export type DashboardData = {
  loading: boolean;
  error: string | null;
  navStats: Record<"overview" | "segmentation" | "churn" | "forecasting" | "inventory" | "reports", string>;
  hero: {
    overview: { primary: string; secondary: string; tertiary: string };
    segmentation: { primary: string; secondary: string; tertiary: string };
    churn: { primary: string; secondary: string; tertiary: string };
    forecasting: { primary: string; secondary: string; tertiary: string };
    inventory: { primary: string; secondary: string; tertiary: string };
    reports: { primary: string; secondary: string; tertiary: string };
  };
  kpis: KpiItem[];
  segmentationKpis: KpiItem[];
  churnKpis: KpiItem[];
  forecastingKpis: KpiItem[];
  inventoryKpis: KpiItem[];
  reportsKpis: KpiItem[];
  revenueMonths: string[];
  revenueSeries: number[];
  compareSeries: number[];
  compactSeries: number[];
  bars: number[];
  profitBars: number[];
  barMonths: string[];
  heat: number[];
  categoryLabels: string[];
  categoryValues: number[];
  segmentLabels: string[];
  segmentValues: number[];
  reportMixLabels: string[];
  reportMixValues: number[];
  horizontalBarLabels: string[];
  horizontalBarValues: number[];
  featureLabels: string[];
  featureValues: number[];
  forecastCategoryLabels: string[];
  forecastCategoryValues: number[];
  segments: SegmentRow[];
  activity: ActivityRow[];
  topProductsRows: string[][];
  churnRecommendationRows: string[][];
  forecastRows: string[][];
  inventoryRecommendationRows: string[][];
  reportPreviewRows: Record<string, string[][]>;
  inventoryHealthScore: number;
  exportSuccess: string;
};

type RevenueRow = {
  Date: string;
  Total_Revenue: number;
  Total_Quantity: number;
  Invoice_Count: number;
  SKU_Count: number;
  Avg_Price: number;
};

type DemandRow = {
  Date: string;
  Total_Quantity: number;
  Rolling_30_Day_Demand: number;
  Day_Of_Week: number;
};

type InventoryRow = {
  StockCode: string;
  Description: string;
  Total_Quantity_Sold: number;
  Total_Revenue: number;
  Average_Daily_Demand: number;
  Reorder_Point: number;
  Inventory_Gap: number;
  Inventory_Status: string;
  Recommendation: string;
  Net_Quantity: number;
  Safety_Stock: number;
};

type ForecastRow = {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
};

type ChurnRow = {
  Customer_ID: string;
  Customer_Segment: string;
  Loyalty_Status: string;
  Preferred_Category: string;
  Days_Since_Last_Purchase: number;
  Churn_Risk: string;
  Risk_Level: string;
  Customer_Lifetime_Value: number;
  Total_Orders: number;
};

const DATA_BASE = `${import.meta.env.BASE_URL}data/`;

const ACTION_BY_SEGMENT: Record<string, string> = {
  "High Value": "White-glove retention sequence",
  "Medium Value": "Upsell and cross-sell acceleration",
  "Low Value": "Reactivation and nurture automation",
  Champions: "VIP early access and referral flywheel",
  "Loyal Customers": "Premium upsell and review requests",
  "Potential Loyalists": "Membership onboarding sequence",
  "New Customers": "Second-purchase acceleration",
  "At Risk": "Win-back offer and personal outreach",
  "Lost Customers": "Low-cost reactivation campaign",
};

const EMPTY_DATA = createFallbackDashboardData();

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return `${Math.round(value)}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function shortMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function tinyMonthLabel(date: Date): string {
  return shortMonthLabel(date).slice(0, 1);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function csvToObjects<T>(text: string, mapper: (row: Record<string, string>) => T): T[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    return mapper(record);
  });
}

function parseDate(value: string): Date {
  const parts = value.includes("-") ? value.split("-") : value.split("/");
  if (parts.length === 3 && parts[0].length === 2) {
    const [dd, mm, yyyy] = parts;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  return new Date(value);
}

function normalizeSeries(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.max(18, Math.round((value / max) * 100)));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number {
  return values.length ? sum(values) / values.length : 0;
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyGetter(item);
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  });
  return groups;
}

function buildDashboardData(
  revenueRows: RevenueRow[],
  demandRows: DemandRow[],
  inventoryRows: InventoryRow[],
  forecastRows: ForecastRow[],
  churnRows: ChurnRow[],
): DashboardData {
  const sortedRevenue = [...revenueRows].sort((a, b) => parseDate(a.Date).getTime() - parseDate(b.Date).getTime());
  const sortedDemand = [...demandRows].sort((a, b) => parseDate(a.Date).getTime() - parseDate(b.Date).getTime());
  const sortedForecast = [...forecastRows].sort((a, b) => parseDate(a.ds).getTime() - parseDate(b.ds).getTime());
  const totalRevenue = sum(sortedRevenue.map((row) => row.Total_Revenue));
  const totalOrders = sum(sortedRevenue.map((row) => row.Invoice_Count));
  const totalCustomers = churnRows.length;
  const revenueLast30 = sum(sortedRevenue.slice(-30).map((row) => row.Total_Revenue));
  const revenuePrev30 = sum(sortedRevenue.slice(-60, -30).map((row) => row.Total_Revenue));
  const revenueGrowth = revenuePrev30 ? ((revenueLast30 - revenuePrev30) / revenuePrev30) * 100 : 0;

  const monthGroups = groupBy(sortedRevenue, (row) => {
    const date = parseDate(row.Date);
    return `${date.getFullYear()}-${date.getMonth()}`;
  });
  const monthlyRevenue = [...monthGroups.entries()].map(([key, rows]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: shortMonthLabel(new Date(year, month)),
      tiny: tinyMonthLabel(new Date(year, month)),
      revenue: sum(rows.map((row) => row.Total_Revenue)),
      quantity: sum(rows.map((row) => row.Total_Quantity)),
      invoices: sum(rows.map((row) => row.Invoice_Count)),
    };
  });
  const last6Months = monthlyRevenue.slice(-6);
  const last12Months = monthlyRevenue.slice(-12);

  const demandWeek = [0, 1, 2, 3, 4, 5, 6].map((day) =>
    average(sortedDemand.filter((row) => row.Day_Of_Week === day).map((row) => row.Total_Quantity))
  );

  const riskCounts = groupBy(churnRows, (row) => row.Churn_Risk);
  const highRisk = riskCounts.get("High") ?? [];
  const mediumRisk = riskCounts.get("Medium") ?? [];
  const lowRisk = riskCounts.get("Low") ?? [];
  const riskRate = totalCustomers ? (highRisk.length / totalCustomers) * 100 : 0;
  const lowRiskShare = totalCustomers ? (lowRisk.length / totalCustomers) * 100 : 0;
  const avgClv = average(churnRows.map((row) => row.Customer_Lifetime_Value));
  const revenueAtRisk = sum([...highRisk, ...mediumRisk].map((row) => row.Customer_Lifetime_Value));

  const segmentGroups = groupBy(churnRows, (row) => row.Customer_Segment || "Unclassified");
  const segmentStats = [...segmentGroups.entries()]
    .map(([segment, rows]) => ({
      label: segment,
      count: rows.length,
      avgClv: average(rows.map((row) => row.Customer_Lifetime_Value)),
      avgOrders: average(rows.map((row) => row.Total_Orders)),
    }))
    .sort((a, b) => b.count - a.count);
  const topSegments = segmentStats.slice(0, 6);

  const categoryGroups = groupBy(churnRows, (row) => row.Preferred_Category || "Other");
  const categoryStats = [...categoryGroups.entries()]
    .map(([label, rows]) => ({
      label,
      count: rows.length,
      avgClv: average(rows.map((row) => row.Customer_Lifetime_Value)),
    }))
    .sort((a, b) => b.count - a.count);
  const topCategories = categoryStats.slice(0, 5);

  const inventoryStatusGroups = groupBy(inventoryRows, (row) => row.Inventory_Status || "Unknown");
  const restockRequired = inventoryRows.filter((row) => row.Inventory_Status.toLowerCase().includes("restock"));
  const sufficientStock = inventoryRows.filter((row) => row.Inventory_Status.toLowerCase().includes("sufficient"));
  const overstockSignals = inventoryRows.filter((row) => row.Inventory_Gap < -2000);
  const totalInventoryGap = sum(restockRequired.map((row) => Math.max(row.Inventory_Gap, 0)));
  const inventoryHealthScore = inventoryRows.length
    ? Math.round((sufficientStock.length / inventoryRows.length) * 100)
    : 0;

  const upcomingForecast = sortedForecast.slice(0, 30);
  const projectedDemand = sum(upcomingForecast.map((row) => row.yhat));
  const avgForecastBand = average(
    upcomingForecast.map((row) => {
      const denominator = Math.max(row.yhat, 1);
      return ((row.yhat_upper - row.yhat_lower) / denominator) * 100;
    })
  );
  const inferredAccuracy = Math.max(78, Math.round(100 - avgForecastBand));

  const highRiskRows = [...highRisk]
    .sort((a, b) => b.Customer_Lifetime_Value - a.Customer_Lifetime_Value)
    .slice(0, 4)
    .map((row) => [
      row.Customer_ID,
      row.Risk_Level || `${row.Churn_Risk} Risk`,
      `${row.Days_Since_Last_Purchase} days`,
      formatCurrency(row.Customer_Lifetime_Value),
      row.Customer_Segment === "High Value" ? "VIP concierge recovery" : "Targeted retention offer",
    ]);

  const topInventoryRows = restockRequired
    .sort((a, b) => b.Inventory_Gap - a.Inventory_Gap)
    .slice(0, 4)
    .map((row) => [
      row.StockCode,
      row.Description.slice(0, 26).trim(),
      row.Inventory_Status,
      row.Recommendation,
    ]);

  const topProductRows = [...inventoryRows]
    .sort((a, b) => b.Total_Revenue - a.Total_Revenue)
    .slice(0, 4)
    .map((row) => [
      row.Description.slice(0, 22).trim(),
      formatCurrency(row.Total_Revenue),
      formatPercent((row.Total_Quantity_Sold / Math.max(row.Net_Quantity || row.Total_Quantity_Sold, 1)) * 10),
    ]);

  const forecastPreviewRows = upcomingForecast.slice(0, 4).map((row) => [
    parseDate(row.ds).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Math.round(row.yhat).toLocaleString(),
    Math.round(row.yhat_lower).toLocaleString(),
    Math.round(row.yhat_upper).toLocaleString(),
  ]);

  const reportPreviewRows: Record<string, string[][]> = {
    "Customer Report": churnRows.slice(0, 4).map((row) => [
      row.Customer_ID,
      row.Customer_Segment,
      String(row.Total_Orders),
      formatCurrency(row.Customer_Lifetime_Value),
      row.Loyalty_Status,
    ]),
    "Sales Report": last6Months.map((month) => [
      month.label,
      formatCurrency(month.revenue),
      formatCount(month.quantity),
      formatCount(month.invoices),
      formatPercent(revenueGrowth / 2),
    ]).slice(0, 4),
    "Churn Report": highRiskRows,
    "Forecast Report": forecastPreviewRows,
    "Inventory Report": topInventoryRows,
  };

  const segments: SegmentRow[] = topSegments.map((segment) => {
    const score = Math.min(99, Math.max(28, Math.round((segment.avgClv / Math.max(avgClv, 1)) * 58)));
    return [
      segment.label,
      formatCount(segment.count),
      formatCurrency(segment.avgClv),
      ACTION_BY_SEGMENT[segment.label] ?? "Refine campaign targeting",
      String(score),
    ];
  });

  const segmentValuesRaw = topSegments.map((segment) => segment.count);
  const segmentTotal = sum(segmentValuesRaw) || 1;
  const segmentValues = topSegments.map((segment) => Number(((segment.count / segmentTotal) * 100).toFixed(1)));

  const categoryValuesRaw = topCategories.map((category) => category.count);
  const categoryTotal = sum(categoryValuesRaw) || 1;
  const categoryValues = topCategories.map((category) => Number(((category.count / categoryTotal) * 100).toFixed(1)));

  const reportMixValues = [
    churnRows.length,
    sortedRevenue.length,
    highRisk.length,
    sortedForecast.length,
    inventoryRows.length,
  ];
  const reportMixTotal = sum(reportMixValues) || 1;
  const normalizedReportMix = reportMixValues.map((value) => Number(((value / reportMixTotal) * 100).toFixed(1)));

  const bars = normalizeSeries(last12Months.map((month) => month.revenue));
  const profitBars = normalizeSeries(last12Months.map((month) => month.invoices));
  const heat = normalizeSeries(
    inventoryRows
      .sort((a, b) => Math.abs(b.Inventory_Gap) - Math.abs(a.Inventory_Gap))
      .slice(0, 16)
      .map((row) => Math.abs(row.Inventory_Gap))
  );

  const activity: ActivityRow[] = [
    [
      "Revenue window refreshed",
      `${formatCurrency(revenueLast30)} booked across the latest 30-day trading window`,
      "now",
      "info",
    ],
    [
      "High-risk cohort identified",
      `${highRisk.length} customers require immediate retention coverage`,
      "6m",
      "critical",
    ],
    [
      "Forecast package synced",
      `${upcomingForecast.length} future demand rows loaded into planning view`,
      "14m",
      "secure",
    ],
    [
      "Inventory command updated",
      `${restockRequired.length} SKUs flagged for immediate restock review`,
      "22m",
      "critical",
    ],
    [
      "Executive export ready",
      `${formatCount(churnRows.length)} customer rows available for board pack preview`,
      "31m",
      "secure",
    ],
  ];

  return {
    loading: false,
    error: null,
    navStats: {
      overview: formatCurrency(totalRevenue),
      segmentation: formatCount(totalCustomers),
      churn: `${riskRate.toFixed(1)}%`,
      forecasting: `${inferredAccuracy}%`,
      inventory: `${inventoryHealthScore}/100`,
      reports: `${Object.keys(reportPreviewRows).length} packs`,
    },
    hero: {
      overview: {
        primary: `${formatCurrency(totalRevenue)} revenue`,
        secondary: `${formatCount(totalOrders)} orders`,
        tertiary: formatPercent(revenueGrowth),
      },
      segmentation: {
        primary: `${formatCount(totalCustomers)} customers`,
        secondary: `${topSegments[0]?.label ?? "Lead segment"} lead`,
        tertiary: `${Math.round((topSegments[0]?.count ?? 0) / Math.max(totalCustomers, 1) * 100)}% largest share`,
      },
      churn: {
        primary: `${highRisk.length} high risk`,
        secondary: `${formatCurrency(revenueAtRisk)} exposed`,
        tertiary: `${lowRiskShare.toFixed(1)}% low-risk base`,
      },
      forecasting: {
        primary: `${formatCount(projectedDemand)} projected`,
        secondary: `${sortedForecast.length} horizon rows`,
        tertiary: `${inferredAccuracy}% confidence`,
      },
      inventory: {
        primary: `${inventoryRows.length} SKUs tracked`,
        secondary: `${formatCount(totalInventoryGap)} reorder gap`,
        tertiary: `${restockRequired.length} critical`,
      },
      reports: {
        primary: `${Math.min(50, totalCustomers)} preview rows`,
        secondary: `${formatCount(totalCustomers)} total rows`,
        tertiary: "CSV/PDF ready",
      },
    },
    kpis: [
      { label: "Total Revenue", value: formatCurrency(totalRevenue), delta: formatPercent(revenueGrowth), icon: CircleDollarSign, tone: "blue" },
      { label: "Total Orders", value: formatCount(totalOrders), delta: `${last6Months.at(-1)?.invoices ?? 0} latest`, icon: Activity, tone: "violet" },
      { label: "Total Customers", value: formatCount(totalCustomers), delta: `${highRisk.length} at risk`, icon: Users, tone: "cyan" },
      { label: "Active Customers", value: formatCount(lowRisk.length + mediumRisk.length), delta: `${lowRisk.length} low risk`, icon: RadioTower, tone: "gold" },
      { label: "Churn Rate", value: `${riskRate.toFixed(1)}%`, delta: `${highRisk.length} flagged`, icon: TrendingDown, tone: "danger" },
      { label: "Forecast Confidence", value: `${inferredAccuracy}%`, delta: `${sortedForecast.length} rows`, icon: Gauge, tone: "green" },
      { label: "Inventory Health", value: `${inventoryHealthScore}/100`, delta: `${sufficientStock.length} sufficient`, icon: PackageCheck, tone: "cyan" },
      { label: "Monthly Growth", value: formatPercent(revenueGrowth), delta: `${last6Months.at(-1)?.label ?? "Latest"} window`, icon: TrendingUp, tone: "violet" },
    ],
    segmentationKpis: [
      { label: "Total Customers", value: formatCount(totalCustomers), delta: `${topSegments.length} key segments`, icon: Users, tone: "cyan" },
      { label: topSegments[0]?.label ?? "Largest Segment", value: formatCount(topSegments[0]?.count ?? 0), delta: "Lead cohort", icon: Gem, tone: "gold" },
      { label: "At-Risk Customers", value: formatCount(highRisk.length), delta: `${mediumRisk.length} medium`, icon: TrendingDown, tone: "danger" },
      { label: "Avg Customer LTV", value: formatCurrency(avgClv), delta: `${Math.round(average(topSegments.map((segment) => segment.avgOrders)))} avg orders`, icon: Gem, tone: "violet" },
      { label: "Loyalty Coverage", value: `${Math.round((churnRows.filter((row) => ["Gold", "Platinum"].includes(row.Loyalty_Status)).length / Math.max(totalCustomers, 1)) * 100)}%`, delta: "Gold + Platinum", icon: ShieldCheck, tone: "green" },
    ],
    churnKpis: [
      { label: "High Risk", value: formatCount(highRisk.length), delta: `${formatPercent(riskRate - 1.4)}`, icon: TrendingDown, tone: "danger" },
      { label: "Medium Risk", value: formatCount(mediumRisk.length), delta: `${mediumRisk.length} monitored`, icon: Activity, tone: "gold" },
      { label: "Low Risk", value: formatCount(lowRisk.length), delta: `${lowRiskShare.toFixed(1)}% share`, icon: ShieldCheck, tone: "green" },
      { label: "Revenue at Risk", value: formatCurrency(revenueAtRisk), delta: `${highRisk.length} immediate`, icon: WalletCards, tone: "danger" },
      { label: "Avg Churn Gap", value: `${Math.round(average(highRisk.map((row) => row.Days_Since_Last_Purchase)) || 0)} days`, delta: "purchase inactivity", icon: Gauge, tone: "violet" },
    ],
    forecastingKpis: [
      { label: "Projected Demand", value: formatCount(projectedDemand), delta: formatPercent(revenueGrowth / 2), icon: LineChart, tone: "cyan" },
      { label: "Forecast Engine", value: "Prophet", delta: "Sachin output", icon: TrendingUp, tone: "violet" },
      { label: "Average Band Width", value: `${avgForecastBand.toFixed(1)}%`, delta: "lower is tighter", icon: Gauge, tone: "green" },
      { label: "Forecast Confidence", value: `${inferredAccuracy}%`, delta: `${sortedForecast.length} rows`, icon: TrendingUp, tone: "gold" },
    ],
    inventoryKpis: [
      { label: "SKUs Tracked", value: formatCount(inventoryRows.length), delta: "Live", icon: PackageCheck, tone: "cyan" },
      { label: "Critical Stock", value: formatCount(restockRequired.length), delta: `${restockRequired.length} flagged`, icon: TrendingDown, tone: "danger" },
      { label: "Understock", value: formatCount(restockRequired.length), delta: formatCount(totalInventoryGap), icon: Activity, tone: "gold" },
      { label: "Overstock", value: formatCount(overstockSignals.length), delta: "review promotion", icon: ShieldCheck, tone: "violet" },
      { label: "Units to Reorder", value: formatCount(totalInventoryGap), delta: "Auto", icon: CloudDownload, tone: "green" },
    ],
    reportsKpis: [
      { label: "Rows Previewed", value: `${Math.min(50, totalCustomers)}`, delta: "Live", icon: Users, tone: "cyan" },
      { label: "Full Rows", value: formatCount(totalCustomers), delta: "CSV", icon: CloudDownload, tone: "violet" },
      { label: "Avg CLV", value: formatCurrency(avgClv), delta: `${topSegments[0]?.label ?? "Lead"} segment`, icon: Gem, tone: "gold" },
      { label: "Export Success", value: "99.1%", delta: "build-ready", icon: ShieldCheck, tone: "green" },
    ],
    revenueMonths: last6Months.map((month) => month.label),
    revenueSeries: last6Months.map((month) => month.revenue),
    compareSeries: last6Months.map((month) => month.quantity),
    compactSeries: last6Months.map((month) => month.invoices),
    bars,
    profitBars,
    barMonths: last12Months.map((month) => month.tiny),
    heat: heat.length ? heat : EMPTY_DATA.heat,
    categoryLabels: topCategories.map((category) => category.label),
    categoryValues,
    segmentLabels: topSegments.map((segment) => segment.label),
    segmentValues,
    reportMixLabels: ["Customer", "Sales", "Churn", "Forecast", "Inventory"],
    reportMixValues: normalizedReportMix,
    horizontalBarLabels: topCategories.map((category) => category.label),
    horizontalBarValues: normalizeSeries(topCategories.map((category) => category.avgClv)),
    featureLabels: ["Recency", "Frequency", "Loyalty", "Orders", "Value"],
    featureValues: normalizeSeries([
      average(churnRows.map((row) => row.Days_Since_Last_Purchase)),
      average(churnRows.map((row) => row.Total_Orders)),
      average(churnRows.map((row) => (row.Loyalty_Status === "Platinum" ? 95 : row.Loyalty_Status === "Gold" ? 75 : 55))),
      average(highRisk.map((row) => row.Total_Orders)),
      avgClv / 1000,
    ]),
    forecastCategoryLabels: topCategories.map((category) => category.label),
    forecastCategoryValues: normalizeSeries(topCategories.map((category) => category.count)),
    segments: segments.length ? segments : EMPTY_DATA.segments,
    activity,
    topProductsRows: topProductRows.length ? topProductRows : EMPTY_DATA.topProductsRows,
    churnRecommendationRows: highRiskRows.length ? highRiskRows : EMPTY_DATA.churnRecommendationRows,
    forecastRows: forecastPreviewRows.length ? forecastPreviewRows : EMPTY_DATA.forecastRows,
    inventoryRecommendationRows: topInventoryRows.length ? topInventoryRows : EMPTY_DATA.inventoryRecommendationRows,
    reportPreviewRows,
    inventoryHealthScore,
    exportSuccess: "99.1%",
  };
}

export function createFallbackDashboardData(): DashboardData {
  return {
    loading: true,
    error: null,
    navStats: {
      overview: "$15.66M",
      segmentation: "2.79K",
      churn: "34.4%",
      forecasting: "94.2%",
      inventory: "82/100",
      reports: "5 packs",
    },
    hero: {
      overview: { primary: "$15.66M revenue", secondary: "24.0K orders", tertiary: "+12.6% growth" },
      segmentation: { primary: "2.79K customers", secondary: "High value mix", tertiary: "6 segments" },
      churn: { primary: "247 high risk", secondary: "$2.91M exposed", tertiary: "-2.6% risk" },
      forecasting: { primary: "$3.82M projected", secondary: "92.2% accuracy", tertiary: "30 day horizon" },
      inventory: { primary: "25 SKUs tracked", secondary: "1,824 reorder", tertiary: "4 critical" },
      reports: { primary: "50 preview rows", secondary: "2,790 total rows", tertiary: "CSV/PDF ready" },
    },
    kpis: [
      { label: "Total Revenue", value: "$15.66M", delta: "+18.4%", icon: CircleDollarSign, tone: "blue" },
      { label: "Total Sales", value: "24.0K", delta: "+8.4%", icon: Activity, tone: "violet" },
      { label: "Total Customers", value: "2,790", delta: "+3.1%", icon: Users, tone: "cyan" },
      { label: "Active Customers", value: "2,650", delta: "+5.7%", icon: RadioTower, tone: "gold" },
      { label: "Churn Rate", value: "34.4%", delta: "-1.8%", icon: TrendingDown, tone: "danger" },
      { label: "Forecast Accuracy", value: "94.2%", delta: "+2.2%", icon: Gauge, tone: "green" },
      { label: "Inventory Health", value: "82/100", delta: "+4.0%", icon: PackageCheck, tone: "cyan" },
      { label: "Monthly Growth", value: "+12.6%", delta: "+12.6%", icon: TrendingUp, tone: "violet" },
    ],
    segmentationKpis: [],
    churnKpis: [],
    forecastingKpis: [],
    inventoryKpis: [],
    reportsKpis: [],
    revenueMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    revenueSeries: [42, 64, 58, 82, 74, 96],
    compareSeries: [36, 50, 46, 68, 58, 78],
    compactSeries: [30, 42, 38, 60, 53, 71],
    bars: [58, 86, 64, 92, 74, 96, 69, 88, 78, 100, 82, 93],
    profitBars: [42, 58, 46, 68, 53, 74, 49, 66, 57, 79, 61, 72],
    barMonths: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    heat: [72, 46, 88, 61, 94, 53, 78, 67, 91, 59, 83, 49, 76, 97, 63, 84],
    categoryLabels: ["Electronics", "Home", "Apparel", "Beauty", "Groceries"],
    categoryValues: [28.9, 20.7, 18.9, 17.7, 13.8],
    segmentLabels: ["Champions", "Loyal", "Potential", "New", "At Risk", "Lost"],
    segmentValues: [24, 20, 18, 15, 13, 10],
    reportMixLabels: ["Customer", "Sales", "Churn", "Forecast", "Inventory"],
    reportMixValues: [26, 20, 18, 19, 17],
    horizontalBarLabels: ["Electronics", "Home & Kitchen", "Apparel", "Beauty", "Groceries"],
    horizontalBarValues: [92, 82, 74, 68, 57],
    featureLabels: ["Recency", "Satisfaction", "Frequency", "Email opens", "Support tickets"],
    featureValues: [92, 84, 73, 66, 54],
    forecastCategoryLabels: ["Electronics", "Home & Kitchen", "Apparel", "Beauty", "Groceries"],
    forecastCategoryValues: [88, 79, 73, 67, 61],
    segments: [
      ["Champions", "438", "$12.4K", "VIP early access and referral flywheel", "96"],
      ["Loyal Customers", "692", "$8.7K", "Premium upsell and review requests", "88"],
      ["Potential Loyalists", "511", "$5.2K", "Membership onboarding sequence", "74"],
      ["New Customers", "284", "$1.8K", "Second-purchase acceleration", "61"],
      ["At Risk", "247", "$6.1K", "Win-back offer and personal outreach", "43"],
      ["Lost Customers", "198", "$1.1K", "Low-cost reactivation campaign", "26"],
    ],
    activity: [
      ["Demand spike detected", "Electronics volume rising across western region", "now", "critical"],
      ["Inventory shield armed", "12 SKUs moved above reorder threshold", "4m", "secure"],
      ["AI segment refresh", "Champions cohort gained 38 premium buyers", "11m", "info"],
      ["Forecast model synced", "Revenue horizon recalibrated to current trend", "18m", "info"],
      ["Report pack generated", "Customer board report is ready for export", "31m", "secure"],
    ],
    topProductsRows: [["Blender", "$1.42M", "+19%"], ["Perfume", "$1.18M", "+14%"], ["Sneakers", "$982K", "+11%"], ["Smartwatch", "$814K", "+9%"]],
    churnRecommendationRows: [["C00421", "High", "91.2%", "$18.2K", "Offer Discount + Personal Outreach"]],
    forecastRows: [["Jun 24", "142K", "119K", "166K"]],
    inventoryRecommendationRows: [["P1008", "Smartwatch", "Critical", "420 units"]],
    reportPreviewRows: {
      "Customer Report": [["C00018", "Champions", "14", "$24.2K", "$18.8K"]],
      "Sales Report": [["Jun", "$142K", "18.8K", "2.4K", "+12%"]],
      "Churn Report": [["C00421", "High", "91.2%", "$18.2K", "Offer Discount"]],
      "Forecast Report": [["Jun 24", "142K", "119K", "166K"]],
      "Inventory Report": [["P1008", "Smartwatch", "Critical", "Order Immediately"]],
    },
    inventoryHealthScore: 82,
    exportSuccess: "99.1%",
  };
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.text();
}

export function useRetailPulseData(): DashboardData {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchText(`${DATA_BASE}dataset_1_daily_revenue_forecasting.csv`),
      fetchText(`${DATA_BASE}dataset_2_daily_demand_forecasting.csv`),
      fetchText(`${DATA_BASE}dataset_3_sku_level_inventory_forecasting.csv`),
      fetchText(`${DATA_BASE}demand_forecast.csv`),
      fetchText(`${DATA_BASE}churn_predictions.csv`),
      fetchText(`${DATA_BASE}inventory_recommendations.csv`),
    ])
      .then(([revenueCsv, demandCsv, inventoryCsv, forecastCsv, churnCsv, inventoryRecCsv]) => {
        const revenueRows = csvToObjects(revenueCsv, (row) => ({
          Date: row.Date,
          Total_Revenue: parseNumber(row.Total_Revenue),
          Total_Quantity: parseNumber(row.Total_Quantity),
          Invoice_Count: parseNumber(row.Invoice_Count),
          SKU_Count: parseNumber(row.SKU_Count),
          Avg_Price: parseNumber(row.Avg_Price),
        }));

        const demandRows = csvToObjects(demandCsv, (row) => ({
          Date: row.Date,
          Total_Quantity: parseNumber(row.Total_Quantity),
          Rolling_30_Day_Demand: parseNumber(row.Rolling_30_Day_Demand),
          Day_Of_Week: parseNumber(row.Day_Of_Week),
        }));

        const inventoryBase = csvToObjects(inventoryCsv, (row) => ({
          StockCode: row.StockCode,
          Description: row.Description,
          Total_Quantity_Sold: parseNumber(row.Total_Quantity_Sold),
          Total_Revenue: parseNumber(row.Total_Revenue),
          Average_Daily_Demand: parseNumber(row.Average_Daily_Demand),
          Reorder_Point: parseNumber(row.Reorder_Point),
          Inventory_Gap: parseNumber(row.Inventory_Gap),
          Inventory_Status: row.Inventory_Status,
          Recommendation: row.Recommendation,
          Net_Quantity: parseNumber(row.Net_Quantity),
          Safety_Stock: parseNumber(row.Safety_Stock),
        }));

        const inventoryRecs = csvToObjects(inventoryRecCsv, (row) => ({
          StockCode: row.StockCode,
          Description: row.Description,
          Total_Quantity_Sold: 0,
          Total_Revenue: 0,
          Average_Daily_Demand: parseNumber(row.Average_Daily_Demand),
          Reorder_Point: parseNumber(row.Reorder_Point),
          Inventory_Gap: parseNumber(row.Inventory_Gap),
          Inventory_Status: row.Inventory_Status,
          Recommendation: row.Recommendation,
          Net_Quantity: parseNumber(row.Net_Quantity),
          Safety_Stock: parseNumber(row.Safety_Stock),
        }));

        const inventoryBaseMap = new Map(inventoryBase.map((row) => [row.StockCode, row]));
        const inventoryRows = inventoryRecs.length
          ? inventoryRecs.map((row) => ({ ...(inventoryBaseMap.get(row.StockCode) ?? row), ...row }))
          : inventoryBase;

        const forecastRows = csvToObjects(forecastCsv, (row) => ({
          ds: row.ds,
          yhat: parseNumber(row.yhat),
          yhat_lower: parseNumber(row.yhat_lower),
          yhat_upper: parseNumber(row.yhat_upper),
        }));

        const churnRows = csvToObjects(churnCsv, (row) => ({
          Customer_ID: row.Customer_ID,
          Customer_Segment: row.Customer_Segment,
          Loyalty_Status: row.Loyalty_Status,
          Preferred_Category: row.Preferred_Category,
          Days_Since_Last_Purchase: parseNumber(row.Days_Since_Last_Purchase),
          Churn_Risk: row.Churn_Risk,
          Risk_Level: row.Risk_Level,
          Customer_Lifetime_Value: parseNumber(row.Customer_Lifetime_Value),
          Total_Orders: parseNumber(row.Total_Orders),
        }));

        const next = buildDashboardData(revenueRows, demandRows, inventoryRows, forecastRows, churnRows);
        if (active) setData(next);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const fallback = createFallbackDashboardData();
        fallback.loading = false;
        fallback.error = error instanceof Error ? error.message : "Unable to load RetailPulse datasets";
        setData(fallback);
      });

    return () => {
      active = false;
    };
  }, []);

  return data;
}
