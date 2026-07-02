import React from "react";
import { Player } from "@remotion/player";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  registerRoot,
} from "remotion";

// ── Timeline (frames @ 30 fps → 5 s total) ───────────────────────────────────
const CHART_START    = 0;    // start immediately so paused previews never look empty
const CALLOUT_START  = 110;  // 3.67 s — metric callout pulse
const TOTAL_FRAMES   = 210;  // 7.00 s

// ── Deterministic pseudo-random (seeded, frame-safe) ─────────────────────────
function dr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ── Clamped interpolate shorthand ─────────────────────────────────────────────
function ilerp(f: number, a: number, b: number, lo = 0, hi = 1): number {
  return interpolate(f, [a, b], [lo, hi], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DonutRevealComposition  (190×190, 120 frames @ 30 fps)
// Kept fully intact — highest-quality scene, used as reference bar.
// ─────────────────────────────────────────────────────────────────────────────

export interface DonutRevealProps {
  values: number[];
  colors: string[];
}

export const DonutRevealComposition: React.FC<DonutRevealProps> = ({
  values,
  colors,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const offsets: number[] = [];
  let cumulative = 0;
  for (const v of values) {
    offsets.push(-cumulative);
    cumulative += v;
  }

  const trackP = spring({ frame, fps, config: { damping: 80, stiffness: 260 } });
  const lastSegFrame = values.length * 9 + 18;
  const centerP = spring({
    frame: frame - lastSegFrame,
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 120 120"
        width="190"
        height="190"
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        {/* Track ring */}
        <circle
          cx="60" cy="60" r="44"
          fill="none" strokeWidth="16" pathLength="100"
          stroke="rgba(255,255,255,0.1)"
          strokeDasharray={`${100 * trackP} ${100 - 100 * trackP}`}
        />
        {/* Glow halos */}
        {values.map((value, index) => {
          const p = spring({ frame: frame - index * 9, fps, config: { damping: 20, stiffness: 95 } });
          const dash = value * p;
          return (
            <circle key={`glow-${index}`}
              cx="60" cy="60" r="44"
              fill="none" strokeWidth="30" pathLength="100"
              stroke={colors[index]}
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offsets[index]}
              style={{ opacity: p * 0.2, filter: "blur(10px)" }}
            />
          );
        })}
        {/* Main segments */}
        {values.map((value, index) => {
          const p = spring({ frame: frame - index * 9, fps, config: { damping: 26, stiffness: 130 } });
          const dash = value * p;
          return (
            <circle key={`seg-${index}`}
              cx="60" cy="60" r="44"
              fill="none" strokeWidth="16" pathLength="100"
              stroke={colors[index]}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offsets[index]}
              style={{ filter: `drop-shadow(0 0 5px ${colors[index]}cc)` }}
            />
          );
        })}
        {/* Leading spark dot */}
        {values.map((value, index) => {
          const p = spring({ frame: frame - index * 9, fps, config: { damping: 26, stiffness: 130 } });
          if (p < 0.05 || p > 0.95) return null;
          const T = -offsets[index] + value * p;
          const tipAngle = (T / 100) * 2 * Math.PI;
          const tipX = 60 + 44 * Math.cos(tipAngle);
          const tipY = 60 + 44 * Math.sin(tipAngle);
          const fadeIn = Math.min(1, p * 5);
          const fadeOut = 1 - Math.max(0, (p - 0.8) * 5);
          const sparkOpacity = fadeIn * fadeOut;
          return (
            <g key={`spark-${index}`}>
              <circle cx={tipX} cy={tipY} r="9" fill={colors[index]}
                style={{ opacity: sparkOpacity * 0.25, filter: "blur(5px)" }} />
              <circle cx={tipX} cy={tipY} r="4" fill={colors[index]}
                style={{ opacity: sparkOpacity, filter: `drop-shadow(0 0 6px ${colors[index]})` }} />
            </g>
          );
        })}
      </svg>

      {/* Center readout */}
      {centerP > 0.02 && (
        <div style={{
          position: "absolute",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          opacity: Math.min(1, centerP),
          transform: `scale(${0.2 + centerP * 0.8})`,
          zIndex: 2, pointerEvents: "none",
        }}>
          <strong style={{
            fontSize: "1.85rem", lineHeight: 1, fontWeight: 900, color: "#fff",
            letterSpacing: "-0.04em",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            textShadow: "0 0 24px rgba(168,85,247,0.6)",
          }}>100%</strong>
          <span style={{
            fontSize: "0.65rem", fontWeight: 900, color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase" as const, letterSpacing: "0.14em",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}>share</span>
        </div>
      )}

      {/* Orbital particles */}
      {frame > lastSegFrame + 10 && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          {[0, 72, 144, 216, 288].map((baseDeg, idx) => {
            const orbitP = spring({
              frame: frame - (lastSegFrame + 10 + idx * 3), fps,
              config: { damping: 28, stiffness: 90 },
            });
            const angle = ((baseDeg + orbitP * 15) * Math.PI) / 180;
            const r = 95;
            return (
              <div key={idx} style={{
                position: "absolute",
                width: "4px", height: "4px", borderRadius: "50%",
                background: colors[idx % colors.length],
                transform: `translate(${Math.cos(angle) * r}px, ${Math.sin(angle) * r}px)`,
                opacity: orbitP * 0.6,
                boxShadow: `0 0 8px ${colors[idx % colors.length]}`,
              }} />
            );
          })}
        </div>
      )}

      {/* Radial scan line */}
      {frame >= 4 && frame <= 70 && (() => {
        const scanAngle = interpolate(frame, [4, 70], [0, 360]);
        const rad = ((scanAngle - 90) * Math.PI) / 180;
        const x2 = 95 + Math.cos(rad) * 95;
        const y2 = 95 + Math.sin(rad) * 95;
        const scanOpacity =
          Math.min(0.35, (frame - 4) * 0.02) * Math.max(0, 1 - (frame - 55) * 0.07);
        return (
          <svg viewBox="0 0 190 190" width="190" height="190"
            style={{ position: "absolute", opacity: scanOpacity, pointerEvents: "none" }}>
            <defs>
              <linearGradient id="scanGrad" x1={95} y1={95} x2={x2} y2={y2}
                gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(168,85,247,0)" />
                <stop offset="100%" stopColor="rgba(168,85,247,0.8)" />
              </linearGradient>
            </defs>
            <line x1="95" y1="95" x2={x2} y2={y2}
              stroke="url(#scanGrad)" strokeWidth="1.5" />
          </svg>
        );
      })()}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DonutIntroPlayer  (in-dashboard wrapper, unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export function DonutIntroPlayer({
  values,
  colors,
  onEnded,
}: DonutRevealProps & { onEnded: () => void }) {
  return (
    <Player
      component={DonutRevealComposition}
      compositionWidth={190}
      compositionHeight={190}
      durationInFrames={120}
      fps={30}
      inputProps={{ values, colors }}
      autoPlay
      loop={false}
      clickToPlay={false}
      controls={false}
      acknowledgeRemotionLicense
      style={{ width: "100%", height: "100%", background: "transparent" }}
      onEnded={onEnded}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Smooth cubic-bezier path builder
// ─────────────────────────────────────────────────────────────────────────────

function buildSmoothLinePath(
  values: number[],
  x1: number,
  x2: number,
  yBottom: number,
  yTop: number,
): string {
  if (values.length < 2) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: x1 + ((x2 - x1) / (n - 1)) * i,
    y: yBottom - ((v - min) / range) * (yBottom - yTop),
  }));
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i].x - pts[i - 1].x) * 0.45;
    d += ` C${(pts[i - 1].x + dx).toFixed(1)},${pts[i - 1].y.toFixed(1)} ${(pts[i].x - dx).toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
  }
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// DataStoryProps
// ─────────────────────────────────────────────────────────────────────────────

export interface DataStoryProps {
  title: string;
  kicker: string;
  metric?: string;
  mode?: "line" | "bars" | "donut" | "gauge";
  visual?:
    | "line" | "bars" | "donut" | "gauge" | "stream" | "ranked" | "volume" | "monthly" | "heatmap" | "network" | "scatter" | "table" | "timeline"
    | "churn-distribution" | "risk-matrix" | "feature-force" | "retention-timeline" | "churn-network"
    | "forecast-horizon" | "seasonality-wave" | "weekly-cycle" | "forecast-category";
  storyId?: string;
  narrative?: string;
  outro?: string;
  rows?: string[][];
  accent?: string;
  secondaryAccent?: string;
  lineSeries?: number[];
  lineMonths?: string[];
  barSeries?: number[];
  donutValues?: number[];
  donutColors?: string[];
  gaugeValue?: number;
}

const DEFAULT_MONTHS = ["T1", "T2", "T3", "T4"];
const DEFAULT_BARS = [42, 56, 48, 64];

function getDataStoryProfile({
  title,
  kicker,
  storyId,
  accent,
  secondaryAccent,
  narrative,
  outro,
}: DataStoryProps) {
  const key = `${storyId ?? ""} ${title} ${kicker}`.toLowerCase();
  const base = {
    eyebrow: kicker,
    accent: accent ?? "#22d3ee",
    secondary: secondaryAccent ?? "#a855f7",
    background:
      "radial-gradient(circle at 18% 12%, rgba(168,85,247,.24), transparent 34%)," +
      "radial-gradient(circle at 78% 70%, rgba(34,211,238,.18), transparent 34%)," +
      "linear-gradient(135deg, #07081a 0%, #101044 48%, #030712 100%)",
    narrative: narrative ?? "Live data is converted into a concise executive-ready story.",
    outro: outro ?? "Story resolved.",
    signal: "Signal",
  };

  if (key.includes("revenue-trend") || key.includes("daily revenue")) {
    return { ...base, accent: accent ?? "#22d3ee", secondary: "#f59e0b", eyebrow: "Daily revenue replay", narrative: narrative ?? "Revenue movement is drawn from the selected operating window with momentum and threshold context.", outro: outro ?? "Revenue path stabilized.", signal: "Revenue" };
  }
  if (key.includes("product-category") || key.includes("category analysis")) {
    return { ...base, accent: accent ?? "#a855f7", secondary: "#34d399", eyebrow: "Category share map", narrative: narrative ?? "Product categories separate into weighted revenue shares with the strongest pocket highlighted.", outro: outro ?? "Category mix decoded.", signal: "Share" };
  }
  if (key.includes("activity-feed") || key.includes("segment stream") || key.includes("stock alerts") || key.includes("export queue")) {
    return { ...base, accent: accent ?? "#22c55e", secondary: "#60a5fa", eyebrow: "Live event stream", narrative: narrative ?? "Model, inventory, customer, and reporting events are replayed as a live operations stream.", outro: outro ?? "Event stream synchronized.", signal: "Live" };
  }
  if (key.includes("monthly-performance") || key.includes("profit by month")) {
    return { ...base, accent: accent ?? "#f59e0b", secondary: "#ec4899", eyebrow: "Revenue/profit stack", narrative: narrative ?? "Monthly revenue and profit bars build together so margin movement is visible instead of implied.", outro: outro ?? "Monthly performance packaged.", signal: "Month" };
  }
  if (key.includes("top-selling") || key.includes("ranked")) {
    return { ...base, accent: accent ?? "#fbbf24", secondary: "#22d3ee", eyebrow: "Revenue leaderboard", narrative: narrative ?? "Top products are ranked by contribution, exposing which SKUs carry the revenue base.", outro: outro ?? "Leaderboard locked.", signal: "Rank" };
  }
  if (key.includes("volume") || key.includes("three-dimensional")) {
    return { ...base, accent: accent ?? "#8b5cf6", secondary: "#22d3ee", eyebrow: "3D volume field", narrative: narrative ?? "Volume bars rise as a dimensional field, showing relative demand intensity across the operating window.", outro: outro ?? "Volume field mapped.", signal: "Depth" };
  }
  if (key.includes("cluster") || key.includes("scatter")) {
    return { ...base, accent: accent ?? "#c084fc", secondary: "#f472b6", eyebrow: "Cluster scatter scan", narrative: narrative ?? "Customer clusters separate by value and recency so segment behavior becomes visible.", outro: outro ?? "Cluster map resolved.", signal: "Cluster" };
  }
  if (key.includes("heatmap") || key.includes("territory") || key.includes("stock heatmap")) {
    return { ...base, accent: accent ?? "#34d399", secondary: "#f59e0b", eyebrow: "Heat intensity pass", narrative: narrative ?? "Dense signals are converted into a heat field to reveal concentration and risk pressure.", outro: outro ?? "Heat field analyzed.", signal: "Heat" };
  }
  if (key.includes("force graph") || key.includes("neural network")) {
    return { ...base, accent: accent ?? "#22d3ee", secondary: "#ef4444", eyebrow: "Network topology", narrative: narrative ?? "Connected nodes reveal relationships between customers, model features, and risk states.", outro: outro ?? "Network state explained.", signal: "Graph" };
  }
  if (key.includes("timeline") || key.includes("schedule") || key.includes("weekly")) {
    return { ...base, accent: accent ?? "#60a5fa", secondary: "#fbbf24", eyebrow: "Timeline sequence", narrative: narrative ?? "Events and bars resolve across time to show where operational pressure is building.", outro: outro ?? "Timeline ready.", signal: "Time" };
  }
  if (key.includes("forecast") || key.includes("demand")) {
    return { ...base, accent: accent ?? "#22d3ee", secondary: "#34d399", eyebrow: "Forecast simulation", narrative: narrative ?? "Historical demand extends into the forecast horizon with a clear planning signal.", outro: outro ?? "Forecast story complete.", signal: "Forecast" };
  }
  if (key.includes("report") || key.includes("export")) {
    return { ...base, accent: accent ?? "#6366f1", secondary: "#22d3ee", eyebrow: "Report export pass", narrative: narrative ?? "Rows are validated, packaged, and prepared for executive reporting.", outro: outro ?? "Report pack ready.", signal: "Export" };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// LineChartSection  — rendered inside <Sequence from={CHART_START}>
// frame 0 here = absolute frame CHART_START
// ─────────────────────────────────────────────────────────────────────────────

const LineChartSection: React.FC<{
  path: string;
  months: string[];
  accent: string;
}> = ({ path, months, accent }) => {
  const frame = useCurrentFrame();

  const progress = Math.max(0.18, interpolate(frame, [0, 94], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  // Stable IDs derived from accent hex (no special chars)
  const id = accent.replace(/[^a-z0-9]/gi, "x");

  return (
    <svg viewBox="0 0 980 350" width="100%" height="100%" overflow="visible">
      <defs>
        <linearGradient id={`ag-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
        <clipPath id={`ac-${id}`}>
          <rect x="0" y="0" width={`${progress * 980}`} height="360" />
        </clipPath>
      </defs>

      {/* Animated grid lines — staggered fade-in */}
      {[70, 140, 210, 280].map((y, i) => {
        const alpha = interpolate(frame, [i * 5, i * 5 + 12], [0, 0.15], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <line key={y} x1="26" x2="952" y1={y} y2={y}
            stroke={`rgba(255,255,255,${alpha})`}
            strokeDasharray="6 14" />
        );
      })}

      {/* Area fill revealed left-to-right */}
      <path
        d={`${path} L948,350 L40,350 Z`}
        fill={`url(#ag-${id})`}
        clipPath={`url(#ac-${id})`}
      />

      {/* Glowing line — pathLength draw */}
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth="5.5"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray={`${progress} ${1 - progress}`}
        style={{
          filter: `drop-shadow(0 0 12px ${accent}) drop-shadow(0 0 26px ${accent}55)`,
        }}
      />

      {/* Month labels slide up from below */}
      {months.map((month, i) => {
        const t = interpolate(frame, [22 + i * 6, 38 + i * 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <text
            key={month}
            x={(40 + (908 / Math.max(months.length - 1, 1)) * i).toFixed(1)}
            y={330 + (1 - t) * 18}
            fill={`rgba(255,255,255,${0.62 * t})`}
            fontSize="22"
            fontWeight="900"
          >
            {month}
          </text>
        );
      })}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BarChartSection  — rendered inside <Sequence from={CHART_START}>
// ─────────────────────────────────────────────────────────────────────────────

const BarChartSection: React.FC<{
  bars: number[];
  accent: string;
}> = ({ bars, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${bars.length}, 1fr)`,
        alignItems: "end",
        gap: 14,
      }}
    >
      {bars.map((bar, index) => {
        const localP = Math.max(0.3, spring({
          frame: frame - index * 5,
          fps,
          config: { damping: 26, stiffness: 115 },
        }));
        const displayVal = Math.round(bar * localP);

        return (
          <div
            key={index}
            style={{
              position: "relative",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            {/* Count-up value label floats above bar top */}
            {localP > 0.1 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: `${bar * localP}%`,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.82)",
                  paddingBottom: 5,
                  opacity: Math.min(1, (localP - 0.1) * 4),
                  letterSpacing: "-0.02em",
                  pointerEvents: "none",
                }}
              >
                {displayVal}
              </div>
            )}

            {/* Bar with gradient + glow */}
            <div
              style={{
                width: "100%",
                height: `${bar * localP}%`,
                borderRadius: "16px 16px 4px 4px",
                background: `linear-gradient(180deg, #f0abfc 0%, ${accent} 52%, #4f46e5 100%)`,
                boxShadow: `0 0 22px ${accent}55, 0 6px 28px ${accent}33`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DonutChartSection  — renders DonutRevealComposition inline inside Sequence.
// Because it is inside <Sequence from={CHART_START}>, the internal
// useCurrentFrame() call sees frames starting from 0 at the right moment.
// ─────────────────────────────────────────────────────────────────────────────

const DonutChartSection: React.FC<{
  values: number[];
  colors: string[];
}> = ({ values, colors }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div style={{ width: 330, height: 330 }}>
      <DonutRevealComposition values={values} colors={colors} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// GaugeChartSection  — semicircle arc with tick marks, needle, count-up value
// ─────────────────────────────────────────────────────────────────────────────

const GaugeChartSection: React.FC<{
  value: number;
  accent: string;
}> = ({ value, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chartP  = Math.max(0.42, spring({ frame, fps, config: { damping: 28, stiffness: 95 } }));
  const safeVal = Math.max(0, Math.min(100, value));
  const countUp = Math.round(safeVal * chartP);

  // Gauge arc: center (310,230), radius 200
  // angle = π(1 − v/100)  →  v=0 → left, v=100 → right
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const v    = i * 10;
    const ang  = Math.PI * (1 - v / 100);
    const maj  = i % 5 === 0;
    const r1   = maj ? 178 : 186;
    const r2   = 210;
    return {
      x1: 310 + r1 * Math.cos(ang),
      y1: 230 - r1 * Math.sin(ang),
      x2: 310 + r2 * Math.cos(ang),
      y2: 230 - r2 * Math.sin(ang),
      maj,
    };
  });

  const zones = [
    { label: "LOW",  v: 10, fill: "rgba(34,211,238,0.5)" },
    { label: "MED",  v: 50, fill: "rgba(251,191,36,0.5)" },
    { label: "HIGH", v: 90, fill: "rgba(52,211,153,0.5)" },
  ];

  return (
    <svg viewBox="0 0 620 310" width="100%" height="100%" overflow="visible">
      {/* Track arc */}
      <path d="M110 230 A200 200 0 0 1 510 230"
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="32" strokeLinecap="round" />

      {/* Glow arc */}
      <path d="M110 230 A200 200 0 0 1 510 230"
        fill="none" stroke={accent} strokeWidth="48" strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${safeVal * chartP} ${100 - safeVal * chartP}`}
        style={{ opacity: 0.22, filter: "blur(9px)" }}
      />

      {/* Main arc */}
      <path d="M110 230 A200 200 0 0 1 510 230"
        fill="none" stroke={accent} strokeWidth="32" strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${safeVal * chartP} ${100 - safeVal * chartP}`}
        style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
      />

      {/* Tick marks */}
      {ticks.map((t, i) => {
        const alpha = Math.max(t.maj ? 0.22 : 0.12, interpolate(frame, [i * 3, i * 3 + 8], [0, t.maj ? 0.52 : 0.26], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }));
        return (
          <line key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={`rgba(255,255,255,${alpha})`}
            strokeWidth={t.maj ? 2.5 : 1.2}
            strokeLinecap="round"
          />
        );
      })}

      {/* Zone labels */}
      {zones.map(({ label, v, fill }) => {
        const ang   = Math.PI * (1 - v / 100);
        const lx    = 310 + 242 * Math.cos(ang);
        const ly    = 230 - 242 * Math.sin(ang);
        const alpha = Math.max(0.28, interpolate(frame, [28, 44], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }));
        return (
          <text key={label}
            x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor="middle" fontSize="13" fontWeight="700"
            fill={fill} style={{ opacity: alpha, letterSpacing: "0.1em" }}
          >
            {label}
          </text>
        );
      })}

      {/* Needle */}
      <g transform={`rotate(${-90 + (safeVal / 100) * 180 * chartP} 310 230)`}>
        <line x1="310" y1="230" x2="310" y2="60"
          stroke="white" strokeWidth="7" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.75))" }}
        />
        <circle cx="310" cy="230" r="22" fill={accent}
          style={{ filter: `drop-shadow(0 0 14px ${accent})` }}
        />
        <circle cx="310" cy="230" r="10" fill="white" />
      </g>

      {/* Count-up center value */}
      <text x="310" y="262" textAnchor="middle" fontSize="66" fontWeight="900" fill="white"
        style={{
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          filter: `drop-shadow(0 0 24px ${accent}66)`,
        }}
      >
        {countUp}
      </text>
      <text x="310" y="284" textAnchor="middle" fontSize="15" fontWeight="700"
        fill="rgba(255,255,255,0.42)" style={{ letterSpacing: "0.1em" }}
      >
        / 100
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MetricPulse  — pulse ring that emanates from KPI card after chart is drawn
// rendered inside <Sequence from={CALLOUT_START}>
// ─────────────────────────────────────────────────────────────────────────────

const MetricPulse: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame(); // 0 == absolute CALLOUT_START
  const ring  = Math.max(0, 1 - frame / 30);
  if (ring <= 0) return null;
  return (
    <div style={{
      position: "absolute",
      right: 138,
      top: 113,
      width: 100,
      height: 100,
      borderRadius: "50%",
      border: `2px solid ${accent}`,
      opacity: ring * 0.38,
      transform: `scale(${1 + (1 - ring) * 0.6})`,
      pointerEvents: "none",
    }} />
  );
};

const StreamStorySection: React.FC<{ rows: string[][]; accent: string; secondary: string }> = ({ rows, accent, secondary }) => {
  const frame = useCurrentFrame();
  const events = rows.length ? rows.slice(0, 5) : [
    ["Model stack", "Synced", "Live"],
    ["Inventory", "Reorder signal", "Watch"],
    ["Segment", "Champions expanded", "OK"],
    ["Forecast", "Horizon refreshed", "Ready"],
  ];
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gap: 12, alignContent: "center" }}>
      {events.map((row, index) => {
        const p = Math.max(0.42, ilerp(frame, index * 11, index * 11 + 22));
        const active = Math.sin((frame + index * 14) * 0.06) * 0.5 + 0.5;
        return (
          <div key={`${row[0]}-${index}`} style={{
            display: "grid",
            gridTemplateColumns: "72px 1fr auto",
            alignItems: "center",
            gap: 16,
            padding: "12px 16px",
            borderRadius: 20,
            border: `1px solid ${index % 2 ? secondary : accent}33`,
            background: `linear-gradient(135deg, ${index % 2 ? secondary : accent}1f, rgba(255,255,255,.035))`,
            opacity: p,
            transform: `translateX(${(1 - p) * -24}px)`,
            boxShadow: `0 14px 36px rgba(0,0,0,.26), inset 0 1px rgba(255,255,255,.12), 0 0 ${14 + active * 18}px ${index % 2 ? secondary : accent}22`,
          }}>
            <span style={{ color: accent, fontSize: 12, fontWeight: 950, letterSpacing: ".14em" }}>
              T+{String(index + 1).padStart(2, "0")}
            </span>
            <strong style={{ fontSize: 18, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {row[0]} · {row[1] ?? "Signal"}
            </strong>
            <em style={{ color: index % 2 ? secondary : accent, fontSize: 13, fontWeight: 900, fontStyle: "normal" }}>
              {row[2] ?? "Live"}
            </em>
          </div>
        );
      })}
    </div>
  );
};

const RankedStorySection: React.FC<{ rows: string[][]; bars: number[]; accent: string; secondary: string }> = ({ rows, bars, accent, secondary }) => {
  const frame = useCurrentFrame();
  const source = rows.length ? rows.slice(0, 5) : bars.slice(0, 5).map((value, i) => [`Product ${i + 1}`, `$${value.toFixed(1)}K`, `${Math.round(value)}%`]);
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gap: 11, alignContent: "center" }}>
      {source.map((row, index) => {
        const p = Math.max(0.38, spring({ frame: frame - index * 8, fps: 30, config: { damping: 24, stiffness: 120 } }));
        const width = Math.max(18, Math.min(100, Number.parseFloat(String(row[2]).replace(/[^0-9.]/g, "")) || bars[index] || 60));
        return (
          <div key={`${row[0]}-${index}`} style={{
            display: "grid",
            gridTemplateColumns: "42px 1fr 180px",
            alignItems: "center",
            gap: 18,
            padding: "8px 12px",
            borderRadius: 18,
            background: `linear-gradient(135deg, rgba(255,255,255,.07), ${index === 0 ? accent : secondary}10)`,
            border: `1px solid ${index === 0 ? accent : "rgba(255,255,255,.12)"}`,
            boxShadow: index === 0 ? `0 0 36px ${accent}2e` : "0 12px 30px rgba(0,0,0,.18)",
            opacity: p,
            transform: `translateY(${(1 - p) * 18}px)`,
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center",
              background: `${accent}22`, border: `1px solid ${accent}55`, color: accent, fontWeight: 950,
            }}>{index + 1}</span>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: 17, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row[0]}</strong>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.54)", fontWeight: 800 }}>{row[1] ?? "Revenue leader"}</span>
            </div>
            <div style={{ height: 13, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
              <div style={{
                width: `${width * p}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accent}, ${secondary})`,
                boxShadow: `0 0 18px ${accent}88`,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const VolumeStorySection: React.FC<{ bars: number[]; accent: string; secondary: string }> = ({ bars, accent, secondary }) => {
  const frame = useCurrentFrame();
  const values = bars.length ? bars.slice(0, 12) : DEFAULT_BARS;
  const max = Math.max(...values, 1);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", perspective: 860 }}>
      <div style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        bottom: 24,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${secondary}, ${accent}, transparent)`,
        boxShadow: `0 0 26px ${accent}`,
        opacity: 0.75,
      }} />
      <div style={{
        position: "absolute",
        inset: "14px 18px 2px",
        transform: `rotateX(58deg) rotateZ(${-10 + Math.sin(frame * .03) * 2}deg)`,
        transformStyle: "preserve-3d",
        display: "grid",
        gridTemplateColumns: `repeat(${values.length}, 1fr)`,
        gap: 13,
        alignItems: "end",
      }}>
        {values.map((value, index) => {
          const p = Math.max(0.36, spring({ frame: frame - index * 4, fps: 30, config: { damping: 22, stiffness: 105 } }));
          const h = Math.max(24, (value / max) * 210 * p);
          return (
            <div key={index} style={{
              height: h,
              borderRadius: "12px 12px 4px 4px",
              background: `linear-gradient(180deg, ${secondary}, ${accent})`,
              boxShadow: `0 ${18 + h * .05}px 46px ${accent}55, inset 0 1px rgba(255,255,255,.45)`,
              transform: `translateZ(${h * .22}px) rotateY(${Math.sin(frame * 0.035 + index) * 3}deg)`,
            }} />
          );
        })}
      </div>
    </div>
  );
};

const MonthlyStorySection: React.FC<{ bars: number[]; accent: string; secondary: string }> = ({ bars, accent, secondary }) => {
  const frame = useCurrentFrame();
  const values = bars.length ? bars.slice(-7) : DEFAULT_BARS;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => ({
    x: 45 + ((938 - 45) / Math.max(values.length - 1, 1)) * index,
    y: 232 - (value / max) * (232 - 58),
  }));
  const linePath = points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const prev = points[index - 1];
    const dx = (point.x - prev.x) * 0.42;
    return `${path} C${(prev.x + dx).toFixed(1)},${prev.y.toFixed(1)} ${(point.x - dx).toFixed(1)},${point.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }, "");
  const lineProgress = Math.max(0.24, ilerp(frame, 0, 82));
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{
        position: "absolute",
        inset: "0 0 20px",
        display: "grid",
        gridTemplateColumns: `repeat(${values.length}, 1fr)`,
        gap: 16,
        alignItems: "end",
      }}>
        {values.map((value, index) => {
          const p = Math.max(0.34, spring({ frame: frame - index * 6, fps: 30, config: { damping: 24, stiffness: 115 } }));
          const revenueH = Math.max(18, (value / max) * 210 * p);
          const profitH = Math.max(10, revenueH * (0.36 + (index % 3) * 0.07));
          return (
            <div key={index} style={{ position: "relative", height: 230, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8 }}>
              <div style={{ width: "34%", height: revenueH, borderRadius: "16px 16px 5px 5px", background: `linear-gradient(180deg, #fde68a, ${accent} 48%, #7c2d12)`, boxShadow: `0 0 28px ${accent}66, inset 0 1px rgba(255,255,255,.55)` }} />
              <div style={{ width: "34%", height: profitH, borderRadius: "16px 16px 5px 5px", background: `linear-gradient(180deg, #f9a8d4, ${secondary} 54%, #831843)`, boxShadow: `0 0 28px ${secondary}55, inset 0 1px rgba(255,255,255,.45)` }} />
            </div>
          );
        })}
      </div>
      <svg viewBox="0 0 980 280" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`monthly-line-${accent.replace(/[^a-z0-9]/gi, "x")}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={accent} />
            <stop offset="58%" stopColor={secondary} />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <path d={linePath} fill="none" stroke={secondary} strokeWidth="12" strokeLinecap="round" opacity="0.22" style={{ filter: `blur(8px) drop-shadow(0 0 24px ${secondary})` }} />
        <path d={linePath} fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="1.8" strokeLinecap="round" opacity="0.38" />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#monthly-line-${accent.replace(/[^a-z0-9]/gi, "x")})`}
          strokeWidth="4.6"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray={`${lineProgress} ${1 - lineProgress}`}
          opacity="0.9"
          style={{ filter: `drop-shadow(0 0 16px ${secondary}) drop-shadow(0 0 28px ${accent}55)` }}
        />
        {values.map((value, index) => {
          const x = points[index].x;
          const y = points[index].y;
          const p = Math.max(0.42, ilerp(frame, index * 7, index * 7 + 18));
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={5.5 * p}
              fill="white"
              opacity={p}
              style={{ filter: `drop-shadow(0 0 12px ${secondary})` }}
            />
          );
        })}
      </svg>
    </div>
  );
};

const HeatStorySection: React.FC<{ values: number[]; accent: string; secondary: string }> = ({ values, accent, secondary }) => {
  const frame = useCurrentFrame();
  const source = values.length ? values.slice(0, 20) : Array.from({ length: 20 }, (_, i) => 35 + ((i * 17) % 64));
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
      {source.map((value, index) => {
        const p = Math.max(0.36, ilerp(frame, index * 3, index * 3 + 16));
        return (
          <div key={index} style={{
            borderRadius: 18,
            background: `linear-gradient(145deg, ${value > 70 ? secondary : accent}${Math.round(28 + value / 2).toString(16)}, rgba(255,255,255,.04))`,
            border: `1px solid ${value > 70 ? secondary : accent}33`,
            opacity: p,
            transform: `scale(${0.88 + p * 0.12})`,
            boxShadow: value > 80 ? `0 0 24px ${secondary}66` : `0 0 14px ${accent}33`,
          }} />
        );
      })}
    </div>
  );
};

