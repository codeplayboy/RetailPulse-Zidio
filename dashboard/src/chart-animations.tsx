import React from "react";
import { Player } from "@remotion/player";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// ─────────────────────────────────────────────────────────────────────────────
// Donut chart cinematic reveal (190×190, 120 frames @ 30 fps → 4 s)
// ─────────────────────────────────────────────────────────────────────────────

export interface DonutRevealProps {
  values: number[];
  colors: string[];
}

export const DonutRevealComposition: React.FC<DonutRevealProps> = ({ values, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pre-compute cumulative stroke offsets (pathLength="100" coordinate system)
  const offsets: number[] = [];
  let cumulative = 0;
  for (const v of values) {
    offsets.push(-cumulative);
    cumulative += v;
  }

  // Track ring fades in first
  const trackP = spring({ frame, fps, config: { damping: 80, stiffness: 260 } });

  // Center readout bounces in after last segment
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
      {/* SVG rotated to match the real chart's CSS transform: rotate(-90deg) */}
      <svg
        viewBox="0 0 120 120"
        width="190"
        height="190"
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        {/* Track ring */}
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          strokeWidth="16"
          pathLength="100"
          stroke="rgba(255,255,255,0.1)"
          strokeDasharray={`${100 * trackP} ${100 - 100 * trackP}`}
        />

        {/* Glow halos (blurred, wider stroke) */}
        {values.map((value, index) => {
          const p = spring({
            frame: frame - index * 9,
            fps,
            config: { damping: 20, stiffness: 95 },
          });
          const dash = value * p;
          return (
            <circle
              key={`glow-${index}`}
              cx="60"
              cy="60"
              r="44"
              fill="none"
              strokeWidth="30"
              pathLength="100"
              stroke={colors[index]}
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offsets[index]}
              style={{ opacity: p * 0.2, filter: "blur(10px)" }}
            />
          );
        })}

        {/* Main segments */}
        {values.map((value, index) => {
          const p = spring({
            frame: frame - index * 9,
            fps,
            config: { damping: 26, stiffness: 130 },
          });
          const dash = value * p;
          return (
            <circle
              key={`seg-${index}`}
              cx="60"
              cy="60"
              r="44"
              fill="none"
              strokeWidth="16"
              pathLength="100"
              stroke={colors[index]}
              strokeLinecap="butt"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offsets[index]}
              style={{ filter: `drop-shadow(0 0 5px ${colors[index]}cc)` }}
            />
          );
        })}

        {/* Leading spark dot at the arc tip */}
        {values.map((value, index) => {
          const p = spring({
            frame: frame - index * 9,
            fps,
            config: { damping: 26, stiffness: 130 },
          });
          if (p < 0.05 || p > 0.95) return null;
          // Path tip position: cumulative_i + value * p path-units from 3 o'clock
          const T = -offsets[index] + value * p;
          const tipAngle = (T / 100) * 2 * Math.PI;
          const tipX = 60 + 44 * Math.cos(tipAngle);
          const tipY = 60 + 44 * Math.sin(tipAngle);
          const fadeIn = Math.min(1, p * 5);
          const fadeOut = 1 - Math.max(0, (p - 0.80) * 5);
          const sparkOpacity = fadeIn * fadeOut;
          return (
            <g key={`spark-${index}`}>
              <circle
                cx={tipX}
                cy={tipY}
                r="9"
                fill={colors[index]}
                style={{ opacity: sparkOpacity * 0.25, filter: "blur(5px)" }}
              />
              <circle
                cx={tipX}
                cy={tipY}
                r="4"
                fill={colors[index]}
                style={{ opacity: sparkOpacity, filter: `drop-shadow(0 0 6px ${colors[index]})` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center readout */}
      {centerP > 0.02 && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            opacity: Math.min(1, centerP),
            transform: `scale(${0.2 + centerP * 0.8})`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <strong
            style={{
              fontSize: "1.85rem",
              lineHeight: 1,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.04em",
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              textShadow: "0 0 24px rgba(168,85,247,0.6)",
            }}
          >
            100%
          </strong>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.14em",
              fontFamily:
                "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            share
          </span>
        </div>
      )}

      {/* Orbital particle ring that sweeps around the donut at the very end */}
      {frame > lastSegFrame + 10 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {[0, 72, 144, 216, 288].map((baseDeg, idx) => {
            const orbitP = spring({
              frame: frame - (lastSegFrame + 10 + idx * 3),
              fps,
              config: { damping: 28, stiffness: 90 },
            });
            const angle = baseDeg + orbitP * 15;
            const rad = (angle * Math.PI) / 180;
            const r = 95;
            const x = Math.cos(rad) * r;
            const y = Math.sin(rad) * r;
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: colors[idx % colors.length],
                  transform: `translate(${x}px, ${y}px)`,
                  opacity: orbitP * 0.6,
                  boxShadow: `0 0 8px ${colors[idx % colors.length]}`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Radial scan line that sweeps once */}
      {frame >= 4 && frame <= 70 && (() => {
        const scanAngle = interpolate(frame, [4, 70], [0, 360]);
        const rad = ((scanAngle - 90) * Math.PI) / 180;
        const x2 = 95 + Math.cos(rad) * 95;
        const y2 = 95 + Math.sin(rad) * 95;
        const scanOpacity = Math.min(0.35, (frame - 4) * 0.02) * Math.max(0, 1 - (frame - 55) * 0.07);
        return (
          <svg
            viewBox="0 0 190 190"
            width="190"
            height="190"
            style={{ position: "absolute", opacity: scanOpacity, pointerEvents: "none" }}
          >
            <defs>
              <linearGradient id="scanGrad" x1={95} y1={95} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(168,85,247,0)" />
                <stop offset="100%" stopColor="rgba(168,85,247,0.8)" />
              </linearGradient>
            </defs>
            <line
              x1="95" y1="95"
              x2={x2} y2={y2}
              stroke="url(#scanGrad)"
              strokeWidth="1.5"
            />
          </svg>
        );
      })()}
    </AbsoluteFill>
  );
};

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

export interface DataStoryProps {
  title: string;
  kicker: string;
  metric?: string;
  mode?: "line" | "bars" | "donut" | "gauge";
  accent?: string;
}

const storyMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const storyBars = [52, 74, 61, 86, 79, 94, 66, 88];

export const DataStoryComposition: React.FC<DataStoryProps> = ({
  title,
  kicker,
  metric = "+12.6%",
  mode = "line",
  accent = "#22d3ee",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22, stiffness: 120 } });
  const progress = Math.min(1, Math.max(0, interpolate(frame, [18, 126], [0, 1])));
  const headlineY = interpolate(intro, [0, 1], [28, 0]);
  const chartP = spring({ frame: frame - 22, fps, config: { damping: 28, stiffness: 95 } });
  const glow = interpolate(frame % 90, [0, 45, 90], [0.2, 0.48, 0.2]);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(168,85,247,.32), transparent 36%), radial-gradient(circle at 78% 70%, rgba(34,211,238,.2), transparent 34%), linear-gradient(135deg, #07081a 0%, #101044 48%, #030712 100%)",
        color: "white",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 34,
          border: "1px solid rgba(255,255,255,.16)",
          borderRadius: 32,
          boxShadow: `0 0 ${80 + glow * 80}px rgba(168,85,247,.24), inset 0 1px rgba(255,255,255,.16)`,
          background: "linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))",
        }}
      />

      <div style={{ position: "absolute", left: 72, top: 62, opacity: intro, transform: `translateY(${headlineY}px)` }}>
        <div style={{ color: accent, fontSize: 22, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>{kicker}</div>
        <h1 style={{ maxWidth: width * 0.62, margin: "18px 0 0", fontSize: Math.min(76, width * 0.055), lineHeight: 0.98, letterSpacing: "-.04em" }}>{title}</h1>
      </div>

      <div
        style={{
          position: "absolute",
          right: 78,
          top: 86,
          width: 220,
          minHeight: 154,
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,.18)",
          background: "linear-gradient(145deg, rgba(168,85,247,.3), rgba(34,211,238,.13))",
          display: "grid",
          placeItems: "center",
          opacity: intro,
          transform: `scale(${0.88 + intro * 0.12})`,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,.58)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>Signal</div>
          <strong style={{ display: "block", marginTop: 10, fontSize: 46, lineHeight: 1 }}>{metric}</strong>
        </div>
      </div>

      <div style={{ position: "absolute", left: 72, right: 72, bottom: 82, height: height * 0.42 }}>
        {mode === "bars" ? (
          <div style={{ height: "100%", display: "grid", gridTemplateColumns: `repeat(${storyBars.length}, 1fr)`, alignItems: "end", gap: 18 }}>
            {storyBars.map((bar, index) => {
              const localP = spring({ frame: frame - 26 - index * 4, fps, config: { damping: 24, stiffness: 110 } });
              return (
                <div key={index} style={{ height: `${bar * localP}%`, borderRadius: "18px 18px 6px 6px", background: `linear-gradient(180deg, #f0abfc, ${accent}, #4f46e5)`, boxShadow: `0 0 28px ${accent}66` }} />
              );
            })}
          </div>
        ) : mode === "donut" ? (
          <div style={{ width: 330, height: 330, margin: "0 auto", transform: `scale(${0.74 + chartP * 0.26})` }}>
            <DonutRevealComposition values={[28.9, 20.7, 18.9, 17.7, 13.8]} colors={["#a855f7", "#22d3ee", "#34d399", "#fbbf24", "#f472b6"]} />
          </div>
        ) : mode === "gauge" ? (
          <svg viewBox="0 0 620 300" width="100%" height="100%">
            <path d="M110 230 A200 200 0 0 1 510 230" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="34" strokeLinecap="round" />
            <path d="M110 230 A200 200 0 0 1 510 230" fill="none" stroke={accent} strokeWidth="34" strokeLinecap="round" pathLength="100" strokeDasharray={`${82 * chartP} ${100 - 82 * chartP}`} />
            <g transform={`rotate(${-90 + 148 * chartP} 310 230)`}>
              <line x1="310" y1="230" x2="310" y2="78" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
              <circle cx="310" cy="230" r="18" fill={accent} />
            </g>
            <text x="310" y="242" fill="#fff" fontSize="54" fontWeight="900" textAnchor="middle">{Math.round(82 * chartP)}/100</text>
          </svg>
        ) : (
          <svg viewBox="0 0 980 350" width="100%" height="100%">
            {[70, 140, 210, 280].map((y) => <line key={y} x1="26" x2="950" y1={y} y2={y} stroke="rgba(255,255,255,.13)" strokeDasharray="5 12" />)}
            <path
              d="M40,278 C126,206 182,240 254,158 C330,70 420,196 500,126 C584,50 684,108 762,76 C838,42 898,86 948,38"
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray={`${progress} ${1 - progress}`}
              filter={`drop-shadow(0 0 18px ${accent})`}
            />
            {storyMonths.map((month, index) => <text key={month} x={50 + index * 174} y="334" fill="rgba(255,255,255,.58)" fontSize="22" fontWeight="900">{month}</text>)}
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};

export function DataStoryPlayer({ title, kicker, metric, mode, accent }: DataStoryProps) {
  return (
    <Player
      component={DataStoryComposition}
      compositionWidth={1280}
      compositionHeight={720}
      durationInFrames={150}
      fps={30}
      inputProps={{ title, kicker, metric, mode, accent }}
      controls
      loop
      autoPlay
      acknowledgeRemotionLicense
      style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 24, overflow: "hidden", background: "#050712" }}
    />
  );
}
