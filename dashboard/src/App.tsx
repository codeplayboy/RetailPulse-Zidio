import { Canvas, useFrame } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
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
  Filter,
  Gauge,
  Gem,
  Layers3,
  LineChart,
  Lock,
  Menu,
  Moon,
  PackageCheck,
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
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ThemeMode = "dark" | "light";
type PageId = "overview" | "segmentation" | "churn" | "forecasting" | "inventory" | "reports" | "settings";

type NavItem = {
  id: PageId;
  label: string;
  kicker: string;
  icon: typeof BarChart3;
  stat: string;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Executive Overview", kicker: "Board pulse", icon: BarChart3, stat: "$15.66M" },
  { id: "segmentation", label: "Customer Segmentation", kicker: "RFM + KMeans", icon: Users, stat: "2.79K" },
  { id: "churn", label: "Churn Prediction", kicker: "Retention risk", icon: TrendingDown, stat: "34.4%" },
  { id: "forecasting", label: "Demand Forecasting", kicker: "Prophet horizon", icon: LineChart, stat: "94.2%" },
  { id: "inventory", label: "Inventory Optimization", kicker: "Stock policy", icon: PackageCheck, stat: "82/100" },
  { id: "reports", label: "Analytics & Reports", kicker: "Export center", icon: Table2, stat: "5 packs" },
  { id: "settings", label: "Settings", kicker: "Models + controls", icon: Settings, stat: "Live" },
];

const pageMeta: Record<PageId, { eyebrow: string; title: string; summary: string; primary: string; secondary: string; tertiary: string }> = {
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
  settings: {
    eyebrow: "Platform Configuration",
    title: "Control models, themes, notifications, and teams.",
    summary: "Manage RetailPulse intelligence settings, forecast defaults, theme system, alert rules, and access controls.",
    primary: "Hybrid model",
    secondary: "95% service level",
    tertiary: "Alerts enabled",
  },
};

const kpis = [
  { label: "Total Revenue", value: "$15.66M", delta: "+18.4%", icon: CircleDollarSign, tone: "blue" },
  { label: "Total Sales", value: "24.0K", delta: "+8.4%", icon: Activity, tone: "violet" },
  { label: "Total Customers", value: "2,790", delta: "+3.1%", icon: Users, tone: "cyan" },
  { label: "Active Customers", value: "2,650", delta: "+5.7%", icon: RadioTower, tone: "gold" },
  { label: "Churn Rate", value: "34.4%", delta: "-1.8%", icon: TrendingDown, tone: "danger" },
  { label: "Forecast Accuracy", value: "94.2%", delta: "+2.2%", icon: Gauge, tone: "green" },
  { label: "Inventory Health", value: "82/100", delta: "+4.0%", icon: PackageCheck, tone: "cyan" },
  { label: "Monthly Growth", value: "+12.6%", delta: "+12.6%", icon: TrendingUp, tone: "violet" },
];

const segments = [
  ["Champions", "438", "$12.4K", "VIP early access and referral flywheel", "96"],
  ["Loyal Customers", "692", "$8.7K", "Premium upsell and review requests", "88"],
  ["Potential Loyalists", "511", "$5.2K", "Membership onboarding sequence", "74"],
  ["New Customers", "284", "$1.8K", "Second-purchase acceleration", "61"],
  ["At Risk", "247", "$6.1K", "Win-back offer and personal outreach", "43"],
  ["Lost Customers", "198", "$1.1K", "Low-cost reactivation campaign", "26"],
];

const activity = [
  ["Demand spike detected", "Electronics volume rising across western region", "now", "critical"],
  ["Inventory shield armed", "12 SKUs moved above reorder threshold", "4m", "secure"],
  ["AI segment refresh", "Champions cohort gained 38 premium buyers", "11m", "info"],
  ["Forecast model synced", "Revenue horizon recalibrated to current trend", "18m", "info"],
  ["Report pack generated", "Customer board report is ready for export", "31m", "secure"],
];

