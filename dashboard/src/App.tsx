import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useReducedMotion, useScroll } from "framer-motion";
import { TextEffect } from "./components/core/text-effect";
import { InView } from "./components/core/in-view";
import { Magnetic } from "./components/core/magnetic";
import { AnimatedGroup } from "./components/core/animated-group";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CloudDownload,
  Command,
  Crown,
  Database,
  Eye,
  Film,
  Filter,
  Gauge,
  Gem,
  Layers3,
  LineChart,
  Lock,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  PackageCheck,
  PlayCircle,
  RadioTower,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Table2,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { lazy, Suspense, type CSSProperties, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { createFallbackDashboardData, useRetailPulseData } from "./data/retailpulse-data";
import {
  AnimatedValue,
  ExecutiveBriefing,
  LivingOSProvider,
  OperatingDock,
  useLivingOS,
} from "./living-os";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ThemeMode = "dark" | "light";
type PageId = "overview" | "segmentation" | "churn" | "forecasting" | "inventory" | "reports" | "media" | "settings";

const DonutIntroPlayer = lazy(() =>
  import("./chart-animations").then((module) => ({ default: module.DonutIntroPlayer }))
);
const DataStoryPlayer = lazy(() =>
  import("./chart-animations").then((module) => ({ default: module.DataStoryPlayer }))
);
const ModuleStoryPlayer = lazy(() =>
  import("./chart-animations").then((module) => ({ default: module.ModuleStoryPlayer }))
);
const VolumeBars3D = lazy(() => import("./components/volume-bars-3d"));

type NavItem = {
  id: PageId;
  label: string;
  kicker: string;
  icon: typeof BarChart3;
  stat: string;
};

let dashboardDataState = createFallbackDashboardData();

let navItems: NavItem[] = [
  { id: "overview", label: "Executive Overview", kicker: "Board pulse", icon: BarChart3, stat: "$15.66M" },
  { id: "segmentation", label: "Customer Segmentation", kicker: "RFM + KMeans", icon: Users, stat: "2.79K" },
  { id: "churn", label: "Churn Prediction", kicker: "Retention risk", icon: TrendingDown, stat: "34.4%" },
  { id: "forecasting", label: "Demand Forecasting", kicker: "Prophet horizon", icon: LineChart, stat: "94.2%" },
  { id: "inventory", label: "Inventory Optimization", kicker: "Stock policy", icon: PackageCheck, stat: "82/100" },
  { id: "reports", label: "Analytics & Reports", kicker: "Export center", icon: Table2, stat: "5 packs" },
  { id: "media", label: "Media Studio", kicker: "Video stories", icon: Film, stat: "Remotion" },
  { id: "settings", label: "Settings", kicker: "Models + controls", icon: Settings, stat: "Live" },
];

// Canonical story-type list â€” shared between the hero badge row and MediaStudioPage.
const MEDIA_STORY_TYPES = [
  "Executive Briefing",
  "Customer Segment",
  "Churn Intelligence",
  "Demand Forecast",
  "Inventory Command",
  "Analytics Report",
  "Platform Intelligence",
  "Master Reel",
] as const;
type MediaStoryType = (typeof MEDIA_STORY_TYPES)[number];

let pageMeta: Record<PageId, { eyebrow: string; title: string; summary: string; primary: string; secondary: string; tertiary: string }> = {
  overview: {
    eyebrow: "Retail Intelligence Command",
    title: "Revenue, customer, and operations control center.",
    summary: "A dense executive view combining revenue momentum, active demand, segment health, category share, and model-driven recommendations.",
    primary: "$15.66M revenue",
    secondary: "24.0K orders",
    tertiary: "+12.6% growth",
  },
  segmentation: {
    eyebrow: "Customer Intelligence",
    title: "RFM cohorts, loyalty signals, and next-best actions.",
    summary: "Track segment movement, customer lifetime value, KMeans clusters, and tactical playbooks for retention and monetization.",
    primary: "438 champions",
    secondary: "$8.4K avg LTV",
    tertiary: "11.8 RFM",
  },
  churn: {
    eyebrow: "Retention Operations",
    title: "Predict churn before revenue leaves the system.",
    summary: "Expose high-risk customers, churn drivers, revenue-at-risk, and immediate intervention recommendations in one response cockpit.",
    primary: "247 high risk",
    secondary: "$2.91M exposed",
    tertiary: "-2.6% risk",
  },
  forecasting: {
    eyebrow: "Demand Simulation",
    title: "Forecast revenue, demand, and seasonal pressure.",
    summary: "Scenario controls, confidence bands, seasonality, and granular forecast tables for planning inventory and marketing moves.",
    primary: "$3.82M projected",
    secondary: "92.2% accuracy",
    tertiary: "30 day horizon",
  },
  inventory: {
    eyebrow: "Stock Command",
    title: "Keep SKUs balanced across reorder, overstock, and risk.",
    summary: "Monitor stock health, critical inventory, heatmaps, alerts, and reorder guidance for operational efficiency.",
    primary: "25 SKUs tracked",
    secondary: "1,824 reorder",
    tertiary: "4 critical",
  },
  reports: {
    eyebrow: "Executive Reporting",
    title: "Board-ready exports and live report previews.",
    summary: "Create customer, sales, churn, forecast, and inventory packs with structured tables and export-ready data modules.",
    primary: "50 preview rows",
    secondary: "2,790 total rows",
    tertiary: "CSV/PDF ready",
  },
  media: {
    eyebrow: "Remotion Media Studio",
    title: "Turn live analytics into cinematic data stories.",
    summary: "Preview executive video briefings, chart stories, and operational replays using the current RetailPulse visual system and data signals.",
    primary: `${MEDIA_STORY_TYPES.length} story scenes`,
    secondary: "16:9 preview",
    tertiary: "MP4-ready flow",
  },
  settings: {
    eyebrow: "Platform Configuration",
    title: "Control models, themes, notifications, and teams.",
    summary: "Manage RetailPulse intelligence settings, forecast defaults, theme system, alert rules, and access controls.",
    primary: "Hybrid model",
    secondary: "95% service level",
    tertiary: "Alerts enabled",
  },
};

let kpis = [
  { label: "Total Revenue", value: "$15.66M", delta: "+18.4%", icon: CircleDollarSign, tone: "blue" },
  { label: "Total Sales", value: "24.0K", delta: "+8.4%", icon: Activity, tone: "violet" },
  { label: "Total Customers", value: "2,790", delta: "+3.1%", icon: Users, tone: "cyan" },
  { label: "Active Customers", value: "2,650", delta: "+5.7%", icon: RadioTower, tone: "gold" },
  { label: "Churn Rate", value: "34.4%", delta: "-1.8%", icon: TrendingDown, tone: "danger" },
  { label: "Forecast Accuracy", value: "94.2%", delta: "+2.2%", icon: Gauge, tone: "green" },
  { label: "Inventory Health", value: "82/100", delta: "+4.0%", icon: PackageCheck, tone: "cyan" },
  { label: "Monthly Growth", value: "+12.6%", delta: "+12.6%", icon: TrendingUp, tone: "violet" },
];

let segments = [
  ["Champions", "438", "$12.4K", "VIP early access and referral flywheel", "96"],
  ["Loyal Customers", "692", "$8.7K", "Premium upsell and review requests", "88"],
  ["Potential Loyalists", "511", "$5.2K", "Membership onboarding sequence", "74"],
  ["New Customers", "284", "$1.8K", "Second-purchase acceleration", "61"],
  ["At Risk", "247", "$6.1K", "Win-back offer and personal outreach", "43"],
  ["Lost Customers", "198", "$1.1K", "Low-cost reactivation campaign", "26"],
];

let activity = [
  ["Demand spike detected", "Electronics volume rising across western region", "now", "critical"],
  ["Inventory shield armed", "12 SKUs moved above reorder threshold", "4m", "secure"],
  ["AI segment refresh", "Champions cohort gained 38 premium buyers", "11m", "info"],
  ["Forecast model synced", "Revenue horizon recalibrated to current trend", "18m", "info"],
  ["Report pack generated", "Customer board report is ready for export", "31m", "secure"],
];

let bars = [58, 86, 64, 92, 74, 96, 69, 88, 78, 100, 82, 93];
let profitBars = [42, 58, 46, 68, 53, 74, 49, 66, 57, 79, 61, 72];
let heat = [72, 46, 88, 61, 94, 53, 78, 67, 91, 59, 83, 49, 76, 97, 63, 84];
let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
let barMonths = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function compactMetricLabel(value: string, suffixes: string[]) {
  let next = value;
  suffixes.forEach((suffix) => {
    next = next.replace(new RegExp(`\\s+${suffix}$`, "i"), "");
  });
  return next.trim();
}

function buildNavItems() {
  return [
    {
      id: "overview",
      label: "Executive Overview",
      kicker: "Board pulse",
      icon: BarChart3,
      stat: compactMetricLabel(dashboardDataState.hero.overview.primary, ["revenue"]),
    },
    {
      id: "segmentation",
      label: "Customer Segmentation",
      kicker: "RFM + KMeans",
      icon: Users,
      stat: compactMetricLabel(dashboardDataState.hero.segmentation.primary, ["profiled", "customers"]),
    },
    { id: "churn", label: "Churn Prediction", kicker: "Retention risk", icon: TrendingDown, stat: dashboardDataState.navStats.churn },
    { id: "forecasting", label: "Demand Forecasting", kicker: "Prophet horizon", icon: LineChart, stat: dashboardDataState.navStats.forecasting },
    { id: "inventory", label: "Inventory Optimization", kicker: "Stock policy", icon: PackageCheck, stat: dashboardDataState.navStats.inventory },
    { id: "reports", label: "Analytics & Reports", kicker: "Export center", icon: Table2, stat: dashboardDataState.navStats.reports },
    { id: "media", label: "Media Studio", kicker: "Video stories", icon: Film, stat: "Remotion" },
    { id: "settings", label: "Settings", kicker: "Models + controls", icon: Settings, stat: dashboardDataState.loading ? "Loading" : "Live" },
  ] satisfies NavItem[];
}

function buildPageMeta(): typeof pageMeta {
  return {
    overview: {
      eyebrow: "Retail Intelligence Command",
      title: "Revenue, customer, and operations control center.",
      summary: "A dense executive view combining revenue momentum, active demand, segment health, category share, and model-driven recommendations.",
      primary: dashboardDataState.hero.overview.primary,
      secondary: dashboardDataState.hero.overview.secondary,
      tertiary: dashboardDataState.hero.overview.tertiary,
    },
    segmentation: {
      eyebrow: "Customer Intelligence",
      title: "RFM cohorts, loyalty signals, and next-best actions.",
      summary: "Track segment movement, customer lifetime value, KMeans clusters, and tactical playbooks for retention and monetization.",
      primary: dashboardDataState.hero.segmentation.primary,
      secondary: dashboardDataState.hero.segmentation.secondary,
      tertiary: dashboardDataState.hero.segmentation.tertiary,
    },
    churn: {
      eyebrow: "Retention Operations",
      title: "Predict churn before revenue leaves the system.",
      summary: "Expose high-risk customers, churn drivers, revenue-at-risk, and immediate intervention recommendations in one response cockpit.",
      primary: dashboardDataState.hero.churn.primary,
      secondary: dashboardDataState.hero.churn.secondary,
      tertiary: dashboardDataState.hero.churn.tertiary,
    },
    forecasting: {
      eyebrow: "Demand Simulation",
      title: "Forecast revenue, demand, and seasonal pressure.",
      summary: "Scenario controls, confidence bands, seasonality, and granular forecast tables for planning inventory and marketing moves.",
      primary: dashboardDataState.hero.forecasting.primary,
      secondary: dashboardDataState.hero.forecasting.secondary,
      tertiary: dashboardDataState.hero.forecasting.tertiary,
    },
    inventory: {
      eyebrow: "Stock Command",
      title: "Keep SKUs balanced across reorder, overstock, and risk.",
      summary: "Monitor stock health, critical inventory, heatmaps, alerts, and reorder guidance for operational efficiency.",
      primary: dashboardDataState.hero.inventory.primary,
      secondary: dashboardDataState.hero.inventory.secondary,
      tertiary: dashboardDataState.hero.inventory.tertiary,
    },
    reports: {
      eyebrow: "Executive Reporting",
      title: "Board-ready exports and live report previews.",
      summary: "Create customer, sales, churn, forecast, and inventory packs with structured tables and export-ready data modules.",
      primary: dashboardDataState.hero.reports.primary,
      secondary: dashboardDataState.hero.reports.secondary,
      tertiary: dashboardDataState.hero.reports.tertiary,
    },
    media: {
      eyebrow: "Remotion Media Studio",
      title: "Turn live analytics into cinematic data stories.",
      summary: "Preview executive video briefings, chart stories, and operational replays using the current RetailPulse visual system and data signals.",
      primary: `${MEDIA_STORY_TYPES.length} story scenes`,
      secondary: dashboardDataState.hero.reports.primary,
      tertiary: dashboardDataState.hero.reports.tertiary,
    },
    settings: {
      eyebrow: "Platform Configuration",
      title: "Control models, themes, notifications, and teams.",
      summary: "Manage RetailPulse intelligence settings, forecast defaults, theme system, alert rules, and access controls.",
      primary: "Hybrid model",
      secondary: "95% service level",
      tertiary: "Alerts enabled",
    },
  };
}

// â”€â”€ FEATURE 1: MAGNETIC CURSOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useMagneticCursor(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const MAG_RADIUS = 88;
    const STRENGTH = 0.42;
    let rafId: number | null = null;
    let lastX = 0, lastY = 0;
    let els: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('.magnetic'));
    const obs = new MutationObserver(() => {
      els = Array.from(document.querySelectorAll<HTMLElement>('.magnetic'));
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const process = () => {
      rafId = null;
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = lastX - cx;
        const dy = lastY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAG_RADIUS) {
          const pull = (1 - dist / MAG_RADIUS) * STRENGTH;
          el.style.setProperty('--mag-x', `${(dx * pull).toFixed(2)}px`);
          el.style.setProperty('--mag-y', `${(dy * pull).toFixed(2)}px`);
        } else {
          el.style.setProperty('--mag-x', '0px');
          el.style.setProperty('--mag-y', '0px');
        }
      }
    };
    const handle = (e: MouseEvent) => {
      lastX = e.clientX; lastY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(process);
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handle);
      obs.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}

// â”€â”€ FEATURE 3: DEPTH-OF-FIELD FOCUS PLANE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useDepthOfField(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let rafId: number | null = null;
    let panels: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
    const obs = new MutationObserver(() => {
      panels = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const process = () => {
      rafId = null;
      const vc = window.innerHeight / 2;
      const max = window.innerHeight * 0.65;
      for (const el of panels) {
        const rect = el.getBoundingClientRect();
        const ec = rect.top + rect.height / 2;
        const dist = Math.abs(ec - vc);
        const opacity = Math.max(0.62, 1 - (dist / max) * 0.38);
        el.style.setProperty('--dof-opacity', `${opacity.toFixed(3)}`);
      }
    };
    const handle = () => { if (rafId === null) rafId = requestAnimationFrame(process); };
    window.addEventListener('scroll', handle, { passive: true });
    process();
    return () => {
      window.removeEventListener('scroll', handle);
      obs.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}

// â”€â”€ FEATURE 2: INK/WATERCOLOR PAGE REVEAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InkReveal({ trigger }: { trigger: number }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(trigger);
  useEffect(() => {
    if (trigger === prevRef.current) return;
    prevRef.current = trigger;
    const el = overlayRef.current;
    if (!el) return;
    el.classList.remove('ink-active');
    void el.offsetWidth;
    el.classList.add('ink-active');
    const t = window.setTimeout(() => el.classList.remove('ink-active'), 920);
    return () => window.clearTimeout(t);
  }, [trigger]);
  return createPortal(
    <>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="ink-warp" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.022 0.016" numOctaves="4" seed="7" result="turbOut" />
            <feDisplacementMap in="SourceGraphic" in2="turbOut" scale="90" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div ref={overlayRef} className="ink-reveal" aria-hidden="true" />
    </>,
    document.body
  );
}

// â”€â”€ FEATURE 4: FORCE-DIRECTED SEGMENT GRAPH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ForceGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useLivingOS();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 300;
    const H = canvas.offsetHeight || 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const nodes = [
      { label: 'Champions', r: 22, x: W * .5,  y: H * .33, vx: 0, vy: 0, color: '#fbbf24' },
      { label: 'Loyal',     r: 18, x: W * .28, y: H * .5,  vx: 0, vy: 0, color: '#a855f7' },
      { label: 'Potential', r: 16, x: W * .72, y: H * .5,  vx: 0, vy: 0, color: '#22d3ee' },
      { label: 'At Risk',   r: 14, x: W * .2,  y: H * .68, vx: 0, vy: 0, color: '#f472b6' },
      { label: 'New',       r: 12, x: W * .5,  y: H * .72, vx: 0, vy: 0, color: '#6366f1' },
      { label: 'Lost',      r: 10, x: W * .82, y: H * .68, vx: 0, vy: 0, color: '#ef4444' },
    ];
    const links = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,5]];
    const K_REPEL = 4400;
    const K_SPRING = 0.038;
    const REST = 118;
    const DAMP = 0.87;
    const CX = W * .5;
    const CY = H * .5;
    const K_CENTER = 0.009;
    let raf: number;

    const tick = () => {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.vx += (CX - a.x) * K_CENTER;
        a.vy += (CY - a.y) * K_CENTER;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x; const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy + 1;
          const f = K_REPEL / d2;
          a.vx += dx * f; a.vy += dy * f;
          b.vx -= dx * f; b.vy -= dy * f;
        }
      }
      for (const [ai, bi] of links) {
        const a = nodes[ai]; const b = nodes[bi];
        const dx = b.x - a.x; const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - REST) * K_SPRING;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
      for (const n of nodes) {
        n.vx *= DAMP; n.vy *= DAMP;
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x + (reducedMotion ? 0 : n.vx)));
        n.y = Math.max(n.r + 4, Math.min(H - n.r - 4, n.y + (reducedMotion ? 0 : n.vy)));
      }
      ctx.clearRect(0, 0, W, H);
      for (const [ai, bi] of links) {
        const a = nodes[ai]; const b = nodes[bi];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(168,85,247,0.22)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      for (const n of nodes) {
        const g = ctx.createRadialGradient(n.x - n.r * .3, n.y - n.r * .3, 0, n.x, n.y, n.r * 1.7);
        g.addColorStop(0, n.color + 'cc');
        g.addColorStop(1, n.color + '22');
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = n.color + '77'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(8, n.r * 0.52)}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, n.y);
      }
      if (!reducedMotion) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);
  return <canvas ref={canvasRef} className="force-graph-canvas" aria-label="Customer segment force graph" />;
}

