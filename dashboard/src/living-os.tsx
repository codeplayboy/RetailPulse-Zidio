import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Activity,
  Gauge,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PerformanceTier = "high" | "balanced" | "minimal";
export type DensityMode = "command" | "analysis" | "presentation";
export type SystemStatus = "healthy" | "watch" | "degraded";

type ScenarioState = {
  demand: number;
  marketing: number;
  seasonal: number;
};

type LivingOSContextValue = {
  reducedMotion: boolean;
  performanceTier: PerformanceTier;
  density: DensityMode;
  setDensity: (density: DensityMode) => void;
  anomalyLens: boolean;
  setAnomalyLens: (enabled: boolean) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  replayProgress: number;
  setReplayProgress: (progress: number) => void;
  replaying: boolean;
  setReplaying: (playing: boolean) => void;
  scenario: ScenarioState;
  setScenario: (scenario: ScenarioState | ((current: ScenarioState) => ScenarioState)) => void;
  briefingOpen: boolean;
  setBriefingOpen: (open: boolean) => void;
  systemStatus: SystemStatus;
};

const LivingOSContext = createContext<LivingOSContextValue | null>(null);

function detectPerformanceTier(reducedMotion: boolean): PerformanceTier {
  if (reducedMotion) return "minimal";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const highPixelDensity = window.devicePixelRatio > 2;

  if (cores <= 6 || memory <= 4 || highPixelDensity) return "balanced";
  return "high";
}

export function LivingOSProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>(() =>
    detectPerformanceTier(reducedMotion)
  );
  const [density, setDensity] = useState<DensityMode>("command");
  const [anomalyLens, setAnomalyLens] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [replayProgress, setReplayProgress] = useState(100);
  const [replaying, setReplaying] = useState(false);
  const [scenario, setScenario] = useState<ScenarioState>({ demand: 15, marketing: 20, seasonal: 8 });
  const [briefingOpen, setBriefingOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setPerformanceTier(detectPerformanceTier(media.matches));
    };
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!replaying) return;
    const timer = window.setInterval(() => {
      setReplayProgress((current) => {
        if (current >= 100) {
          setReplaying(false);
          return 100;
        }
        return Math.min(100, current + 2);
      });
    }, reducedMotion ? 150 : 80);
    return () => window.clearInterval(timer);
  }, [replaying, reducedMotion]);

  const systemStatus: SystemStatus = anomalyLens ? "watch" : "healthy";
  const value = useMemo(
    () => ({
      reducedMotion,
      performanceTier,
      density,
      setDensity,
      anomalyLens,
      setAnomalyLens,
      activeCategory,
      setActiveCategory,
      replayProgress,
      setReplayProgress,
      replaying,
      setReplaying,
      scenario,
      setScenario,
      briefingOpen,
      setBriefingOpen,
      systemStatus,
    }),
    [
      activeCategory,
      anomalyLens,
      briefingOpen,
      density,
      performanceTier,
      reducedMotion,
      replayProgress,
      replaying,
      scenario,
      systemStatus,
    ]
  );

  return <LivingOSContext.Provider value={value}>{children}</LivingOSContext.Provider>;
}

export function useLivingOS() {
  const context = useContext(LivingOSContext);
  if (!context) throw new Error("useLivingOS must be used inside LivingOSProvider");
  return context;
}

export function AnimatedValue({ value, className }: { value: string; className?: string }) {
  const node = useRef<HTMLElement>(null);
  const { reducedMotion } = useLivingOS();
  const match = value.match(/[+-]?[\d,.]+/);
  const target = match ? Number(match[0].replace(/,/g, "")) : Number.NaN;

  useGSAP(
    () => {
      if (!node.current) return;
      node.current.textContent = value;
    },
    { dependencies: [target, value, reducedMotion] }
  );

  return (
    <motion.strong
      ref={node}
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.05 }}
    >
      {value}
    </motion.strong>
  );
}

const densityOptions: { id: DensityMode; label: string }[] = [
  { id: "command", label: "Command" },
  { id: "analysis", label: "Analysis" },
  { id: "presentation", label: "Present" },
];

export function OperatingDock() {
  const {
    anomalyLens,
    setAnomalyLens,
    density,
    setDensity,
    replayProgress,
    setReplayProgress,
    replaying,
    setReplaying,
    performanceTier,
    systemStatus,
    setBriefingOpen,
  } = useLivingOS();

  const resetReplay = () => {
    setReplaying(false);
    setReplayProgress(0);
  };

  return (
    <motion.section
      className={`operating-dock status-${systemStatus}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="RetailPulse operating controls"
    >
      <button className="heartbeat-button" type="button" onClick={() => setBriefingOpen(true)}>
        <span className="heartbeat-pulse" />
        <RadioTower size={15} />
        <span><strong>Systems nominal</strong><small>{performanceTier} rendering</small></span>
      </button>

      <div className="replay-controls">
        <button
          className="dock-icon-button"
          type="button"
          title={replaying ? "Pause operational replay" : "Play operational replay"}
          aria-label={replaying ? "Pause operational replay" : "Play operational replay"}
          onClick={() => {
            if (replayProgress >= 100) setReplayProgress(0);
            setReplaying(!replaying);
          }}
        >
          {replaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={replayProgress}
          onChange={(event) => {
            setReplaying(false);
            setReplayProgress(Number(event.target.value));
          }}
          aria-label="Operational replay position"
        />
        <span>{replayProgress}%</span>
        <button className="dock-icon-button" type="button" title="Reset replay" aria-label="Reset replay" onClick={resetReplay}>
          <RotateCcw size={14} />
        </button>
      </div>

      <button
        type="button"
        className={anomalyLens ? "anomaly-toggle active" : "anomaly-toggle"}
        aria-pressed={anomalyLens}
        onClick={() => setAnomalyLens(!anomalyLens)}
      >
        <ScanSearch size={15} />
        Anomaly lens
      </button>

      <div className="density-switch" aria-label="Dashboard density">
        {densityOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={density === option.id ? "active" : ""}
            aria-pressed={density === option.id}
            onClick={() => setDensity(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}

export function ExecutiveBriefing() {
  const { briefingOpen, setBriefingOpen, anomalyLens, scenario, activeCategory, replayProgress } = useLivingOS();

  return (
    <AnimatePresence>
      {briefingOpen ? (
        <motion.div
          className="briefing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBriefingOpen(false);
          }}
        >
          <motion.aside
            className="executive-briefing"
            role="dialog"
            aria-modal="true"
            aria-labelledby="briefing-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
          >
            <div className="briefing-kicker"><Sparkles size={15} /> Live executive brief</div>
            <h2 id="briefing-title">Retail operations are stable with one demand signal worth watching.</h2>
            <div className="briefing-grid">
              <article><Activity size={18} /><span>Replay position</span><strong>{replayProgress}%</strong></article>
              <article><ScanSearch size={18} /><span>Anomaly scan</span><strong>{anomalyLens ? "Active" : "Standby"}</strong></article>
              <article><Gauge size={18} /><span>Scenario lift</span><strong>+{scenario.demand + scenario.marketing}%</strong></article>
              <article><RadioTower size={18} /><span>Category focus</span><strong>{activeCategory || "All retail"}</strong></article>
            </div>
            <p>Electronics demand is accelerating while inventory health remains within policy. The current forecast scenario supports a measured reorder rather than a broad stock increase.</p>
            <button type="button" onClick={() => setBriefingOpen(false)}>Return to command center</button>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