const bars = [58, 86, 64, 92, 74, 96, 69, 88, 78, 100, 82, 93];
const profitBars = [42, 58, 46, 68, 53, 74, 49, 66, 57, 79, 61, 72];
const heat = [72, 46, 88, 61, 94, 53, 78, 67, 91, 59, 83, 49, 76, 97, 63, 84];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const barMonths = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function EnvironmentScene({ theme }: { theme: ThemeMode }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const count = 760;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 5 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      data[i * 3] = Math.cos(theta) * r;
      data[i * 3 + 1] = (Math.random() - 0.5) * 8;
      data[i * 3 + 2] = Math.sin(theta) * r - 4;
    }
    return data;
  }, []);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.035 + pointer.x * 0.08;
      group.current.rotation.x = pointer.y * 0.045;
    }
    if (rings.current) {
      rings.current.rotation.z = t * 0.07;
      rings.current.rotation.y = Math.sin(t * 0.24) * 0.16;
    }
  });

  const primary = theme === "dark" ? "#a855f7" : "#9333ea";
  const secondary = theme === "dark" ? "#22d3ee" : "#0891b2";

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
        <group ref={rings} position={[2.6, 0.3, -2]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2 + i * 0.26, i * 0.14, 0]}>
              <torusGeometry args={[1.6 + i * 0.28, 0.01, 12, 180]} />
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
    const entranceTargets = q(".animate-in");
    const lineTargets = q(".draw-line");
    const revealTargets = q(".reveal");
    gsap.defaults({ ease: "power3.out", duration: reduceMotion ? 0.001 : 0.68 });
    if (entranceTargets.length) {
      gsap.fromTo(entranceTargets, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.035 });
    }
    if (lineTargets.length) {
      gsap.fromTo(lineTargets, { strokeDasharray: 760, strokeDashoffset: 760 }, { strokeDashoffset: 0, duration: reduceMotion ? 0.001 : 1.35, delay: 0.1 });
    }
    if (revealTargets.length) {
      ScrollTrigger.batch(revealTargets, {
        start: "top 86%",
        once: true,
        onEnter: (items) => gsap.fromTo(items, { y: 22, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, overwrite: true }),
      });
    }

    const move = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--my", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
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
      30000
    );
    return () => window.clearInterval(timer);
  }, []);
  return <span className="live-clock" aria-label="Current time">{time}</span>;
}

function Sidebar({ activePage, setActivePage, open, setOpen }: { activePage: PageId; setActivePage: (id: PageId) => void; open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="brand">
        <div className="brand-icon"><BarChart3 size={22} /></div>
        <div>
          <strong>RetailPulse</strong>
          <span>Intelligence OS</span>
        </div>
        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => { setActivePage(item.id); setOpen(false); }}>
              <Icon size={18} />
              <span><strong>{item.label}</strong><small>{item.kicker}</small></span>
              <em>{item.stat}</em>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-card">
        <span className="status-orb" />
        <strong>Model stack online</strong>
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
      <ShellButton label="Open alerts" onClick={() => setAlertsOpen(true)}><Bell size={18} /><i /></ShellButton>
      <div className="user-chip"><span>R</span><strong>Rashad</strong></div>
    </header>
  );
}