const NetworkStorySection: React.FC<{ accent: string; secondary: string }> = ({ accent, secondary }) => {
  const frame = useCurrentFrame();
  const nodes = Array.from({ length: 14 }, (_, i) => ({
    x: 80 + dr(i * 11 + 1) * 820,
    y: 35 + dr(i * 11 + 2) * 235,
    r: 5 + dr(i * 11 + 3) * 8,
  }));
  return (
    <svg viewBox="0 0 980 320" width="100%" height="100%">
      {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 260) return null;
        const p = ilerp(frame, (i + j) * 2, (i + j) * 2 + 18);
        return <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={accent} strokeWidth="1.2" opacity={p * .18} />;
      }))}
      {nodes.map((node, index) => {
        const p = Math.max(0.4, spring({ frame: frame - index * 4, fps: 30, config: { damping: 24, stiffness: 120 } }));
        const color = index % 4 === 0 ? secondary : accent;
        return <circle key={index} cx={node.x} cy={node.y} r={node.r * p} fill={color} opacity={0.76} style={{ filter: `drop-shadow(0 0 12px ${color})` }} />;
      })}
    </svg>
  );
};

const ChurnDistributionStorySection: React.FC<{ bars: number[]; accent: string; secondary: string }> = ({ bars, accent, secondary }) => {
  const frame = useCurrentFrame();
  const normalizeRiskBand = (value: number, index: number) => {
    if (!Number.isFinite(value) || value <= 0) return [18, 36, 58, 82][index] ?? 42;
    if (value > 100) return Math.min(92, Math.max(12, value / 10));
    return Math.min(92, Math.max(8, value));
  };
  const values = (bars.length ? bars : [28, 41, 62, 86]).slice(0, 4).map(normalizeRiskBand);
  const labels = ["Low", "Medium", "High", "Critical"];
  const colors = ["#34d399", "#fbbf24", "#f97316", accent];
  return (
    <svg viewBox="0 0 980 320" width="100%" height="100%">
      <circle cx="490" cy="160" r="128" fill={secondary} opacity=".08" />
      {values.map((value, index) => {
        const p = Math.max(0.18, ilerp(frame, 8 + index * 10, 56 + index * 10));
        const r = 64 + index * 32;
        const dash = Math.min(92, Math.max(8, value)) * p;
        return (
          <g key={labels[index]}>
            <circle cx="490" cy="160" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="18" />
            <circle cx="490" cy="160" r={r} fill="none" stroke={colors[index]} strokeWidth="18" pathLength="100" strokeDasharray={`${dash} ${100 - dash}`} strokeLinecap="round" transform={`rotate(${-105 + index * 12} 490 160)`} style={{ filter: `drop-shadow(0 0 18px ${colors[index]}88)` }} />
            <text x={690} y={88 + index * 48} fill={colors[index]} fontSize="18" fontWeight="950">{labels[index]}</text>
            <text x={810} y={88 + index * 48} fill="white" fontSize="22" fontWeight="950">{Math.round(value)}%</text>
          </g>
        );
      })}
      <text x="490" y="148" textAnchor="middle" fill="rgba(255,255,255,.58)" fontSize="18" fontWeight="900" letterSpacing=".12em">RISK MIX</text>
      <text x="490" y="184" textAnchor="middle" fill="white" fontSize="42" fontWeight="950">Churn Bands</text>
    </svg>
  );
};