// â”€â”€ FEATURE 5: VORONOI TERRITORY MAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VoronoiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useLivingOS();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 300;
    const H = canvas.offsetHeight || 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const seeds = [
      { x: W*.18, y: H*.25, dx: .22, dy: .14, color: '#a855f7' },
      { x: W*.72, y: H*.2,  dx: -.18, dy: .19, color: '#22d3ee' },
      { x: W*.5,  y: H*.54, dx: .12, dy: -.2, color: '#f472b6' },
      { x: W*.14, y: H*.72, dx: .24, dy: -.11, color: '#6366f1' },
      { x: W*.82, y: H*.65, dx: -.19, dy: -.17, color: '#fbbf24' },
      { x: W*.55, y: H*.88, dx: .14, dy: .09, color: '#34d399' },
    ];
    let raf: number;
    const tick = () => {
      if (!reducedMotion) {
        for (const s of seeds) {
          s.x += s.dx; s.y += s.dy;
          if (s.x < 0 || s.x > W) s.dx *= -1;
          if (s.y < 0 || s.y > H) s.dy *= -1;
        }
      }
      ctx.clearRect(0, 0, W, H);
      const dim = Math.min(W, H);
      for (const s of seeds) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, dim * .58);
        g.addColorStop(0, s.color + '55');
        g.addColorStop(.45, s.color + '1a');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      for (let i = 0; i < seeds.length; i++) {
        for (let j = i + 1; j < seeds.length; j++) {
          const a = seeds[i]; const b = seeds[j];
          const dx = b.x - a.x; const dy = b.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < dim * .72) {
            const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
            const nx = -dy / d; const ny = dx / d;
            const len = 55;
            ctx.beginPath();
            ctx.moveTo(mx - nx * len, my - ny * len);
            ctx.lineTo(mx + nx * len, my + ny * len);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      for (const s of seeds) {
        ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color; ctx.fill();
      }
      if (!reducedMotion) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);
  return <canvas ref={canvasRef} className="voronoi-canvas" aria-label="Customer territory map" />;
}

// â”€â”€ FEATURE 10: CHURN NEURAL NET VISUALIZATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChurnNeuralNet() {
  const layers = [
    ['Recency', 'Frequency', 'Monetary', 'Email', 'Support'],
    ['H1', 'H2', 'H3', 'H4'],
    ['H5', 'H6', 'H7'],
    ['Stay', 'Churn'],
  ];
  const palette = ['#22d3ee', '#a855f7', '#f472b6', '#ef4444'];
  const W = 340; const H = 200;
  const layerXs = [32, 108, 210, 312];
  const positions = layers.map((layer, li) => {
    const gap = H / (layer.length + 1);
    return layer.map((_, ni) => ({ x: layerXs[li], y: gap * (ni + 1) }));
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const edges = useMemo((): Array<{ x1:number; y1:number; x2:number; y2:number; del:number }> => {
    const result: Array<{ x1:number; y1:number; x2:number; y2:number; del:number }> = [];
    for (let li = 0; li < layers.length - 1; li++) {
      for (const a of positions[li]) {
        for (const b of positions[li + 1]) {
          result.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, del: Math.random() * 1.8 });
        }
      }
    }
    return result;
  }, []); // layers/positions derive from in-function constants â€” stable across renders
  return (
    <svg className="churn-neural-net" viewBox={`0 0 ${W} ${H}`} aria-label="Churn prediction neural network visualization">
      <defs>
        {palette.map((c, i) => (
          <radialGradient key={i} id={`cng${i}`} cx="38%" cy="38%" r="62%">
            <stop offset="0%" stopColor={c} stopOpacity="0.88" />
            <stop offset="100%" stopColor={c} stopOpacity="0.15" />
          </radialGradient>
        ))}
      </defs>
      {edges.map((e, i) => (
        <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="rgba(168,85,247,0.16)" strokeWidth="0.75"
          style={{ animation: `nn-pulse 2.6s ease-in-out ${e.del.toFixed(2)}s infinite` }}
        />
      ))}
      {positions.map((layer, li) => layer.map((pos, ni) => (
        <g key={`${li}-${ni}`}>
          <circle cx={pos.x} cy={pos.y}
            r={li === 0 ? 7.5 : li === layers.length - 1 ? 9 : 6.5}
            fill={`url(#cng${li})`}
            style={{ animation: `nn-glow 2.1s ease-in-out ${(li * 0.28 + ni * 0.17).toFixed(2)}s infinite alternate` }}
          />
          {li === 0 && <text x={pos.x - 12} y={pos.y + 3.5} fontSize="6.5" fill="rgba(255,255,255,0.55)" textAnchor="end">{layers[0][ni]}</text>}
          {li === layers.length - 1 && <text x={pos.x + 12} y={pos.y + 3.5} fontSize="8" fill={ni === 1 ? '#ef4444' : '#34d399'} textAnchor="start" fontWeight="600">{layers[li][ni]}</text>}
        </g>
      )))}
    </svg>
  );
}

// â”€â”€ FEATURE 12: MORPHING SVG BRAND ICON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MorphingBrandIcon({ anomaly }: { anomaly: boolean }) {
  return (
    <svg viewBox="0 0 24 20" width="22" height="22" fill="none" aria-hidden="true">
      <motion.polyline
        points="0,18 4,14 8,18 12,10 16,18 20,8 24,18"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: anomaly ? 0 : 1 }} transition={{ duration: 0.38, ease: 'easeInOut' }}
      />
      <motion.polyline
        points="0,18 3,4 6,18 9,1 12,18 15,3 18,18 21,2 24,18"
        stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        animate={{ opacity: anomaly ? 1 : 0 }} transition={{ duration: 0.38, ease: 'easeInOut' }}
      />
    </svg>
  );
}

// â”€â”€ FEATURE 7: 3D VOLUME BARS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ FEATURE 14: FUZZY MATCH HIGHLIGHT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fuzzyHighlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase().trim();
  const parts: ReactNode[] = [];
  let last = 0; let qi = 0;
  for (let i = 0; i < text.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) {
      if (last < i) parts.push(text.slice(last, i));
      parts.push(<mark key={i} className="cmd-match-mark" style={{ animationDelay: `${qi * 28}ms` }}>{text[i]}</mark>);
      last = i + 1; qi++;
    }
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function usePageAnimation(root: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(root);
    const compactViewport = window.innerWidth < 900;
    const dur = reduceMotion || compactViewport ? 0.001 : 0.5;
    gsap.defaults({ ease: "power2.out", duration: dur });

    const entranceTargets = q(".animate-in:not(.topbar)");
    if (entranceTargets.length) {
      gsap.fromTo(
        entranceTargets,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, stagger: compactViewport ? 0 : 0.025, overwrite: "auto" },
      );
    }

    const lineTargets = q(".draw-line");
    if (lineTargets.length) {
      gsap.fromTo(
        lineTargets,
        { strokeDasharray: 760, strokeDashoffset: 760 },
        { strokeDashoffset: 0, duration: reduceMotion ? 0.001 : 1.4, delay: 0.15 },
      );
    }
  }, { scope: root, dependencies: deps, revertOnUpdate: true });
}

function useChartBloom(root: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chartSelector = [
      ".revenue-line-wrapper",
      ".revenue-bars",
      ".combo-bars",
      ".donut-layout",
      ".stacked-bars",
      ".hbars",
      ".heat-grid",
      ".scatter",
      ".gauge",
      ".volume-bars-3d"
    ].join(", ");

    if (reduceMotion) {
      scope.querySelectorAll<HTMLElement>(".panel").forEach((panel) => {
        if (!panel.querySelector(chartSelector)) return;
        panel.classList.add("chart-bloom", "is-bloomed");
      });
      return;
    }

    const mobileScrollRoot = window.innerWidth < 900
      ? scope.querySelector<HTMLElement>(".workspace")
      : null;

    const getVisibilityState = (panel: HTMLElement) => {
      const rootRect = mobileScrollRoot?.getBoundingClientRect();
      const visibleTop = rootRect?.top ?? 0;
      const visibleBottom = rootRect?.bottom ?? window.innerHeight;
      const enterAhead = Math.min(260, window.innerHeight * 0.28);
      const enterFloor = Math.min(70, window.innerHeight * 0.08);
      const resetMargin = Math.min(260, window.innerHeight * 0.28);
      const rect = panel.getBoundingClientRect();

      return {
        enters: rect.top < visibleBottom + enterAhead && rect.bottom > visibleTop + enterFloor,
        exitsAbove: rect.bottom < visibleTop - resetMargin,
        exitsBelow: rect.top > visibleBottom + resetMargin,
      };
    };

    let scrollFrame = 0;
    let scrollWatchTimer = 0;
    let lastScrollTop = -1;
    const readScrollTop = () => mobileScrollRoot?.scrollTop ?? window.scrollY;
    let previousScrollTop = readScrollTop();
    let scrollDirection: "down" | "up" = "down";

    const setScrollDirection = (direction: "down" | "up") => {
      scrollDirection = direction;
      scope.classList.toggle("scrolling-down", direction === "down");
      scope.classList.toggle("scrolling-up", direction === "up");
    };

    const syncBloomState = () => {
      scrollFrame = 0;
      scope.querySelectorAll<HTMLElement>(".panel.chart-bloom").forEach((panel) => {
        const { enters, exitsBelow } = getVisibilityState(panel);
        if (scrollDirection === "up" && exitsBelow) {
          panel.classList.remove("is-bloomed");
          panel.dataset.bloomedOnce = "false";
          return;
        }
        if (scrollDirection === "down" && enters && panel.dataset.bloomedOnce !== "true") {
          panel.classList.add("is-bloomed");
          panel.dataset.bloomedOnce = "true";
        }
      });
    };

    const scheduleBloomSync = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(syncBloomState);
    };

    const watchScrollSettle = () => {
      const currentScrollTop = readScrollTop();
      if (Math.abs(currentScrollTop - lastScrollTop) > 0.5) {
        lastScrollTop = currentScrollTop;
        syncBloomState();
        scrollWatchTimer = window.setTimeout(watchScrollSettle, 90);
      } else {
        scrollWatchTimer = 0;
      }
    };

    const startScrollWatch = () => {
      const currentScrollTop = readScrollTop();
      setScrollDirection(currentScrollTop >= previousScrollTop ? "down" : "up");
      previousScrollTop = currentScrollTop;
      scheduleBloomSync();
      if (scrollDirection !== "down") return;
      if (scrollWatchTimer) return;
      lastScrollTop = -1;
      scrollWatchTimer = window.setTimeout(watchScrollSettle, 34);
    };

    const handleWheelDirection = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 1) return;
      setScrollDirection(event.deltaY > 0 ? "down" : "up");
      if (event.deltaY > 0) startScrollWatch();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const panel = entry.target as HTMLElement;
          if (entry.isIntersecting && scrollDirection === "down" && panel.dataset.bloomedOnce !== "true") {
            panel.classList.add("is-bloomed");
            panel.dataset.bloomedOnce = "true";
            return;
          }
        });
      },
      { root: mobileScrollRoot, threshold: [0, 0.12, 0.34], rootMargin: "0px 0px -6% 0px" }
    );

    const tagPanels = () => {
      const panels = Array.from(scope.querySelectorAll<HTMLElement>(".panel"));
      panels.forEach((panel, index) => {
        if (panel.classList.contains("chart-bloom")) return;
        if (!panel.querySelector(chartSelector)) return;
        panel.classList.add("chart-bloom");
        panel.style.setProperty("--bloom-delay", `${Math.min(0.1, index * 0.012)}s`);
        observer.observe(panel);
      });
      scheduleBloomSync();
    };

    tagPanels();
    const frame = window.requestAnimationFrame(tagPanels);
    const shortTimer = window.setTimeout(tagPanels, 180);
    const syncTimer = window.setTimeout(scheduleBloomSync, 320);
    const settledTimer = window.setTimeout(tagPanels, 700);
    const mutationObserver = new MutationObserver(tagPanels);
    mutationObserver.observe(scope, { childList: true, subtree: true });
    const scrollTarget: Window | HTMLElement = mobileScrollRoot ?? window;
    scrollTarget.addEventListener("scroll", startScrollWatch, { passive: true });
    window.addEventListener("wheel", handleWheelDirection, { passive: true });
    window.addEventListener("resize", startScrollWatch);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.cancelAnimationFrame(frame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (scrollWatchTimer) window.clearTimeout(scrollWatchTimer);
      window.clearTimeout(shortTimer);
      window.clearTimeout(syncTimer);
      window.clearTimeout(settledTimer);
      scrollTarget.removeEventListener("scroll", startScrollWatch);
      window.removeEventListener("wheel", handleWheelDirection);
      window.removeEventListener("resize", startScrollWatch);
      scope.classList.remove("scrolling-down", "scrolling-up");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function ShellButton({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return <button className="shell-button" type="button" aria-label={label} onClick={onClick}>{children}</button>;
}

function SkeletonDashboard() {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
    </div>
  );
}

function DataLoadError({ message }: { message: string }) {
  return (
    <section className="data-error-panel">
      <span className="data-error-icon"><Database size={28} /></span>
      <div>
        <p className="eyebrow">DATA SOURCE CHECK FAILED</p>
        <h2>RetailPulse could not load the integrated datasets.</h2>
        <p>
          The dashboard is blocked from showing fallback demo numbers. Fix the missing CSV or schema issue,
          then refresh the preview to restore the live integrated dashboard.
        </p>
        <code>{message}</code>
      </div>
    </section>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const timer = window.setInterval(
      () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      60000
    );
    return () => window.clearInterval(timer);
  }, []);
  return <span className="live-clock" aria-label="Current time">{time}</span>;
}

