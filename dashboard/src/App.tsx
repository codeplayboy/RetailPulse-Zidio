import { Canvas, useFrame } from "@react-three/fiber";
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
import { Component, lazy, Suspense, type CSSProperties, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
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
    primary: "7 story scenes",
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

function buildNavItems() {
  return [
    { id: "overview", label: "Executive Overview", kicker: "Board pulse", icon: BarChart3, stat: dashboardDataState.navStats.overview },
    { id: "segmentation", label: "Customer Segmentation", kicker: "RFM + KMeans", icon: Users, stat: dashboardDataState.navStats.segmentation },
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
      primary: "7 story scenes",
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
}

// ── FEATURE 1: MAGNETIC CURSOR ───────────────────────────────────────────────
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

// ── FEATURE 3: DEPTH-OF-FIELD FOCUS PLANE ────────────────────────────────────
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

// ── FEATURE 2: INK/WATERCOLOR PAGE REVEAL ────────────────────────────────────
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

// ── FEATURE 4: FORCE-DIRECTED SEGMENT GRAPH ──────────────────────────────────
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

// ── FEATURE 5: VORONOI TERRITORY MAP ─────────────────────────────────────────
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

// ── FEATURE 10: CHURN NEURAL NET VISUALIZATION ───────────────────────────────
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
  }, []); // layers/positions derive from in-function constants — stable across renders
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

// ── FEATURE 12: MORPHING SVG BRAND ICON ──────────────────────────────────────
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

// ── FEATURE 7: 3D VOLUME BARS ─────────────────────────────────────────────────
function VolumeBarsScene({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const heights = [58, 86, 64, 92, 74, 96, 69, 88, 78, 100, 82, 93];
  const colors = ['#a855f7', '#6366f1', '#22d3ee', '#f472b6'];
  useFrame((state) => {
    if (groupRef.current && !reducedMotion) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(t * 0.38) * 0.26;
      groupRef.current.position.y = Math.sin(t * 0.55) * 0.09 - 0.45;
    }
  });
  return (
    <group ref={groupRef} position={[0, -0.45, 0]}>
      {heights.map((h, i) => {
        const sy = (h / 100) * 2.4;
        const col = colors[i % colors.length];
        return (
          <mesh key={i} position={[(i - heights.length / 2) * 0.28, sy / 2, 0]}>
            <boxGeometry args={[0.2, sy, 0.2]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.38} metalness={0.58} roughness={0.22} />
          </mesh>
        );
      })}
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 4, 3]} intensity={2.2} color="#a855f7" />
      <pointLight position={[-3, 2, 2]} intensity={1.6} color="#22d3ee" />
    </group>
  );
}

function VolumeBars3D() {
  const { reducedMotion, performanceTier } = useLivingOS();
  if (performanceTier === 'minimal') return <RevenueBars />;
  return (
    <div className="volume-bars-3d">
      <Canvas camera={{ position: [0, 1.5, 5.6], fov: 42 }} gl={{ antialias: false, alpha: true }} dpr={1}>
        <CanvasErrorBoundary>
          <VolumeBarsScene reducedMotion={reducedMotion} />
        </CanvasErrorBoundary>
      </Canvas>
    </div>
  );
}