const RiskMatrixStorySection: React.FC<{ values: number[]; accent: string; secondary: string }> = ({ values, accent, secondary }) => {
  const frame = useCurrentFrame();
  const cells = (values.length ? values : [86, 68, 41, 29, 74, 56, 38, 91, 63, 48, 35, 78]).slice(0, 12);
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
      {cells.map((value, index) => {
        const p = Math.max(0.25, ilerp(frame, index * 4, index * 4 + 22));
        const color = value > 75 ? accent : value > 55 ? "#f97316" : value > 38 ? "#fbbf24" : secondary;
        return (
          <div key={index} style={{ borderRadius: 22, padding: 16, border: `1px solid ${color}55`, background: `linear-gradient(145deg, ${color}2f, rgba(255,255,255,.045))`, opacity: p, transform: `scale(${0.9 + p * 0.1}) translateY(${(1 - p) * 12}px)`, boxShadow: `0 0 ${16 + value * .18}px ${color}33, inset 0 1px rgba(255,255,255,.12)` }}>
            <div style={{ color, fontSize: 12, fontWeight: 950, letterSpacing: ".12em" }}>R{index + 1}</div>
            <strong style={{ display: "block", color: "white", fontSize: 28, marginTop: 16 }}>{Math.round(value)}%</strong>
            <span style={{ color: "rgba(255,255,255,.48)", fontSize: 12, fontWeight: 800 }}>cohort pressure</span>
          </div>
        );
      })}
    </div>
  );
};

const FeatureForceStorySection: React.FC<{ accent: string; secondary: string }> = ({ accent, secondary }) => {
  const frame = useCurrentFrame();
  const features = [
    { label: "Recency", x: 165, y: 70 },
    { label: "Frequency", x: 118, y: 225 },
    { label: "CLV", x: 430, y: 44 },
    { label: "Orders", x: 585, y: 230 },
    { label: "Loyalty", x: 792, y: 92 },
  ];
  const center = { x: 490, y: 160 };
  return (
    <svg viewBox="0 0 980 320" width="100%" height="100%">
      {features.map((node, index) => {
        const p = Math.max(0.24, ilerp(frame, 8 + index * 8, 34 + index * 8));
        const color = index % 2 ? secondary : accent;
        return (
          <g key={node.label}>
            <line x1={node.x} y1={node.y} x2={center.x} y2={center.y} stroke={color} strokeWidth="2.5" opacity={p * .62} strokeDasharray="10 12" strokeDashoffset={-frame * 1.6} />
            <circle cx={node.x} cy={node.y} r={22 * p} fill={color} opacity=".2" />
            <circle cx={node.x} cy={node.y} r={10 + Math.sin(frame * .06 + index) * 2} fill={color} style={{ filter: `drop-shadow(0 0 16px ${color})` }} />
            <text x={node.x} y={node.y + 42} textAnchor="middle" fill="white" fontSize="16" fontWeight="900" opacity={p}>{node.label}</text>
          </g>
        );
      })}
      <circle cx={center.x} cy={center.y} r={58 + Math.sin(frame * .04) * 5} fill={`${accent}24`} stroke={accent} strokeWidth="2" />
      <text x={center.x} y={center.y - 6} textAnchor="middle" fill="white" fontSize="31" fontWeight="950">Risk</text>
      <text x={center.x} y={center.y + 24} textAnchor="middle" fill={accent} fontSize="16" fontWeight="950">driver model</text>
    </svg>
  );
};

const RetentionTimelineStorySection: React.FC<{ rows: string[][]; accent: string; secondary: string }> = ({ rows, accent, secondary }) => {
  const frame = useCurrentFrame();
  const source = rows.length ? rows.slice(0, 4) : [["C00421", "High", "Personal outreach"], ["C00318", "High", "Win-back offer"], ["C00102", "Medium", "Care queue"], ["C00818", "Low", "Monitor"]];
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gap: 14, alignContent: "center" }}>
      {source.map((row, index) => {
        const p = Math.max(0.28, spring({ frame: frame - index * 11, fps: 30, config: { damping: 24, stiffness: 105 } }));
        const color = index < 2 ? accent : secondary;
        return (
          <div key={`${row[0]}-${index}`} style={{ display: "grid", gridTemplateColumns: "96px 1fr 210px", alignItems: "center", gap: 16, padding: "13px 16px", borderRadius: 20, border: `1px solid ${color}44`, background: `linear-gradient(135deg, ${color}20, rgba(255,255,255,.04))`, opacity: p, transform: `translateX(${(1 - p) * -24}px)`, boxShadow: `0 16px 44px rgba(0,0,0,.24), 0 0 26px ${color}22` }}>
            <strong style={{ color, fontSize: 17 }}>{row[0]}</strong>
            <span style={{ color: "white", fontSize: 18, fontWeight: 900 }}>{row[2] ?? row[4] ?? "Retention action"}</span>
            <em style={{ color: "rgba(255,255,255,.62)", fontStyle: "normal", fontSize: 14, fontWeight: 900 }}>{row[1] ?? "Risk"}</em>
          </div>
        );
      })}
    </div>
  );
};

const ForecastHorizonStorySection: React.FC<{ history: number[]; forecast: number[]; months: string[]; accent: string; secondary: string }> = ({ history, forecast, months, accent, secondary }) => {
  const frame = useCurrentFrame();
  const hist = history.length ? history.slice(-8) : [42, 48, 45, 58, 61, 57, 66, 70];
  const fc = forecast.length ? forecast.slice(0, 7) : [72, 76, 80, 84, 88, 91, 95];
  const all = [...hist, ...fc];
  const path = buildSmoothLinePath(all, 48, 900, 244, 34);
  const splitX = 48 + (900 / Math.max(all.length - 1, 1)) * (hist.length - 1);
  const p = Math.max(.18, ilerp(frame, 0, 96));
  return (
    <svg viewBox="0 0 980 320" width="100%" height="100%">
      <rect x="38" y="22" width="904" height="250" rx="28" fill={`${accent}12`} stroke="rgba(255,255,255,.12)" />
      <path d={`${path} L948 294 L48 294 Z`} fill={secondary} opacity=".07" />
      <path d={path} fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray={`${p} ${1 - p}`} style={{ filter: `drop-shadow(0 0 16px ${accent})` }} />
      <line x1={splitX} x2={splitX} y1="36" y2="282" stroke={secondary} strokeWidth="2" strokeDasharray="8 8" opacity={ilerp(frame, 58, 80)} />
      <text x={splitX + 14} y="64" fill={secondary} fontSize="18" fontWeight="950">forecast opens</text>
      {months.slice(0, Math.min(all.length, 10)).map((m, i) => <text key={i} x={48 + (900 / Math.max(all.length - 1, 1)) * i} y="308" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="14" fontWeight="800">{m}</text>)}
    </svg>
  );
};