function Sidebar({
  activePage,
  setActivePage,
  open,
  setOpen,
  items,
  overviewStat,
  segmentationStat,
}: {
  activePage: PageId;
  setActivePage: (id: PageId) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  items: NavItem[];
  overviewStat: string;
  segmentationStat: string;
}) {
  const { anomalyLens } = useLivingOS();
  const resolveNavStat = (item: NavItem) => {
    if (item.id === "overview") return overviewStat;
    if (item.id === "segmentation") return segmentationStat;
    return item.stat;
  };
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="brand">
        <div className="brand-icon"><MorphingBrandIcon anomaly={anomalyLens} /></div>
        <div>
          <strong className="brand-shimmer"><TextEffect per="char" preset="blur" delay={0.1} speedReveal={1.6} as="span">RetailPulse</TextEffect></strong>
          <span><TextEffect per="word" preset="fade" delay={0.3} speedReveal={2.5} as="span">Intelligence OS</TextEffect></span>
        </div>
        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button key={item.id} className={`magnetic${isActive ? " active" : ""}`} onClick={() => { setActivePage(item.id); setOpen(false); }}>
              {isActive && (
                <motion.span
                  className="nav-pill"
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={18} />
              <span><strong>{item.label}</strong><small>{item.kicker}</small></span>
              <em>{resolveNavStat(item)}</em>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-card">
        <span className="status-orb" />
        <strong><TextEffect per="word" preset="fade-in-blur" delay={0.1} speedReveal={2} as="span">Model stack online</TextEffect></strong>
        <p>Forecast drift below tolerance. 7 modules synced.</p>
      </div>
    </aside>
    </>
  );
}

function Topbar({ page, setNavOpen, setCommandOpen, setAlertsOpen }: { page: NavItem; setNavOpen: (open: boolean) => void; setCommandOpen: (open: boolean) => void; setAlertsOpen: (open: boolean) => void }) {
  const Icon = page.icon;
  return (
    <header className="topbar animate-in">
      <ShellButton label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={19} /></ShellButton>
      <button className="search-command" type="button" onClick={() => setCommandOpen(true)}>
        <Search size={17} />
        <span>Search customer, product, SKU, report...</span>
      </button>
      <div className="top-context">
        <Icon size={17} />
        <span>{page.label}</span>
      </div>
      <LiveClock />
      <ShellButton label="Open alerts" onClick={() => setAlertsOpen(true)}><Bell size={18} /><motion.i className="bell-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 620, damping: 18, delay: 1.4 }} /></ShellButton>
      <div className="user-chip"><span>R</span><strong>Rashad</strong></div>
    </header>
  );
}

function HeroPanel({ page, onInsight, onRefine }: { page: NavItem; onInsight: () => void; onRefine: () => void }) {
  const meta = pageMeta[page.id];
  const Icon = page.icon;
  const [streamWords, setStreamWords] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const sweepParallaxY = useTransform(heroScroll, [0, 1], [0, -48]);

  const handleInsight = useCallback(() => {
    onInsight();
    const insight = `AI analysis complete â€” ${meta.summary.slice(0, 120)} Key opportunity detected: high-value segment growth accelerating 24% QoQ.`;
    const words = insight.split(' ');
    setStreamWords([]);
    setStreaming(true);
    let i = 0;
    streamRef.current = window.setInterval(() => {
      i++;
      setStreamWords(words.slice(0, i));
      if (i >= words.length) {
        window.clearInterval(streamRef.current!);
        setStreaming(false);
      }
    }, 62);
  }, [onInsight, meta.summary]);

  useEffect(() => () => { if (streamRef.current) window.clearInterval(streamRef.current); }, []);

  return (
    <section ref={heroRef} className="hero-panel animate-in">
      <motion.span className="sweep-shine" style={{ y: sweepParallaxY }} aria-hidden="true" />
      <motion.div
        key={page.id}
        className="hero-copy"
        variants={heroContainerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.span variants={heroItemVariants} className="eyebrow">
          <Icon size={16} />
          <span>{meta.eyebrow}</span>
        </motion.span>
        <motion.h1 variants={heroItemVariants}>
          {meta.title}
        </motion.h1>
        {streamWords.length > 0 ? (
          <motion.p variants={heroItemVariants} className="insight-stream">
            {streamWords.map((w, i) => (
              <motion.span key={`${w}-${i}`} className="stream-word"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: i * 0.022, ease: 'easeOut' }}
              >{w}{' '}</motion.span>
            ))}
            {streaming && <span className="stream-cursor">â–‹</span>}
          </motion.p>
        ) : (
          <motion.p variants={heroItemVariants}>{meta.summary}</motion.p>
        )}
        <motion.div variants={heroItemVariants} className="hero-actions">
          <Magnetic intensity={0.45} range={90} springOptions={{ stiffness: 30, damping: 5, mass: 0.25 }}>
            <button type="button" className="primary-action magnetic" onClick={handleInsight}><Sparkles size={17} /> Generate insight</button>
          </Magnetic>
          <button type="button" className="secondary-action" onClick={onRefine}><Filter size={17} /> Refine view</button>
        </motion.div>
      </motion.div>
      <HeroShowcase page={page} meta={meta} />
    </section>
  );
}