// ── FEATURE 14: FUZZY MATCH HIGHLIGHT ────────────────────────────────────────
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

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function EnvironmentScene({ theme }: { theme: ThemeMode }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const { performanceTier, reducedMotion, replayProgress, systemStatus, anomalyLens } = useLivingOS();
  const points = useMemo(() => {
    const count = performanceTier === "high" ? 320 : performanceTier === "balanced" ? 160 : 60;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 5 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      data[i * 3] = Math.cos(theta) * r;
      data[i * 3 + 1] = (Math.random() - 0.5) * 8;
      data[i * 3 + 2] = Math.sin(theta) * r - 4;
    }
    return data;
  }, [performanceTier]);
  const signalNodes = useMemo(() => [
    [-3.8, 1.7, -2.2], [-2.6, .5, -1.5], [-1.2, 1.15, -2.8], [.2, -.15, -2],
    [1.7, 1.35, -2.6], [3.2, .25, -1.8], [2.1, -1.3, -2.4], [.4, -1.65, -2.8],
  ] as [number, number, number][], []);
  const signalLines = useMemo(() => {
    const data: number[] = [];
    for (let i = 0; i < signalNodes.length - 1; i += 1) data.push(...signalNodes[i], ...signalNodes[i + 1]);
    data.push(...signalNodes[1], ...signalNodes[4], ...signalNodes[3], ...signalNodes[6]);
    return new Float32Array(data);
  }, [signalNodes]);

  useFrame(({ clock, pointer }) => {
    if (document.hidden || reducedMotion) return;
    const t = clock.getElapsedTime();
    const replayVelocity = 0.018 + replayProgress * 0.0002;
    if (group.current) {
      group.current.rotation.y = t * replayVelocity + pointer.x * 0.08;
      group.current.rotation.x = pointer.y * 0.045;
    }
    if (rings.current) {
      rings.current.rotation.z = t * 0.07;
      rings.current.rotation.y = Math.sin(t * 0.24) * 0.16;
    }
  });

  const primary = anomalyLens ? "#f97316" : systemStatus === "watch" ? "#fb7185" : theme === "dark" ? "#a855f7" : "#9333ea";
  const secondary = anomalyLens ? "#fbbf24" : theme === "dark" ? "#22d3ee" : "#0891b2";

  return (
    <>
      <ambientLight intensity={theme === "dark" ? 1.8 : 2.2} />
      <pointLight position={[4.5, 4, 5]} intensity={theme === "dark" ? 72 : 44} color={primary} />
      <pointLight position={[-5, -2, 3]} intensity={theme === "dark" ? 48 : 52} color={secondary} />
      <group ref={group}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[points, 3]} />
          </bufferGeometry>
          <pointsMaterial color={secondary} size={0.02} sizeAttenuation transparent opacity={0.5} />
        </points>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[signalLines, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={secondary} transparent opacity={performanceTier === "minimal" ? .12 : .28} />
        </lineSegments>
        {performanceTier !== "minimal" ? signalNodes.map((position, index) => (
          <mesh key={`signal-${index}`} position={position}>
            <sphereGeometry args={[index % 3 === 0 ? .065 : .04, 12, 12]} />
            <meshStandardMaterial color={index % 2 ? secondary : primary} emissive={index % 2 ? secondary : primary} emissiveIntensity={1.8} />
          </mesh>
        )) : null}
        <group ref={rings} position={[2.6, 0.3, -2]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2 + i * 0.26, i * 0.14, 0]}>
              <torusGeometry args={[1.6 + i * 0.28, 0.01, 6, 48]} />
              <meshStandardMaterial color={i % 2 ? secondary : primary} emissive={primary} metalness={0.9} roughness={0.18} transparent opacity={0.44} />
            </mesh>
          ))}
        </group>
        {bars.slice(0, 10).map((height, i) => (
          <mesh key={i} position={[-4.1 + i * 0.34, -2.25 + height / 92, -2.4]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.09, height / 50, 0.09]} />
            <meshStandardMaterial color={primary} emissive={primary} metalness={0.75} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function usePageAnimation(root: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = gsap.utils.selector(root);
    const dur = reduceMotion ? 0.001 : 0.72;
    gsap.defaults({ ease: "power3.out", duration: dur });

    const entranceTargets = q(".animate-in");
    if (entranceTargets.length) {
      gsap.fromTo(
        entranceTargets,
        { y: 24, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.035 },
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

function Sidebar({ activePage, setActivePage, open, setOpen }: { activePage: PageId; setActivePage: (id: PageId) => void; open: boolean; setOpen: (open: boolean) => void }) {
  const { anomalyLens } = useLivingOS();
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
        {navItems.map((item) => {
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
              <em>{item.stat}</em>
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
    const insight = `AI analysis complete — ${meta.summary.slice(0, 120)} Key opportunity detected: high-value segment growth accelerating 24% QoQ.`;
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
          <Icon size={16} />{" "}
          <TextEffect per="char" preset="blur" delay={0.05} speedReveal={3.5} as="span">{meta.eyebrow}</TextEffect>
        </motion.span>
        <motion.h1 variants={heroItemVariants}>
          <TextEffect per="word" preset="fade-in-blur" delay={0.1} speedReveal={2.5} speedSegment={1.5} as="span">{meta.title}</TextEffect>
        </motion.h1>
        {streamWords.length > 0 ? (
          <motion.p variants={heroItemVariants} className="insight-stream">
            {streamWords.map((w, i) => (
              <motion.span key={`${w}-${i}`} className="stream-word"
                initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.24, delay: i * 0.022, ease: 'easeOut' }}
              >{w}{' '}</motion.span>
            ))}
            {streaming && <span className="stream-cursor">▋</span>}
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
      <div className="hero-metrics">
        {[meta.primary, meta.secondary, meta.tertiary].map((metric, index) => (
          <div key={metric}>
            <small><TextEffect per="word" preset="fade" delay={0.15 + index * 0.05} speedReveal={3.5} as="span">{["Primary signal", "Operational read", "Trend state"][index]}</TextEffect></small>
            <AnimatedValue value={metric} />
          </div>
        ))}
      </div>
    </section>
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
          <Control title="Revenue threshold" value="$0 – $50K" />
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
  const { anomalyLens, replayProgress } = useLivingOS();
  return (
    <section className="kpi-grid animate-in">
      {items.map(({ label, value, delta, icon: Icon, tone }, index) => (
        <motion.article
          key={label}
          layout
          className={`metric-card tone-${tone} ${anomalyLens && (tone === "danger" || index === 1) ? "anomaly-hit" : ""}`}
          style={{ "--replay": replayProgress / 100 } as CSSProperties}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 26, delay: index * 0.035 }}
          whileHover={{ y: -6, rotateX: 2, transition: { type: "spring", stiffness: 260, damping: 22, delay: 0 } }}
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

    gsap.fromTo(root.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .48, ease: "power3.out" });
    gsap.fromTo(valueLabel, { scale: .92 }, { scale: 1, duration: .55, ease: "back.out(1.8)" });

    gsap.fromTo(icon, { y: -movement, scale: .7 }, { y: 0, scale: 1, duration: .7, ease: "back.out(2)" });
  }, { scope: root, dependencies: [direction, value, reducedMotion], revertOnUpdate: true });

  return (
    <div ref={root} className={`trend-indicator trend-${direction}`} aria-label={`${direction} trend ${value}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={direction}
          className="trend-icon"
          initial={{ opacity: 0, y: -8, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.7 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.25 }}
        ><TrendIcon size={17} strokeWidth={2.6} /></motion.span>
      </AnimatePresence>
      <strong className="trend-value">{value}</strong>
      <small>{direction === "positive" ? "Increase" : direction === "negative" ? "Decrease" : "Current status"}</small>
    </div>
  );
}

type StoryMode = "line" | "bars" | "donut" | "gauge";

function getPanelStorySpec(title: string): { mode: StoryMode; metric: string } {
  const normalized = title.toLowerCase();
  if (normalized.includes("churn") || normalized.includes("risk")) return { mode: "gauge", metric: "-2.6%" };
  if (normalized.includes("inventory") || normalized.includes("health")) return { mode: "gauge", metric: "82/100" };
  if (normalized.includes("distribution") || normalized.includes("category") || normalized.includes("mix")) return { mode: "donut", metric: "+6.8%" };
  if (normalized.includes("bar") || normalized.includes("performance") || normalized.includes("timeline") || normalized.includes("queue")) return { mode: "bars", metric: "+8.4%" };
  if (normalized.includes("forecast") || normalized.includes("demand")) return { mode: "line", metric: "94.2%" };
  if (normalized.includes("report") || normalized.includes("export")) return { mode: "bars", metric: "5 packs" };
  return { mode: "line", metric: "+12.6%" };
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
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px 600px 0px" }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
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
            <motion.div className="story-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.section className="story-surface" role="dialog" aria-modal="true" aria-labelledby={`story-${title.replace(/\W+/g, "-")}`} initial={{ scale: .96, y: 22 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .98, y: 12 }}>
                <div className="story-head">
                  <div><span>{kicker}</span><h2 id={`story-${title.replace(/\W+/g, "-")}`}>{title} Data Story</h2></div>
                  <button type="button" aria-label="Close data story" onClick={() => setStoryOpen(false)}><X size={18} /></button>
                </div>
                <Suspense fallback={<div className="story-loading">Preparing Remotion story...</div>}>
                  <DataStoryPlayer title={title} kicker={kicker} metric={storySpec.metric} mode={storySpec.mode} />
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

function RevenueLine({ compact = false }: { compact?: boolean }) {
  const gradientId = useId().replace(/:/g, "");
  const lineGradient = `lineStroke-${gradientId}`;
  const areaGradient = `lineArea-${gradientId}`;
  const values = compact ? dashboardDataState.compactSeries : dashboardDataState.revenueSeries;
  const compareValues = compact ? dashboardDataState.revenueSeries : dashboardDataState.compareSeries;
  const path = createLinePath(values, 560, 190, { left: 24, right: 22, top: 22, bottom: 24 });
  const comparePath = createLinePath(compareValues, 560, 190, { left: 24, right: 22, top: 34, bottom: 36 });
  const areaPath = `${path} L538,166 L24,166 Z`;
  const pointMax = Math.max(...values, 1);
  const pointMin = Math.min(...values, 0);
  const points = values.map((value, index) => {
    const x = 24 + ((538 - 24) / Math.max(values.length - 1, 1)) * index;
    const normalized = pointMax === pointMin ? 0.5 : (value - pointMin) / (pointMax - pointMin);
    const y = 22 + (166 - 22) - normalized * (166 - 22);
    return { x, y };
  });

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
        </defs>
        {[42, 78, 114, 150].map((y) => <line key={y} x1="24" x2="538" y1={y} y2={y} className="grid-line" />)}
        {[0, 50, 100, 150].map((v, i) => <text key={v} x="0" y={154 - i * 36} className="axis-label">${v}k</text>)}
        {months.map((month, index) => {
          const x = 24 + ((538 - 24) / Math.max(months.length - 1, 1)) * index;
          return <text key={`${month}-${index}`} x={x} y="182" className="axis-label">{month}</text>;
        })}
        <line x1="24" x2="538" y1="92" y2="92" className="target-line" />
        <path d={areaPath} fill={`url(#${areaGradient})`} />
        <path className="compare-line" d={comparePath} />
        <path className="draw-line" style={{ stroke: `url(#${lineGradient})` }} d={path} />
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${index}`}
            cx={point.x}
            cy={point.y}
            r="4.8"
            className="line-dot bio-pulse"
            style={{ stroke: `url(#${lineGradient})`, animationDelay: `${index * 0.22}s` }}
          />
        ))}
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
  // SVG is ALWAYS rendered — the overlay visually covers it during the animation.
  const [playerDone, setPlayerDone] = useState(false);
  const markDone = useCallback(() => setPlayerDone(true), []);
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);

  // Unique key per mount — forces Remotion Player to start from frame 0 on every
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

        {/* SVG is always visible — the overlay covers it while the cinematic plays */}
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="donut-track" cx="60" cy="60" r="44" pathLength="100" />
          {values.map((value, index) => {
            const dashOffset = -offset;
            offset += value;
            const isHovered = hoveredSeg === index;
            return (
              <circle
                key={`${labels[index]}-${value}`}
                className={`donut-segment${isHovered ? " donut-segment-hovered" : ""}`}
                cx="60"
                cy="60"
                r="44"
                pathLength="100"
                stroke={segmentColors[index]}
                strokeDasharray={`${value} ${100 - value}`}
                strokeDashoffset={dashOffset}
                strokeWidth={isHovered ? 14 : 12}
                style={{
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

        {/* Remotion cinematic overlay — solid bg covers the SVG while playing,
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

  // Live scale from replayProgress — no entrance re-trigger
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

function GaugeDial({ value }: { value: number }) {
  const root = useRef<HTMLDivElement>(null);
  const entranceDoneRef = useRef(false);
  const { replayProgress, reducedMotion } = useLivingOS();
  const displayedValue = Math.round(value * (.72 + replayProgress * .0028));
  const angle = -90 + displayedValue * 1.8;

  useGSAP(() => {
    if (!root.current || reducedMotion) return;
    if (!entranceDoneRef.current) {
      entranceDoneRef.current = true;
      gsap.fromTo(root.current.querySelector(".gauge-progress"), { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.2, ease: "power3.out" });
      gsap.fromTo(root.current.querySelector(".gauge-needle"), { rotation: -90, transformOrigin: "120px 120px" }, { rotation: angle, duration: 1.25, ease: "elastic.out(1, .65)" });
    } else {
      gsap.to(root.current.querySelector(".gauge-needle"), { rotation: angle, duration: 0.4, ease: "power2.out", overwrite: "auto" });
    }
  }, { scope: root, dependencies: [angle, reducedMotion] });

  return (
    <div ref={root} className="gauge" role="img" aria-label={`Inventory health ${displayedValue} out of 100`}>
      <svg viewBox="0 0 240 150" aria-hidden="true">
        <defs>
          <linearGradient id="gaugeProgress" x1="0" x2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <path className="gauge-track" pathLength="100" d="M30 120 A90 90 0 0 1 210 120" />
        <path className="gauge-progress" pathLength="100" strokeDasharray={`${displayedValue} ${100 - displayedValue}`} d="M30 120 A90 90 0 0 1 210 120" />
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickAngle = (-180 + tick * 1.8) * (Math.PI / 180);
          const x1 = 120 + Math.cos(tickAngle) * 76;
          const y1 = 120 + Math.sin(tickAngle) * 76;
          const x2 = 120 + Math.cos(tickAngle) * 84;
          const y2 = 120 + Math.sin(tickAngle) * 84;
          return <line key={tick} className="gauge-tick" x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <g className="gauge-needle">
          <line x1="120" y1="120" x2="120" y2="48" />
          <circle cx="120" cy="120" r="8" />
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
      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      viewOptions={{ amount: 0, margin: "200px" }}
      once
    >
      <div className="activity-feed">
        {activity.map(([title, body, time, tone], index) => (
          <motion.article initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "0px 0px 200px 0px" }} transition={{ delay: index * .03 }} key={title} className={`activity-${tone}`}>
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
      {rows.map((row, index) => <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px 200px 0px" }} transition={{ delay: index * .045 }} key={row.join("-")}>{row.map((cell) => <span key={cell}>{cell}</span>)}</motion.div>)}
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

// ── EXECUTIVE PULSE ─────────────────────────────────────────────────────────
type ExecTone = "purple" | "cyan" | "pink" | "danger";

const execKpis: Array<{
  title: string; value: string; label: string; tone: ExecTone;
  icon: typeof Activity; delta: string;
}> = [
  { title: "Primary Signal",   value: "$15.66M", label: "Revenue",          tone: "purple", icon: CircleDollarSign, delta: "+18.4%" },
  { title: "Operational Read", value: "24.0K",   label: "Orders",           tone: "cyan",   icon: Activity,         delta: "+8.4%"  },
  { title: "Customer Health",  value: "2.79K",   label: "Active Customers", tone: "pink",   icon: Users,            delta: "+3.1%"  },
  { title: "Churn Risk Index", value: "34.4%",   label: "At Risk",          tone: "danger", icon: TrendingDown,     delta: "-1.8%"  },
];

function ExecPulseCard({ title, value, label, tone, icon: Icon, delta }: {
  title: string; value: string; label: string; tone: ExecTone;
  icon: typeof Activity; delta: string;
}) {
  const isNeg = delta.startsWith("-");
  const DeltaIcon = isNeg ? TrendingDown : TrendingUp;
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
      style={{ perspective: 800, rotateX, rotateY, scale: cardScale, y: cardY }}
      onMouseMove={handleTiltMove}
      onMouseLeave={handleTiltLeave}
    >
      <span className="exec-card-glow" aria-hidden="true" />
      <motion.span className="exec-card-glare" aria-hidden="true" style={{ background: glareStyle }} />
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
          <span>Revenue momentum — {tfLabels[timeframe] ?? timeframe}</span>
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
        <Panel title="3D Volume Analysis" kicker="Interactive three-dimensional volume bars" icon={BarChart3}><VolumeBars3D /></Panel>
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
        {tabs.map((tab) => (
          <button type="button" aria-pressed={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>
            {activeTab === tab && (
              <motion.span className="tab-pill" layoutId="seg-tab-pill" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            {tab}
          </button>
        ))}
        <span className="tab-status">Viewing {activeTab}</span>
      </section>
      <section className="dashboard-grid">
        <Panel title="Segment Distribution" kicker="Share of customer base" icon={Users}><Donut labels={dashboardDataState.segmentLabels} values={dashboardDataState.segmentValues} /></Panel>
        <Panel title="Customer Lifetime Value" kicker="Average CLV by segment" icon={Gem}><HorizontalBars labels={dashboardDataState.horizontalBarLabels} values={dashboardDataState.horizontalBarValues} /></Panel>
        <Panel title="KMeans Cluster Scatter" kicker="Recency vs monetary, sized by frequency" icon={Brain}><ScatterPlot /></Panel>
        <Panel title="RFM Score Heatmap" kicker="Recency, frequency, monetary heat" icon={Eye}><HeatMap /></Panel>
        <Panel title="Segment Force Graph" kicker="Live physics — customer topology" icon={RadioTower}><ForceGraph /></Panel>
        <Panel title="Territory Map" kicker="Voronoi — geographic density zones" icon={Layers3}><VoronoiCanvas /></Panel>
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
        <Panel title="Inventory Health" kicker="Weighted across all SKUs" icon={Gauge}><GaugeDial value={dashboardDataState.inventoryHealthScore} /></Panel>
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
  const storyTypes = [
    "Executive Briefing",
    "Chart Story",
    "Operational Replay",
    "Churn Intelligence",
    "Demand Forecast",
    "Inventory Command",
    "Customer Segment",
  ];
  const formats = ["1920x1080", "1080x1080", "1080x1920", "1200x628", "3840x2160"];
  const [storyType, setStoryType] = useState(storyTypes[0]);
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

  const previewMode = storyType.includes("Inventory") ? "gauge" : storyType.includes("Chart") || storyType.includes("Customer") ? "donut" : storyType.includes("Replay") ? "bars" : "line";
  const previewMetric = storyType.includes("Churn") ? "-2.6%" : storyType.includes("Inventory") ? "82/100" : storyType.includes("Demand") ? "94.2%" : "+12.6%";

  return (
    <>
      <section className="media-studio animate-in">
        <div className="media-control-panel">
          <span className="eyebrow"><Film size={16} /> <TextEffect per="char" preset="blur" delay={0.1} speedReveal={2} as="span">Remotion studio</TextEffect></span>
          <h2><TextEffect per="word" preset="fade-in-blur" delay={0.2} speedReveal={1.8} speedSegment={1.2} as="span">Executive video generator</TextEffect></h2>
          <p>Use the current dashboard signals to preview cinematic reports, chart stories, and board-ready operational replays.</p>

          <label>
            <span>Composition</span>
            <select value={storyType} onChange={(event) => setStoryType(event.target.value)} aria-label="Select Remotion composition">
              {storyTypes.map((type) => <option key={type}>{type}</option>)}
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
                {rendering ? `Rendering ${renderProgress}%` : "Generate Executive Video"}
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
            <DataStoryPlayer title={storyType} kicker="RetailPulse media studio" metric={previewMetric} mode={previewMode} />
          </Suspense>
        </div>
      </section>

      <KpiGrid items={[
        { label: "Story Scenes", value: "7", delta: "Live", icon: Film, tone: "violet" },
        { label: "Render Queue", value: rendering ? `${renderProgress}%` : "Ready", delta: format, icon: CloudDownload, tone: "cyan" },
        { label: "Engagement Lift", value: "+18.4%", delta: "+4.2%", icon: TrendingUp, tone: "green" },
        { label: "Caption Coverage", value: captioned ? "100%" : "0%", delta: captioned ? "On" : "Off", icon: Table2, tone: "gold" },
      ]} />

      <section className="dashboard-grid">
        <Panel title="Render Queue" kicker="Export workflow" icon={CloudDownload}>
          <LuxuryTable rows={[
            [storyType, format, rendering ? `${renderProgress}%` : "Ready"],
            ["Weekly Board Pack", "1920x1080", "Rendered"],
            ["Inventory Replay", "1080x1920", "Draft"],
            ["Churn Brief", "1200x628", "Preview"],
          ]} />
        </Panel>
        <Panel title="Story Scenes" kicker="Current composition sequence" icon={Film}>
          <LuxuryTable rows={[
            ["01", "Opening signal", "Revenue and health"],
            ["02", "Chart reveal", "Trend + anomaly"],
            ["03", "Operational read", "Forecast and stock"],
            ["04", "Executive close", "Recommended action"],
          ]} />
        </Panel>
        <Panel className="wide-panel" title="Video Engagement Forecast" kicker="Projected watch-through and executive attention" icon={LineChart}><RevenueLine /><RevenueBars /></Panel>
        <Panel title="Format Performance Mix" kicker="Landscape, square, vertical, and social cuts" icon={Layers3}><Donut labels={["16:9", "1:1", "9:16", "Social", "4K"]} /></Panel>
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
            <span>{isLight ? "Metallic silver and gold" : "Obsidian black and crimson"}</span>
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
        <p className="settings-copy">Use the switch to move between the black-and-red reference theme and the metallic silver-and-gold workspace.</p>
      </AccordionPanel>
      <AccordionPanel title="Model Settings" kicker="Configuration" icon={Brain}>
        <Control title="KMeans clusters" value="5 clusters" />
        <Control title="Inventory service level" value="95.0%" />
        <Control title="Churn model" value="Balanced logistic" />
      </AccordionPanel>
      <AccordionPanel title="Forecast Settings" kicker="Configuration" icon={LineChart}>
        <Control title="Default horizon" value="30 days" />
        <Control title="MAPE target" value="12%" />
        <Control title="Engine" value="Prophet + fallback" />
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
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const heroItemVariants = {
  initial: { opacity: 0, y: 18, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const } },
};

// Direction-aware page slide: matches transitions-dev page side-by-side token values.
// Forward (+1) slides in from right, backward (-1) slides in from left.
const PAGE_SLIDE_DISTANCE = 8;   // --page-slide-distance: 8px
const PAGE_BLUR = 3;             // --page-blur: 3px
const PAGE_SLIDE_DUR = 0.25;     // --page-slide-dur: 250ms
const PAGE_EASE = [0.22, 1, 0.36, 1] as const; // --page-slide-ease

const pageVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir * PAGE_SLIDE_DISTANCE,
    filter: `blur(${PAGE_BLUR}px)`,
  }),
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: PAGE_SLIDE_DUR, ease: PAGE_EASE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -PAGE_SLIDE_DISTANCE,
    filter: `blur(${PAGE_BLUR}px)`,
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
  const active = navItems.find((item) => item.id === activePage)!;

  // Track direction for slide: 1 = forward (→), -1 = backward (←)
  const prevPageRef = useRef<PageId>(activePage);
  const directionRef = useRef<1 | -1>(1);
  useEffect(() => {
    const prevIdx = navItems.findIndex((n) => n.id === prevPageRef.current);
    const nextIdx = navItems.findIndex((n) => n.id === activePage);
    directionRef.current = nextIdx >= prevIdx ? 1 : -1;
    prevPageRef.current = activePage;
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

  // Merged: background gradient + scene parallax + cursor spotlight — single RAF-throttled handler
  useEffect(() => {
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
  }, []);

  // CSS Houdini paint worklet registration
  useEffect(() => {
    if ('paintWorklet' in CSS) {
      (CSS as unknown as { paintWorklet: { addModule: (url: string) => void } }).paintWorklet.addModule(`${import.meta.env.BASE_URL}noise-bg.js`);
    }
  }, []);

  // Feature 1: Magnetic cursor
  useMagneticCursor(performanceTier !== 'minimal');
  // Feature 3: Depth-of-field
  useDepthOfField(performanceTier !== 'minimal');

  const handleSetActivePage = useCallback((id: PageId) => {
    setActivePage(id);
    setPageChangeCounter((c) => c + 1);
  }, []);

  usePageAnimation(root, [loading]);

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
    <main ref={root} className={`app-shell theme-${theme} density-${density} ${anomalyLens ? "anomaly-lens" : ""}`}>
      <div className="scene-layer">
        <CanvasErrorBoundary>
          <Canvas camera={{ position: [0, 0, 7.5], fov: 44 }} dpr={performanceTier === "high" ? [1, 1.2] : 1} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}>
            <EnvironmentScene theme={theme} />
          </Canvas>
        </CanvasErrorBoundary>
      </div>
      <InkReveal trigger={pageChangeCounter} />
      <Sidebar activePage={activePage} setActivePage={handleSetActivePage} open={navOpen} setOpen={setNavOpen} />
      <section className="workspace">
        <Topbar page={active} setNavOpen={setNavOpen} setCommandOpen={setCommandOpen} setAlertsOpen={setAlertsOpen} />
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.25 } }}
            >
              <SkeletonDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.3, delay: 0.05 } }}
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