function HeroPanel({ page, onInsight, onRefine }: { page: NavItem; onInsight: () => void; onRefine: () => void }) {
  const meta = pageMeta[page.id];
  const Icon = page.icon;
  return (
    <section className="hero-panel animate-in">
      <span className="sweep-shine" aria-hidden="true" />
      <div className="hero-copy">
        <span className="eyebrow"><Icon size={16} /> {meta.eyebrow}</span>
        <h1>{meta.title}</h1>
        <p>{meta.summary}</p>
        <div className="hero-actions">
          <button type="button" className="primary-action" onClick={onInsight}><Sparkles size={17} /> Generate insight</button>
          <button type="button" className="secondary-action" onClick={onRefine}><Filter size={17} /> Refine view</button>
        </div>
      </div>
      <div className="hero-metrics">
        {[meta.primary, meta.secondary, meta.tertiary].map((metric, index) => (
          <div key={metric}>
            <small>{["Primary signal", "Operational read", "Trend state"][index]}</small>
            <strong>{metric}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterDock() {
  return (
    <section className="filter-dock animate-in">
      <Control icon={CalendarDays} title="Date range" value="Dec 2025 - Jun 2026" />
      <Control icon={Layers3} title="Category" value="All categories" />
      <Control icon={RadioTower} title="Region" value="All regions" />
      <button className="secondary-action"><SlidersHorizontal size={16} /> Advanced filters</button>
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
  return (
    <section className="kpi-grid animate-in">
      {items.map(({ label, value, delta, icon: Icon, tone }) => (
        <motion.article key={label} className={`metric-card tone-${tone}`} whileHover={{ y: -6, rotateX: 2 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
          <div className="metric-top"><span><Icon size={18} /></span></div>
          <strong>{value}</strong>
          <p>{label}</p>
          <TrendIndicator value={delta} />
        </motion.article>
      ))}
    </section>
  );
}

function TrendIndicator({ value }: { value: string }) {
  const root = useRef<HTMLDivElement>(null);
  const direction = value.startsWith("+") ? "positive" : value.startsWith("-") ? "negative" : "neutral";
  const TrendIcon = direction === "positive" ? TrendingUp : direction === "negative" ? TrendingDown : Activity;

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !root.current) return;

    const icon = root.current.querySelector(".trend-icon");
    const valueLabel = root.current.querySelector(".trend-value");
    const movement = direction === "positive" ? -4 : direction === "negative" ? 4 : 0;

    gsap.fromTo(root.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .48, ease: "power3.out" });
    gsap.fromTo(valueLabel, { scale: .92 }, { scale: 1, duration: .55, ease: "back.out(1.8)" });

    if (movement) {
      gsap.to(icon, {
        y: movement,
        duration: .72,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    } else {
      gsap.to(icon, {
        opacity: .55,
        duration: 1.1,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }
  }, { scope: root, dependencies: [direction, value], revertOnUpdate: true });

  return (
    <div ref={root} className={`trend-indicator trend-${direction}`} aria-label={`${direction} trend ${value}`}>
      <span className="trend-icon"><TrendIcon size={17} strokeWidth={2.6} /></span>
      <strong className="trend-value">{value}</strong>
      <small>{direction === "positive" ? "Increase" : direction === "negative" ? "Decrease" : "Current status"}</small>
    </div>
  );
}

function Panel({ title, kicker, icon: Icon, children, className = "" }: { title: string; kicker: string; icon: typeof Activity; children: ReactNode; className?: string }) {
  return (
    <section className={`panel reveal ${className}`}>
      <div className="panel-heading">
        <div><span>{kicker}</span><h2>{title}</h2></div>
        <Icon size={21} />
      </div>
      {children}
    </section>
  );
}

function RevenueLine({ compact = false }: { compact?: boolean }) {
  const path = "M24,150 C70,116 92,128 136,88 C178,46 224,118 278,72 C330,24 374,76 426,42 C474,20 506,50 538,24";
  const comparePath = "M24,162 C72,140 108,148 154,110 C204,76 232,128 284,98 C330,66 380,104 426,72 C474,48 504,82 538,58";
  return (
    <svg className={compact ? "revenue-line compact" : "revenue-line"} viewBox="0 0 560 190" role="img" aria-label="Revenue trend chart">
      <defs>
        <linearGradient id="lineStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--chart-a)" />
          <stop offset="52%" stopColor="var(--chart-b)" />
          <stop offset="100%" stopColor="var(--accent-gold)" />
        </linearGradient>
        <linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-a)" stopOpacity=".32" />
          <stop offset="55%" stopColor="var(--chart-b)" stopOpacity=".16" />
          <stop offset="100%" stopColor="var(--chart-a)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[42, 78, 114, 150].map((y) => <line key={y} x1="24" x2="538" y1={y} y2={y} className="grid-line" />)}
      {[0, 50, 100, 150].map((v, i) => <text key={v} x="0" y={154 - i * 36} className="axis-label">${v}k</text>)}
      {[24, 126, 228, 330, 432, 538].map((x, i) => <text key={x} x={x} y="182" className="axis-label">{months[i]}</text>)}
      <line x1="24" x2="538" y1="92" y2="92" className="target-line" />
      <path d={`${path} L538,166 L24,166 Z`} fill="url(#lineArea)" />
      <path className="compare-line" d={comparePath} />
      <path className="draw-line" d={path} />
      {[24, 136, 278, 426, 538].map((x, i) => <circle key={x} cx={x} cy={[150, 88, 72, 42, 24][i]} r="4.8" className="line-dot" />)}
    </svg>
  );
}

function RevenueBars() {
  return (
    <div className="combo-bars" aria-label="Revenue and profit monthly bar chart">
      <div className="bar-axis">{["120k", "80k", "40k"].map((t) => <span key={t}>{t}</span>)}</div>
      <div className="bar-plot">
        {bars.map((bar, i) => (
          <span key={i} className="bar-cluster">
            <i style={{ "--h": `${bar}%` } as CSSProperties} />
            <b style={{ "--h": `${profitBars[i]}%` } as CSSProperties} />
          </span>
        ))}
      </div>
      <div className="bar-months">{barMonths.map((month, i) => <span key={`${month}-${i}`}>{month}</span>)}</div>
      <div className="chart-legend"><span>Revenue</span><span>Profit</span></div>
    </div>
  );
}

function Donut({ labels = ["Electronics", "Home", "Apparel", "Beauty", "Groceries"] }: { labels?: string[] }) {
  const values = [28.9, 20.7, 18.9, 17.7, 13.8, 10.2];
  return (
    <div className="donut-layout">
      <div className="donut"><strong>100%</strong><span>share</span></div>
      <div className="legend">
        {labels.map((label, i) => <span key={label}><i style={{ "--i": i } as CSSProperties} />{label}<b>{values[i] ?? 8.4}%</b></span>)}
      </div>
    </div>
  );
}

function StackedBars() {
  return (
    <div className="stacked-bars">
      {bars.slice(0, 7).map((value, i) => (
        <span key={i} style={{ "--h": `${value}%` } as CSSProperties}><i /><small>{["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}</small></span>
      ))}
    </div>
  );
}

function HorizontalBars({ labels = ["Electronics", "Home & Kitchen", "Apparel", "Beauty", "Groceries"] }: { labels?: string[] }) {
  return (
    <div className="hbars">
      {labels.map((label, i) => {
        const value = 92 - i * 10;
        return <div key={label}><span>{label}<b>{value}%</b></span><strong style={{ width: `${value}%` }} /></div>;
      })}
    </div>
  );
}

function HeatMap() {
  return <div className="heat-grid">{heat.map((v, i) => <span key={i} style={{ "--v": v } as CSSProperties}>{v}</span>)}</div>;
}

function ScatterPlot() {
  return (
    <div className="scatter">
      {segments.map((segment, i) => <span key={segment[0]} style={{ left: `${11 + i * 13}%`, bottom: `${18 + ((i * 17) % 58)}%`, width: `${32 + i * 5}px`, height: `${32 + i * 5}px` }} />)}
    </div>
  );
}

function GaugeDial({ value }: { value: number }) {
  return (
    <div className="gauge">
      <div style={{ "--value": `${value * 1.8}deg` } as CSSProperties} />
      <strong>{value}/100</strong>
      <span>Healthy stock posture</span>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="activity-feed">
      {activity.map(([title, body, time, tone]) => (
        <article key={title} className={`activity-${tone}`}>
          <span />
          <div><strong>{title}</strong><p>{body}</p></div>
          <em>{time}</em>
        </article>
      ))}
    </div>
  );
}

function LuxuryTable({ rows, wide = false }: { rows: string[][]; wide?: boolean }) {
  return (
    <div className={wide ? "lux-table wide" : "lux-table"}>
      {rows.map((row) => <div key={row.join("-")}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}
    </div>
  );
}

function SegmentCards() {
  return (
    <div className="segment-list">
      {segments.map(([name, count, ltv, action, score]) => (
        <article key={name}>
          <div><strong>{name}</strong><span>{count} customers</span></div>
          <em>{ltv} CLV</em>
          <p>{action}</p>
          <b style={{ width: `${score}%` }} />
        </article>
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

function OverviewPage() {
  return (
    <>
      <FilterDock />
      <KpiGrid />
      <section className="dashboard-grid overview-layout">
        <Panel className="wide-panel" title="Revenue Trend" kicker="Daily revenue across selected window" icon={LineChart}><RevenueLine /><RevenueBars /></Panel>
        <Panel title="Product Category Analysis" kicker="Revenue share by category" icon={Layers3}><Donut /></Panel>
        <Panel title="Live Activity Feed" kicker="Model, inventory, and segment stream" icon={RadioTower}><ActivityFeed /></Panel>
        <Panel title="Monthly Performance" kicker="Revenue and profit by month" icon={BarChart3}><StackedBars /></Panel>
        <Panel title="Top Selling Products" kicker="Ranked by total revenue" icon={Crown}><LuxuryTable rows={[["Blender", "$1.42M", "+19%"], ["Perfume", "$1.18M", "+14%"], ["Sneakers", "$982K", "+11%"], ["Smartwatch", "$814K", "+9%"]]} /></Panel>
      </section>
    </>
  );
}

function SegmentationPage() {
  const [activeTab, setActiveTab] = useState("Segments");
  const tabs = ["Segments", "RFM Analysis", "Clusters", "Playbooks"];

  return (
    <>
      <KpiGrid items={[
        { label: "Total Customers", value: "2,790", delta: "+3.1%", icon: Users, tone: "cyan" },
        { label: "Champions", value: "438", delta: "+4.5%", icon: Crown, tone: "gold" },
        { label: "At-Risk Customers", value: "247", delta: "-2.1%", icon: TrendingDown, tone: "danger" },
        { label: "Avg Customer LTV", value: "$8.4K", delta: "+6.8%", icon: Gem, tone: "violet" },
        { label: "Avg RFM Score", value: "11.8/15", delta: "+1.3", icon: Gauge, tone: "green" },
      ]} />
      <section className="tab-strip animate-in" aria-label="Customer intelligence views">
        {tabs.map((tab) => (
          <button type="button" aria-pressed={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>
        ))}
        <span className="tab-status">Viewing {activeTab}</span>
      </section>
      <section className="dashboard-grid">
        <Panel title="Segment Distribution" kicker="Share of customer base" icon={Users}><Donut labels={["Champions", "Loyal", "Potential", "New", "At Risk", "Lost"]} /></Panel>
        <Panel title="Customer Lifetime Value" kicker="Average CLV by segment" icon={Gem}><HorizontalBars /></Panel>
        <Panel title="KMeans Cluster Scatter" kicker="Recency vs monetary, sized by frequency" icon={Brain}><ScatterPlot /></Panel>
        <Panel title="RFM Score Heatmap" kicker="Recency, frequency, monetary heat" icon={Eye}><HeatMap /></Panel>
        <Panel className="wide-panel" title="Customer Insights & Playbook" kicker="Recommended action per segment" icon={Sparkles}><SegmentCards /></Panel>
      </section>
    </>
  );
}

function ChurnPage() {
  return (
    <>
      <KpiGrid items={[
        { label: "High Risk", value: "247", delta: "+2.4%", icon: TrendingDown, tone: "danger" },
        { label: "Medium Risk", value: "602", delta: "+0.8%", icon: Activity, tone: "gold" },
        { label: "Low Risk", value: "1,941", delta: "-1.1%", icon: ShieldCheck, tone: "green" },
        { label: "Revenue at Risk", value: "$2.91M", delta: "-4.0%", icon: WalletCards, tone: "danger" },
        { label: "Avg Churn Prob.", value: "31.8%", delta: "-2.6%", icon: Gauge, tone: "violet" },
      ]} />
      <section className="dashboard-grid">
        <Panel title="Churn Probability Distribution" kicker="Across the customer base" icon={BarChart3}><RevenueBars /></Panel>
        <Panel title="Risk Analysis" kicker="Customers by risk band" icon={Gauge}><RiskMatrix /></Panel>
        <Panel title="Feature Importance" kicker="What drives churn" icon={Brain}><HorizontalBars labels={["Recency", "Satisfaction", "Frequency", "Email opens", "Support tickets"]} /></Panel>
        <Panel title="Churn Timeline" kicker="Monthly churn events over last 6 months" icon={CalendarDays}><StackedBars /></Panel>
        <Panel className="wide-panel" title="Retention Recommendation Engine" kicker="Top at-risk customers + suggested action" icon={Zap}><LuxuryTable rows={[["C00421", "High", "91.2%", "$18.2K", "Offer Discount + Personal Outreach"], ["C01884", "High", "87.4%", "$12.7K", "VIP Concierge Call"], ["C00941", "Medium", "66.8%", "$8.9K", "Loyalty Program Enrollment"], ["C02016", "Medium", "61.5%", "$6.3K", "Personalized Campaign"]]} wide /></Panel>
      </section>
    </>
  );
}

function ForecastingPage() {
  const [demandBoost, setDemandBoost] = useState(15);
  const [marketingBoost, setMarketingBoost] = useState(20);
  const [seasonalFactor, setSeasonalFactor] = useState(8);

  const projected = (3.20 + demandBoost * 0.028 + marketingBoost * 0.018 + seasonalFactor * 0.016).toFixed(2);
  const delta = `+${(demandBoost * 0.85 + marketingBoost * 0.42 + seasonalFactor * 0.22).toFixed(1)}%`;

  return (
    <>
      <section className="control-grid animate-in">
        <Control title="Forecast period" value="30 Days" />
        <Control title="Metric" value="Revenue" />
        <div className="scenario-control">
          <label><span>Demand Increase</span><strong>+{demandBoost}%</strong></label>
          <input type="range" min={0} max={40} value={demandBoost} onChange={(e) => setDemandBoost(Number(e.target.value))} aria-label="Demand boost percentage" />
        </div>
        <div className="scenario-control">
          <label><span>Marketing Impact</span><strong>+{marketingBoost}%</strong></label>
          <input type="range" min={0} max={40} value={marketingBoost} onChange={(e) => setMarketingBoost(Number(e.target.value))} aria-label="Marketing impact percentage" />
        </div>
        <div className="scenario-control">
          <label><span>Seasonal Factor</span><strong>+{seasonalFactor}%</strong></label>
          <input type="range" min={0} max={20} value={seasonalFactor} onChange={(e) => setSeasonalFactor(Number(e.target.value))} aria-label="Seasonal factor percentage" />
        </div>
      </section>
      <KpiGrid items={[
        { label: "Projected Revenue", value: `$${projected}M`, delta, icon: LineChart, tone: "cyan" },
        { label: "Forecast Engine", value: "Prophet", delta: "Hybrid", icon: Brain, tone: "violet" },
        { label: "Backtest MAPE", value: "7.8%", delta: "-1.2%", icon: Gauge, tone: "green" },
        { label: "Forecast Accuracy", value: "92.2%", delta: "+2.1%", icon: TrendingUp, tone: "gold" },
      ]} />
      <section className="dashboard-grid">
        <Panel className="wide-panel" title="Historical Demand + Forecast" kicker="Confidence band and target line" icon={LineChart}><RevenueLine /><RevenueBars /></Panel>
        <Panel title="Seasonal Trend" kicker="30-day rolling average" icon={Activity}><RevenueLine compact /></Panel>
        <Panel title="Weekly Trend" kicker="Average demand by day of week" icon={CalendarDays}><StackedBars /></Panel>
        <Panel title="Forecast Detail" kicker="Day-by-day projection" icon={Table2}><LuxuryTable rows={[["Jun 24", "$142K", "$119K", "$166K"], ["Jun 25", "$148K", "$124K", "$172K"], ["Jun 26", "$153K", "$128K", "$181K"], ["Jun 27", "$166K", "$139K", "$195K"]]} /></Panel>
        <Panel title="Category Forecast" kicker="Projected demand by product line" icon={Layers3}><HorizontalBars /></Panel>
      </section>
    </>
  );
}

function InventoryPage() {
  return (
    <>
      <KpiGrid items={[
        { label: "SKUs Tracked", value: "25", delta: "Live", icon: PackageCheck, tone: "cyan" },
        { label: "Critical Stock", value: "4", delta: "-3.0%", icon: TrendingDown, tone: "danger" },
        { label: "Understock", value: "7", delta: "+1", icon: Activity, tone: "gold" },
        { label: "Overstock", value: "3", delta: "-2", icon: Layers3, tone: "violet" },
        { label: "Units to Reorder", value: "1,824", delta: "Auto", icon: CloudDownload, tone: "green" },
      ]} />
      <section className="dashboard-grid">
        <Panel title="Inventory Health" kicker="Weighted across all SKUs" icon={Gauge}><GaugeDial value={82} /></Panel>
        <Panel title="Stock Alerts" kicker="Items needing attention now" icon={Bell}><ActivityFeed /></Panel>
        <Panel title="Product Stock Heatmap" kicker="Average days-of-cover by category" icon={Layers3}><HeatMap /></Panel>
        <Panel title="Reorder Schedule" kicker="Upcoming fulfillment orders" icon={CalendarDays}><StackedBars /></Panel>
        <Panel className="wide-panel" title="Inventory Recommendations" kicker="Suggested reorder plan" icon={Table2}><LuxuryTable rows={[["P1008", "Smartwatch", "Critical", "420 units"], ["P1011", "Perfume", "Low", "280 units"], ["P1017", "Coffee Maker", "Healthy", "0 units"], ["P1023", "Sneakers", "Overstock", "Promotion"]]} /></Panel>
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
        <div><span className="eyebrow"><Table2 size={16} /> Report builder</span><h2>Board-ready exports</h2></div>
        {reports.map((item) => <button type="button" aria-pressed={activeReport === item} className={activeReport === item ? "active" : ""} onClick={() => setActiveReport(item)} key={item}>{item}</button>)}
      </section>
      <KpiGrid items={[
        { label: "Rows Previewed", value: "50", delta: "Live", icon: Table2, tone: "cyan" },
        { label: "Full Rows", value: "2,790", delta: "CSV", icon: CloudDownload, tone: "violet" },
        { label: "Avg CLV", value: "$8.4K", delta: "+6.8%", icon: Gem, tone: "gold" },
      ]} />
      <section className="dashboard-grid">
        <Panel className="wide-panel" title={`${activeReport} Preview`} kicker="Live preview with CSV / Excel / PDF export" icon={CloudDownload}>
          <LuxuryTable rows={[["C00018", "Champions", "14", "$24.2K", "$18.8K"], ["C00241", "Loyal", "12", "$19.4K", "$14.1K"], ["C01402", "At Risk", "3", "$8.1K", "$6.2K"], ["C01884", "Lost", "1", "$1.3K", "$900"]]} wide />
        </Panel>
        <Panel title="Export Queue" kicker="Recent report automation" icon={Database}><ActivityFeed /></Panel>
      </section>
    </>
  );
}

function SettingsPage({ theme, setTheme }: { theme: ThemeMode; setTheme: (theme: ThemeMode) => void }) {
  const isLight = theme === "light";

  return (
    <section className="settings-grid animate-in">
      <Panel title="Appearance" kicker="Theme" icon={isLight ? Sun : Moon}>
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
      </Panel>
      <Panel title="Model Settings" kicker="Configuration" icon={Brain}>
        <Control title="KMeans clusters" value="5 clusters" />
        <Control title="Inventory service level" value="95.0%" />
        <Control title="Churn model" value="Balanced logistic" />
      </Panel>
      <Panel title="Forecast Settings" kicker="Configuration" icon={LineChart}>
        <Control title="Default horizon" value="30 days" />
        <Control title="MAPE target" value="12%" />
        <Control title="Engine" value="Prophet + fallback" />
      </Panel>
      <Panel title="User Management" kicker="Access control" icon={Lock}>
        <LuxuryTable rows={[["Rashad", "Platform Integration", "Owner"], ["Kaviya", "Data Engineering", "Editor"], ["Rohinee", "Customer Intelligence", "Editor"], ["Sachin", "Forecasting", "Analyst"]]} />
      </Panel>
      <Panel title="Notification Settings" kicker="Configuration" icon={Bell}>
        <Control title="Email alerts" value="Enabled" />
        <Control title="Alert topics" value="Critical stock, churn spikes" />
        <Control title="Digest recipient" value="ops@retailpulse.io" />
      </Panel>
      <Panel title="Security & Audit" kicker="Governance" icon={ShieldCheck}>
        <ActivityFeed />
      </Panel>
    </section>
  );
}

function CommandModal({ open, onClose, setActivePage }: { open: boolean; onClose: () => void; setActivePage: (id: PageId) => void }) {
  const [query, setQuery] = useState("");
  const results = navItems.filter((item) => `${item.label} ${item.kicker}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <motion.section className="command-modal" role="dialog" aria-modal="true" aria-labelledby="command-title" initial={{ y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }}>
            <div className="modal-head"><Command size={18} /><strong id="command-title">Command search</strong><button type="button" aria-label="Close command search" onClick={onClose}><X size={18} /></button></div>
            <label className="modal-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search dashboard modules, customers, reports..." /></label>
            <div className="command-results">
              {results.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} className="command-result" aria-label={`Open ${item.label}`} onClick={() => { setActivePage(item.id); onClose(); }}><Icon size={17} /><span>{item.label}</span><em>{item.kicker}</em></button>;
              })}
              {results.length === 0 ? <p className="empty-result">No matching dashboard module.</p> : null}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AlertsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="alerts-title" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="drawer-head"><strong id="alerts-title">Live notifications</strong><button type="button" aria-label="Close notifications" onClick={onClose}><X size={18} /></button></div>
            <ActivityFeed />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div className="toast" role="status" aria-live="polite" initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
          <Sparkles size={17} />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function App() {
  const root = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem("retailpulse-theme");
    return savedTheme === "light" ? "light" : "dark";
  });
  const [navOpen, setNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const active = navItems.find((item) => item.id === activePage)!;

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

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

  usePageAnimation(root, [activePage, theme, loading]);

  const renderPage = () => {
    if (activePage === "overview") return <OverviewPage />;
    if (activePage === "segmentation") return <SegmentationPage />;
    if (activePage === "churn") return <ChurnPage />;
    if (activePage === "forecasting") return <ForecastingPage />;
    if (activePage === "inventory") return <InventoryPage />;
    if (activePage === "reports") return <ReportsPage />;
    return <SettingsPage theme={theme} setTheme={setTheme} />;
  };

  return (
    <main ref={root} className={`app-shell theme-${theme}`}>
      <div className="scene-layer">
        <Canvas camera={{ position: [0, 0, 7.5], fov: 44 }} dpr={[1, 1.4]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
          <EnvironmentScene theme={theme} />
        </Canvas>
      </div>
      <Sidebar activePage={activePage} setActivePage={setActivePage} open={navOpen} setOpen={setNavOpen} />
      <section className="workspace">
        <Topbar page={active} setNavOpen={setNavOpen} setCommandOpen={setCommandOpen} setAlertsOpen={setAlertsOpen} />
        {loading ? <SkeletonDashboard /> : (
          <>
            <HeroPanel
              page={active}
              onInsight={() => setToast(`${active.label} insight generated from the latest model snapshot.`)}
              onRefine={() => setCommandOpen(true)}
            />
            <AnimatePresence mode="wait">
              <motion.div
                className="page-content"
                key={activePage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </section>
      <CommandModal open={commandOpen} onClose={() => setCommandOpen(false)} setActivePage={setActivePage} />
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <Toast message={toast} />
    </main>
  );
}

export default App;