function HeroShowcase({
  page,
  meta,
}: {
  page: NavItem;
  meta: { eyebrow: string; title: string; summary: string; primary: string; secondary: string; tertiary: string };
}) {
  const { performanceTier, reducedMotion } = useLivingOS();
  const ambientMotion = performanceTier !== "minimal" && !reducedMotion;
  const labels = ["Primary signal", "Operational read", "Trend state"];
  const trendBars = [42, 68, 58, 88, 74, 92, 64, 98];
  const forecastPoints = [74, 52, 64, 58, 82, 76, 92, 88];
  const stockBars = [54, 78, 62, 91, 66, 48];
  const segmentNodes = [
    { x: 18, y: 32, size: 20, tone: "violet" },
    { x: 38, y: 58, size: 14, tone: "cyan" },
    { x: 50, y: 24, size: 18, tone: "gold" },
    { x: 68, y: 48, size: 24, tone: "violet" },
    { x: 82, y: 28, size: 16, tone: "cyan" },
    { x: 74, y: 72, size: 15, tone: "gold" },
  ];

  const renderVisual = () => {
    switch (page.id) {
      case "segmentation":
        return (
          <div className="hero-visual hero-visual-segmentation">
            <span className="hero-live-scan" aria-hidden="true" />
            <div className="hero-visual-grid">
              {segmentNodes.map((node, index) => (
                <motion.div
                  key={`${node.x}-${node.y}`}
                  className={`hero-node tone-${node.tone}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.size * 2, height: node.size * 2 }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={ambientMotion ? { opacity: 1, scale: 1, y: [0, index % 2 === 0 ? -7 : 7, 0] } : { opacity: 1, scale: 1 }}
                  transition={ambientMotion ? { duration: 3.2 + index * 0.16, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 } : { duration: 0.35, delay: index * 0.05 }}
                />
              ))}
              <svg className="hero-link-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M18 32 C28 36, 33 52, 38 58 S45 34, 50 24 S62 34, 68 48 S76 34, 82 28" />
                <path d="M38 58 C44 62, 61 66, 74 72" />
                <path d="M50 24 C56 26, 72 26, 82 28" />
              </svg>
              <div className="hero-visual-caption">
                <span>Cluster drift live</span>
                <strong>6 strategic cohorts mapped</strong>
              </div>
            </div>
          </div>
        );
      case "churn":
        return (
          <div className="hero-visual hero-visual-churn">
            <span className="hero-live-scan" aria-hidden="true" />
            <div className="churn-command-visual" aria-hidden="true">
              <div className="churn-signal-column">
                <span><em>Recency</em><strong>91d</strong></span>
                <span><em>Frequency</em><strong>4.2</strong></span>
                <span><em>CLV</em><strong>$8.4K</strong></span>
              </div>
              <svg className="churn-flow-lines" viewBox="0 0 360 180">
                <path className="churn-flow-rail" d="M80 42 C130 42 128 90 178 90" />
                <path className="churn-flow-rail" d="M80 90 H178" />
                <path className="churn-flow-rail" d="M80 138 C130 138 128 90 178 90" />
                <path className="churn-flow-rail" d="M218 90 C258 90 266 48 318 48" />
                <path className="churn-flow-rail" d="M218 90 C258 90 266 90 318 90" />
                <path className="churn-flow-rail" d="M218 90 C258 90 266 132 318 132" />
                <path className="churn-flow-active churn-flow-a" d="M80 42 C130 42 128 90 178 90 C218 90 250 48 318 48" />
                <path className="churn-flow-active churn-flow-b" d="M80 90 H178 C218 90 250 90 318 90" />
                <path className="churn-flow-active churn-flow-c" d="M80 138 C130 138 128 90 178 90 C218 90 250 132 318 132" />
              </svg>
              <div className="churn-model-card">
                <span>Risk model</span>
                <strong>28.2%</strong>
                <em>churn exposure</em>
              </div>
              <div className="churn-action-column">
                <span><em>VIP recovery</em><strong>247</strong></span>
                <span><em>Win-back offer</em><strong>$2.91M</strong></span>
                <span><em>Care queue</em><strong>1.9K</strong></span>
              </div>
            </div>
          </div>
        );
      case "forecasting":
        return (
          <div className="hero-visual hero-visual-forecasting">
            <span className="hero-live-scan" aria-hidden="true" />
            <svg viewBox="0 0 320 180" className="hero-line-chart" aria-hidden="true">
              <defs>
                <linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
              </defs>
              <path className="hero-chart-band" d="M18 126 C42 108, 58 118, 82 98 S124 116, 148 82 S192 92, 214 62 S260 88, 302 38 L302 160 L18 160 Z" />
              <path className="hero-chart-line" d="M18 126 C42 108, 58 118, 82 98 S124 116, 148 82 S192 92, 214 62 S260 88, 302 38" />
              {forecastPoints.map((point, index) => (
                <circle key={index} className="hero-chart-dot" cx={18 + index * 40} cy={170 - point} r="4" />
              ))}
            </svg>
            <div className="hero-forecast-tags">
              {["Weekly seasonality", "Regressor-aware", "22.53% MAPE"].map((label) => <span key={label}>{label}</span>)}
            </div>
          </div>
        );
      case "inventory":
        return (
          <div className="hero-visual hero-visual-inventory">
            <span className="hero-live-scan" aria-hidden="true" />
            <div className="hero-stock-columns">
              {stockBars.map((value, index) => (
                <motion.div
                  key={index}
                  className="hero-stock-column"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.4 }}
                >
                  <span style={{ height: `${value}%` }} />
                </motion.div>
              ))}
            </div>
            <div className="hero-visual-caption">
              <span>Stock equilibrium</span>
              <strong>Critical, reorder, surplus in one frame</strong>
            </div>
          </div>
        );
      case "reports":
        return (
          <div className="hero-visual hero-visual-reports">
            <span className="hero-live-scan" aria-hidden="true" />
            <motion.div className="hero-report-card report-back" animate={ambientMotion ? { rotate: [-8, -6, -8], y: [0, -4, 0] } : { rotate: -7, y: 0 }} transition={ambientMotion ? { duration: 4.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }} />
            <motion.div className="hero-report-card report-mid" animate={ambientMotion ? { rotate: [5, 7, 5], y: [0, -6, 0] } : { rotate: 6, y: 0 }} transition={ambientMotion ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }} />
            <div className="hero-report-card report-front">
              <span>Export pipeline</span>
              <strong>CSV, PDF, board pack</strong>
              <div>
                {["Revenue", "Churn", "Inventory"].map((label) => <i key={label}>{label}</i>)}
              </div>
            </div>
          </div>
        );
      case "media":
        return (
          <div className="hero-visual hero-visual-media">
            <span className="hero-live-scan" aria-hidden="true" />
            <div className="hero-media-frame">
              <div className="hero-media-head" />
              <div className="hero-media-timeline">
                <motion.b
                  animate={ambientMotion ? { x: ["0%", "220%", "0%"] } : { x: "0%" }}
                  transition={ambientMotion ? { duration: 5.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                />
              </div>
            </div>
            <div className="hero-media-scenes">
              {MEDIA_STORY_TYPES.slice(0, 4).map((scene, index) => (
                <motion.span key={scene} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                  {scene}
                </motion.span>
              ))}
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="hero-visual hero-visual-settings">
            <span className="hero-live-scan" aria-hidden="true" />
            <div className="hero-settings-hub">
              <motion.div className="hero-settings-core" animate={ambientMotion ? { rotate: 360 } : { rotate: 0 }} transition={ambientMotion ? { duration: 18, repeat: Infinity, ease: "linear" } : { duration: 0.3 }} />
              <span className="hub-a">Theme</span>
              <span className="hub-b">Alerts</span>
              <span className="hub-c">Models</span>
              <span className="hub-d">Access</span>
            </div>
          </div>
        );
      case "overview":
      default:
        return (
          <div className="hero-visual hero-visual-overview">
            <span className="hero-live-scan" aria-hidden="true" />
            <div className="hero-overview-orb" />
            <svg viewBox="0 0 320 180" className="hero-line-chart" aria-hidden="true">
              <path className="hero-chart-grid" d="M18 140 H302 M18 104 H302 M18 68 H302 M18 32 H302" />
              <path className="hero-chart-line" d="M18 128 C42 108, 54 112, 76 94 S116 88, 138 102 S184 118, 210 76 S262 54, 302 42" />
            </svg>
            <div className="hero-trend-bars">
              {trendBars.map((value, index) => (
                <motion.i
                  key={index}
                  style={{ height: `${value}%` }}
                  initial={{ opacity: 0, scaleY: 0.25 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.05 * index, duration: 0.45 }}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="hero-stage">
      {renderVisual()}
      <div className="hero-metrics">
        {[meta.primary, meta.secondary, meta.tertiary].map((metric, index) => (
          <motion.div
            key={metric}
            className="hero-metric-card"
            initial={{ opacity: 0, y: 12 }}
            animate={ambientMotion ? { opacity: 1, y: [0, -3, 0], scale: [1, 1.012, 1] } : { opacity: 1, y: 0, scale: 1 }}
            transition={ambientMotion ? { delay: 0.08 * index, duration: 4.2 + index * 0.35, repeat: Infinity, ease: "easeInOut" } : { delay: 0.08 * index, duration: 0.32 }}
          >
            <span className="metric-live-beacon" aria-hidden="true" />
            <small><TextEffect per="word" preset="fade" delay={0.15 + index * 0.05} speedReveal={3.5} as="span">{labels[index]}</TextEffect></small>
            <AnimatedValue value={metric} className="live-hero-value" />
            <span className="metric-signal-line" aria-hidden="true" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FilterDock() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="filter-dock animate-in">
      <Control icon={CalendarDays} title="Date range" value="Dec 2025 - Jun 2026" />
      <Control icon={Layers3} title="Category" value="All categories" />
      <Control icon={RadioTower} title="Region" value="All regions" />
      <button className="secondary-action" onClick={() => setExpanded(e => !e)}><SlidersHorizontal size={16} /> Advanced filters</button>
      <div className={`filter-advanced${expanded ? " is-open" : ""}`}>
        <div className="filter-advanced-inner">
          <Control title="Revenue threshold" value="$0 â€“ $50K" />
          <Control title="Churn risk" value="All" />
          <Control title="Segment" value="All segments" />
        </div>
      </div>
    </section>
  );
}

function Control({ icon: Icon, title, value }: { icon?: typeof Activity; title: string; value: string }) {
  return (
    <div className="control">
      {Icon ? <Icon size={16} /> : null}
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KpiGrid({ items = kpis }: { items?: typeof kpis }) {
  const { anomalyLens, replayProgress, performanceTier, reducedMotion } = useLivingOS();
  const shouldAnimate = !reducedMotion && performanceTier !== "minimal";
  return (
    <section className="kpi-grid animate-in">
      {items.map(({ label, value, delta, icon: Icon, tone }, index) => (
        <motion.article
          key={label}
          layout={shouldAnimate}
          className={`metric-card tone-${tone} ${anomalyLens && (tone === "danger" || index === 1) ? "anomaly-hit" : ""}`}
          style={{ "--replay": replayProgress / 100 } as CSSProperties}
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: shouldAnimate ? 0.46 : 0, ease: [0.22, 1, 0.36, 1], delay: shouldAnimate ? index * 0.06 : 0 }}
          whileHover={shouldAnimate ? { y: -7, scale: 1.025, transition: { type: "spring", stiffness: 420, damping: 20 } } : undefined}
        >
          <div className="metric-top"><span><Icon size={18} /></span></div>
          <AnimatedValue value={value} />
          <p><TextEffect per="word" preset="fade" delay={0.15 + index * 0.04} speedReveal={3.5} as="span">{label}</TextEffect></p>
          <TrendIndicator value={delta} />
        </motion.article>
      ))}
    </section>
  );
}

function TrendIndicator({ value }: { value: string }) {
  const root = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useLivingOS();
  const direction = value.startsWith("+") ? "positive" : value.startsWith("-") ? "negative" : "neutral";
  const TrendIcon = direction === "positive" ? TrendingUp : direction === "negative" ? TrendingDown : Activity;

  useGSAP(() => {
    if (reducedMotion || !root.current) return;

    const icon = root.current.querySelector(".trend-icon");
    const valueLabel = root.current.querySelector(".trend-value");
    const movement = direction === "positive" ? -4 : direction === "negative" ? 4 : 0;

    gsap.fromTo(root.current, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: .34, ease: "power2.out" });
    gsap.fromTo(valueLabel, { autoAlpha: .82 }, { autoAlpha: 1, duration: .28, ease: "power2.out" });

    gsap.fromTo(icon, { y: -movement, autoAlpha: .72 }, { y: 0, autoAlpha: 1, duration: .38, ease: "power2.out" });
  }, { scope: root, dependencies: [direction, value, reducedMotion], revertOnUpdate: true });

  return (
    <div ref={root} className={`trend-indicator trend-${direction}`} aria-label={`${direction} trend ${value}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={direction}
          className="trend-icon"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        ><TrendIcon size={17} strokeWidth={2.6} /></motion.span>
      </AnimatePresence>
      <strong className="trend-value">{value}</strong>
      <small>{direction === "positive" ? "Increase" : direction === "negative" ? "Decrease" : "Current status"}</small>
    </div>
  );
}

type StoryMode = "line" | "bars" | "donut" | "gauge";
type StorySpec = {
  mode: StoryMode;
  visual?:
    | "line" | "bars" | "donut" | "gauge" | "stream" | "ranked" | "volume" | "monthly" | "heatmap" | "network" | "scatter" | "table" | "timeline"
    | "churn-distribution" | "risk-matrix" | "feature-force" | "retention-timeline" | "churn-network"
    | "forecast-horizon" | "seasonality-wave" | "weekly-cycle" | "forecast-category";
  storyId?: string;
  metric: string;
  narrative?: string;
  outro?: string;
  rows?: string[][];
  accent?: string;
  secondaryAccent?: string;
  lineSeries?: number[];
  lineMonths?: string[];
  barSeries?: number[];
  barLabels?: string[];
  profitSeries?: number[];
  donutValues?: number[];
  donutLabels?: string[];
  donutColors?: string[];
  gaugeValue?: number;
};

function getPanelStorySpec(title: string): StorySpec {
  const normalized = title.toLowerCase();
  const d = dashboardDataState;
  const donutColors = ["#a855f7", "#22d3ee", "#34d399", "#fbbf24", "#f472b6"];
  const streamRows = d.activity.slice(0, 5).map((item) => [item[0], item[1], item[2]]);

  if (normalized.includes("revenue trend")) {
    return { mode: "line", visual: "line", storyId: "revenue-trend", metric: d.navStats.overview, lineSeries: d.revenueSeries, lineMonths: d.revenueMonths, accent: "#22d3ee", secondaryAccent: "#f59e0b", narrative: "Daily revenue redraws from the live dataset, then resolves into the current executive revenue signal.", outro: "Daily revenue story complete." };
  }
  if (normalized.includes("product category")) {
    const topShare = d.categoryValues.length > 0 ? `${d.categoryValues[0].toFixed(1)}%` : "Top share";
    return { mode: "donut", visual: "donut", storyId: "product-category", metric: topShare, donutValues: d.categoryValues, donutLabels: d.categoryLabels, donutColors, accent: "#a855f7", secondaryAccent: "#34d399", narrative: `Live category mix: ${d.categoryLabels.slice(0, 3).join(", ")} lead the visible product-share chart.`, outro: "Category mix decoded." };
  }
  if (normalized.includes("live activity feed") || normalized.includes("stock alerts") || normalized.includes("export queue")) {
    return { mode: "bars", visual: "stream", storyId: "activity-feed", metric: "Live", rows: streamRows, accent: "#22c55e", secondaryAccent: "#60a5fa", narrative: "Live operational events replay in sequence across models, inventory, customers, and reporting.", outro: "Event stream synchronized." };
  }
  if (normalized.includes("monthly performance")) {
    return { mode: "bars", visual: "monthly", storyId: "monthly-performance", metric: d.hero.overview.tertiary, barSeries: d.bars.slice(-7), profitSeries: d.profitBars.slice(-7), barLabels: d.barMonths.slice(-7), accent: "#f59e0b", secondaryAccent: "#ec4899", narrative: "The video uses the same revenue and profit bars shown in this monthly chart, then adds the trend overlay for context.", outro: "Monthly performance packaged." };
  }
  if (normalized.includes("top selling")) {
    return { mode: "bars", visual: "ranked", storyId: "top-selling-products", metric: d.navStats.overview, rows: d.topProductsRows.slice(0, 5), barSeries: d.horizontalBarValues, accent: "#fbbf24", secondaryAccent: "#22d3ee", narrative: "Products are ranked by total revenue contribution to show which SKUs are carrying the business.", outro: "Leaderboard locked." };
  }
  if (normalized.includes("3d volume") || normalized.includes("volume analysis")) {
    return { mode: "bars", visual: "volume", storyId: "volume-analysis", metric: d.hero.overview.tertiary, barSeries: d.bars, barLabels: d.barMonths, accent: "#8b5cf6", secondaryAccent: "#22d3ee", narrative: "The video maps the exact same 3D volume percentages and month labels used by the visible volume bars.", outro: "Volume field mapped." };
  }
  if (normalized.includes("segment distribution")) {
    return { mode: "donut", visual: "donut", storyId: "segment-distribution", metric: d.navStats.segmentation, donutValues: d.segmentValues, donutLabels: d.segmentLabels, donutColors, accent: "#c084fc", secondaryAccent: "#f472b6", narrative: `The story uses the same customer segment distribution visible in this panel: ${d.segmentLabels.slice(0, 3).join(", ")}.`, outro: "Segment distribution resolved." };
  }
  if (normalized.includes("customer lifetime")) {
    return { mode: "bars", visual: "ranked", storyId: "customer-lifetime-value", metric: d.hero.segmentation.secondary, rows: d.horizontalBarLabels.slice(0, 5).map((label, index) => [label, `${d.horizontalBarValues[index] ?? 0}`, "CLV"]), barSeries: d.horizontalBarValues, accent: "#34d399", secondaryAccent: "#a855f7", narrative: "Customer value tiers rank by contribution so priority segments are clear.", outro: "CLV ranking complete." };
  }
  if (normalized.includes("cluster scatter") || normalized.includes("force graph") || (normalized.includes("neural network") && !normalized.includes("churn"))) {
    return { mode: "line", visual: "network", storyId: normalized.includes("neural") ? "segment-neural-network" : "segment-network", metric: d.navStats.segmentation, accent: "#22d3ee", secondaryAccent: "#ef4444", narrative: "The model view becomes a relationship map, showing how signals connect before the final prediction.", outro: "Network state explained." };
  }
  if (normalized.includes("churn probability distribution")) {
    return { mode: "bars", visual: "churn-distribution", storyId: "churn-probability-distribution", metric: d.navStats.churn, barSeries: dashboardDataState.churnKpis.map((item) => Number.parseFloat(item.value.replace(/[^0-9.]/g, "")) || 0).slice(0, 4), accent: "#ef4444", secondaryAccent: "#34d399", narrative: "Churn probability splits into readable risk bands so the customer base is no longer a single flat percentage.", outro: "Churn distribution resolved." };
  }
  if (normalized.includes("risk analysis")) {
    return { mode: "bars", visual: "risk-matrix", storyId: "risk-analysis-matrix", metric: d.navStats.churn, barSeries: d.heat, accent: "#ef4444", secondaryAccent: "#22d3ee", narrative: "Risk bands become a pressure matrix, exposing which cohorts need retention focus first.", outro: "Risk matrix stabilized." };
  }
  if (normalized.includes("feature importance")) {
    return { mode: "line", visual: "feature-force", storyId: "churn-feature-force", metric: d.hero.churn.secondary, accent: "#f97316", secondaryAccent: "#22d3ee", narrative: "Churn drivers connect into a central risk model so recency, value, and loyalty signals are explainable.", outro: "Feature drivers explained." };
  }
  if (normalized.includes("churn timeline")) {
    return { mode: "bars", visual: "retention-timeline", storyId: "churn-retention-timeline", metric: d.hero.churn.tertiary, rows: d.churnRecommendationRows.slice(0, 4), accent: "#f97316", secondaryAccent: "#34d399", narrative: "Churn events convert into a retention timeline with actions sequenced by urgency.", outro: "Retention timeline queued." };
  }
  if (normalized.includes("churn neural network")) {
    return { mode: "line", visual: "churn-network", storyId: "churn-neural-network-v2", metric: d.navStats.churn, accent: "#22d3ee", secondaryAccent: "#ef4444", narrative: "Prediction nodes activate from customer signals into a central churn decision layer.", outro: "Neural pathway resolved." };
  }
  if (normalized.includes("retention recommendation")) {
    return { mode: "bars", visual: "retention-timeline", storyId: "retention-recommendation-engine", metric: `${d.churnRecommendationRows.length} actions`, rows: d.churnRecommendationRows.slice(0, 5), accent: "#f97316", secondaryAccent: "#34d399", narrative: "At-risk customers become a clear retention action queue with intervention recommendations.", outro: "Retention actions packaged." };
  }
  if (normalized.includes("heatmap") || normalized.includes("territory")) {
    return { mode: "bars", visual: "heatmap", storyId: "heatmap-story", metric: d.hero.inventory.tertiary, barSeries: d.heat, accent: "#34d399", secondaryAccent: "#f59e0b", narrative: "Dense operational signals convert into a heat field to expose pressure, concentration, and opportunity.", outro: "Heat field analyzed." };
  }
  if (normalized.includes("historical demand") || normalized.includes("demand + forecast")) {
    return { mode: "line", visual: "forecast-horizon", storyId: "historical-demand-forecast-horizon", metric: d.navStats.forecasting, lineSeries: d.compareSeries.slice(-8), barSeries: d.revenueSeries.slice(-7), lineMonths: d.revenueMonths, accent: "#22d3ee", secondaryAccent: "#34d399", narrative: "Historical demand and forecast context are pulled from the same dashboard demand and forecast series.", outro: "Demand horizon calibrated." };
  }
  if (normalized.includes("seasonal trend")) {
    return { mode: "line", visual: "seasonality-wave", storyId: "seasonality-wave-model", metric: d.hero.forecasting.secondary, lineSeries: d.compactSeries, lineMonths: d.revenueMonths, accent: "#22d3ee", secondaryAccent: "#fbbf24", narrative: "The seasonal story uses the same compact trend signal from the seasonal chart, rendered as a layered demand wave.", outro: "Seasonality pattern identified." };
  }
  if (normalized.includes("weekly trend")) {
    return { mode: "bars", visual: "weekly-cycle", storyId: "weekly-demand-cycle", metric: d.hero.forecasting.tertiary, barSeries: d.bars.slice(-7), barLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], accent: "#60a5fa", secondaryAccent: "#34d399", narrative: "The same seven bars from the weekly trend panel are replayed as a radial operating cycle.", outro: "Weekly cycle mapped." };
  }
  if (normalized.includes("category forecast")) {
    return { mode: "bars", visual: "forecast-category", storyId: "category-forecast-bars", metric: d.navStats.forecasting, barSeries: d.forecastCategoryValues, barLabels: d.forecastCategoryLabels, accent: "#34d399", secondaryAccent: "#22d3ee", narrative: "Projected demand by product line uses the same category values and labels as the visible forecast ranking.", outro: "Category forecast ranked." };
  }
  if (normalized.includes("forecast detail") || normalized.includes("recommendation") || normalized.includes("preview")) {
    const tableRows = normalized.includes("forecast") ? d.forecastRows : normalized.includes("inventory") ? d.inventoryRecommendationRows : normalized.includes("retention") ? d.churnRecommendationRows : d.topProductsRows;
    const storyId = normalized.includes("forecast") ? "forecast-detail-table" : normalized.includes("inventory") ? "inventory-recommendation-table" : normalized.includes("retention") ? "retention-recommendation-table" : "table-story";
    return { mode: "bars", visual: "table", storyId, metric: `${tableRows.length} rows`, rows: tableRows.slice(0, 5), barSeries: d.bars, accent: "#6366f1", secondaryAccent: "#22d3ee", narrative: "Structured rows are promoted into an executive-ready replay with ranked evidence and next actions.", outro: "Table evidence packaged." };
  }
  if (normalized.includes("timeline") || normalized.includes("weekly trend") || normalized.includes("reorder schedule")) {
    return { mode: "bars", visual: "timeline", storyId: "timeline-story", metric: d.hero.forecasting.tertiary, barSeries: normalized.includes("reorder") ? d.heat.slice(0, 7) : d.bars.slice(-7), accent: "#60a5fa", secondaryAccent: "#fbbf24", narrative: "The time sequence builds bar by bar so operational timing and pressure are easier to read.", outro: "Timeline ready." };
  }
  if (normalized.includes("churn") || normalized.includes("risk")) {
    return { mode: "gauge", visual: "gauge", storyId: "risk-gauge", metric: d.navStats.churn, gaugeValue: Math.max(0, Math.min(100, parseFloat(d.navStats.churn) || 34.4)), accent: "#ef4444", secondaryAccent: "#f97316", narrative: "Risk is compressed into a gauge so retention pressure is readable at a glance.", outro: "Risk posture captured." };
  }
  if (normalized.includes("inventory") || normalized.includes("health")) {
    return { mode: "gauge", visual: "gauge", storyId: "inventory-health", metric: d.navStats.inventory, gaugeValue: d.inventoryHealthScore, accent: "#fbbf24", secondaryAccent: "#22d3ee", narrative: "Inventory health resolves into a single stock posture score with supporting operational context.", outro: "Inventory posture stabilized." };
  }
  if (normalized.includes("distribution") || normalized.includes("category") || normalized.includes("mix")) {
    const topShare = d.categoryValues.length > 0 ? `${d.categoryValues[0].toFixed(1)}%` : "+6.8%";
    return { mode: "donut", visual: "donut", storyId: "distribution", metric: topShare, donutValues: d.categoryValues, donutColors, accent: "#a855f7", secondaryAccent: "#34d399", narrative: "Distribution is visualized as a weighted share map with the leading pocket emphasized.", outro: "Distribution decoded." };
  }
  if (normalized.includes("bar") || normalized.includes("performance") || normalized.includes("timeline") || normalized.includes("queue")) {
    return { mode: "bars", visual: "bars", storyId: "bar-performance", metric: d.navStats.overview, barSeries: d.bars, accent: "#f59e0b", secondaryAccent: "#ec4899", narrative: "Bars rise in sequence to reveal the shape and pace of recent performance.", outro: "Performance pattern complete." };
  }
  if (normalized.includes("forecast") || normalized.includes("demand")) {
    return { mode: "line", visual: "line", storyId: "forecast-line", metric: d.navStats.forecasting, lineSeries: d.revenueSeries, lineMonths: d.revenueMonths, accent: "#22d3ee", secondaryAccent: "#34d399", narrative: "Historical demand extends into the planning horizon with model confidence context.", outro: "Forecast story complete." };
  }
  if (normalized.includes("report") || normalized.includes("export")) {
    return { mode: "bars", visual: "stream", storyId: "report-export", metric: d.navStats.reports, rows: streamRows, barSeries: d.bars, accent: "#6366f1", secondaryAccent: "#22d3ee", narrative: "Report operations replay as queued, validated, and export-ready events.", outro: "Report workflow sealed." };
  }
  return { mode: "line", visual: "line", storyId: "default-live-story", metric: d.hero.overview.tertiary, lineSeries: d.revenueSeries, lineMonths: d.revenueMonths, accent: "#22d3ee", secondaryAccent: "#a855f7", narrative: "The selected panel is converted into a focused live data story.", outro: "Panel story complete." };
}

function Panel({
  title,
  kicker,
  icon: Icon,
  children,
  className = "",
  storyEnabled = true,
}: {
  title: string;
  kicker: string;
  icon: typeof Activity;
  children: ReactNode;
  className?: string;
  storyEnabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const storySpec = getPanelStorySpec(title);
  const portalRoot = useMemo(() => document.querySelector(".app-shell") || document.body, []);
  return (
    <motion.section
      className={`panel ${className}`}
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 26, duration: 0.24 }}
    >
      <div className="panel-heading">
        <div>
          <span><TextEffect per="word" preset="fade" delay={0.02} speedReveal={4.5} as="span">{kicker}</TextEffect></span>
          <h2><TextEffect per="word" preset="fade-in-blur" delay={0.06} speedReveal={3.2} speedSegment={1.4} as="span">{title}</TextEffect></h2>
        </div>
        <div className="panel-actions">
          {storyEnabled ? (
            <button type="button" title={`Play data story for ${title}`} aria-label={`Play Data Story ${title}`} onClick={() => setStoryOpen(true)}><PlayCircle size={15} /></button>
          ) : null}
          <button type="button" title={`Focus ${title}`} aria-label={`Focus ${title}`} onClick={() => setFocused(true)}><Maximize2 size={15} /></button>
          <Icon size={21} />
        </div>
      </div>
      {children}
      {createPortal(
        <AnimatePresence>
          {focused ? (
          <motion.div className="focus-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="letterbox-bar letterbox-top" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} />
            <motion.div className="letterbox-bar letterbox-bottom" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} />
            <motion.section className="focus-surface" initial={{ scale: .96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .98, y: 12 }}>
              <div className="panel-heading">
                <div><span>{kicker}</span><h2>{title}</h2></div>
                <button type="button" title="Exit focus mode" aria-label="Exit focus mode" onClick={() => setFocused(false)}><Minimize2 size={18} /></button>
              </div>
              <div className="focus-content">{children}</div>
            </motion.section>
          </motion.div>
          ) : null}
        </AnimatePresence>,
        portalRoot
      )}
      {createPortal(
        <AnimatePresence>
          {storyOpen ? (
            <motion.div
              className="story-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onWheel={(event) => {
                event.stopPropagation();
              }}
              onTouchMove={(event) => {
                event.stopPropagation();
              }}
            >
              <motion.section className="story-surface" role="dialog" aria-modal="true" aria-labelledby={`story-${title.replace(/\W+/g, "-")}`} initial={{ scale: .96, y: 22 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .98, y: 12 }}>
                <div className="story-head">
                  <div><span>{kicker}</span><h2 id={`story-${title.replace(/\W+/g, "-")}`}>{title} Data Story</h2></div>
                  <button type="button" aria-label="Close data story" onClick={() => setStoryOpen(false)}><X size={18} /></button>
                </div>
                <Suspense fallback={<div className="story-loading">Preparing Remotion story...</div>}>
                  <DataStoryPlayer
                    key={`${storySpec.storyId ?? title}-${storySpec.metric}-${JSON.stringify(storySpec.barSeries ?? storySpec.lineSeries ?? storySpec.donutValues ?? storySpec.rows ?? [])}`}
                    title={title}
                    kicker={kicker}
                    metric={storySpec.metric}
                    mode={storySpec.mode}
                    visual={storySpec.visual}
                    storyId={storySpec.storyId}
                    narrative={storySpec.narrative}
                    outro={storySpec.outro}
                    rows={storySpec.rows}
                    accent={storySpec.accent}
                    secondaryAccent={storySpec.secondaryAccent}
                    lineSeries={storySpec.lineSeries}
                    lineMonths={storySpec.lineMonths}
                    barSeries={storySpec.barSeries}
                    barLabels={storySpec.barLabels}
                    profitSeries={storySpec.profitSeries}
                    donutValues={storySpec.donutValues}
                    donutLabels={storySpec.donutLabels}
                    donutColors={storySpec.donutColors}
                    gaugeValue={storySpec.gaugeValue}
                  />
                </Suspense>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        portalRoot
      )}
    </motion.section>
  );
}

function createLinePath(values: number[], width: number, height: number, padding: { left: number; right: number; top: number; bottom: number }) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  return values.map((value, index) => {
    const x = padding.left + (innerWidth / Math.max(values.length - 1, 1)) * index;
    const normalized = max === min ? 0.5 : (value - min) / (max - min);
    const y = padding.top + innerHeight - normalized * innerHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function createLinePoints(values: number[], width: number, height: number, padding: { left: number; right: number; top: number; bottom: number }, domain?: { min: number; max: number }) {
  const max = domain?.max ?? Math.max(...values, 1);
  const min = domain?.min ?? Math.min(...values, 0);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  return values.map((value, index) => {
    const x = padding.left + (innerWidth / Math.max(values.length - 1, 1)) * index;
    const normalized = max === min ? 0.5 : (value - min) / (max - min);
    const y = padding.top + innerHeight - normalized * innerHeight;
    return { x, y, value };
  });
}

function createSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length < 3) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  }

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const previous = points[index - 1];
    const next = points[index + 1] ?? point;
    const controlX1 = previous.x + (point.x - (points[index - 2]?.x ?? previous.x)) / 6;
    const controlY1 = previous.y + (point.y - (points[index - 2]?.y ?? previous.y)) / 6;
    const controlX2 = point.x - (next.x - previous.x) / 6;
    const controlY2 = point.y - (next.y - previous.y) / 6;
    return `${path} C${controlX1.toFixed(1)},${controlY1.toFixed(1)} ${controlX2.toFixed(1)},${controlY2.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, "");
}

function formatAxisCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

function RevenueLine({ compact = false }: { compact?: boolean }) {
  const gradientId = useId().replace(/:/g, "");
  const lineGradient = `lineStroke-${gradientId}`;
  const areaGradient = `lineArea-${gradientId}`;
  const glowGradient = `lineGlow-${gradientId}`;
  const glowFilter = `lineFilter-${gradientId}`;
  const clipId = `lineClip-${gradientId}`;
  const values = compact ? dashboardDataState.compactSeries : dashboardDataState.revenueSeries;
  const compareValues = compact ? dashboardDataState.revenueSeries : dashboardDataState.compareSeries;
  const chartPadding = { left: compact ? 46 : 56, right: 24, top: 24, bottom: 30 };
  const plotLeft = chartPadding.left;
  const plotRight = 560 - chartPadding.right;
  const plotTop = chartPadding.top;
  const plotBottom = 190 - chartPadding.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const rawMax = Math.max(...values, ...compareValues, 1);
  const axisStep = rawMax >= 1_000_000 ? 500_000 : rawMax >= 250_000 ? 250_000 : rawMax >= 100_000 ? 50_000 : 25_000;
  const axisMax = Math.max(axisStep, Math.ceil(rawMax / axisStep) * axisStep);
  const domain = { min: 0, max: axisMax };
  const axisTicks = [0, axisMax * .25, axisMax * .5, axisMax * .75, axisMax];
  const yForValue = (value: number) => plotBottom - (Math.max(0, Math.min(axisMax, value)) / axisMax) * plotHeight;
  const averageValue = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const targetY = yForValue(averageValue);
  const points = createLinePoints(values, 560, 190, chartPadding, domain);
  const comparePoints = createLinePoints(compareValues, 560, 190, chartPadding, domain);
  const path = createSmoothPath(points);
  const comparePath = createSmoothPath(comparePoints);
  const firstPoint = points[0] ?? { x: plotLeft, y: plotBottom, value: 0 };
  const finalPoint = points[points.length - 1] ?? firstPoint;
  const peakPoint = points.reduce((peak, point) => point.value > peak.value ? point : peak, firstPoint);
  const areaPath = `${path} L${finalPoint.x.toFixed(1)},${plotBottom} L${firstPoint.x.toFixed(1)},${plotBottom} Z`;
  const finalValueLabel = formatAxisCurrency(finalPoint.value);
  const trendDelta = values.length > 1 ? finalPoint.value - values[values.length - 2] : 0;
  const trendLabel = `${trendDelta >= 0 ? "+" : "-"}${formatAxisCurrency(Math.abs(trendDelta)).replace("$", "")}`;
  const chipX = Math.min(Math.max(finalPoint.x - 98, plotLeft + 12), plotRight - 102);
  const chipY = Math.min(Math.max(finalPoint.y - 52, plotTop + 6), plotBottom - 52);
  const startBadgeWidth = compact ? 44 : 52;
  const startBadgeHeight = compact ? 17 : 18;
  const endBadgeWidth = compact ? 44 : 52;
  const endBadgeHeight = compact ? 17 : 18;
  const startBadgeX = Math.min(Math.max(firstPoint.x + (compact ? 11 : 13), plotLeft + 5), plotRight - startBadgeWidth - 4);
  const startBadgeY = Math.min(Math.max(firstPoint.y + (compact ? -22 : -21), plotTop + 5), plotBottom - startBadgeHeight - 4);
  const endBadgeX = Math.min(Math.max(finalPoint.x - (compact ? 55 : 61), plotLeft + 5), plotRight - endBadgeWidth - 4);
  const endBadgeY = Math.min(Math.max(finalPoint.y + (compact ? 12 : 15), plotTop + 5), plotBottom - endBadgeHeight - 4);
  const peakBadgeX = Math.min(Math.max(peakPoint.x - 38, plotLeft + 6), plotRight - 82);
  const peakBadgeY = Math.max(peakPoint.y - 30, plotTop + 6);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const strokeGradRef = useRef<SVGLinearGradientElement>(null);

  useGSAP(() => {
    const grad = strokeGradRef.current;
    if (!grad) return;
    gsap.to(grad, {
      attr: { x1: "0.32", x2: "1.32" },
      duration: 3.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }, { scope: wrapperRef, dependencies: [] });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current || !scannerRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    scannerRef.current.style.left = `${pct}%`;
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="revenue-line-wrapper"
      onMouseMove={handleMouseMove}
    >
      <div ref={scannerRef} className="revenue-scanner" aria-hidden="true" />
      <svg className={compact ? "revenue-line compact" : "revenue-line"} viewBox="0 0 560 190" role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient ref={strokeGradRef} id={lineGradient} x1="0" x2="1">
            <stop offset="0%" stopColor="var(--chart-a)" />
            <stop offset="52%" stopColor="var(--chart-b)" />
            <stop offset="100%" stopColor="var(--accent-gold)" />
          </linearGradient>
          <linearGradient id={areaGradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-a)" stopOpacity=".32" />
            <stop offset="55%" stopColor="var(--chart-b)" stopOpacity=".16" />
            <stop offset="100%" stopColor="var(--chart-a)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={glowGradient} cx="50%" cy="32%" r="72%">
            <stop offset="0%" stopColor="var(--chart-b)" stopOpacity=".24" />
            <stop offset="58%" stopColor="var(--chart-a)" stopOpacity=".08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id={glowFilter} x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={clipId}>
            <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} rx="18" />
          </clipPath>
        </defs>
        <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} rx="18" className="revenue-plot-glass" />
        <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} rx="18" fill={`url(#${glowGradient})`} className="revenue-plot-glow" />
        {axisTicks.map((value) => {
          const y = yForValue(value);
          return <line key={`grid-${value}`} x1={plotLeft} x2={plotRight} y1={y} y2={y} className="grid-line" />;
        })}
        {axisTicks.map((value) => {
          const y = yForValue(value);
          return <text key={`axis-${value}`} x={plotLeft - 10} y={y + 3} className="axis-label axis-y-label">{formatAxisCurrency(value)}</text>;
        })}
        {months.map((month, index) => {
          const x = plotLeft + (plotWidth / Math.max(months.length - 1, 1)) * index;
          return <text key={`${month}-${index}`} x={x} y="182" className="axis-label axis-month-label">{month}</text>;
        })}
        <g clipPath={`url(#${clipId})`}>
          <line x1={plotLeft} x2={plotRight} y1={targetY} y2={targetY} className="target-line" />
          <path className="revenue-area-fill" d={areaPath} fill={`url(#${areaGradient})`} />
          <path className="compare-line" d={comparePath} />
          <path className="revenue-line-depth" style={{ stroke: `url(#${lineGradient})`, filter: `url(#${glowFilter})` }} d={path} />
          <path className="draw-line revenue-primary-line" style={{ stroke: `url(#${lineGradient})` }} d={path} />
          {points.map((point, index) => (
            <circle
              key={`${point.x}-${index}`}
              cx={point.x}
              cy={point.y}
              r={point === finalPoint || point === peakPoint ? "5.6" : "4.3"}
              className="line-dot bio-pulse"
              style={{ stroke: `url(#${lineGradient})`, animationDelay: `${index * 0.22}s` }}
            />
          ))}
        </g>
        <g className={`revenue-endpoint-marker revenue-start-marker ${compact ? "compact-marker" : ""}`}>
          <circle cx={firstPoint.x} cy={firstPoint.y} r={compact ? "8.5" : "9.8"} />
          <circle cx={firstPoint.x} cy={firstPoint.y} r={compact ? "3.4" : "4.1"} />
          <g className="endpoint-label-pill">
            <rect x={startBadgeX} y={startBadgeY} width={startBadgeWidth} height={startBadgeHeight} rx={compact ? "8.5" : "9"} />
            <text x={startBadgeX + startBadgeWidth / 2} y={startBadgeY + (compact ? 11.8 : 12.4)}>Start</text>
          </g>
        </g>
        <g className={`revenue-endpoint-marker revenue-finish-marker ${compact ? "compact-marker" : ""}`}>
          <circle cx={finalPoint.x} cy={finalPoint.y} r={compact ? "9" : "10.8"} />
          <circle cx={finalPoint.x} cy={finalPoint.y} r={compact ? "3.6" : "4.4"} />
          <g className="endpoint-label-pill">
            <rect x={endBadgeX} y={endBadgeY} width={endBadgeWidth} height={endBadgeHeight} rx={compact ? "8.5" : "9"} />
            <text x={endBadgeX + endBadgeWidth / 2} y={endBadgeY + (compact ? 11.8 : 12.4)}>End</text>
          </g>
        </g>
        {!compact && (
          <>
            <line x1={peakPoint.x} x2={peakPoint.x} y1={plotTop + 2} y2={plotBottom} className="revenue-peak-guide" />
            <g className="revenue-peak-badge">
              <rect x={peakBadgeX} y={peakBadgeY} width="76" height="22" rx="11" />
              <text x={peakBadgeX + 38} y={peakBadgeY + 15}>Peak {months[points.indexOf(peakPoint)]}</text>
            </g>
            <g className="revenue-value-chip">
              <rect x={chipX} y={chipY} width="96" height="42" rx="15" />
              <text x={chipX + 14} y={chipY + 17} className="chip-label">Latest</text>
              <text x={chipX + 14} y={chipY + 33} className="chip-value">{finalValueLabel} <tspan>{trendLabel}</tspan></text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

function RevenueBars() {
  const plotRef = useRef<HTMLDivElement>(null);
  const { replayProgress, reducedMotion } = useLivingOS();
  const factor = .65 + replayProgress * .0035;
  const [tipIndex, setTipIndex] = useState<number | null>(null);

  // GSAP cluster hover: lift + glow on mouseenter, revert on mouseleave
  useGSAP(() => {
    if (!plotRef.current || reducedMotion) return;
    const clusters = plotRef.current.querySelectorAll<HTMLElement>(".bar-cluster");
    clusters.forEach((cluster) => {
      const rects = cluster.querySelectorAll<HTMLElement>("i, b");
      cluster.addEventListener("mouseenter", () => {
        gsap.to(rects, {
          filter: "brightness(1.5) drop-shadow(0 0 14px rgba(168,85,247,0.75))",
          y: -3,
          duration: 0.22,
          stagger: 0.04,
          ease: "power2.out",
        });
      });
      cluster.addEventListener("mouseleave", () => {
        gsap.to(rects, {
          filter: "none",
          y: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
      });
    });
  }, { scope: plotRef, dependencies: [] });

  return (
    <div className="combo-bars" aria-label="Revenue and profit monthly bar chart">
      <div className="bar-axis">{["120k", "80k", "40k"].map((t) => <span key={t}>{t}</span>)}</div>
      <div className="bar-plot" ref={plotRef}>
        {bars.map((bar, i) => (
          <span
            key={i}
            className="bar-cluster"
            style={{ position: "relative" } as CSSProperties}
            onMouseEnter={() => setTipIndex(i)}
            onMouseLeave={() => setTipIndex(null)}
          >
            <i style={{ "--h": `${bar * factor}%`, "--delay": `${i * 42}ms` } as CSSProperties} />
            <b style={{ "--h": `${profitBars[i] * factor}%`, "--delay": `${i * 42 + 60}ms` } as CSSProperties} />
            {tipIndex === i && (
              <span className="chart-tip" role="tooltip">
                <strong>{barMonths[i]}</strong>
                <span>Rev: {bars[i]}%</span>
                <span>Profit: {profitBars[i]}%</span>
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="bar-months">{barMonths.map((month, i) => <span key={`${month}-${i}`}>{month}</span>)}</div>
      <div className="chart-legend"><span>Revenue</span><span>Profit</span></div>
    </div>
  );
}

function Donut({
  labels = ["Electronics", "Home", "Apparel", "Beauty", "Groceries"],
  values: valuesProp,
}: { labels?: string[]; values?: number[] }) {
  const root = useRef<HTMLDivElement>(null);
  const { activeCategory, setActiveCategory, reducedMotion } = useLivingOS();
  const values =
    valuesProp
    ?? (labels.length === 6
      ? dashboardDataState.segmentValues
      : labels[0] === "Customer"
        ? dashboardDataState.reportMixValues
        : dashboardDataState.categoryValues);
  const colors = ["#a855f7", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#60a5fa"];
  const segmentColors = colors.slice(0, values.length);

  // Overlay is shown while the Remotion cinematic plays, then removed.
  // SVG is ALWAYS rendered â€” the overlay visually covers it during the animation.
  const [playerDone, setPlayerDone] = useState(false);
  const markDone = useCallback(() => setPlayerDone(true), []);
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);

  // Unique key per mount â€” forces Remotion Player to start from frame 0 on every
  // page visit, even if React tries to reuse an existing Player instance.
  const mountKey = useRef(`${Date.now()}-${Math.random()}`);

  // Fallback: guarantee overlay goes away after animation duration + buffer,
  // even if onEnded never fires (browser autoplay block, Remotion error, etc.)
  useEffect(() => {
    if (reducedMotion) return;
    const t = setTimeout(markDone, 5500); // 120 frames @ 30 fps = 4 s + 1.5 s buffer
    return () => clearTimeout(t);
  }, [reducedMotion, markDone]);

  // Stable reference prevents Remotion Player from resetting on every parent re-render
  const playerInputProps = useMemo(
    () => ({ values, colors: segmentColors }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels.join("|")],
  );

  let offset = 0;

  return (
    <div ref={root} className="donut-layout">
      <div className="donut" role="img" aria-label={`${labels.length}-segment distribution chart`}>

        {/* SVG is always visible â€” the overlay covers it while the cinematic plays */}
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="donut-track" cx="60" cy="60" r="44" pathLength="100" />
          {values.map((value, index) => {
            const dashOffset = -offset;
            offset += value;
            const isHovered = hoveredSeg === index;
            const isActive = activeCategory === labels[index];
            return (
              <circle
                key={`${labels[index]}-${value}`}
                className={`donut-segment${isHovered ? " donut-segment-hovered" : ""}${isActive ? " donut-segment-active" : ""}`}
                cx="60"
                cy="60"
                r="44"
                pathLength="100"
                stroke={segmentColors[index]}
                strokeDasharray={`${value} ${100 - value}`}
                strokeDashoffset={dashOffset}
                strokeWidth={isHovered ? 14 : 12}
                style={{
                  "--donut-offset": `${dashOffset}`,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transform: isHovered ? "scale(1.07)" : "scale(1)",
                  filter: isHovered ? `drop-shadow(0 0 8px ${segmentColors[index]})` : "none",
                  transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), stroke-width 0.22s ease-out, filter 0.22s ease-out",
                  cursor: "pointer",
                } as CSSProperties}
                onMouseEnter={() => setHoveredSeg(index)}
                onMouseLeave={() => setHoveredSeg(null)}
              />
            );
          })}
        </svg>

        <div><strong>100%</strong><span>share</span></div>

        {/* Remotion cinematic overlay â€” solid bg covers the SVG while playing,
            then unmounts to reveal the interactive SVG underneath */}
        {!reducedMotion && !playerDone && (
          <div className="donut-player-wrap" aria-hidden="true">
            <Suspense fallback={null}>
              <DonutIntroPlayer key={mountKey.current} {...playerInputProps} onEnded={markDone} />
            </Suspense>
          </div>
        )}
      </div>

      <div className="legend">
        {labels.map((label, i) => (
          <button
            type="button"
            key={label}
            className={activeCategory === label ? "active" : ""}
            aria-pressed={activeCategory === label}
            onClick={() => setActiveCategory(activeCategory === label ? null : label)}
          >
            <i style={{ background: segmentColors[i], boxShadow: `0 0 10px ${segmentColors[i]}88` }} />
            {label}<b>{values[i]}%</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function StackedBars({ values = bars.slice(0, 7), labels = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"] }: { values?: number[]; labels?: string[] }) {
  const { replayProgress } = useLivingOS();
  return (
    <div className="stacked-bars">
      {values.slice(0, 7).map((value, i) => (
        <span key={i} style={{ "--h": `${value * (.65 + replayProgress * .0035)}%`, "--delay": `${i * 70}ms` } as CSSProperties}><i /><small>{labels[i] ?? `P${i + 1}`}</small></span>
      ))}
    </div>
  );
}

function HorizontalBars({
  labels = ["Electronics", "Home & Kitchen", "Apparel", "Beauty", "Groceries"],
  values,
}: { labels?: string[]; values?: number[] }) {
  const root = useRef<HTMLDivElement>(null);
  const { activeCategory, setActiveCategory, replayProgress, reducedMotion } = useLivingOS();
  const resolvedValues =
    values
    ?? (labels[0] === "Recency"
      ? dashboardDataState.featureValues
      : labels.length === dashboardDataState.forecastCategoryLabels.length && labels[0] === dashboardDataState.forecastCategoryLabels[0]
        ? dashboardDataState.forecastCategoryValues
        : dashboardDataState.horizontalBarValues);

  // ScrollTrigger: bars scaleX from 0 to 1 on scroll-in, staggered
  useGSAP(() => {
    if (!root.current || reducedMotion) return;
    const bars = root.current.querySelectorAll<HTMLElement>("strong");
    gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });
    ScrollTrigger.create({
      trigger: root.current,
      start: "top 150%",
      onEnter: () => {
        gsap.to(bars, {
          scaleX: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.05,
        });
      },
      once: true,
    });
  }, { scope: root, dependencies: [labels.join("|"), reducedMotion] });

  return (
    <div ref={root} className="hbars">
      {labels.map((label, i) => {
        const value = resolvedValues[i] ?? Math.max(28, 92 - i * 10);
        const selected = activeCategory === label || (activeCategory === "Home" && label === "Home & Kitchen");
        return (
          <button
            type="button"
            className={selected ? "active" : ""}
            onClick={() => setActiveCategory(selected ? null : label)}
            key={label}
          >
            <span>{label}<b>{value}%</b></span>
            <strong style={{ width: `${value * (.65 + replayProgress * .0035)}%` }} />
          </button>
        );
      })}
    </div>
  );
}

function HeatMap() {
  const root = useRef<HTMLDivElement>(null);
  const { anomalyLens, replayProgress, reducedMotion } = useLivingOS();
  const COLS = 8;

  // Entrance: diagonal wave stagger (row + col index pattern)
  useGSAP(() => {
    if (!root.current || reducedMotion) return;
    const cells = root.current.querySelectorAll("span");
    gsap.fromTo(
      cells,
      { opacity: 0, scale: 0.55 },
      {
        opacity: 1,
        scale: 0.7,
        duration: 0.42,
        ease: "back.out(2)",
        delay: (i: number) => (i % COLS + Math.floor(i / COLS)) * 0.038,
      },
    );
  }, { scope: root, dependencies: [anomalyLens, reducedMotion] });

  // Live scale from replayProgress â€” no entrance re-trigger
  useGSAP(() => {
    if (!root.current) return;
    if (reducedMotion) return;
    const cells = root.current.querySelectorAll("span");
    gsap.to(cells, {
      scale: 0.7 + replayProgress * 0.003,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, { scope: root, dependencies: [replayProgress, reducedMotion], revertOnUpdate: false });

  return (
    <div ref={root} className={anomalyLens ? "heat-grid anomaly-active" : "heat-grid"}>
      {heat.map((v, i) => (
        <span
          className={`${anomalyLens && v > 88 ? "anomaly-cell" : ""}${v > 85 ? " heat-pulse" : ""}`.trim()}
          key={i}
          style={{ "--v": v } as CSSProperties}
        >
          {v}
        </span>
      ))}
    </div>
  );
}

function ScatterPlot() {
  const { replayProgress } = useLivingOS();
  return (
    <div className="scatter">
      {segments.map((segment, i) => <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: .5 + replayProgress * .005, scale: .55 + replayProgress * .0045 }} transition={{ delay: i * .06, type: "spring" }} key={segment[0]} style={{ left: `${11 + i * 13}%`, bottom: `${18 + ((i * 17) % 58)}%`, width: `${32 + i * 5}px`, height: `${32 + i * 5}px` }} />)}
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(angleRad) * radius,
    y: cy + Math.sin(angleRad) * radius,
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function GaugeDial({ value }: { value: number }) {
  const root = useRef<HTMLDivElement>(null);
  const entranceDoneRef = useRef(false);
  const { replayProgress, reducedMotion } = useLivingOS();
  const gradientId = useId().replace(/:/g, "");
  const cx = 130;
  const cy = 132;
  const radius = 92;
  const tickInnerRadius = 76;
  const tickOuterRadius = 84;
  const needleLength = radius * 0.88;
  const startAngle = 180;
  const endAngle = 360;
  const displayedValue = Math.round(value * (.72 + replayProgress * .0028));
  const needleAngle = startAngle + (displayedValue / 100) * (endAngle - startAngle);
  const needleRotation = needleAngle - startAngle;
  const arcPath = describeArc(cx, cy, radius, startAngle, endAngle);

  useGSAP(() => {
    if (!root.current || reducedMotion) return;
    const needle = root.current.querySelector(".gauge-needle");
    const progress = root.current.querySelector(".gauge-progress");
    if (!needle || !progress) return;

    if (!entranceDoneRef.current) {
      entranceDoneRef.current = true;
      gsap.fromTo(progress, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.1, ease: "power3.out" });
      gsap.fromTo(
        needle,
        { attr: { transform: `rotate(0 ${cx} ${cy})` } },
        { attr: { transform: `rotate(${needleRotation} ${cx} ${cy})` }, duration: 1.15, ease: "elastic.out(1, .68)" },
      );
    } else {
      gsap.to(needle, {
        attr: { transform: `rotate(${needleRotation} ${cx} ${cy})` },
        duration: 0.38,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, { scope: root, dependencies: [needleRotation, reducedMotion] });

  return (
    <div ref={root} className="gauge" role="img" aria-label={`Inventory health ${displayedValue} out of 100`}>
      <svg viewBox="0 0 260 190" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <path className="gauge-track" pathLength="100" d={arcPath} />
        <path
          className="gauge-progress"
          pathLength="100"
          strokeDasharray={`${displayedValue} ${100 - displayedValue}`}
          d={arcPath}
          style={{ stroke: `url(#${gradientId})` }}
        />
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickAngle = startAngle - (tick / 100) * (startAngle - endAngle);
          const inner = polarToCartesian(cx, cy, tickInnerRadius, tickAngle);
          const outer = polarToCartesian(cx, cy, tickOuterRadius, tickAngle);
          return <line key={`tick-${tick}`} className="gauge-tick" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />;
        })}
        <g className="gauge-needle" transform={`rotate(${needleRotation} ${cx} ${cy})`}>
          <line x1={cx} y1={cy} x2={cx - needleLength} y2={cy} />
          <line className="gauge-counterweight" x1={cx} y1={cy} x2={cx + 16} y2={cy} />
          <circle className="gauge-pivot-ring" cx={cx} cy={cy} r="10" />
          <circle className="gauge-pivot-core" cx={cx} cy={cy} r="5.5" />
        </g>
      </svg>
      <div className="gauge-reading">
        <AnimatedValue value={`${displayedValue}/100`} />
        <span>Healthy stock posture</span>
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <InView
      variants={{ hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      viewOptions={{ amount: 0, margin: "200px" }}
      once
    >
      <div className="activity-feed">
        {activity.map(([title, body, time, tone], index) => (
          <motion.article initial={false} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .03, duration: 0.24 }} key={title} className={`activity-${tone}`}>
            <span />
            <div>
              <strong><TextEffect per="word" preset="fade" delay={index * 0.03} speedReveal={4} as="span">{title}</TextEffect></strong>
              <p>{body}</p>
            </div>
            <em>{time}</em>
          </motion.article>
        ))}
      </div>
    </InView>
  );
}

function LuxuryTable({ rows, wide = false }: { rows: string[][]; wide?: boolean }) {
  return (
    <div className={wide ? "lux-table wide" : "lux-table"}>
      {rows.map((row, index) => <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .03, duration: 0.22 }} key={row.join("-")}>{row.map((cell) => <span key={cell}>{cell}</span>)}</motion.div>)}
    </div>
  );
}

function SegmentCards() {
  return (
    <div className="segment-list">
      {segments.map(([name, count, ltv, action, score], i) => (
        <motion.article
          key={name}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "0px 0px 300px 0px" }}
          transition={{ delay: i * 0.04, type: "spring", stiffness: 240, damping: 24 }}
        >
          <div><strong><TextEffect per="word" preset="fade" delay={i * 0.04} speedReveal={3.5} as="span">{name}</TextEffect></strong><span>{count} customers</span></div>
          <em>{ltv} CLV</em>
          <p>{action}</p>
          <motion.b
            initial={{ width: "0%" }}
            whileInView={{ width: `${score}%` }}
            viewport={{ once: true, margin: "0px 0px 300px 0px" }}
            transition={{ delay: 0.1 + i * 0.04, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.article>
      ))}
    </div>
  );
}

function RiskMatrix() {
  return (
    <div className="risk-matrix">
      {["Low", "Medium", "High", "Critical"].map((label, i) => <div key={label}><span>{label}</span><strong>{[1941, 602, 247, 42][i]}</strong></div>)}
    </div>
  );
}

// â”€â”€ EXECUTIVE PULSE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ExecTone = "purple" | "cyan" | "pink" | "danger";

type ExecPulseItem = {
  title: string; value: string; label: string; tone: ExecTone;
  icon: typeof Activity; delta: string;
};

function toExecTone(tone?: string): ExecTone {
  if (tone === "danger") return "danger";
  if (tone === "cyan" || tone === "green") return "cyan";
  if (tone === "gold") return "pink";
  return "purple";
}

function buildExecutivePulseItems(): ExecPulseItem[] {
  const [revenue, orders, customers, churn] = dashboardDataState.kpis;
  return [
    {
      title: "Primary Signal",
      value: revenue?.value ?? dashboardDataState.hero.overview.primary.replace(/\s+revenue$/i, ""),
      label: revenue?.label ?? "Revenue",
      tone: toExecTone(revenue?.tone),
      icon: revenue?.icon ?? CircleDollarSign,
      delta: revenue?.delta ?? dashboardDataState.hero.overview.tertiary,
    },
    {
      title: "Operational Read",
      value: orders?.value ?? dashboardDataState.hero.overview.secondary.replace(/\s+orders$/i, ""),
      label: orders?.label ?? "Orders",
      tone: toExecTone(orders?.tone),
      icon: orders?.icon ?? Activity,
      delta: orders?.delta ?? "Live",
    },
    {
      title: "Customer Health",
      value: customers?.value ?? dashboardDataState.navStats.segmentation,
      label: customers?.label ?? "Customers",
      tone: "pink",
      icon: customers?.icon ?? Users,
      delta: customers?.delta ?? "Live",
    },
    {
      title: "Churn Risk Index",
      value: churn?.value ?? dashboardDataState.navStats.churn,
      label: churn?.label ?? "Churn",
      tone: "danger",
      icon: churn?.icon ?? TrendingDown,
      delta: churn?.delta ?? "Monitored",
    },
  ];
}

function ExecPulseCard({ title, value, label, tone, icon: Icon, delta }: {
  title: string; value: string; label: string; tone: ExecTone;
  icon: typeof Activity; delta: string;
}) {
  const { performanceTier, reducedMotion } = useLivingOS();
  const isNeg = delta.startsWith("-");
  const DeltaIcon = isNeg ? TrendingDown : TrendingUp;
  const canTilt = performanceTier !== "minimal" && !reducedMotion;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  const cardScale = useSpring(1, { stiffness: 300, damping: 22 });
  const cardY = useSpring(0, { stiffness: 300, damping: 22 });
  const glareStyle = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(circle at ${((x as number) + 0.5) * 100}% ${((y as number) + 0.5) * 100}%, rgba(255,255,255,0.18) 0%, transparent 60%)`
  );

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
    cardScale.set(1.025);
    cardY.set(-8);
  }, [mouseX, mouseY, cardScale, cardY]);

  const handleTiltLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    cardScale.set(1);
    cardY.set(0);
  }, [mouseX, mouseY, cardScale, cardY]);

  return (
    <motion.article
      className={`exec-card exec-card-${tone}`}
      style={canTilt ? { perspective: 800, rotateX, rotateY, scale: cardScale, y: cardY } : undefined}
      onMouseMove={canTilt ? handleTiltMove : undefined}
      onMouseLeave={canTilt ? handleTiltLeave : undefined}
    >
      <span className="exec-card-glow" aria-hidden="true" />
      <motion.span className="exec-card-glare" aria-hidden="true" style={canTilt ? { background: glareStyle } : undefined} />
      <div className="exec-card-header">
        <span className="exec-card-title"><TextEffect per="word" preset="fade" delay={0.04} speedReveal={4.5} as="span">{title}</TextEffect></span>
        <span className="exec-card-icon"><Icon size={20} /></span>
      </div>
      <AnimatedValue className="exec-card-value" value={value} />
      <div className="exec-card-footer">
        <span className="exec-card-label"><TextEffect per="word" preset="fade" delay={0.1} speedReveal={4.5} as="span">{label}</TextEffect></span>
        <span className={`exec-card-delta ${isNeg ? "neg" : "pos"}`}>
          <DeltaIcon size={13} strokeWidth={2.8} />{delta}
        </span>
      </div>
    </motion.article>
  );
}

function ExecutivePulseSection() {
  const [region, setRegion] = useState("all");
  const [timeframe, setTimeframe] = useState("ytd");
  const execKpis = buildExecutivePulseItems();
  const tfLabels: Record<string, string> = {
    ytd: "Year to Date", last30: "Last 30 Days", last90: "Last 90 Days",
    q1: "Q1 2026", q2: "Q2 2026",
  };
  return (
    <section className="exec-pulse animate-in">
      <div className="exec-pulse-head">
        <div>
          <span className="eyebrow exec-pulse-eyebrow">
            <RadioTower size={16} />{" "}
            <TextEffect per="char" preset="blur" delay={0.1} speedReveal={2} as="span">Executive Pulse</TextEffect>
          </span>
          <h2 className="exec-pulse-h2">
            <TextEffect per="word" preset="fade-in-blur" delay={0.2} speedReveal={1.8} speedSegment={1.2} as="span">Live performance intelligence</TextEffect>
          </h2>
        </div>
        <AnimatedGroup className="exec-pulse-controls" preset="slide" as="div" asChild="div">
          <label className="exec-filter">
            <RadioTower size={14} />
            <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Filter by region">
              <option value="all">All Regions</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
            </select>
          </label>
          <label className="exec-filter">
            <CalendarDays size={14} />
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} aria-label="Filter by timeframe">
              <option value="ytd">Year to Date</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="q1">Q1 2026</option>
              <option value="q2">Q2 2026</option>
            </select>
          </label>
        </AnimatedGroup>
      </div>

      <div className="exec-pulse-grid">
        {execKpis.map((kpi) => <ExecPulseCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="exec-pulse-chart">
        <div className="exec-pulse-chart-head">
          <span>Revenue momentum â€” {tfLabels[timeframe] ?? timeframe}</span>
          <div className="exec-chart-legend">
            <span><i />Revenue</span>
            <span><i />Target</span>
          </div>
        </div>
        <RevenueLine />
      </div>
    </section>
  );
}

function OverviewPage() {
  const { performanceTier } = useLivingOS();
  return (
    <>
      <ExecutivePulseSection />
      <FilterDock />
      <KpiGrid />
      <section className="dashboard-grid overview-layout">
        <Panel className="wide-panel" title="Revenue Trend" kicker="Daily revenue across selected window" icon={LineChart}><RevenueLine /><RevenueBars /></Panel>
        <Panel title="Product Category Analysis" kicker="Revenue share by category" icon={Layers3}><Donut labels={dashboardDataState.categoryLabels} values={dashboardDataState.categoryValues} /></Panel>
        <Panel title="Live Activity Feed" kicker="Model, inventory, and segment stream" icon={RadioTower}><ActivityFeed /></Panel>
        <Panel title="Monthly Performance" kicker="Revenue and profit by month" icon={BarChart3}><StackedBars values={bars.slice(-7)} labels={months} /></Panel>
        <Panel title="Top Selling Products" kicker="Ranked by total revenue" icon={Crown}><LuxuryTable rows={dashboardDataState.topProductsRows} /></Panel>
        <Panel title="3D Volume Analysis" kicker="Interactive three-dimensional volume bars" icon={BarChart3}>
          {performanceTier === "minimal" ? (
            <RevenueBars />
          ) : (
            <Suspense fallback={<RevenueBars />}>
              <VolumeBars3D
                values={dashboardDataState.bars}
                labels={dashboardDataState.barMonths}
                title="Monthly revenue volume"
              />
            </Suspense>
          )}
        </Panel>
      </section>
    </>
  );
}

function SegmentationPage() {
  const [activeTab, setActiveTab] = useState("Segments");
  const tabs = ["Segments", "RFM Analysis", "Clusters", "Playbooks"];

  return (
    <>
      <KpiGrid items={dashboardDataState.segmentationKpis} />
      <section className="tab-strip animate-in" aria-label="Customer intelligence views">
        <div className="tab-list">
          {tabs.map((tab) => (
            <button type="button" aria-pressed={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>
              {activeTab === tab && (
                <motion.span className="tab-pill" layoutId="seg-tab-pill" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              {tab}
            </button>
          ))}
        </div>
        <span className="tab-status">Viewing {activeTab}</span>
      </section>
      <section className="dashboard-grid">
        <Panel title="Segment Distribution" kicker="Share of customer base" icon={Users}><Donut labels={dashboardDataState.segmentLabels} values={dashboardDataState.segmentValues} /></Panel>
        <Panel title="Customer Lifetime Value" kicker="Average CLV by segment" icon={Gem}><HorizontalBars labels={dashboardDataState.horizontalBarLabels} values={dashboardDataState.horizontalBarValues} /></Panel>
        <Panel title="KMeans Cluster Scatter" kicker="Recency vs monetary, sized by frequency" icon={Brain}><ScatterPlot /></Panel>
        <Panel title="RFM Score Heatmap" kicker="Recency, frequency, monetary heat" icon={Eye}><HeatMap /></Panel>
        <Panel title="Segment Force Graph" kicker="Live physics â€” customer topology" icon={RadioTower}><ForceGraph /></Panel>
        <Panel title="Territory Map" kicker="Voronoi â€” geographic density zones" icon={Layers3}><VoronoiCanvas /></Panel>
        <Panel className="wide-panel" title="Customer Insights & Playbook" kicker="Recommended action per segment" icon={Sparkles}><SegmentCards /></Panel>
      </section>
    </>
  );
}

function ChurnPage() {
  return (
    <>
      <KpiGrid items={dashboardDataState.churnKpis} />
      <section className="dashboard-grid">
        <Panel title="Churn Probability Distribution" kicker="Across the customer base" icon={BarChart3}><RevenueBars /></Panel>
        <Panel title="Risk Analysis" kicker="Customers by risk band" icon={Gauge}><RiskMatrix /></Panel>
        <Panel title="Feature Importance" kicker="What drives churn" icon={Brain}><HorizontalBars labels={dashboardDataState.featureLabels} values={dashboardDataState.featureValues} /></Panel>
        <Panel title="Churn Timeline" kicker="Monthly churn events over last 6 months" icon={CalendarDays}><StackedBars values={bars.slice(-6)} labels={months} /></Panel>
        <Panel title="Churn Neural Network" kicker="Animated prediction model visualization" icon={Brain}><ChurnNeuralNet /></Panel>
        <Panel className="wide-panel" title="Retention Recommendation Engine" kicker="Top at-risk customers + suggested action" icon={Zap}><LuxuryTable rows={dashboardDataState.churnRecommendationRows} wide /></Panel>
      </section>
    </>
  );
}

function ForecastingPage() {
  const { scenario, setScenario } = useLivingOS();
  const demandBoost = scenario.demand;
  const marketingBoost = scenario.marketing;
  const seasonalFactor = scenario.seasonal;

  const projected = (3.20 + demandBoost * 0.028 + marketingBoost * 0.018 + seasonalFactor * 0.016).toFixed(2);
  const delta = `+${(demandBoost * 0.85 + marketingBoost * 0.42 + seasonalFactor * 0.22).toFixed(1)}%`;

  return (
    <>
      <section className="control-grid animate-in">
        <Control title="Forecast period" value="30 Days" />
        <Control title="Metric" value="Revenue" />
        <div className="scenario-control">
          <label><span>Demand Increase</span><strong>+{demandBoost}%</strong></label>
          <input type="range" min={0} max={40} value={demandBoost} onChange={(e) => setScenario((current) => ({ ...current, demand: Number(e.target.value) }))} aria-label="Demand boost percentage" />
        </div>
        <div className="scenario-control">
          <label><span>Marketing Impact</span><strong>+{marketingBoost}%</strong></label>
          <input type="range" min={0} max={40} value={marketingBoost} onChange={(e) => setScenario((current) => ({ ...current, marketing: Number(e.target.value) }))} aria-label="Marketing impact percentage" />
        </div>
        <div className="scenario-control">
          <label><span>Seasonal Factor</span><strong>+{seasonalFactor}%</strong></label>
          <input type="range" min={0} max={20} value={seasonalFactor} onChange={(e) => setScenario((current) => ({ ...current, seasonal: Number(e.target.value) }))} aria-label="Seasonal factor percentage" />
        </div>
      </section>
      <KpiGrid items={dashboardDataState.forecastingKpis.map((item, index) => index === 0 ? { ...item, delta, value: item.value } : item)} />
      <section className="dashboard-grid">
        <Panel className="wide-panel" title="Historical Demand + Forecast" kicker="Confidence band and target line" icon={LineChart}><RevenueLine /><RevenueBars /></Panel>
        <Panel title="Seasonal Trend" kicker="30-day rolling average" icon={Activity}><RevenueLine compact /></Panel>
        <Panel title="Weekly Trend" kicker="Average demand by day of week" icon={CalendarDays}><StackedBars values={bars.slice(-7)} labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} /></Panel>
        <Panel title="Forecast Detail" kicker="Day-by-day projection" icon={Table2}><LuxuryTable rows={dashboardDataState.forecastRows} /></Panel>
        <Panel title="Category Forecast" kicker="Projected demand by product line" icon={Layers3}><HorizontalBars labels={dashboardDataState.forecastCategoryLabels} values={dashboardDataState.forecastCategoryValues} /></Panel>
      </section>
    </>
  );
}

function InventoryPage() {
  return (
    <>
      <KpiGrid items={dashboardDataState.inventoryKpis} />
      <section className="dashboard-grid">
        <Panel className="inventory-gauge-panel" title="Inventory Health" kicker="Weighted across all SKUs" icon={Gauge} storyEnabled={false}><GaugeDial value={dashboardDataState.inventoryHealthScore} /></Panel>
        <Panel title="Stock Alerts" kicker="Items needing attention now" icon={Bell}><ActivityFeed /></Panel>
        <Panel title="Product Stock Heatmap" kicker="Average days-of-cover by category" icon={Layers3}><HeatMap /></Panel>
        <Panel title="Reorder Schedule" kicker="Upcoming fulfillment orders" icon={CalendarDays}><StackedBars values={heat.slice(0, 7)} labels={["P1", "P2", "P3", "P4", "P5", "P6", "P7"]} /></Panel>
        <Panel className="wide-panel" title="Inventory Recommendations" kicker="Suggested reorder plan" icon={Table2}><LuxuryTable rows={dashboardDataState.inventoryRecommendationRows} /></Panel>
      </section>
    </>
  );
}

function ReportsPage() {
  const reports = ["Customer Report", "Sales Report", "Churn Report", "Forecast Report", "Inventory Report"];
  const [activeReport, setActiveReport] = useState(reports[0]);

  return (
    <>
      <section className="report-builder animate-in">
        <div>
          <span className="eyebrow"><Table2 size={16} /> <TextEffect per="char" preset="blur" delay={0.1} speedReveal={2} as="span">Report builder</TextEffect></span>
          <h2><TextEffect per="word" preset="fade-in-blur" delay={0.2} speedReveal={2} as="span">Board-ready exports</TextEffect></h2>
        </div>
        {reports.map((item) => <button type="button" aria-pressed={activeReport === item} className={activeReport === item ? "active" : ""} onClick={() => setActiveReport(item)} key={item}>{item}</button>)}
      </section>
      <KpiGrid items={dashboardDataState.reportsKpis} />
      <section className="dashboard-grid">
        <Panel className="wide-panel" title={`${activeReport} Preview`} kicker="Live preview with CSV / Excel / PDF export" icon={CloudDownload}>
          <LuxuryTable rows={dashboardDataState.reportPreviewRows[activeReport] ?? []} wide />
        </Panel>
        <Panel title="Report Velocity" kicker="Exports generated across the week" icon={BarChart3}><RevenueBars /></Panel>
        <Panel title="Export Readiness Trend" kicker="Rows validated, queued, and delivered" icon={LineChart}><RevenueLine compact /></Panel>
        <Panel title="Report Mix" kicker="Customer, churn, forecast, and stock packs" icon={Layers3}><Donut labels={dashboardDataState.reportMixLabels} values={dashboardDataState.reportMixValues} /></Panel>
        <Panel title="Export Queue" kicker="Recent report automation" icon={Database}><ActivityFeed /></Panel>
      </section>
    </>
  );
}

function MediaStudioPage() {
  const formats = ["1920x1080", "1080x1080", "1080x1920", "1200x628", "3840x2160"];
  const [storyType, setStoryType] = useState<MediaStoryType>(MEDIA_STORY_TYPES[0]);
  const [format, setFormat] = useState(formats[0]);
  const [duration, setDuration] = useState(45);
  const [captioned, setCaptioned] = useState(true);
  const [narration, setNarration] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderDone, setRenderDone] = useState(false);

  useEffect(() => {
    if (!rendering) return;
    const timer = window.setInterval(() => {
      setRenderProgress((value) => {
        if (value >= 100) {
          setRendering(false);
          setRenderDone(true);
          return 100;
        }
        return Math.min(100, value + 8);
      });
    }, 220);
    return () => window.clearInterval(timer);
  }, [rendering]);

  const _d = dashboardDataState;
  const _donutColors = ["#a855f7", "#22d3ee", "#34d399", "#fbbf24", "#f472b6"];
  const formatMixLabels = ["Customer", "Sales", "Churn", "Forecast", "Inventory"];
  const formatMixValues = _d.reportMixValues;
  const parseMetricValue = (value: string) => {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const moduleStoryType =
    storyType === "Executive Briefing" ? "executive" :
    storyType === "Customer Segment" ? "customer-segment" :
    storyType === "Churn Intelligence" ? "churn-intel" :
    storyType === "Demand Forecast" ? "demand-forecast" :
    storyType === "Inventory Command" ? "inventory-opt" :
    storyType === "Analytics Report" ? "analytics-report" :
    storyType === "Platform Intelligence" ? "platform-intel" :
    "master-reel";

  const executiveKpis = _d.kpis.slice(0, 4).map((item) => ({
    label: item.label,
    value: item.value,
    delta: item.delta,
  }));
  const customerSegments = (_d.segmentLabels.length ? _d.segmentLabels : _d.categoryLabels)
    .slice(0, 4)
    .map((label, index) => ({
      label,
      value: Number(((_d.segmentValues[index] ?? _d.categoryValues[index] ?? 0)).toFixed(1)),
      color: _donutColors[index % _donutColors.length],
    }));
  const churnRiskTiers = _d.churnKpis.slice(0, 4).map((item, index) => ({
    label: item.label,
    count: Math.max(1, Math.round(parseMetricValue(item.value))),
    pct: Number((parseMetricValue(item.delta) || [14.2, 25.6, 37.4, 22.8][index] || 0).toFixed(1)),
    color: ["#ef4444", "#f97316", "#fbbf24", "#34d399"][index] ?? "#a855f7",
  }));
  const inventorySkus = (_d.horizontalBarLabels.length ? _d.horizontalBarLabels : _d.categoryLabels)
    .slice(0, 6)
    .map((label, index) => {
      const stock = Math.max(10, Math.round(_d.horizontalBarValues[index] ?? _d.categoryValues[index] ?? 50));
      return {
        label,
        stock,
        reorder: Math.max(15, Math.round(stock * 0.62)),
      };
    });
  const analyticsRows = _d.reportsKpis.slice(0, 4).map((item) => {
    const deltaValue = parseMetricValue(item.delta);
    return {
      label: item.label,
      val: item.value,
      trend: deltaValue < 0 ? "down" as const : deltaValue > 0 ? "up" as const : "flat" as const,
    };
  });
  const platformMetrics = [
    { label: "Executive Revenue", value: _d.navStats.overview, status: "ok" as const },
    { label: "Customer Coverage", value: _d.navStats.segmentation, status: "ok" as const },
    { label: "Churn Exposure", value: _d.navStats.churn, status: "warn" as const },
    { label: "Forecast Confidence", value: _d.navStats.forecasting, status: "ok" as const },
    { label: "Inventory Health", value: _d.navStats.inventory, status: "ok" as const },
    { label: "Report Readiness", value: _d.navStats.reports, status: "ok" as const },
  ];
  const masterMetrics = [
    { label: "Revenue", value: _d.navStats.overview, color: "#f59e0b" },
    { label: "Customers", value: _d.navStats.segmentation, color: "#22d3ee" },
    { label: "Churn", value: _d.navStats.churn, color: "#ef4444" },
    { label: "Forecast", value: _d.navStats.forecasting, color: "#34d399" },
    { label: "Inventory", value: _d.navStats.inventory, color: "#a855f7" },
    { label: "Reports", value: _d.navStats.reports, color: "#6366f1" },
  ];

  // Render queue: current selection + next 3 different story types
  const _queueOthers = MEDIA_STORY_TYPES.filter(t => t !== storyType).slice(0, 3);
  const queueRows: [string, string, string][] = [
    [storyType, format, rendering ? `${renderProgress}%` : "Ready"],
    ..._queueOthers.map(t => [t, "1920x1080", "Available"] as [string, string, string]),
  ];

  // Scene breakdown driven by the selected composition and live metrics.
  const _topCategory = _d.categoryValues.length > 0 ? `${_d.categoryValues[0].toFixed(1)}%` : "—";
  const sceneRows: [string, string, string][] =
    moduleStoryType === "inventory-opt"
      ? [["01", "Stock command open", _d.navStats.inventory], ["02", "SKU balance", `${inventorySkus.length} live SKUs`], ["03", "Health gauge", `${_d.inventoryHealthScore}/100`], ["04", "Recovery close", _d.hero.inventory.tertiary]]
      : moduleStoryType === "customer-segment"
      ? [["01", "Segment open", _d.navStats.segmentation], ["02", "Cluster spread", `${customerSegments.length} clusters`], ["03", "Share distribution", _topCategory], ["04", "Action close", _d.hero.segmentation.tertiary]]
      : moduleStoryType === "churn-intel"
      ? [["01", "Risk scan", _d.navStats.churn], ["02", "Tier reveal", `${churnRiskTiers.length} risk bands`], ["03", "Heat progression", `${_d.heat.length} tracked signals`], ["04", "Retention close", _d.hero.churn.tertiary]]
      : moduleStoryType === "demand-forecast"
      ? [["01", "Demand signal", _d.navStats.forecasting], ["02", "Historical run", `${_d.compareSeries.slice(-8).length} points`], ["03", "Forecast extension", `${_d.revenueSeries.slice(-7).length} points`], ["04", "Planning close", _d.hero.forecasting.tertiary]]
      : moduleStoryType === "analytics-report"
      ? [["01", "Board open", _d.navStats.reports], ["02", "Report pack", `${analyticsRows.length} report metrics`], ["03", "Line summary", `${_d.revenueSeries.length} timeline points`], ["04", "Export close", _d.hero.reports.tertiary]]
      : moduleStoryType === "platform-intel"
      ? [["01", "Control open", _d.hero.overview.tertiary], ["02", "System status", `${platformMetrics.length} live controls`], ["03", "Platform pulse", _d.navStats.reports], ["04", "Operations close", _d.hero.reports.tertiary]]
      : moduleStoryType === "master-reel"
      ? [["01", "Brand open", "RetailPulse"], ["02", "Module sweep", `${MEDIA_STORY_TYPES.length - 1} modules`], ["03", "Signal montage", _d.navStats.overview], ["04", "Showcase close", _d.hero.overview.tertiary]]
      : [["01", "Executive open", _d.navStats.overview], ["02", "KPI reveal", `${executiveKpis.length} hero metrics`], ["03", "Trend bars", `${_d.bars.length} signals`], ["04", "Command close", _d.hero.overview.tertiary]];

  return (
    <>
      <section className="media-studio animate-in">
        <div className="media-control-panel">
          <span className="eyebrow"><Film size={16} /> <TextEffect per="char" preset="blur" delay={0.1} speedReveal={2} as="span">Remotion studio</TextEffect></span>
          <h2><TextEffect per="word" preset="fade-in-blur" delay={0.2} speedReveal={1.8} speedSegment={1.2} as="span">Executive video generator</TextEffect></h2>
          <p>Use the current dashboard signals to preview cinematic reports, chart stories, and board-ready operational replays.</p>

          <label>
            <span>Composition</span>
            <select value={storyType} onChange={(event) => setStoryType(event.target.value as MediaStoryType)} aria-label="Select Remotion composition">
              {MEDIA_STORY_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <div className="media-format-grid">
            {formats.map((preset) => (
              <button type="button" key={preset} className={format === preset ? "active" : ""} aria-pressed={format === preset} onClick={() => setFormat(preset)}>
                {preset}
              </button>
            ))}
          </div>

          <div className="scenario-control">
            <label><span>Duration</span><strong>{duration}s</strong></label>
            <input type="range" min={15} max={90} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} aria-label="Video duration seconds" />
          </div>

          <div className="media-toggles">
            <button type="button" className={captioned ? "active" : ""} aria-pressed={captioned} onClick={() => setCaptioned(!captioned)}>Captions</button>
            <button type="button" className={narration ? "active" : ""} aria-pressed={narration} onClick={() => setNarration(!narration)}>Narration</button>
          </div>

          <button
            type="button"
            className={`primary-action media-render${renderDone ? " render-success" : ""}`}
            onClick={() => { setRenderProgress(0); setRenderDone(false); setRendering(true); }}
          >
            {renderDone ? (
              <>
                <svg className="success-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={17} height={17}>
                  <motion.path
                    d="M5 13l4 4L19 7"
                    strokeDasharray={26}
                    initial={{ strokeDashoffset: 26 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  />
                </svg>
                Rendered!
              </>
            ) : (
              <>
                <CloudDownload size={17} />
                {rendering ? `Rendering ${renderProgress}%` : "Generate Play Data Video"}
              </>
            )}
          </button>
        </div>

        <div className="media-preview">
          <div className="media-preview-head">
            <div><span>{format}</span><strong>{storyType}</strong></div>
            <em>{captioned ? "Captions on" : "Captions off"} / {narration ? "Narration queued" : "Silent preview"}</em>
          </div>
          <Suspense fallback={<div className="story-loading">Loading Remotion preview...</div>}>
            <div className="media-remotion-frame">
              <ModuleStoryPlayer
                storyType={moduleStoryType}
                durationSeconds={duration}
                captionsEnabled={captioned}
                narrationEnabled={narration}
                previewFormat={format}
                ebTitle="RetailPulse Executive Briefing"
                ebKpis={executiveKpis}
                ebBarSeries={_d.bars}
              csTitle="RetailPulse Customer Segments"
              csSegments={customerSegments}
              ciTitle="RetailPulse Churn Intelligence"
              ciRiskTiers={churnRiskTiers}
              ciHeatValues={_d.heat}
              dfTitle="RetailPulse Demand Forecast"
              dfHistorical={_d.compareSeries.slice(-8)}
              dfForecast={_d.revenueSeries.slice(-7)}
              dfMonths={_d.revenueMonths.slice(-15)}
              ioTitle="RetailPulse Inventory Command"
              ioSkus={inventorySkus}
              ioHealthScore={_d.inventoryHealthScore}
              arTitle="RetailPulse Analytics Report"
              arLineSeries={_d.revenueSeries.slice(-12)}
              arMonths={_d.revenueMonths.slice(-12)}
              arRows={analyticsRows}
              piTitle="RetailPulse Platform Intelligence"
              piMetrics={platformMetrics}
              mrBrandName="RetailPulse"
              mrKeyMetrics={masterMetrics}
            />
            </div>
          </Suspense>
        </div>
      </section>

      <KpiGrid items={[
        { label: "Story Scenes", value: `${MEDIA_STORY_TYPES.length}`, delta: "Live", icon: Film, tone: "violet" },
        { label: "Render Queue", value: rendering ? `${renderProgress}%` : "Ready", delta: format, icon: CloudDownload, tone: "cyan" },
        { label: "Export Readiness", value: _d.hero.reports.tertiary, delta: _d.hero.reports.secondary, icon: TrendingUp, tone: "green" },
        { label: "Caption Coverage", value: captioned ? "100%" : "0%", delta: captioned ? "On" : "Off", icon: Table2, tone: "gold" },
      ]} />

      <section className="dashboard-grid">
        <Panel title="Render Queue" kicker="Export workflow" icon={CloudDownload}>
          <LuxuryTable rows={queueRows} />
        </Panel>
        <Panel title="Story Scenes" kicker="Current composition sequence" icon={Film}>
          <LuxuryTable rows={sceneRows} />
        </Panel>
        <Panel className="wide-panel" title="Video Engagement Forecast" kicker="Projected watch-through and executive attention" icon={LineChart}><RevenueLine /><RevenueBars /></Panel>
        <Panel title="Story Data Mix" kicker="Live composition weight by active data pack" icon={Layers3}><Donut labels={formatMixLabels} values={formatMixValues} /></Panel>
        <Panel title="Scene Timing Balance" kicker="Intro, chart reveal, insight, and close" icon={BarChart3}><StackedBars /></Panel>
      </section>
    </>
  );
}

function AccordionPanel({ title, kicker, icon: Icon, children, defaultOpen = false }: {
  title: string; kicker: string; icon: typeof Activity; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`t-acc-item${open ? " is-open" : ""}`}>
      <button type="button" className="t-acc-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon size={17} className="acc-icon" />
        <div className="acc-title-group">
          <strong><TextEffect per="word" preset="fade" delay={0.05} speedReveal={2.5} as="span">{title}</TextEffect></strong>
          <span><TextEffect per="word" preset="fade" delay={0.1} speedReveal={3} as="span">{kicker}</TextEffect></span>
        </div>
        <svg className="acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className="t-acc-panel" aria-hidden={!open}>
        <div className="t-acc-panel-inner">{children}</div>
      </div>
    </div>
  );
}

function SettingsPage({ theme, setTheme }: { theme: ThemeMode; setTheme: (theme: ThemeMode) => void }) {
  const isLight = theme === "light";

  return (
    <section className="settings-grid animate-in">
      <AccordionPanel title="Appearance" kicker="Theme" icon={isLight ? Sun : Moon} defaultOpen>
        <div className="theme-toggle-row">
          <div>
            <strong>{isLight ? "Light theme" : "Dark theme"}</strong>
            <span>{isLight ? "Warm gold on porcelain" : "Neon violet on deep indigo"}</span>
          </div>
          <button
            type="button"
            className={`theme-toggle ${isLight ? "is-light" : ""}`}
            role="switch"
            aria-checked={isLight}
            aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
            onClick={() => setTheme(isLight ? "dark" : "light")}
          >
            <Moon className="toggle-moon" size={17} />
            <Sun className="toggle-sun" size={17} />
            <span className="toggle-thumb" />
          </button>
        </div>
        <p className="settings-copy">Use the switch to move between the deep-indigo neon workspace and the light porcelain-and-gold workspace.</p>
      </AccordionPanel>
      <AccordionPanel title="Model Settings" kicker="Configuration" icon={Brain}>
        <Control title="KMeans clusters" value="5 clusters" />
        <Control title="Inventory service level" value="95.0%" />
        <Control title="Churn model" value="Balanced logistic" />
      </AccordionPanel>
      <AccordionPanel title="Forecast Settings" kicker="Configuration" icon={LineChart}>
        <Control title="Default horizon" value="30 days" />
        <Control title="Latest verified MAPE" value="22.53%" />
        <Control title="Engine" value="Prophet + regressors" />
      </AccordionPanel>
      <AccordionPanel title="User Management" kicker="Access control" icon={Lock}>
        <LuxuryTable rows={[["Rashad", "Platform Integration", "Owner"], ["Kaviya", "Data Engineering", "Editor"], ["Rohinee", "Customer Intelligence", "Editor"], ["Sachin", "Forecasting", "Analyst"]]} />
      </AccordionPanel>
      <AccordionPanel title="Notification Settings" kicker="Configuration" icon={Bell}>
        <Control title="Email alerts" value="Enabled" />
        <Control title="Alert topics" value="Critical stock, churn spikes" />
        <Control title="Digest recipient" value="ops@retailpulse.io" />
      </AccordionPanel>
      <AccordionPanel title="Security & Audit" kicker="Governance" icon={ShieldCheck}>
        <ActivityFeed />
      </AccordionPanel>
    </section>
  );
}

function CommandModal({ open, onClose, setActivePage }: { open: boolean; onClose: () => void; setActivePage: (id: PageId) => void }) {
  const [query, setQuery] = useState("");
  const { anomalyLens, setAnomalyLens, setReplaying, setReplayProgress, setActiveCategory, setBriefingOpen } = useLivingOS();
  const shouldReduceMotion = useReducedMotion();
  const results = navItems.filter((item) => `${item.label} ${item.kicker}`.toLowerCase().includes(query.trim().toLowerCase()));
  const normalized = query.trim().toLowerCase();
  const actions = [
    { id: "brief", label: "Generate executive briefing", detail: "Summarize live operations", show: !normalized || "briefing summary insight".includes(normalized), run: () => setBriefingOpen(true) },
    { id: "anomaly", label: anomalyLens ? "Disable anomaly lens" : "Enable anomaly lens", detail: "Highlight abnormal signals", show: !normalized || "anomaly risk scan".includes(normalized), run: () => setAnomalyLens(!anomalyLens) },
    { id: "replay", label: "Replay the operating day", detail: "Animate every widget from open to now", show: !normalized || "replay timeline history".includes(normalized), run: () => { setReplayProgress(0); setReplaying(true); } },
    { id: "electronics", label: "Focus Electronics signals", detail: "Link category charts and filters", show: !normalized || "electronics category focus".includes(normalized), run: () => { setActiveCategory("Electronics"); setActivePage("overview"); } },
    { id: "media", label: "Open Media Studio", detail: "Preview Remotion video stories", show: !normalized || "media video remotion export story".includes(normalized), run: () => setActivePage("media") },
  ].filter((action) => action.show);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <motion.section className="command-modal" role="dialog" aria-modal="true" aria-labelledby="command-title" initial={{ y: shouldReduceMotion ? 0 : -20, scale: shouldReduceMotion ? 1 : 0.9, opacity: 0, filter: shouldReduceMotion ? "none" : "blur(10px)" }} animate={{ y: 0, scale: 1, opacity: 1, filter: "none" }} exit={{ y: shouldReduceMotion ? 0 : -10, scale: shouldReduceMotion ? 1 : 0.96, opacity: 0, filter: shouldReduceMotion ? "none" : "blur(6px)" }} transition={{ type: "spring", stiffness: 360, damping: 28 }}>
            <div className="modal-head"><Command size={18} /><strong id="command-title">Command search</strong><button type="button" aria-label="Close command search" onClick={onClose}><X size={18} /></button></div>
            <label className="modal-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search dashboard modules, customers, reports..." /></label>
            <div className="command-results">
              {actions.map((action) => (
                <button key={action.id} className="command-result command-action" onClick={() => { action.run(); onClose(); }}>
                  <Sparkles size={17} /><span>{action.label}</span><em>{action.detail}</em>
                </button>
              ))}
              {results.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} className="command-result" aria-label={`Open ${item.label}`} onClick={() => { setActivePage(item.id); onClose(); }}><Icon size={17} /><span>{fuzzyHighlight(item.label, query)}</span><em>{item.kicker}</em></button>;
              })}
              {results.length === 0 && actions.length === 0 ? <p className="empty-result">No matching dashboard module or command.</p> : null}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AlertsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="alerts-title" initial={{ x: shouldReduceMotion ? 0 : 420 }} animate={{ x: 0 }} exit={{ x: shouldReduceMotion ? 0 : 420 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="drawer-head"><strong id="alerts-title">Live notifications</strong><button type="button" aria-label="Close notifications" onClick={onClose}><X size={18} /></button></div>
            <ActivityFeed />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Toast({ message }: { message: string }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {message ? (
        <motion.div className="toast" role="status" aria-live="polite" initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18, scale: shouldReduceMotion ? 1 : .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}>
          <Sparkles size={17} />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Hero panel text stagger variants (transitions-dev 18-texts-reveal pattern)
const heroContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};
const heroItemVariants = {
  initial: { opacity: 0, y: 14, filter: "blur(1.5px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
};

// Direction-aware page slide: matches transitions-dev page side-by-side token values.
// Forward (+1) slides in from right, backward (-1) slides in from left.
const PAGE_SLIDE_DISTANCE = 8;   // --page-slide-distance: 8px
const PAGE_SLIDE_DUR = 0.25;     // --page-slide-dur: 250ms
const PAGE_EASE = [0.22, 1, 0.36, 1] as const; // --page-slide-ease

const pageVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir * PAGE_SLIDE_DISTANCE,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: PAGE_SLIDE_DUR, ease: PAGE_EASE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -PAGE_SLIDE_DISTANCE,
    transition: { duration: PAGE_SLIDE_DUR, ease: PAGE_EASE },
  }),
};

function Dashboard() {
  const root = useRef<HTMLDivElement>(null);
  const { density, anomalyLens, performanceTier } = useLivingOS();
  const liveDashboardData = useRetailPulseData();
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [pageChangeCounter, setPageChangeCounter] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem("retailpulse-theme");
    return savedTheme === "light" ? "light" : "dark";
  });
  const [navOpen, setNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  dashboardDataState = liveDashboardData;
  navItems = buildNavItems();
  pageMeta = buildPageMeta();
  kpis = liveDashboardData.kpis;
  segments = liveDashboardData.segments;
  activity = liveDashboardData.activity;
  bars = liveDashboardData.bars;
  profitBars = liveDashboardData.profitBars;
  heat = liveDashboardData.heat;
  months = liveDashboardData.revenueMonths;
  barMonths = liveDashboardData.barMonths;
  const overviewStat = compactMetricLabel(pageMeta.overview.primary, ["revenue"]);
  const segmentationStat = compactMetricLabel(pageMeta.segmentation.primary, ["profiled", "customers"]);
  const active = navItems.find((item) => item.id === activePage)!;

  // Track direction for slide: 1 = forward (â†’), -1 = backward (â†)
  const prevPageRef = useRef<PageId>(activePage);
  const directionRef = useRef<1 | -1>(1);
  useEffect(() => {
    const prevIdx = navItems.findIndex((n) => n.id === prevPageRef.current);
    const nextIdx = navItems.findIndex((n) => n.id === activePage);
    directionRef.current = nextIdx >= prevIdx ? 1 : -1;
    prevPageRef.current = activePage;
  }, [activePage]);

  useEffect(() => {
    const workspace = root.current?.querySelector<HTMLElement>(".workspace");
    workspace?.scrollTo({ top: 0, behavior: "auto" });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activePage]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), liveDashboardData.loading ? 900 : 240);
    return () => window.clearTimeout(timer);
  }, [liveDashboardData.loading]);

  useEffect(() => {
    window.localStorage.setItem("retailpulse-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setAlertsOpen(false);
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Merged: background gradient + scene parallax + cursor spotlight â€” single RAF-throttled handler
  useEffect(() => {
    if (performanceTier === "minimal") return;
    const shell = root.current;
    const scene = root.current?.querySelector<HTMLElement>(".scene-layer") ?? null;
    const workspace = root.current?.querySelector<HTMLElement>(".workspace") ?? null;
    let rafId: number | null = null;
    let clientX = 0, clientY = 0;
    const process = () => {
      rafId = null;
      const pctX = ((clientX / window.innerWidth) * 100).toFixed(1);
      const pctY = ((clientY / window.innerHeight) * 100).toFixed(1);
      if (shell) {
        shell.style.setProperty("--mx", `${pctX}%`);
        shell.style.setProperty("--my", `${pctY}%`);
      }
      if (scene) {
        const x = (clientX / window.innerWidth - 0.5) * 14;
        const y = (clientY / window.innerHeight - 0.5) * 9;
        scene.style.transform = `translate(${x}px, ${y}px)`;
      }
      if (workspace) {
        workspace.style.setProperty("--cx", `${clientX}px`);
        workspace.style.setProperty("--cy", `${clientY}px`);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      clientX = e.clientX; clientY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(process);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [performanceTier]);

  // Feature 1: Magnetic cursor
  useMagneticCursor(performanceTier !== 'minimal');

  const handleSetActivePage = useCallback((id: PageId) => {
    setActivePage(id);
    setPageChangeCounter((c) => c + 1);
  }, []);

  usePageAnimation(root, [loading]);
  useChartBloom(root, [loading, activePage]);

  const renderPage = () => {
    if (activePage === "overview") return <OverviewPage />;
    if (activePage === "segmentation") return <SegmentationPage />;
    if (activePage === "churn") return <ChurnPage />;
    if (activePage === "forecasting") return <ForecastingPage />;
    if (activePage === "inventory") return <InventoryPage />;
    if (activePage === "reports") return <ReportsPage />;
    if (activePage === "media") return <MediaStudioPage />;
    return <SettingsPage theme={theme} setTheme={setTheme} />;
  };

  return (
    <main ref={root} className={`app-shell theme-${theme} density-${density} perf-${performanceTier} ${anomalyLens ? "anomaly-lens" : ""}`}>
      <InkReveal trigger={pageChangeCounter} />
      <Sidebar
        activePage={activePage}
        setActivePage={handleSetActivePage}
        open={navOpen}
        setOpen={setNavOpen}
        items={navItems}
        overviewStat={overviewStat}
        segmentationStat={segmentationStat}
      />
      <section className="workspace">
        <Topbar page={active} setNavOpen={setNavOpen} setCommandOpen={setCommandOpen} setAlertsOpen={setAlertsOpen} />
        <div className="workspace-body">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <SkeletonDashboard />
              </motion.div>
            ) : liveDashboardData.error ? (
              <motion.div
                key="data-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: PAGE_EASE } }}
              >
                <DataLoadError message={liveDashboardData.error} />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.24, delay: 0.04, ease: PAGE_EASE } }}
              >
                <HeroPanel
                  page={active}
                  onInsight={() => setToast(`${active.label} insight generated from the latest model snapshot.`)}
                  onRefine={() => setCommandOpen(true)}
                />
                <OperatingDock />
                <AnimatePresence mode="wait" custom={directionRef.current}>
                  <motion.div
                    className="page-content"
                    key={activePage}
                    custom={directionRef.current}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.12}
                    onDragEnd={(_e, info) => {
                      const pageIds = navItems.map((n) => n.id);
                      const currentIndex = pageIds.indexOf(activePage);
                      if (info.velocity.x < -400 && currentIndex < pageIds.length - 1) {
                        directionRef.current = 1;
                        handleSetActivePage(pageIds[currentIndex + 1]);
                      } else if (info.velocity.x > 400 && currentIndex > 0) {
                        directionRef.current = -1;
                        handleSetActivePage(pageIds[currentIndex - 1]);
                      }
                    }}
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <CommandModal open={commandOpen} onClose={() => setCommandOpen(false)} setActivePage={handleSetActivePage} />
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <ExecutiveBriefing />
      <Toast message={toast} />
    </main>
  );
}

function App() {
  return (
    <LivingOSProvider>
      <Dashboard />
    </LivingOSProvider>
  );
}

export default App;