const SeasonalityWaveStorySection: React.FC<{ accent: string; secondary: string }> = ({ accent, secondary }) => {
  const frame = useCurrentFrame();
  const wave = (amp: number, y: number, phase: number) => Array.from({ length: 36 }, (_, i) => {
    const x = 45 + i * 25;
    const yy = y + Math.sin(i * .55 + phase + frame * .045) * amp;
    return `${i ? "L" : "M"}${x.toFixed(1)},${yy.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 980 320" width="100%" height="100%">
      <path d={wave(42, 146, 0)} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" opacity=".9" style={{ filter: `drop-shadow(0 0 18px ${accent})` }} />
      <path d={wave(26, 178, 1.8)} fill="none" stroke={secondary} strokeWidth="4" strokeLinecap="round" opacity=".72" strokeDasharray="14 10" />
      {["Trend", "Weekly", "Monthly"].map((label, i) => <text key={label} x={110 + i * 260} y={72 + i * 54} fill={i ? secondary : accent} fontSize="25" fontWeight="950">{label}</text>)}
    </svg>
  );
};

const WeeklyCycleStorySection: React.FC<{ values: number[]; accent: string; secondary: string }> = ({ values, accent, secondary }) => {
  const frame = useCurrentFrame();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const source = (values.length ? values : [48, 56, 62, 60, 74, 88, 69]).slice(0, 7);
  return (
    <svg viewBox="0 0 980 320" width="100%" height="100%">
      {source.map((value, index) => {
        const angle = (-90 + index * (360 / 7)) * Math.PI / 180;
        const p = Math.max(.25, ilerp(frame, index * 7, index * 7 + 25));
        const len = 62 + value * 1.35 * p;
        const color = index >= 5 ? secondary : accent;
        return (
          <g key={labels[index]}>
            <line x1="490" y1="160" x2={490 + Math.cos(angle) * len} y2={160 + Math.sin(angle) * len} stroke={color} strokeWidth="18" strokeLinecap="round" opacity=".82" style={{ filter: `drop-shadow(0 0 18px ${color})` }} />
            <text x={490 + Math.cos(angle) * 180} y={160 + Math.sin(angle) * 180} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="18" fontWeight="950">{labels[index]}</text>
          </g>
        );
      })}
      <circle cx="490" cy="160" r="46" fill="rgba(255,255,255,.09)" stroke={accent} />
      <text x="490" y="167" textAnchor="middle" fill="white" fontSize="20" fontWeight="950">7D</text>
    </svg>
  );
};

const ForecastCategoryStorySection: React.FC<{ labels?: string[]; bars: number[]; accent: string; secondary: string }> = ({ labels = [], bars, accent, secondary }) => {
  const frame = useCurrentFrame();
  const source = (bars.length ? bars : [82, 74, 66, 58, 44]).slice(0, 5);
  return (
    <div style={{ display: "grid", gap: 14, alignContent: "center", width: "100%", height: "100%" }}>
      {source.map((value, index) => {
        const p = Math.max(.24, spring({ frame: frame - index * 8, fps: 30, config: { damping: 22, stiffness: 110 } }));
        const color = index % 2 ? secondary : accent;
        return (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "180px 1fr 70px", gap: 16, alignItems: "center" }}>
            <strong style={{ color: "white", fontSize: 18 }}>{labels[index] ?? `Category ${index + 1}`}</strong>
            <div style={{ height: 18, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, value) * p}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${color}, white)`, boxShadow: `0 0 22px ${color}77` }} />
            </div>
            <span style={{ color, fontSize: 18, fontWeight: 950 }}>{Math.round(value * p)}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DataStoryComposition  — main 1280×720 cinematic composition
// Uses Sequence for proper phase isolation of chart and callout sections.
// ─────────────────────────────────────────────────────────────────────────────

export const DataStoryComposition: React.FC<DataStoryProps> = ({
  title,
  kicker,
  metric = "+12.6%",
  mode = "line",
  visual,
  storyId,
  narrative,
  outro,
  rows,
  accent,
  secondaryAccent,
  lineSeries,
  lineMonths,
  barSeries,
  donutValues,
  donutColors,
  gaugeValue,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const profile = getDataStoryProfile({ title, kicker, metric, mode, visual, storyId, narrative, outro, rows, accent, secondaryAccent, lineSeries, lineMonths, barSeries, donutValues, donutColors, gaugeValue });
  const storyVisual = visual ?? mode;
  const storyAccent = profile.accent;
  const storySecondary = profile.secondary;
  const outroIn = ilerp(frame, TOTAL_FRAMES - 60, TOTAL_FRAMES - 34);

  // ── Resolve effective data (live → fallback) ──────────────────────────────
  const effectiveBars = barSeries && barSeries.length > 0 ? barSeries : DEFAULT_BARS;
  const effectiveDonutValues =
    donutValues && donutValues.length > 0
      ? donutValues
      : [100];
  const effectiveDonutColors =
    donutColors && donutColors.length >= effectiveDonutValues.length
      ? donutColors
      : [storyAccent];
  const effectiveGaugeValue =
    typeof gaugeValue === "number" ? Math.max(0, Math.min(100, gaugeValue)) : 0;
  const effectiveLinePath =
    lineSeries && lineSeries.length >= 2
      ? buildSmoothLinePath(lineSeries, 40, 948, 278, 38)
      : buildSmoothLinePath([0, 0, 0, 0], 40, 948, 278, 38);
  const effectiveMonths =
    lineMonths && lineMonths.length > 0 ? lineMonths : DEFAULT_MONTHS;

  // ── Global animation springs ──────────────────────────────────────────────
  const intro = spring({ frame, fps, config: { damping: 22, stiffness: 120 } });
  const introVisible = Math.max(0.82, intro);
  const insightVisible = Math.max(0.72, ilerp(frame, 6, 34));
  const glow = interpolate(frame % 90, [0, 45, 90], [0.2, 0.48, 0.2]);
  const headlineY = interpolate(introVisible, [0, 1], [20, 0]);
  const sweepX = ((frame * 10) % 1540) - 180;
  const titleSize = title.length > 24 ? 52 : 60;
  const narrativeLine = profile.narrative.length > 124
    ? `${profile.narrative.slice(0, 121).trim()}...`
    : profile.narrative;

  return (
    <AbsoluteFill
      style={{
        background:
          profile.background,
        color: "white",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Ambient shimmer particles ───────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(circle at 18% 18%, ${storyAccent}36, transparent 28%),` +
            `radial-gradient(circle at 78% 28%, ${storySecondary}2e, transparent 31%),` +
            "linear-gradient(120deg, rgba(255,255,255,.035), transparent 42%, rgba(255,255,255,.025))",
          opacity: 0.95,
        }} />
        <svg width="1280" height="720" viewBox="0 0 1280 720" style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
          <defs>
            <linearGradient id={`data-sweep-${storyId ?? mode}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={storyAccent} stopOpacity="0" />
              <stop offset="50%" stopColor={storyAccent} stopOpacity="0.48" />
              <stop offset="100%" stopColor={storySecondary} stopOpacity="0" />
            </linearGradient>
            <pattern id={`data-grid-${storyId ?? mode}`} width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1280" height="720" fill={`url(#data-grid-${storyId ?? mode})`} opacity="0.18" />
          <line x1={sweepX} y1="0" x2={sweepX + 250} y2="720" stroke={`url(#data-sweep-${storyId ?? mode})`} strokeWidth="3" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={930 + i * 72}
              cy={215 + Math.sin(frame * 0.04 + i) * 18}
              r={88 + i * 34 + Math.sin(frame * 0.035 + i) * 8}
              fill="none"
              stroke={i % 2 ? storySecondary : storyAccent}
              strokeWidth="1.4"
              opacity={0.11}
            />
          ))}
        </svg>
        {Array.from({ length: 34 }, (_, i) => {
          const px  = (i * 137.5) % 100;
          const py  = (i * 91.3) % 100;
          const sz  = 1.5 + (i % 4);
          const opc = 0.1 + 0.16 * Math.sin((frame + i * 7) * 0.05);
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${px}%`, top: `${py}%`,
              width: sz, height: sz,
              borderRadius: "50%",
              background: i % 3 === 0 ? storyAccent : "white",
              opacity: opc,
              boxShadow: i % 5 === 0 ? `0 0 12px ${storyAccent}` : "none",
            }} />
          );
        })}
      </div>

      {/* ── Frame border with breathing glow ───────────────────────────── */}
      <div style={{
        position: "absolute", inset: 34,
        border: "1px solid rgba(255,255,255,.16)",
        borderRadius: 32,
        boxShadow:
          `0 0 ${80 + glow * 80}px rgba(168,85,247,.24), ` +
          "inset 0 1px rgba(255,255,255,.16)",
        background: `linear-gradient(135deg, ${storyAccent}18, rgba(255,255,255,.025))`,
        pointerEvents: "none",
      }} />

      {/* ── Headline: kicker + title slide up ──────────────────────────── */}
      <div style={{
        position: "absolute", left: 72, top: 54,
        opacity: introVisible,
        transform: `translateY(${headlineY}px)`,
        zIndex: 3,
      }}>
        <div style={{
          color: storyAccent, fontSize: 16, fontWeight: 950,
          letterSpacing: ".2em", textTransform: "uppercase" as const,
          textShadow: `0 0 20px ${storyAccent}66`,
        }}>
          {profile.eyebrow}
        </div>
        <h1 style={{
          maxWidth: width * 0.58,
          margin: "12px 0 0",
          fontSize: titleSize,
          lineHeight: 0.96,
          letterSpacing: "-.04em",
          fontWeight: 950,
          textShadow: "0 18px 42px rgba(0,0,0,.42)",
        }}>
          {title}
        </h1>
      </div>

      {/* ── KPI card ────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", right: 72, top: 66,
        width: 212, minHeight: 118,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,.18)",
        background: `linear-gradient(145deg, ${storyAccent}36, ${storySecondary}22)`,
        display: "grid", placeItems: "center",
        opacity: introVisible,
        transform: `scale(${0.92 + introVisible * 0.08})`,
        backdropFilter: "blur(12px)",
        boxShadow: `0 24px 80px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.20), 0 0 44px ${storyAccent}22`,
        zIndex: 3,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,.62)",
            fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: ".12em",
          }}>
            {profile.signal}
          </div>
          <strong style={{ display: "block", marginTop: 9, fontSize: 38, lineHeight: 1 }}>
            {metric}
          </strong>
        </div>
      </div>

      {/* ── Chart area — Sequence offsets frame counter for chart phases ─ */}
      <div style={{
        position: "absolute",
        left: 72, right: 72, top: 260, bottom: 150,
        overflow: "hidden",
        borderRadius: 28,
        padding: 26,
        border: "1px solid rgba(255,255,255,.14)",
        background:
          `radial-gradient(circle at 70% 28%, ${storyAccent}24, transparent 34%),` +
          `linear-gradient(145deg, rgba(255,255,255,.10), ${storySecondary}10 48%, rgba(255,255,255,.035))`,
        boxShadow:
          `0 30px 90px rgba(0,0,0,.38), inset 0 1px rgba(255,255,255,.16), 0 0 70px ${storyAccent}1f`,
        backdropFilter: "blur(10px)",
        zIndex: 2,
      }}>
        <Sequence from={CHART_START}>
          {storyVisual === "churn-distribution" ? (
            <ChurnDistributionStorySection bars={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "risk-matrix" ? (
            <RiskMatrixStorySection values={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "feature-force" || storyVisual === "churn-network" ? (
            <FeatureForceStorySection accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "retention-timeline" ? (
            <RetentionTimelineStorySection rows={rows ?? []} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "forecast-horizon" ? (
            <ForecastHorizonStorySection history={lineSeries ?? []} forecast={barSeries ?? []} months={effectiveMonths} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "seasonality-wave" ? (
            <SeasonalityWaveStorySection accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "weekly-cycle" ? (
            <WeeklyCycleStorySection values={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "forecast-category" ? (
            <ForecastCategoryStorySection bars={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "stream" ? (
            <StreamStorySection rows={rows ?? []} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "ranked" || storyVisual === "table" ? (
            <RankedStorySection rows={rows ?? []} bars={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "volume" ? (
            <VolumeStorySection bars={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "monthly" ? (
            <MonthlyStorySection bars={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "heatmap" ? (
            <HeatStorySection values={effectiveBars} accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "network" || storyVisual === "scatter" ? (
            <NetworkStorySection accent={storyAccent} secondary={storySecondary} />
          ) : storyVisual === "timeline" || storyVisual === "bars" || mode === "bars" ? (
            <BarChartSection bars={effectiveBars} accent={storyAccent} />
          ) : storyVisual === "donut" || mode === "donut" ? (
            <DonutChartSection values={effectiveDonutValues} colors={effectiveDonutColors} />
          ) : storyVisual === "gauge" || mode === "gauge" ? (
            <GaugeChartSection value={effectiveGaugeValue} accent={storyAccent} />
          ) : (
            <LineChartSection
              path={effectiveLinePath}
              months={effectiveMonths}
              accent={storyAccent}
            />
          )}
        </Sequence>
      </div>

      {/* ── Metric pulse ring after chart is drawn ──────────────────────── */}
      <Sequence from={CALLOUT_START}>
        <MetricPulse accent={storyAccent} />
      </Sequence>

      {frame < TOTAL_FRAMES - 36 && (
        <div style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 92,
          minHeight: 54,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 18px",
          borderRadius: 18,
          border: `1px solid ${storyAccent}3f`,
          background: "linear-gradient(135deg, rgba(5,7,19,.78), rgba(5,7,19,.38))",
          boxShadow: `0 16px 42px rgba(0,0,0,.32), 0 0 38px ${storyAccent}1f`,
          backdropFilter: "blur(14px)",
          fontSize: 18,
          lineHeight: 1.18,
          color: "rgba(255,255,255,.84)",
          fontWeight: 760,
          opacity: insightVisible,
          textShadow: "0 10px 28px rgba(0,0,0,.42)",
          zIndex: 3,
        }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            flex: "0 0 auto",
            background: storyAccent,
            boxShadow: `0 0 18px ${storyAccent}`,
          }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {narrativeLine}
          </span>
        </div>
      )}

      {outroIn > 0.01 && (
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 32,
          display: "grid",
          placeItems: "center",
          opacity: outroIn,
          background:
            `radial-gradient(circle at 50% 42%, ${storyAccent}44, transparent 42%),` +
            `radial-gradient(circle at 62% 58%, ${storySecondary}26, transparent 48%),` +
            "linear-gradient(135deg, rgba(2,2,8,.96), rgba(5,6,20,.94))",
          border: `1px solid ${storyAccent}55`,
          boxShadow: `inset 0 1px rgba(255,255,255,.16), 0 0 90px ${storyAccent}44`,
          zIndex: 60,
          pointerEvents: "none",
        }}>
          <div style={{
            width: "min(820px, 78%)",
            textAlign: "center",
            padding: "46px 54px",
            borderRadius: 34,
            border: `1px solid ${storyAccent}66`,
            background: "linear-gradient(145deg, rgba(255,255,255,.14), rgba(255,255,255,.045))",
            boxShadow: `0 36px 110px rgba(0,0,0,.56), inset 0 1px rgba(255,255,255,.18), 0 0 70px ${storyAccent}33`,
            backdropFilter: "blur(18px)",
            transform: `translateY(${(1 - outroIn) * 18}px) scale(${0.96 + outroIn * 0.04})`,
          }}>
            <div style={{
              margin: "0 auto 22px",
              width: 74,
              height: 74,
              borderRadius: 26,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 24,
              fontWeight: 950,
              background: `linear-gradient(145deg, ${storyAccent}66, ${storySecondary}44)`,
              border: `1px solid ${storyAccent}88`,
              boxShadow: `0 0 48px ${storyAccent}66`,
            }}>
              RP
            </div>
            <div style={{
              fontSize: 54,
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: "-0.045em",
              color: "white",
              textShadow: `0 0 34px ${storyAccent}77`,
            }}>
              {profile.outro}
            </div>
            <div style={{
              marginTop: 16,
              color: storyAccent,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: ".22em",
              textTransform: "uppercase" as const,
            }}>
              {profile.signal} / {metric}
            </div>
            <div style={{
              margin: "24px auto 0",
              width: 360 * outroIn,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${storyAccent}, ${storySecondary}, transparent)`,
              boxShadow: `0 0 20px ${storyAccent}`,
            }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DataStoryPlayer  — in-dashboard <Player> wrapper (unchanged API)
// ─────────────────────────────────────────────────────────────────────────────

export function DataStoryPlayer({
  title,
  kicker,
  metric,
  mode,
  visual,
  storyId,
  narrative,
  outro,
  rows,
  accent,
  secondaryAccent,
  lineSeries,
  lineMonths,
  barSeries,
  donutValues,
  donutColors,
  gaugeValue,
}: DataStoryProps) {
  return (
    <Player
      component={DataStoryComposition}
      compositionWidth={1280}
      compositionHeight={720}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      inputProps={{
        title, kicker, metric, mode, accent,
        visual, storyId, narrative, outro, rows, secondaryAccent,
        lineSeries, lineMonths, barSeries,
        donutValues, donutColors, gaugeValue,
      }}
      controls
      loop
      autoPlay
      acknowledgeRemotionLicense
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 24,
        overflow: "hidden",
        background: "#050712",
      }}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ███  NEW MODULE-SPECIFIC COMPOSITIONS  (8 unique scenes)  ███████████████████
// Each has its own timing, bg, motion language, SVG ID prefix, and identity.
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 1. ExecutiveBriefingComposition — 240 frames (8 s)
//    Dark navy, gold accent, cinematic KPI briefing
//    SVG prefix: eb-
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecutiveBriefingProps {
  title: string;
  kpis: { label: string; value: string; delta: string }[];
  barSeries?: number[];
}

export const ExecutiveBriefingComposition: React.FC<ExecutiveBriefingProps> = ({
  title = "Executive Briefing",
  kpis = [
    { label: "Revenue", value: "$4.2M", delta: "+18%" },
    { label: "Orders",  value: "12,840", delta: "+7%" },
    { label: "NPS",     value: "82",    delta: "+4pt" },
    { label: "Margin",  value: "34%",   delta: "+2pp" },
  ],
  barSeries = [52, 67, 48, 73, 61, 80, 58],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const curtain = ilerp(frame, 0, 18, 0, 1);
  const titleIn = spring({ frame: frame - 10, fps, config: { damping: 28, stiffness: 140 } });
  const barMax  = Math.max(...barSeries, 1);

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,.14), transparent 60%)," +
        "linear-gradient(160deg, #04071a 0%, #0a0d1f 60%, #020511 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Gold scan-line curtain wipe intro */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: `${(1 - curtain) * 100}%`,
        background: "#04071a",
        zIndex: 10,
        transition: "none",
      }} />

      {/* Ambient grid pattern */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.06 }} width="100%" height="100%">
        <defs>
          <pattern id="eb-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#eb-grid)" />
      </svg>

      {/* Diagonal accent band */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "linear-gradient(118deg, transparent 0%, rgba(245,158,11,.04) 45%, transparent 55%)",
      }} />

      {/* Header bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 6,
        background: "linear-gradient(90deg, #f59e0b, #fbbf24, #d97706)",
        boxShadow: "0 0 24px #f59e0b88",
        opacity: curtain,
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 54, left: 80,
        opacity: titleIn,
        transform: `translateX(${(1 - titleIn) * -24}px)`,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 900, color: "#f59e0b",
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
        }}>
          RetailPulse Intelligence
        </div>
        <h1 style={{
          margin: "14px 0 0", fontSize: 58, lineHeight: 0.96,
          fontWeight: 900, letterSpacing: "-0.04em",
          textShadow: "0 0 40px rgba(245,158,11,.3)",
        }}>
          {title}
        </h1>
      </div>

      {/* KPI grid — 4 cards stagger in */}
      <div style={{
        position: "absolute", top: 200, left: 80, right: 80,
        display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20,
      }}>
        {kpis.map((kpi, i) => {
          const p = spring({ frame: frame - (30 + i * 12), fps, config: { damping: 26, stiffness: 120 } });
          const countP = ilerp(frame, 30 + i * 12, 80 + i * 12, 0, 1);
          const isPositive = kpi.delta.startsWith("+");
          return (
            <div key={kpi.label} style={{
              borderRadius: 20,
              border: "1px solid rgba(245,158,11,.22)",
              background: "linear-gradient(145deg, rgba(245,158,11,.1), rgba(245,158,11,.03))",
              padding: "28px 24px",
              opacity: p,
              transform: `translateY(${(1 - p) * 20}px)`,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{
                fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.45)",
                letterSpacing: "0.18em", textTransform: "uppercase" as const,
              }}>
                {kpi.label}
              </div>
              <div style={{
                fontSize: 38, fontWeight: 900, marginTop: 10, lineHeight: 1,
                opacity: countP,
                transform: `scale(${0.85 + countP * 0.15})`,
              }}>
                {kpi.value}
              </div>
              <div style={{
                marginTop: 8, fontSize: 13, fontWeight: 900,
                color: isPositive ? "#34d399" : "#f87171",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span>{isPositive ? "▲" : "▼"}</span>
                <span>{kpi.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart — weekly performance */}
      <div style={{
        position: "absolute", bottom: 70, left: 80, right: 80, height: 180,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.35)",
          letterSpacing: "0.16em", textTransform: "uppercase" as const,
          marginBottom: 12,
        }}>
          Weekly Performance Index
        </div>
        <div style={{
          height: 140, display: "flex", alignItems: "flex-end", gap: 14,
        }}>
          {barSeries.map((v, i) => {
            const p = spring({ frame: frame - (100 + i * 8), fps, config: { damping: 24, stiffness: 130 } });
            const pct = (v / barMax) * 100 * p;
            return (
              <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", height: `${pct}%`,
                  borderRadius: "8px 8px 2px 2px",
                  background: `linear-gradient(180deg, #fbbf24, #f59e0b 60%, #d97706)`,
                  boxShadow: `0 0 16px #f59e0b55`,
                  position: "relative",
                }}>
                  {p > 0.6 && (
                    <div style={{
                      position: "absolute", top: -20, left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.7)",
                      opacity: ilerp(p, 0.6, 0.9),
                    }}>
                      {v}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outro: gold line sweep */}
      {frame > 200 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: `${ilerp(frame, 200, 240) * 100}%`,
          height: 4,
          background: "linear-gradient(90deg, transparent, #f59e0b, #fbbf24)",
          boxShadow: "0 0 20px #f59e0b",
        }} />
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CustomerSegmentComposition — 210 frames (7 s)
//    Deep violet bg, galaxy/orbit aesthetic, donut + orbiting labels
//    SVG prefix: cs-
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerSegmentProps {
  title: string;
  segments: { label: string; value: number; color: string }[];
}

export const CustomerSegmentComposition: React.FC<CustomerSegmentProps> = ({
  title = "Customer Segments",
  segments = [
    { label: "Premium",  value: 28.9, color: "#a855f7" },
    { label: "Regular",  value: 34.2, color: "#ec4899" },
    { label: "New",      value: 20.7, color: "#8b5cf6" },
    { label: "At-Risk",  value: 16.2, color: "#f472b6" },
  ],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalVal = segments.reduce((s, x) => s + x.value, 0) || 1;

  // Galaxy particle field (deterministic via dr)
  const STARS = 60;

  // Donut reveal
  let cum = 0;
  const offsets = segments.map(s => { const o = -cum; cum += s.value / totalVal * 100; return o; });

  const titleIn = spring({ frame: frame - 8, fps, config: { damping: 24, stiffness: 110 } });

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,.22), transparent 55%)," +
        "radial-gradient(circle at 80% 20%, rgba(236,72,153,.12), transparent 40%)," +
        "linear-gradient(140deg, #070314 0%, #0d0520 55%, #040110 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Star field */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1280" height="720">
        {Array.from({ length: STARS }, (_, i) => {
          const sx = dr(i * 3 + 1) * 1280;
          const sy = dr(i * 3 + 2) * 720;
          const sr = 0.5 + dr(i * 3 + 3) * 1.5;
          const pulse = 0.2 + 0.4 * Math.sin((frame * 0.04) + dr(i) * 6.28);
          return (
            <circle key={i} cx={sx} cy={sy} r={sr}
              fill={i % 4 === 0 ? "#a855f7" : "white"}
              opacity={pulse * (0.3 + dr(i + 100) * 0.4)}
            />
          );
        })}
      </svg>

      {/* Title */}
      <div style={{
        position: "absolute", top: 60, left: 80,
        opacity: titleIn,
        transform: `translateY(${(1 - titleIn) * 16}px)`,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 900, color: "#a855f7",
          letterSpacing: "0.2em", textTransform: "uppercase" as const,
        }}>
          Intelligence Layer
        </div>
        <h1 style={{
          margin: "12px 0 0", fontSize: 54, lineHeight: 0.96,
          fontWeight: 900, letterSpacing: "-0.04em",
          background: "linear-gradient(135deg, #f0abfc, #c084fc, #a855f7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {title}
        </h1>
      </div>

      {/* Central donut */}
      <svg viewBox="0 0 280 280" width="340" height="340"
        style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }}>
        <defs>
          <filter id="cs-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="140" cy="140" r="100" fill="none" strokeWidth="32"
          stroke="rgba(168,85,247,.12)" />
        {segments.map((seg, i) => {
          const pct = (seg.value / totalVal) * 100;
          const p = spring({ frame: frame - 30 - i * 14, fps, config: { damping: 22, stiffness: 100 } });
          const dash = pct * p;
          return (
            <g key={i}>
              {/* Glow layer */}
              <circle cx="140" cy="140" r="100" fill="none" strokeWidth="48"
                stroke={seg.color} pathLength="100"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offsets[i]}
                style={{ opacity: p * 0.18, filter: "blur(12px)" }}
              />
              {/* Main segment */}
              <circle cx="140" cy="140" r="100" fill="none" strokeWidth="32"
                stroke={seg.color} pathLength="100"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offsets[i]}
                style={{ filter: `drop-shadow(0 0 6px ${seg.color}cc)` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center label */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)",
        textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{
          fontSize: 42, fontWeight: 900, lineHeight: 1,
          opacity: ilerp(frame, 60, 90),
          textShadow: "0 0 30px rgba(168,85,247,.6)",
        }}>
          {segments.length}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.4)",
          letterSpacing: "0.14em", textTransform: "uppercase" as const,
        }}>
          Segments
        </div>
      </div>

      {/* Orbit labels */}
      {segments.map((seg, i) => {
        const pct = (seg.value / totalVal) * 100;
        const cumMid = offsets[i] * -1 + pct / 2;
        const angle = ((cumMid / 100) * 360 - 90) * (Math.PI / 180);
        const orbitR = 230;
        const px = 640 + Math.cos(angle) * orbitR;
        const py = 360 + Math.sin(angle) * orbitR;
        const p = ilerp(frame, 70 + i * 14, 110 + i * 14);
        return (
          <div key={`label-${i}`} style={{
            position: "absolute",
            left: px, top: py,
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            opacity: p,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 900, color: seg.color,
              textShadow: `0 0 12px ${seg.color}`,
            }}>
              {pct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 700 }}>
              {seg.label}
            </div>
          </div>
        );
      })}

      {/* Orbiting spark ring */}
      {frame > 80 && (
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1280" height="720">
          {[0, 1, 2, 3, 4].map(i => {
            const baseAngle = (i / 5) * Math.PI * 2;
            const angle = baseAngle + frame * 0.018;
            const r = 200;
            const sx = 640 + Math.cos(angle) * r;
            const sy = 360 + Math.sin(angle) * r;
            const op = ilerp(frame, 80, 110) * (0.5 + 0.3 * Math.sin(frame * 0.1 + i));
            return (
              <circle key={i} cx={sx} cy={sy} r="4"
                fill={segments[i % segments.length].color}
                opacity={op}
                style={{ filter: `blur(1px) drop-shadow(0 0 6px ${segments[i % segments.length].color})` }}
              />
            );
          })}
        </svg>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", right: 80, bottom: 80,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {segments.map((seg, i) => {
          const p = ilerp(frame, 90 + i * 8, 130 + i * 8);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              opacity: p, transform: `translateX(${(1 - p) * 16}px)`,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3,
                background: seg.color,
                boxShadow: `0 0 8px ${seg.color}`,
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.8)" }}>
                {seg.label} — {seg.value.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. ChurnIntelComposition — 210 frames (7 s)
//    Dark crimson bg, alert aesthetic, risk tier bars, heat cells
//    SVG prefix: ci-
// ─────────────────────────────────────────────────────────────────────────────

export interface ChurnIntelProps {
  title: string;
  riskTiers: { label: string; count: number; pct: number; color: string }[];
  heatValues?: number[];
}

export const ChurnIntelComposition: React.FC<ChurnIntelProps> = ({
  title = "Churn Intelligence",
  riskTiers = [
    { label: "Critical Risk",  count: 284,  pct: 14.2, color: "#ef4444" },
    { label: "High Risk",      count: 512,  pct: 25.6, color: "#f97316" },
    { label: "Medium Risk",    count: 748,  pct: 37.4, color: "#fbbf24" },
    { label: "Low Risk",       count: 456,  pct: 22.8, color: "#34d399" },
  ],
  heatValues = [87, 72, 45, 30, 63, 55, 41, 78, 60, 35, 50, 68],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxCount = Math.max(...riskTiers.map(r => r.count), 1);
  const alertP  = ilerp(frame, 0, 12, 0, 1);
  const titleIn = spring({ frame: frame - 8, fps, config: { damping: 30, stiffness: 150 } });

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(239,68,68,.18), transparent 50%)," +
        "radial-gradient(circle at 85% 75%, rgba(249,115,22,.1), transparent 40%)," +
        "linear-gradient(150deg, #120306 0%, #1a0408 50%, #080102 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Alert pulse border */}
      <div style={{
        position: "absolute", inset: 0, border: "2px solid rgba(239,68,68,.3)",
        borderRadius: 0, pointerEvents: "none",
        boxShadow: `0 0 ${40 + 20 * Math.sin(frame * 0.12)}px rgba(239,68,68,${0.1 + 0.06 * Math.sin(frame * 0.12)})`,
      }} />

      {/* Scan-line overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.06) 3px, rgba(0,0,0,.06) 4px)`,
      }} />

      {/* Alert header stripe */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 5,
        background: "linear-gradient(90deg, #ef4444, #f97316)",
        opacity: alertP,
      }} />

      {/* Title block */}
      <div style={{
        position: "absolute", top: 52, left: 80,
        opacity: titleIn, transform: `translateY(${(1 - titleIn) * 12}px)`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "#ef4444",
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
        }}>
          ⚠ Risk Engine Active
        </div>
        <h1 style={{
          margin: "10px 0 0", fontSize: 54, fontWeight: 900,
          lineHeight: 0.96, letterSpacing: "-0.04em",
          textShadow: "0 0 32px rgba(239,68,68,.4)",
        }}>
          {title}
        </h1>
      </div>

      {/* Risk tier horizontal bars */}
      <div style={{
        position: "absolute", top: 190, left: 80, right: 80,
      }}>
        {riskTiers.map((tier, i) => {
          const p = spring({ frame: frame - (40 + i * 14), fps, config: { damping: 24, stiffness: 110 } });
          const w = (tier.count / maxCount) * 100 * p;
          return (
            <div key={tier.label} style={{ marginBottom: 22 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 6, fontSize: 13, fontWeight: 700,
                color: "rgba(255,255,255,.8)",
                opacity: p,
              }}>
                <span>{tier.label}</span>
                <span style={{ color: tier.color }}>
                  {Math.round(tier.count * p).toLocaleString()} customers ({tier.pct.toFixed(1)}%)
                </span>
              </div>
              <div style={{
                height: 28, borderRadius: 6,
                background: "rgba(255,255,255,.06)",
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{
                  height: "100%", width: `${w}%`,
                  background: `linear-gradient(90deg, ${tier.color}cc, ${tier.color})`,
                  borderRadius: 6,
                  boxShadow: `0 0 16px ${tier.color}66`,
                  transition: "none",
                }} />
                {/* Shimmer on bar */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(90deg, transparent ${w - 8}%, rgba(255,255,255,.15) ${w}%, transparent ${w + 4}%)`,
                  pointerEvents: "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Heat map cells */}
      <div style={{
        position: "absolute", bottom: 68, left: 80,
        display: "flex", gap: 8, flexWrap: "wrap" as const,
        width: 640,
      }}>
        <div style={{
          width: "100%", fontSize: 11, fontWeight: 900,
          color: "rgba(255,255,255,.35)", letterSpacing: "0.14em",
          textTransform: "uppercase" as const, marginBottom: 8,
        }}>
          Churn Heat Map (Monthly Cohorts)
        </div>
        {heatValues.map((v, i) => {
          const p = ilerp(frame, 120 + i * 4, 140 + i * 4);
          const hue = v > 70 ? "#ef4444" : v > 50 ? "#f97316" : v > 35 ? "#fbbf24" : "#34d399";
          return (
            <div key={i} style={{
              width: 42, height: 42, borderRadius: 6,
              background: hue,
              opacity: p * (0.3 + (v / 100) * 0.7),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "white",
              boxShadow: p > 0.5 ? `0 0 10px ${hue}88` : "none",
            }}>
              {v}%
            </div>
          );
        })}
      </div>

      {/* Summary stats right side */}
      <div style={{
        position: "absolute", right: 80, bottom: 68,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {[
          { label: "Total At-Risk", val: "2,000", color: "#f97316" },
          { label: "Avg. Risk Score", val: "61.4", color: "#fbbf24" },
          { label: "Recovery Rate", val: "43%", color: "#34d399" },
        ].map((s, i) => {
          const p = ilerp(frame, 130 + i * 12, 170 + i * 12);
          return (
            <div key={s.label} style={{
              opacity: p, transform: `translateX(${(1 - p) * 20}px)`,
              textAlign: "right",
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                {s.label}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color,
                textShadow: `0 0 16px ${s.color}` }}>
                {s.val}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. DemandForecastComposition — 240 frames (8 s)
//    Ocean/deep-tech bg, grid scan, dual-line chart with confidence band
//    SVG prefix: df-
// ─────────────────────────────────────────────────────────────────────────────

export interface DemandForecastProps {
  title: string;
  historical: number[];
  forecast: number[];
  months: string[];
}

export const DemandForecastComposition: React.FC<DemandForecastProps> = ({
  title = "Demand Forecast",
  historical = [420, 445, 412, 478, 510, 488, 530, 565],
  forecast   = [530, 565, 590, 620, 655, 680, 710],
  months     = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const all  = [...historical, ...forecast];
  const aMin = Math.min(...all);
  const aMax = Math.max(...all);
  const rng  = (aMax - aMin) || 1;

  // Build coord for each point
  const X1 = 60, X2 = 1180, Y_BOT = 580, Y_TOP = 80;
  const totalPts = historical.length + forecast.length - 1;
  const coords = all.map((v, i) => ({
    x: X1 + ((X2 - X1) / (totalPts - 1)) * i,
    y: Y_BOT - ((v - aMin) / rng) * (Y_BOT - Y_TOP),
  }));
  const histCoords  = coords.slice(0, historical.length);
  const fcCoords    = coords.slice(historical.length - 1);

  function makePath(pts: {x:number;y:number}[]) {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const dx = (pts[i].x - pts[i-1].x) * 0.45;
      d += ` C${(pts[i-1].x+dx).toFixed(1)},${pts[i-1].y.toFixed(1)} ${(pts[i].x-dx).toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return d;
  }

  const histPath = makePath(histCoords);
  const fcPath   = makePath(fcCoords);

  const scanDone = ilerp(frame, 0, 30, 0, 1);
  const histP    = ilerp(frame, 35, 120, 0, 1);
  const fcP      = ilerp(frame, 120, 200, 0, 1);
  const titleIn  = spring({ frame: frame - 6, fps, config: { damping: 28, stiffness: 130 } });

  // Confidence band path
  const bandUpper = fcCoords.map(c => ({ x: c.x, y: c.y - 28 }));
  const bandLower = fcCoords.map(c => ({ x: c.x, y: c.y + 28 }));
  const bandPath  =
    makePath(bandUpper) +
    ` L${bandLower[bandLower.length-1].x.toFixed(1)},${bandLower[bandLower.length-1].y.toFixed(1)}` +
    bandLower.slice().reverse().map(c => ` L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join("") +
    " Z";

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(6,182,212,.14), transparent 55%)," +
        "radial-gradient(ellipse 40% 40% at 90% 10%, rgba(52,211,153,.1), transparent 50%)," +
        "linear-gradient(165deg, #020c14 0%, #041420 50%, #010810 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Grid scan intro — cyan horizontal sweep */}
      {frame < 35 && (
        <svg style={{ position: "absolute", inset: 0 }} width="1280" height="720">
          {[120, 200, 280, 360, 440, 520, 600].map((y, i) => {
            const alpha = ilerp(frame, i * 3, i * 3 + 14, 0, 0.2) *
                          (1 - ilerp(frame, 20 + i * 3, 30 + i * 3, 0, 1));
            return (
              <line key={y} x1="0" y1={y} x2="1280" y2={y}
                stroke="#06b6d4" strokeWidth="1"
                opacity={alpha}
              />
            );
          })}
          <rect
            x="0" y={720 * (1 - scanDone)} width="1280" height={720 * scanDone}
            fill="none"
            stroke="#06b6d4" strokeWidth="1.5"
            opacity={0.15 * (1 - scanDone)}
          />
        </svg>
      )}

      {/* Title */}
      <div style={{
        position: "absolute", top: 48, left: 80,
        opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14}px)`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "#06b6d4",
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
        }}>
          Predictive Analytics
        </div>
        <h1 style={{
          margin: "10px 0 0", fontSize: 54, fontWeight: 900,
          lineHeight: 0.96, letterSpacing: "-0.04em",
          textShadow: "0 0 32px rgba(6,182,212,.4)",
        }}>
          {title}
        </h1>
      </div>

      {/* Chart SVG */}
      <svg viewBox="0 0 1280 720" width="1280" height="720"
        style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="df-histgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="df-fcgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="df-histclip">
            <rect x={X1} y="0" width={`${histP * (X1 + ((X2-X1)/(totalPts-1))*(historical.length-1) - X1)}`} height="720" />
          </clipPath>
          <clipPath id="df-fcclip">
            <rect x={fcCoords[0]?.x ?? X1} y="0"
              width={`${fcP * (X2 - (fcCoords[0]?.x ?? X1))}`} height="720" />
          </clipPath>
        </defs>

        {/* Grid */}
        {[200, 300, 400, 500].map((y, i) => (
          <line key={y} x1={X1} y1={y} x2={X2} y2={y}
            stroke="rgba(255,255,255,.08)" strokeWidth="1"
            strokeDasharray="8 16"
            opacity={ilerp(frame, 30 + i * 4, 48 + i * 4)}
          />
        ))}

        {/* Confidence band */}
        {fcP > 0.01 && (
          <path d={bandPath}
            fill="#34d399" fillOpacity={0.08 * fcP}
            clipPath="url(#df-fcclip)"
          />
        )}

        {/* Historical area */}
        <path
          d={`${histPath} L${histCoords[histCoords.length-1].x.toFixed(1)},${Y_BOT} L${X1},${Y_BOT} Z`}
          fill="url(#df-histgrad)"
          clipPath="url(#df-histclip)"
        />

        {/* Historical line */}
        <path d={histPath} fill="none"
          stroke="#22d3ee" strokeWidth="4" strokeLinecap="round"
          pathLength="1"
          strokeDasharray={`${histP} ${1 - histP}`}
          style={{ filter: "drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 22px #22d3ee44)" }}
        />

        {/* Forecast area */}
        <path
          d={`${fcPath} L${fcCoords[fcCoords.length-1].x.toFixed(1)},${Y_BOT} L${fcCoords[0].x.toFixed(1)},${Y_BOT} Z`}
          fill="url(#df-fcgrad)"
          clipPath="url(#df-fcclip)"
        />

        {/* Forecast line dashed */}
        <path d={fcPath} fill="none"
          stroke="#34d399" strokeWidth="4" strokeLinecap="round"
          strokeDasharray="18 8"
          pathLength="1"
          style={{
            strokeDashoffset: `${1 - fcP}`,
            filter: "drop-shadow(0 0 10px #34d399) drop-shadow(0 0 22px #34d39944)",
          }}
        />

        {/* Divider line at historical/forecast boundary */}
        {histP > 0.9 && (
          <line
            x1={fcCoords[0]?.x ?? X1} y1={Y_TOP - 20}
            x2={fcCoords[0]?.x ?? X1} y2={Y_BOT + 20}
            stroke="rgba(255,255,255,.2)" strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        )}

        {/* Month labels */}
        {months.map((m, i) => {
          const cx = X1 + ((X2 - X1) / (months.length - 1)) * i;
          const op = ilerp(frame, 60 + i * 4, 80 + i * 4);
          return (
            <text key={i} x={cx} y={650} textAnchor="middle"
              fontSize="18" fontWeight="700"
              fill={`rgba(255,255,255,${0.4 * op})`}
            >
              {m}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        position: "absolute", top: 170, right: 80,
        display: "flex", flexDirection: "column", gap: 12,
        opacity: ilerp(frame, 50, 80),
      }}>
        {[
          { color: "#22d3ee", label: "Historical", style: "solid" },
          { color: "#34d399", label: "Forecast",   style: "dashed" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="8">
              <line x1="0" y1="4" x2="32" y2="4"
                stroke={l.color} strokeWidth="3"
                strokeDasharray={l.style === "dashed" ? "6 4" : "none"}
              />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* Key metric callout */}
      <div style={{
        position: "absolute", right: 80, bottom: 80,
        borderRadius: 16, border: "1px solid rgba(52,211,153,.3)",
        background: "linear-gradient(145deg, rgba(52,211,153,.12), rgba(6,182,212,.06))",
        padding: "20px 28px",
        opacity: ilerp(frame, 160, 190),
        backdropFilter: "blur(8px)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.4)",
          letterSpacing: "0.14em", textTransform: "uppercase" as const,
        }}>
          Forecast Accuracy
        </div>
        <div style={{ fontSize: 42, fontWeight: 900, color: "#34d399",
          textShadow: "0 0 20px #34d39966", marginTop: 6 }}>
          94.2%
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. InventoryOptComposition — 210 frames (7 s)
//    Warm dark bg, warehouse aesthetic, stock bars + threshold, health gauge
//    SVG prefix: io-
// ─────────────────────────────────────────────────────────────────────────────

export interface InventoryOptProps {
  title: string;
  skus: { label: string; stock: number; reorder: number }[];
  healthScore: number;
}

export const InventoryOptComposition: React.FC<InventoryOptProps> = ({
  title = "Inventory Optimization",
  skus = [
    { label: "SKU-001", stock: 82,  reorder: 40 },
    { label: "SKU-007", stock: 31,  reorder: 40 },
    { label: "SKU-012", stock: 94,  reorder: 50 },
    { label: "SKU-019", stock: 18,  reorder: 35 },
    { label: "SKU-025", stock: 65,  reorder: 45 },
    { label: "SKU-033", stock: 47,  reorder: 40 },
  ],
  healthScore = 76,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn  = spring({ frame: frame - 6, fps, config: { damping: 28, stiffness: 130 } });
  const gaugeP   = spring({ frame: frame - 100, fps, config: { damping: 22, stiffness: 90 } });
  const safeH    = Math.min(100, Math.max(0, healthScore));

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(245,158,11,.12), transparent 50%)," +
        "radial-gradient(ellipse 40% 40% at 10% 10%, rgba(20,184,166,.1), transparent 45%)," +
        "linear-gradient(145deg, #0b0802 0%, #130e04 50%, #060401 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Warehouse grid lines */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.05 }} width="1280" height="720">
        <defs>
          <pattern id="io-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect width="80" height="80" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#io-grid)" />
      </svg>

      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 80,
        opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14}px)`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "#f59e0b",
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
        }}>
          Supply Chain Intelligence
        </div>
        <h1 style={{
          margin: "10px 0 0", fontSize: 52, fontWeight: 900,
          lineHeight: 0.96, letterSpacing: "-0.04em",
          textShadow: "0 0 28px rgba(245,158,11,.35)",
        }}>
          {title}
        </h1>
      </div>

      {/* SKU bars with reorder threshold line */}
      <div style={{
        position: "absolute", top: 185, left: 80, right: 430,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.35)",
          letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 14,
        }}>
          Stock Levels vs Reorder Point
        </div>
        {skus.map((sku, i) => {
          const p = spring({ frame: frame - (40 + i * 12), fps, config: { damping: 24, stiffness: 110 } });
          const stockW = sku.stock * p;
          const reorderPct = sku.reorder;
          const isLow = sku.stock <= sku.reorder;
          const barColor = isLow ? "#ef4444" : sku.stock >= 80 ? "#34d399" : "#fbbf24";
          return (
            <div key={sku.label} style={{ marginBottom: 18 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.7)",
                marginBottom: 5, opacity: p,
              }}>
                <span>{sku.label}</span>
                <span style={{ color: barColor }}>{Math.round(stockW)}%</span>
              </div>
              <div style={{
                height: 22, borderRadius: 4, background: "rgba(255,255,255,.06)",
                position: "relative", overflow: "visible",
              }}>
                <div style={{
                  height: "100%", width: `${stockW}%`,
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${barColor}bb, ${barColor})`,
                  boxShadow: `0 0 12px ${barColor}44`,
                }} />
                {/* Reorder threshold line */}
                <div style={{
                  position: "absolute", top: -4, bottom: -4,
                  left: `${reorderPct}%`,
                  width: 2,
                  background: "rgba(255,255,255,.4)",
                  borderRadius: 1,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Health gauge (semicircle) */}
      <div style={{
        position: "absolute", right: 80, top: 160,
        width: 320, textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.35)",
          letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 14,
        }}>
          Inventory Health Score
        </div>
        <svg viewBox="0 0 320 190" width="320" height="190">
          <defs>
            <linearGradient id="io-gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path d="M30 160 A130 130 0 0 1 290 160"
            fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="24" strokeLinecap="round" />
          {/* Filled arc */}
          <path d="M30 160 A130 130 0 0 1 290 160"
            fill="none" stroke="url(#io-gauge)" strokeWidth="24" strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${safeH * gaugeP} ${100 - safeH * gaugeP}`}
            style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,.5))" }}
          />
          {/* Needle */}
          <g transform={`rotate(${-90 + (safeH / 100) * 180 * gaugeP} 160 160)`}>
            <line x1="160" y1="160" x2="160" y2="50"
              stroke="white" strokeWidth="5" strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px white)" }}
            />
            <circle cx="160" cy="160" r="14"
              fill={safeH >= 70 ? "#34d399" : safeH >= 40 ? "#fbbf24" : "#ef4444"}
              style={{ filter: "drop-shadow(0 0 10px currentColor)" }}
            />
          </g>
          {/* Value */}
          <text x="160" y="172" textAnchor="middle" fontSize="42" fontWeight="900" fill="white"
            style={{ filter: "drop-shadow(0 0 16px rgba(52,211,153,.5))" }}>
            {Math.round(safeH * gaugeP)}
          </text>
        </svg>

        {/* Status */}
        <div style={{
          marginTop: 8, fontSize: 14, fontWeight: 900,
          color: safeH >= 70 ? "#34d399" : safeH >= 40 ? "#fbbf24" : "#ef4444",
          letterSpacing: "0.1em",
          opacity: ilerp(frame, 120, 150),
        }}>
          {safeH >= 70 ? "HEALTHY" : safeH >= 40 ? "ATTENTION" : "CRITICAL"}
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{
        position: "absolute", bottom: 60, left: 80, right: 80,
        display: "flex", gap: 20,
      }}>
        {[
          { label: "Low-Stock SKUs", val: String(skus.filter(s => s.stock <= s.reorder).length), accent: "#ef4444" },
          { label: "Optimal SKUs",   val: String(skus.filter(s => s.stock > s.reorder).length),  accent: "#34d399" },
          { label: "Avg. Stock",     val: `${Math.round(skus.reduce((a, s) => a + s.stock, 0) / skus.length)}%`, accent: "#fbbf24" },
        ].map((st, i) => {
          const p = ilerp(frame, 160 + i * 10, 190 + i * 10);
          return (
            <div key={st.label} style={{
              flex: 1, borderRadius: 14,
              border: `1px solid ${st.accent}33`,
              background: `${st.accent}0d`,
              padding: "16px 20px",
              opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.4)",
                letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
                {st.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: st.accent,
                marginTop: 6, textShadow: `0 0 14px ${st.accent}` }}>
                {st.val}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. AnalyticsReportComposition — 180 frames (6 s)
//    Deep blue/indigo, enterprise scan-line intro, line chart + data rows
//    SVG prefix: ar-
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsReportProps {
  title: string;
  lineSeries: number[];
  months: string[];
  rows: { label: string; val: string; trend: "up" | "down" | "flat" }[];
}

export const AnalyticsReportComposition: React.FC<AnalyticsReportProps> = ({
  title = "Analytics Report",
  lineSeries = [42, 51, 47, 63, 58, 74, 69, 82, 78, 90, 86, 95],
  months     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  rows       = [
    { label: "Total Sessions",    val: "1.24M",  trend: "up"   },
    { label: "Conversion Rate",   val: "3.82%",  trend: "up"   },
    { label: "Avg. Order Value",  val: "$68.40", trend: "down"  },
    { label: "Return Rate",       val: "4.1%",   trend: "flat"  },
  ],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const path    = buildSmoothLinePath(lineSeries, 60, 720, 460, 120);
  const lineP   = ilerp(frame, 40, 140, 0, 1);
  const titleIn = spring({ frame: frame - 4, fps, config: { damping: 26, stiffness: 130 } });

  // Scan-line intro effect
  const scanY = ilerp(frame, 0, 30) * 720;

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 70% 50% at 30% 80%, rgba(59,130,246,.14), transparent 55%)," +
        "radial-gradient(ellipse 40% 35% at 85% 15%, rgba(99,102,241,.12), transparent 45%)," +
        "linear-gradient(145deg, #030710 0%, #060c1a 55%, #020510 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Scan-line intro */}
      {frame < 34 && (
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1280" height="720">
          <defs>
            <linearGradient id="ar-scan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y={Math.max(0, scanY - 60)} width="1280" height="120"
            fill="url(#ar-scan)" />
          <line x1="0" y1={scanY} x2="1280" y2={scanY}
            stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
        </svg>
      )}

      {/* Vertical rule accent */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 780, width: 1,
        background: "rgba(255,255,255,.08)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 80,
        opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14}px)`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "#3b82f6",
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
        }}>
          Performance Intelligence
        </div>
        <h1 style={{
          margin: "10px 0 0", fontSize: 52, fontWeight: 900,
          lineHeight: 0.96, letterSpacing: "-0.04em",
          textShadow: "0 0 28px rgba(59,130,246,.4)",
        }}>
          {title}
        </h1>
      </div>

      {/* Line chart */}
      <div style={{
        position: "absolute", top: 155, left: 40, width: 740, height: 380,
      }}>
        <svg viewBox="0 0 800 500" width="100%" height="100%" overflow="visible">
          <defs>
            <linearGradient id="ar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            <clipPath id="ar-clip">
              <rect x="60" y="0" width={lineP * 660} height="500" />
            </clipPath>
          </defs>
          {/* Grid */}
          {[120, 200, 280, 360, 440].map((y, i) => (
            <line key={y} x1="60" y1={y} x2="720" y2={y}
              stroke={`rgba(255,255,255,${ilerp(frame, 30 + i * 3, 44 + i * 3) * 0.1})`}
              strokeWidth="1" strokeDasharray="8 14"
            />
          ))}
          {/* Area */}
          <path
            d={`${path} L720,460 L60,460 Z`}
            fill="url(#ar-fill)" clipPath="url(#ar-clip)"
          />
          {/* Line */}
          <path d={path} fill="none"
            stroke="#3b82f6" strokeWidth="4.5" strokeLinecap="round"
            pathLength="1"
            strokeDasharray={`${lineP} ${1 - lineP}`}
            style={{ filter: "drop-shadow(0 0 10px #3b82f6) drop-shadow(0 0 24px #3b82f644)" }}
          />
          {/* Month labels */}
          {months.map((m, i) => {
            const cx = 60 + (660 / (months.length - 1)) * i;
            return (
              <text key={i} x={cx} y={490} textAnchor="middle"
                fontSize="16" fontWeight="700"
                fill={`rgba(255,255,255,${ilerp(frame, 50 + i * 3, 70 + i * 3) * 0.45})`}
              >
                {m}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Data rows (right panel) */}
      <div style={{
        position: "absolute", top: 155, left: 820, right: 60,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.35)",
          letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 16,
        }}>
          Key Metrics
        </div>
        {rows.map((row, i) => {
          const p = ilerp(frame, 60 + i * 14, 90 + i * 14);
          const trendColor = row.trend === "up" ? "#34d399" : row.trend === "down" ? "#f87171" : "#94a3b8";
          const trendIcon  = row.trend === "up" ? "▲" : row.trend === "down" ? "▼" : "—";
          return (
            <div key={row.label} style={{
              padding: "18px 0",
              borderBottom: "1px solid rgba(255,255,255,.07)",
              opacity: p,
              transform: `translateX(${(1 - p) * 20}px)`,
            }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,.42)", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase" as const,
              }}>
                {row.label}
              </div>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 10, marginTop: 6,
              }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: "white" }}>
                  {row.val}
                </span>
                <span style={{ fontSize: 14, fontWeight: 900, color: trendColor }}>
                  {trendIcon}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. PlatformIntelComposition — 180 frames (6 s)
//    Deep green/indigo bg, network nodes intro, system status + all-clear pulse
//    SVG prefix: pi-
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformIntelProps {
  title: string;
  metrics: { label: string; value: string; status: "ok" | "warn" | "crit" }[];
}

export const PlatformIntelComposition: React.FC<PlatformIntelProps> = ({
  title = "Platform Intelligence",
  metrics = [
    { label: "API Uptime",        value: "99.97%", status: "ok"   },
    { label: "Latency P95",       value: "142 ms", status: "ok"   },
    { label: "Active Users",      value: "4,820",  status: "ok"   },
    { label: "Error Rate",        value: "0.03%",  status: "warn" },
    { label: "Data Freshness",    value: "< 2 s",  status: "ok"   },
    { label: "Model Accuracy",    value: "96.4%",  status: "ok"   },
  ],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn  = spring({ frame: frame - 6, fps, config: { damping: 26, stiffness: 120 } });
  const allClearP = ilerp(frame, 130, 160, 0, 1);

  // Node positions (deterministic)
  const NODES = 18;
  const nodeData = Array.from({ length: NODES }, (_, i) => ({
    x: 100 + dr(i * 5 + 1) * 1080,
    y: 80 + dr(i * 5 + 2) * 560,
    r: 3 + dr(i * 5 + 3) * 5,
    phase: dr(i * 5 + 4) * Math.PI * 2,
  }));

  // Edges (connect nearby pairs deterministically)
  const edges: [number, number][] = [];
  for (let a = 0; a < NODES; a++) {
    for (let b = a + 1; b < NODES; b++) {
      const dx = nodeData[a].x - nodeData[b].x;
      const dy = nodeData[a].y - nodeData[b].y;
      if (Math.sqrt(dx * dx + dy * dy) < 260) edges.push([a, b]);
    }
  }

  const statusColor = (s: "ok" | "warn" | "crit") =>
    s === "ok" ? "#22c55e" : s === "warn" ? "#fbbf24" : "#ef4444";

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(22,163,74,.12), transparent 55%)," +
        "radial-gradient(circle at 85% 85%, rgba(99,102,241,.12), transparent 45%)," +
        "linear-gradient(145deg, #030215 0%, #05062a 55%, #020118 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Network node graph */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1280" height="720">
        {/* Edges */}
        {edges.map(([a, b], i) => {
          const op = ilerp(frame, 8 + i * 0.4, 20 + i * 0.4) * 0.12;
          return (
            <line key={i}
              x1={nodeData[a].x} y1={nodeData[a].y}
              x2={nodeData[b].x} y2={nodeData[b].y}
              stroke="#22c55e" strokeWidth="0.8" opacity={op}
            />
          );
        })}
        {/* Nodes */}
        {nodeData.map((n, i) => {
          const p   = ilerp(frame, 4 + i * 2, 18 + i * 2);
          const pulse = 0.4 + 0.3 * Math.sin(frame * 0.08 + n.phase);
          return (
            <circle key={i} cx={n.x} cy={n.y} r={n.r}
              fill={i % 5 === 0 ? "#6366f1" : "#22c55e"}
              opacity={p * pulse}
            />
          );
        })}
        {/* All-clear pulse rings */}
        {allClearP > 0.01 && [0, 1, 2].map(i => {
          const t = (allClearP - i * 0.25) * (1 / 0.75);
          if (t <= 0) return null;
          const r = t * 360;
          const op = Math.max(0, (1 - t) * 0.35);
          return (
            <circle key={i} cx="640" cy="360" r={r}
              fill="none" stroke="#22c55e" strokeWidth="2"
              opacity={op}
            />
          );
        })}
      </svg>

      {/* Title */}
      <div style={{
        position: "absolute", top: 50, left: 80,
        opacity: titleIn, transform: `translateY(${(1 - titleIn) * 14}px)`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, color: "#22c55e",
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
        }}>
          System Status · Live
        </div>
        <h1 style={{
          margin: "10px 0 0", fontSize: 52, fontWeight: 900,
          lineHeight: 0.96, letterSpacing: "-0.04em",
          textShadow: "0 0 28px rgba(34,197,94,.4)",
        }}>
          {title}
        </h1>
      </div>

      {/* Metric cards grid */}
      <div style={{
        position: "absolute", top: 185, left: 80, right: 80,
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20,
      }}>
        {metrics.map((m, i) => {
          const p = spring({ frame: frame - (40 + i * 12), fps, config: { damping: 26, stiffness: 120 } });
          const sc = statusColor(m.status);
          return (
            <div key={m.label} style={{
              borderRadius: 18,
              border: `1px solid ${sc}22`,
              background: `${sc}0d`,
              padding: "24px 22px",
              opacity: p,
              transform: `translateY(${(1 - p) * 18}px)`,
              backdropFilter: "blur(6px)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Status dot */}
              <div style={{
                position: "absolute", top: 16, right: 16,
                width: 10, height: 10, borderRadius: "50%",
                background: sc,
                boxShadow: `0 0 8px ${sc}`,
              }} />
              <div style={{
                fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.42)",
                letterSpacing: "0.14em", textTransform: "uppercase" as const,
              }}>
                {m.label}
              </div>
              <div style={{
                fontSize: 30, fontWeight: 900, marginTop: 10,
                color: sc, textShadow: `0 0 16px ${sc}66`,
              }}>
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-clear banner */}
      {allClearP > 0.01 && (
        <div style={{
          position: "absolute", bottom: 60, left: "50%",
          transform: `translateX(-50%)`,
          borderRadius: 40,
          border: "1px solid rgba(34,197,94,.4)",
          background: "rgba(34,197,94,.1)",
          padding: "14px 40px",
          opacity: allClearP,
          backdropFilter: "blur(10px)",
          whiteSpace: "nowrap" as const,
        }}>
          <span style={{
            fontSize: 15, fontWeight: 900, color: "#22c55e",
            letterSpacing: "0.14em", textTransform: "uppercase" as const,
            textShadow: "0 0 16px #22c55e",
          }}>
            ✓ All Systems Operational
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. MasterReelComposition — 300 frames (10 s)
//    Brand showreel: intro, mini-charts split, metrics cascade, outro
//    SVG prefix: mr-
// ─────────────────────────────────────────────────────────────────────────────

export interface MasterReelProps {
  brandName?: string;
  keyMetrics?: { label: string; value: string; color: string }[];
}

export const MasterReelComposition: React.FC<MasterReelProps> = ({
  brandName  = "RetailPulse",
  keyMetrics = [
    { label: "Revenue Growth",   value: "+18.4%",  color: "#f59e0b" },
    { label: "Churn Reduced",    value: "-12.2%",  color: "#22d3ee" },
    { label: "Forecast Acc.",    value: "94.2%",   color: "#34d399" },
    { label: "Inventory Score",  value: "82 / 100",color: "#a855f7" },
    { label: "Active Users",     value: "4,820",   color: "#ec4899" },
    { label: "Uptime",           value: "99.97%",  color: "#6366f1" },
  ],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase markers
  const BRAND_END    = 60;
  const CHARTS_START = 65;
  const CHARTS_END   = 190;
  const METRICS_START = 195;
  const OUTRO_START  = 265;

  const brandIn  = spring({ frame, fps, config: { damping: 24, stiffness: 100 } });
  const brandOut = ilerp(frame, BRAND_END - 20, BRAND_END, 1, 0);

  const chartsIn = ilerp(frame, CHARTS_START, CHARTS_START + 20, 0, 1);
  const chartsOut = ilerp(frame, CHARTS_END - 15, CHARTS_END, 1, 0);

  const metricsIn = ilerp(frame, METRICS_START, METRICS_START + 20, 0, 1);
  const metricsOut = ilerp(frame, OUTRO_START - 15, OUTRO_START, 1, 0);

  const outroIn = ilerp(frame, OUTRO_START, OUTRO_START + 25, 0, 1);

  // Mini spark lines (deterministic)
  const sparkLines = [
    [30, 42, 38, 55, 48, 62, 57, 74],
    [60, 48, 55, 42, 50, 38, 44, 35],
    [40, 52, 60, 55, 68, 72, 80, 85],
  ];

  const bgParticles = Array.from({ length: 40 }, (_, i) => ({
    x: dr(i * 7 + 1) * 1280,
    y: dr(i * 7 + 2) * 720,
    r: 0.5 + dr(i * 7 + 3) * 2.5,
    color: [
      "#a855f7", "#22d3ee", "#f59e0b", "#34d399", "#ec4899",
    ][Math.floor(dr(i * 7 + 4) * 5)],
    phase: dr(i * 7 + 5) * Math.PI * 2,
    speed: 0.03 + dr(i * 7 + 6) * 0.05,
  }));

  return (
    <AbsoluteFill style={{
      background:
        "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(168,85,247,.16), transparent 55%)," +
        "radial-gradient(circle at 85% 10%, rgba(34,211,238,.1), transparent 40%)," +
        "linear-gradient(145deg, #020105 0%, #060215 50%, #010104 100%)",
      color: "white",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Ambient particles */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1280" height="720">
        {bgParticles.map((p, i) => {
          const pulse = 0.2 + 0.5 * Math.sin(frame * p.speed + p.phase);
          return (
            <circle key={i} cx={p.x} cy={p.y} r={p.r}
              fill={p.color} opacity={pulse * 0.6}
            />
          );
        })}
      </svg>

      {/* ── PHASE 1: Brand intro ── */}
      {frame < BRAND_END && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
          opacity: brandOut,
        }}>
          {/* Logo mark */}
          <svg width="80" height="80" viewBox="0 0 80 80"
            style={{
              opacity: brandIn,
              transform: `scale(${0.6 + brandIn * 0.4})`,
              marginBottom: 24,
            }}>
            <defs>
              <linearGradient id="mr-logo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="36" fill="none"
              stroke="url(#mr-logo)" strokeWidth="4"
              style={{ filter: "drop-shadow(0 0 16px #a855f7)" }}
            />
            <polyline points="20,50 32,30 44,42 56,20 68,32"
              fill="none" stroke="url(#mr-logo)" strokeWidth="3.5" strokeLinecap="round"
            />
          </svg>
          <div style={{
            fontSize: 72, fontWeight: 900, letterSpacing: "-0.05em",
            opacity: brandIn,
            transform: `translateY(${(1 - brandIn) * 20}px)`,
            background: "linear-gradient(135deg, #f0abfc, #22d3ee, #34d399)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {brandName}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 900, letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,.4)",
            marginTop: 12,
            opacity: ilerp(frame, 18, 35),
          }}>
            Intelligent Retail Analytics
          </div>
        </div>
      )}

      {/* ── PHASE 2: Mini-charts split ── */}
      {frame >= CHARTS_START && frame < CHARTS_END && (
        <div style={{
          position: "absolute", inset: 0,
          opacity: chartsIn * chartsOut,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 2,
        }}>
          {sparkLines.map((series, si) => {
            const panelColors = ["#f59e0b", "#22d3ee", "#34d399"];
            const ac = panelColors[si];
            const path = buildSmoothLinePath(series, 30, 370, 220, 40);
            const p = ilerp(frame, CHARTS_START + si * 18, CHARTS_START + si * 18 + 60, 0, 1);
            return (
              <div key={si} style={{
                background: "rgba(255,255,255,.03)",
                borderRight: "1px solid rgba(255,255,255,.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column",
                gap: 12,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 900, color: ac,
                  letterSpacing: "0.16em", textTransform: "uppercase" as const,
                }}>
                  {["Revenue", "Churn", "Demand"][si]}
                </div>
                <svg viewBox="0 0 400 260" width="380" height="220">
                  <defs>
                    <linearGradient id={`mr-fill-${si}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ac} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={ac} stopOpacity="0.02" />
                    </linearGradient>
                    <clipPath id={`mr-clip-${si}`}>
                      <rect x="30" y="0" width={p * 340} height="260" />
                    </clipPath>
                  </defs>
                  <path d={`${path} L370,220 L30,220 Z`}
                    fill={`url(#mr-fill-${si})`}
                    clipPath={`url(#mr-clip-${si})`}
                  />
                  <path d={path} fill="none"
                    stroke={ac} strokeWidth="4" strokeLinecap="round"
                    pathLength="1"
                    strokeDasharray={`${p} ${1 - p}`}
                    style={{ filter: `drop-shadow(0 0 8px ${ac})` }}
                  />
                </svg>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PHASE 3: Key metrics cascade ── */}
      {frame >= METRICS_START && frame < OUTRO_START + 10 && (
        <div style={{
          position: "absolute", inset: 0,
          opacity: metricsIn * metricsOut,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 20,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,.35)",
            letterSpacing: "0.22em", textTransform: "uppercase" as const,
            marginBottom: 8,
            opacity: ilerp(frame, METRICS_START, METRICS_START + 12),
          }}>
            Platform Impact Summary
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3,280px)", gap: 16,
          }}>
            {keyMetrics.map((km, i) => {
              const p = spring({ frame: frame - (METRICS_START + 10 + i * 12), fps,
                config: { damping: 26, stiffness: 130 } });
              return (
                <div key={km.label} style={{
                  borderRadius: 18,
                  border: `1px solid ${km.color}22`,
                  background: `${km.color}0d`,
                  padding: "20px 24px",
                  textAlign: "center",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 16}px)`,
                  backdropFilter: "blur(6px)",
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.4)",
                    letterSpacing: "0.16em", textTransform: "uppercase" as const,
                    marginBottom: 8,
                  }}>
                    {km.label}
                  </div>
                  <div style={{
                    fontSize: 30, fontWeight: 900, color: km.color,
                    textShadow: `0 0 16px ${km.color}88`,
                  }}>
                    {km.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PHASE 4: Outro ── */}
      {frame >= OUTRO_START && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
          opacity: outroIn,
        }}>
          <div style={{
            fontSize: 20, fontWeight: 900,
            background: "linear-gradient(135deg, #f0abfc, #22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}>
            {brandName}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,.3)",
            letterSpacing: "0.24em", textTransform: "uppercase" as const, marginTop: 8,
          }}>
            Powered by AI · Built for Growth
          </div>
          {/* Outro line sweep */}
          <div style={{
            marginTop: 28, width: `${outroIn * 320}px`, height: 1,
            background: "linear-gradient(90deg, transparent, #a855f7, #22d3ee, transparent)",
          }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ModuleStoryPlayer — routes to the correct module composition
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleStoryType =
  | "executive"
  | "customer-segment"
  | "churn-intel"
  | "demand-forecast"
  | "inventory-opt"
  | "analytics-report"
  | "platform-intel"
  | "master-reel";

export interface ModuleStoryProps {
  storyType: ModuleStoryType;
  durationSeconds?: number;
  captionsEnabled?: boolean;
  narrationEnabled?: boolean;
  previewFormat?: string;
  // ExecutiveBriefing
  ebTitle?: string;
  ebKpis?: { label: string; value: string; delta: string }[];
  ebBarSeries?: number[];
  // CustomerSegment
  csTitle?: string;
  csSegments?: { label: string; value: number; color: string }[];
  // ChurnIntel
  ciTitle?: string;
  ciRiskTiers?: { label: string; count: number; pct: number; color: string }[];
  ciHeatValues?: number[];
  // DemandForecast
  dfTitle?: string;
  dfHistorical?: number[];
  dfForecast?: number[];
  dfMonths?: string[];
  // InventoryOpt
  ioTitle?: string;
  ioSkus?: { label: string; stock: number; reorder: number }[];
  ioHealthScore?: number;
  // AnalyticsReport
  arTitle?: string;
  arLineSeries?: number[];
  arMonths?: string[];
  arRows?: { label: string; val: string; trend: "up" | "down" | "flat" }[];
  // PlatformIntel
  piTitle?: string;
  piMetrics?: { label: string; value: string; status: "ok" | "warn" | "crit" }[];
  // MasterReel
  mrBrandName?: string;
  mrKeyMetrics?: { label: string; value: string; color: string }[];
}

const MODULE_STORY_FRAMES: Record<ModuleStoryType, number> = {
  "executive":        240,
  "customer-segment": 210,
  "churn-intel":      210,
  "demand-forecast":  240,
  "inventory-opt":    210,
  "analytics-report": 180,
  "platform-intel":   180,
  "master-reel":      300,
};

type ModuleStoryConfig = {
  label: string;
  kicker: string;
  accent: string;
  metric: string;
  thesis: string;
  close: string;
  captionBeats: string[];
};

function getModuleStoryConfig(props: ModuleStoryProps): ModuleStoryConfig {
  const firstKpi = props.ebKpis?.[0];
  const firstSegment = props.csSegments?.[0];
  const highRisk = props.ciRiskTiers?.[0];
  const latestForecast = props.dfForecast?.at(-1);
  const watchedSkus = props.ioSkus?.length ?? 0;
  const firstReport = props.arRows?.[0];
  const firstPlatformMetric = props.piMetrics?.[0];
  const firstMasterMetric = props.mrKeyMetrics?.[0];

  const configs: Record<ModuleStoryType, ModuleStoryConfig> = {
    executive: {
      label: "Executive Briefing",
      kicker: "Retail command sequence",
      accent: "#f59e0b",
      metric: firstKpi ? `${firstKpi.value} ${firstKpi.label}` : "Live KPI stack",
      thesis: "Revenue, orders, customers, and operating health are synchronized into one board-ready command view.",
      close: "Executive pulse locked.",
      captionBeats: [
        "Opening the board pulse from live dashboard signals.",
        "KPI cards rise from the current integration layer.",
        "Trend bars compress the operating story into one executive read.",
        "Briefing packaged for decision review.",
      ],
    },
    "customer-segment": {
      label: "Customer Segment",
      kicker: "Cluster intelligence replay",
      accent: "#c084fc",
      metric: firstSegment ? `${firstSegment.value.toFixed(1)}% ${firstSegment.label}` : "Live customer clusters",
      thesis: "Customer cohorts are mapped into actionable segments for retention, value growth, and campaign targeting.",
      close: "Segment playbook ready.",
      captionBeats: [
        "Loading customer intelligence from the active dataset.",
        "Cluster rings separate premium, regular, new, and at-risk cohorts.",
        "Distribution labels reveal the strongest customer concentration.",
        "Action layer prepared for personalized plays.",
      ],
    },
    "churn-intel": {
      label: "Churn Intelligence",
      kicker: "Retention risk scan",
      accent: "#ef4444",
      metric: highRisk ? `${highRisk.count.toLocaleString()} ${highRisk.label}` : "Risk bands active",
      thesis: "Retention signals expose the customers most likely to leave before revenue drops out of the system.",
      close: "Retention response armed.",
      captionBeats: [
        "Activating churn risk scan across customer behavior.",
        "Risk tiers stack by severity and customer count.",
        "Heat signals identify pressure zones for retention teams.",
        "Intervention queue is ready for follow-up.",
      ],
    },
    "demand-forecast": {
      label: "Demand Forecast",
      kicker: "Prophet planning reel",
      accent: "#22d3ee",
      metric: latestForecast ? `${Math.round(latestForecast).toLocaleString()} forecast` : "Forecast horizon active",
      thesis: "Historical demand and forward projections combine into a planning view for replenishment and revenue timing.",
      close: "Forecast horizon calibrated.",
      captionBeats: [
        "Reading historical demand movement from the integrated model output.",
        "Baseline demand line draws before the future projection opens.",
        "Forecast extension adds the next planning horizon.",
        "Planning signal is ready for inventory and sales alignment.",
      ],
    },
    "inventory-opt": {
      label: "Inventory Command",
      kicker: "Stock balance sequence",
      accent: "#fbbf24",
      metric: props.ioHealthScore != null ? `${props.ioHealthScore}/100 health` : `${watchedSkus} live SKUs`,
      thesis: "SKU stock levels, reorder points, and inventory health converge into a clear command layer.",
      close: "Stock posture stabilized.",
      captionBeats: [
        "Opening SKU command from live inventory recommendations.",
        "Stock bars compare current levels against reorder points.",
        "Health gauge resolves the total inventory posture.",
        "Optimization actions are ready for operations review.",
      ],
    },
    "analytics-report": {
      label: "Analytics Report",
      kicker: "Board pack generator",
      accent: "#60a5fa",
      metric: firstReport ? `${firstReport.val} ${firstReport.label}` : "Report pack ready",
      thesis: "Export-ready report packs translate customer, sales, churn, forecast, and stock data into an executive narrative.",
      close: "Report pack sealed.",
      captionBeats: [
        "Preparing board-ready analytics from live reporting data.",
        "Timeline chart reveals the performance arc.",
        "Report rows validate the metrics that will ship.",
        "Export package is ready for review.",
      ],
    },
    "platform-intel": {
      label: "Platform Intelligence",
      kicker: "Integration health monitor",
      accent: "#22c55e",
      metric: firstPlatformMetric ? `${firstPlatformMetric.value} ${firstPlatformMetric.label}` : "System metrics online",
      thesis: "The platform layer monitors integration health, freshness, reporting readiness, and operational controls.",
      close: "Platform systems aligned.",
      captionBeats: [
        "Scanning platform intelligence across all integrated modules.",
        "System nodes connect data, model, and dashboard controls.",
        "Status metrics confirm readiness across the integration layer.",
        "Operational state is ready for final presentation.",
      ],
    },
    "master-reel": {
      label: "RetailPulse Master Reel",
      kicker: "Full platform showcase",
      accent: "#f59e0b",
      metric: firstMasterMetric ? `${firstMasterMetric.value} ${firstMasterMetric.label}` : "RetailPulse live",
      thesis: "Every module rolls into one final RetailPulse showcase: revenue, customers, churn, forecast, inventory, and reports.",
      close: "RetailPulse showcase complete.",
      captionBeats: [
        "Opening the full RetailPulse command experience.",
        "Module montage brings every team output into one story.",
        "Impact metrics cascade across the final operating layer.",
        "Showcase closes with the integrated platform state.",
      ],
    },
  };

  return configs[props.storyType];
}

function renderBaseModuleStory(props: ModuleStoryProps) {
  if (props.storyType === "executive") {
    return (
      <ExecutiveBriefingComposition
        title={props.ebTitle ?? "Executive Briefing"}
        kpis={props.ebKpis ?? [
          { label: "Revenue", value: "$4.2M", delta: "+18%" },
          { label: "Orders", value: "12,840", delta: "+7%" },
          { label: "NPS", value: "82", delta: "+4pt" },
          { label: "Margin", value: "34%", delta: "+2pp" },
        ]}
        barSeries={props.ebBarSeries ?? [52, 67, 48, 73, 61, 80, 58]}
      />
    );
  }

  if (props.storyType === "customer-segment") {
    return (
      <CustomerSegmentComposition
        title={props.csTitle ?? "Customer Segments"}
        segments={props.csSegments ?? [
          { label: "Premium", value: 28.9, color: "#a855f7" },
          { label: "Regular", value: 34.2, color: "#ec4899" },
          { label: "New", value: 20.7, color: "#8b5cf6" },
          { label: "At-Risk", value: 16.2, color: "#f472b6" },
        ]}
      />
    );
  }

  if (props.storyType === "churn-intel") {
    return (
      <ChurnIntelComposition
        title={props.ciTitle ?? "Churn Intelligence"}
        riskTiers={props.ciRiskTiers ?? [
          { label: "Critical Risk", count: 284, pct: 14.2, color: "#ef4444" },
          { label: "High Risk", count: 512, pct: 25.6, color: "#f97316" },
          { label: "Medium Risk", count: 748, pct: 37.4, color: "#fbbf24" },
          { label: "Low Risk", count: 456, pct: 22.8, color: "#34d399" },
        ]}
        heatValues={props.ciHeatValues ?? [87, 72, 45, 30, 63, 55, 41, 78, 60, 35, 50, 68]}
      />
    );
  }

  if (props.storyType === "demand-forecast") {
    return (
      <DemandForecastComposition
        title={props.dfTitle ?? "Demand Forecast"}
        historical={props.dfHistorical ?? [420, 445, 412, 478, 510, 488, 530, 565]}
        forecast={props.dfForecast ?? [530, 565, 590, 620, 655, 680, 710]}
        months={props.dfMonths ?? ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"]}
      />
    );
  }

  if (props.storyType === "inventory-opt") {
    return (
      <InventoryOptComposition
        title={props.ioTitle ?? "Inventory Optimization"}
        skus={props.ioSkus ?? [
          { label: "SKU-001", stock: 82, reorder: 40 },
          { label: "SKU-007", stock: 31, reorder: 40 },
          { label: "SKU-012", stock: 94, reorder: 50 },
          { label: "SKU-019", stock: 18, reorder: 35 },
          { label: "SKU-025", stock: 65, reorder: 45 },
          { label: "SKU-033", stock: 47, reorder: 40 },
        ]}
        healthScore={props.ioHealthScore ?? 76}
      />
    );
  }

  if (props.storyType === "analytics-report") {
    return (
      <AnalyticsReportComposition
        title={props.arTitle ?? "Analytics Report"}
        lineSeries={props.arLineSeries ?? [42, 51, 47, 63, 58, 74, 69, 82, 78, 90, 86, 95]}
        months={props.arMonths ?? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}
        rows={props.arRows ?? [
          { label: "Total Sessions", val: "1.24M", trend: "up" },
          { label: "Conversion Rate", val: "3.82%", trend: "up" },
          { label: "Avg. Order Value", val: "$68.40", trend: "down" },
          { label: "Return Rate", val: "4.1%", trend: "flat" },
        ]}
      />
    );
  }

  if (props.storyType === "platform-intel") {
    return (
      <PlatformIntelComposition
        title={props.piTitle ?? "Platform Intelligence"}
        metrics={props.piMetrics ?? [
          { label: "API Uptime", value: "99.97%", status: "ok" },
          { label: "Latency P95", value: "142 ms", status: "ok" },
          { label: "Active Users", value: "4,820", status: "ok" },
          { label: "Error Rate", value: "0.03%", status: "warn" },
          { label: "Data Freshness", value: "< 2 s", status: "ok" },
          { label: "Model Accuracy", value: "96.4%", status: "ok" },
        ]}
      />
    );
  }

  return (
    <MasterReelComposition
      brandName={props.mrBrandName ?? "RetailPulse"}
      keyMetrics={props.mrKeyMetrics ?? [
        { label: "Revenue Growth", value: "+18.4%", color: "#f59e0b" },
        { label: "Churn Reduced", value: "-12.2%", color: "#22d3ee" },
        { label: "Forecast Acc.", value: "94.2%", color: "#34d399" },
        { label: "Inventory Score", value: "82 / 100", color: "#a855f7" },
        { label: "Active Users", value: "4,820", color: "#ec4899" },
        { label: "Uptime", value: "99.97%", color: "#6366f1" },
      ]}
    />
  );
}

const PremiumModuleStoryComposition: React.FC<ModuleStoryProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const config = getModuleStoryConfig(props);
  const introIn = spring({ frame, fps, config: { damping: 26, stiffness: 110 } });
  const introOut = 1 - ilerp(frame, 48, 72);
  const introOpacity = frame < 72 ? Math.min(1, Math.max(0.72, introIn) * introOut) : 0;
  const outroStart = Math.max(90, durationInFrames - 58);
  const outroIn = ilerp(frame, outroStart, outroStart + 22);
  const beatIndex = Math.min(config.captionBeats.length - 1, Math.floor((frame / Math.max(durationInFrames, 1)) * config.captionBeats.length));
  const sweepX = ((frame * 9) % 1480) - 160;
  const beatPulse = 0.55 + Math.sin(frame * 0.08) * 0.18;

  return (
    <AbsoluteFill style={{ background: "#020105", overflow: "hidden", color: "white" }}>
      {renderBaseModuleStory(props)}

      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width="1280" height="720" viewBox="0 0 1280 720" style={{ position: "absolute", inset: 0, opacity: 0.45 }}>
          <defs>
            <linearGradient id={`story-sweep-${props.storyType}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={config.accent} stopOpacity="0" />
              <stop offset="50%" stopColor={config.accent} stopOpacity="0.55" />
              <stop offset="100%" stopColor={config.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={sweepX} y1="0" x2={sweepX + 210} y2="720" stroke={`url(#story-sweep-${props.storyType})`} strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={190 + i * 280}
              cy={610 - Math.sin(frame * 0.035 + i) * 18}
              r={24 + i * 5}
              fill="none"
              stroke={config.accent}
              strokeWidth="1"
              opacity={0.05 + beatPulse * 0.08}
            />
          ))}
        </svg>

        {introOpacity > 0.01 && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background:
              `radial-gradient(circle at 50% 42%, ${config.accent}33, transparent 42%),` +
              "linear-gradient(135deg, rgba(2,1,5,0.88), rgba(2,1,5,0.58))",
            opacity: introOpacity,
            transform: `scale(${1.03 - introIn * 0.03})`,
          }}>
            <div style={{
              width: 820,
              borderRadius: 34,
              padding: "44px 52px",
              border: `1px solid ${config.accent}55`,
              background: "linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035))",
              boxShadow: `0 34px 90px rgba(0,0,0,.5), 0 0 70px ${config.accent}33`,
              backdropFilter: "blur(18px)",
              transform: `translateY(${(1 - introIn) * 24}px)`,
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.28em",
                textTransform: "uppercase" as const,
                color: config.accent,
                marginBottom: 18,
              }}>
                {config.kicker}
              </div>
              <h1 style={{
                margin: 0,
                fontSize: 66,
                lineHeight: 0.92,
                letterSpacing: "-0.055em",
                fontWeight: 950,
                color: "white",
                textShadow: `0 0 36px ${config.accent}55`,
              }}>
                {config.label}
              </h1>
              <p style={{
                margin: "22px 0 0",
                maxWidth: 680,
                fontSize: 24,
                lineHeight: 1.28,
                color: "rgba(255,255,255,.72)",
                fontWeight: 650,
              }}>
                {config.thesis}
              </p>
              <div style={{
                marginTop: 28,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                borderRadius: 999,
                padding: "12px 18px",
                background: `${config.accent}18`,
                border: `1px solid ${config.accent}44`,
                color: "white",
                fontSize: 15,
                fontWeight: 900,
              }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: config.accent,
                  boxShadow: `0 0 16px ${config.accent}`,
                }} />
                {config.metric}
              </div>
            </div>
          </div>
        )}

        {props.captionsEnabled !== false && frame > 68 && frame < outroStart + 16 && (
          <div style={{
            position: "absolute",
            left: 86,
            right: 86,
            bottom: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 22,
            padding: "16px 20px",
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,.14)",
            background: "linear-gradient(135deg, rgba(5,6,15,.72), rgba(5,6,15,.38))",
            boxShadow: "0 18px 50px rgba(0,0,0,.34)",
            backdropFilter: "blur(14px)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}>
              <span style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: config.accent,
                boxShadow: `0 0 18px ${config.accent}`,
                flex: "0 0 auto",
              }} />
              <span style={{
                fontSize: 18,
                lineHeight: 1.22,
                fontWeight: 780,
                color: "rgba(255,255,255,.9)",
              }}>
                {config.captionBeats[beatIndex]}
              </span>
            </div>
            <span style={{
              flex: "0 0 auto",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              fontWeight: 900,
              color: props.narrationEnabled ? config.accent : "rgba(255,255,255,.42)",
            }}>
              {props.narrationEnabled ? "Narration armed" : "Silent preview"}
            </span>
          </div>
        )}

        {outroIn > 0.01 && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            opacity: outroIn,
            background:
              `radial-gradient(circle at 50% 50%, ${config.accent}2e, transparent 48%),` +
              "linear-gradient(135deg, rgba(2,1,5,0.3), rgba(2,1,5,0.82))",
          }}>
            <div style={{
              textAlign: "center",
              transform: `translateY(${(1 - outroIn) * 18}px) scale(${0.96 + outroIn * 0.04})`,
            }}>
              <div style={{
                margin: "0 auto 22px",
                width: 88,
                height: 88,
                borderRadius: 30,
                border: `1px solid ${config.accent}66`,
                background: `linear-gradient(145deg, ${config.accent}38, rgba(255,255,255,.08))`,
                boxShadow: `0 0 54px ${config.accent}55`,
                display: "grid",
                placeItems: "center",
                fontSize: 34,
                fontWeight: 950,
                color: "white",
              }}>
                RP
              </div>
              <div style={{
                fontSize: 54,
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
                fontWeight: 950,
                color: "white",
                textShadow: `0 0 36px ${config.accent}55`,
              }}>
                {config.close}
              </div>
              <div style={{
                marginTop: 18,
                fontSize: 15,
                fontWeight: 900,
                letterSpacing: "0.24em",
                textTransform: "uppercase" as const,
                color: config.accent,
              }}>
                {config.metric}
              </div>
              <div style={{
                margin: "28px auto 0",
                width: 460 * outroIn,
                height: 2,
                borderRadius: 999,
                background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)`,
                boxShadow: `0 0 24px ${config.accent}`,
              }} />
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function ModuleStoryPlayer(props: ModuleStoryProps) {
  const { storyType } = props;
  const durationInFrames = props.durationSeconds
    ? Math.max(120, Math.round(props.durationSeconds * 30))
    : MODULE_STORY_FRAMES[storyType];

  const playerStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 24,
    overflow: "hidden",
    background: "#020105",
  };

  return (
    <Player
      component={PremiumModuleStoryComposition}
      compositionWidth={1280} compositionHeight={720}
      durationInFrames={durationInFrames} fps={30}
      inputProps={props}
      controls loop autoPlay acknowledgeRemotionLicense style={playerStyle}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RemotionRoot — registers all compositions for CLI rendering
//   npx remotion studio  →  opens Remotion Studio
//   npx remotion render DataStoryLine out.mp4
// ─────────────────────────────────────────────────────────────────────────────

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DonutReveal"
      component={DonutRevealComposition}
      durationInFrames={120}
      fps={30}
      width={190}
      height={190}
      defaultProps={{
        values: [28.9, 20.7, 18.9, 17.7, 13.8],
        colors: ["#a855f7", "#22d3ee", "#34d399", "#fbbf24", "#f472b6"],
      }}
    />
    <Composition
      id="DataStoryLine"
      component={DataStoryComposition}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Revenue Trends",
        kicker: "Analytics",
        metric: "+12.6%",
        mode: "line" as const,
        accent: "#22d3ee",
      }}
    />
    <Composition
      id="DataStoryBars"
      component={DataStoryComposition}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Sales Performance",
        kicker: "Metrics",
        metric: "+8.4%",
        mode: "bars" as const,
        accent: "#a855f7",
      }}
    />
    <Composition
      id="DataStoryDonut"
      component={DataStoryComposition}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Category Distribution",
        kicker: "Share",
        metric: "100%",
        mode: "donut" as const,
        accent: "#34d399",
      }}
    />
    <Composition
      id="DataStoryGauge"
      component={DataStoryComposition}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Inventory Health",
        kicker: "Pulse",
        metric: "82/100",
        mode: "gauge" as const,
        accent: "#fbbf24",
      }}
    />
    {/* ── 8 New Module Compositions ── */}
    <Composition
      id="ExecutiveBriefing"
      component={ExecutiveBriefingComposition}
      durationInFrames={240}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Executive Briefing",
        kpis: [
          { label: "Revenue", value: "$4.2M",  delta: "+18%" },
          { label: "Orders",  value: "12,840", delta: "+7%"  },
          { label: "NPS",     value: "82",     delta: "+4pt" },
          { label: "Margin",  value: "34%",    delta: "+2pp" },
        ],
        barSeries: [52, 67, 48, 73, 61, 80, 58],
      }}
    />
    <Composition
      id="CustomerSegment"
      component={CustomerSegmentComposition}
      durationInFrames={210}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Customer Segments",
        segments: [
          { label: "Premium",  value: 28.9, color: "#a855f7" },
          { label: "Regular",  value: 34.2, color: "#ec4899" },
          { label: "New",      value: 20.7, color: "#8b5cf6" },
          { label: "At-Risk",  value: 16.2, color: "#f472b6" },
        ],
      }}
    />
    <Composition
      id="ChurnIntel"
      component={ChurnIntelComposition}
      durationInFrames={210}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Churn Intelligence",
        riskTiers: [
          { label: "Critical Risk", count: 284,  pct: 14.2, color: "#ef4444" },
          { label: "High Risk",     count: 512,  pct: 25.6, color: "#f97316" },
          { label: "Medium Risk",   count: 748,  pct: 37.4, color: "#fbbf24" },
          { label: "Low Risk",      count: 456,  pct: 22.8, color: "#34d399" },
        ],
        heatValues: [87, 72, 45, 30, 63, 55, 41, 78, 60, 35, 50, 68],
      }}
    />
    <Composition
      id="DemandForecast"
      component={DemandForecastComposition}
      durationInFrames={240}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title:      "Demand Forecast",
        historical: [420, 445, 412, 478, 510, 488, 530, 565],
        forecast:   [530, 565, 590, 620, 655, 680, 710],
        months:     ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"],
      }}
    />
    <Composition
      id="InventoryOpt"
      component={InventoryOptComposition}
      durationInFrames={210}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Inventory Optimization",
        skus: [
          { label: "SKU-001", stock: 82,  reorder: 40 },
          { label: "SKU-007", stock: 31,  reorder: 40 },
          { label: "SKU-012", stock: 94,  reorder: 50 },
          { label: "SKU-019", stock: 18,  reorder: 35 },
          { label: "SKU-025", stock: 65,  reorder: 45 },
          { label: "SKU-033", stock: 47,  reorder: 40 },
        ],
        healthScore: 76,
      }}
    />
    <Composition
      id="AnalyticsReport"
      component={AnalyticsReportComposition}
      durationInFrames={180}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title:      "Analytics Report",
        lineSeries: [42, 51, 47, 63, 58, 74, 69, 82, 78, 90, 86, 95],
        months:     ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        rows: [
          { label: "Total Sessions",   val: "1.24M",  trend: "up"  as const },
          { label: "Conversion Rate",  val: "3.82%",  trend: "up"  as const },
          { label: "Avg. Order Value", val: "$68.40", trend: "down" as const },
          { label: "Return Rate",      val: "4.1%",   trend: "flat" as const },
        ],
      }}
    />
    <Composition
      id="PlatformIntel"
      component={PlatformIntelComposition}
      durationInFrames={180}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        title: "Platform Intelligence",
        metrics: [
          { label: "API Uptime",     value: "99.97%", status: "ok"   as const },
          { label: "Latency P95",    value: "142 ms", status: "ok"   as const },
          { label: "Active Users",   value: "4,820",  status: "ok"   as const },
          { label: "Error Rate",     value: "0.03%",  status: "warn" as const },
          { label: "Data Freshness", value: "< 2 s",  status: "ok"   as const },
          { label: "Model Accuracy", value: "96.4%",  status: "ok"   as const },
        ],
      }}
    />
    <Composition
      id="MasterReel"
      component={MasterReelComposition}
      durationInFrames={300}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{
        brandName: "RetailPulse",
        keyMetrics: [
          { label: "Revenue Growth",  value: "+18.4%",   color: "#f59e0b" },
          { label: "Churn Reduced",   value: "-12.2%",   color: "#22d3ee" },
          { label: "Forecast Acc.",   value: "94.2%",    color: "#34d399" },
          { label: "Inventory Score", value: "82 / 100", color: "#a855f7" },
          { label: "Active Users",    value: "4,820",    color: "#ec4899" },
          { label: "Uptime",          value: "99.97%",   color: "#6366f1" },
        ],
      }}
    />
  </>
);

registerRoot(RemotionRoot);
