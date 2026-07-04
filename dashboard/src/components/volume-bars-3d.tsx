import { useLivingOS } from "../living-os";

const colors = ["#a855f7", "#6366f1", "#22d3ee", "#f472b6"];

type VolumeBars3DProps = {
  values: number[];
  labels: string[];
  title?: string;
};

const clampPercent = (value: number) => Math.max(8, Math.min(100, Number.isFinite(value) ? value : 0));

export default function VolumeBars3D({ values, labels, title = "Revenue volume by month" }: VolumeBars3DProps) {
  const { reducedMotion, performanceTier } = useLivingOS();
  const maxValue = Math.max(...values, 1);
  const items = values.map((value, index) => {
    const rawValue = Number.isFinite(value) ? value : 0;
    const height = clampPercent((rawValue / maxValue) * 100);
    return {
      rawValue,
      height,
      label: labels[index] ?? `P${index + 1}`,
      color: colors[index % colors.length],
    };
  });
  const isStatic = reducedMotion || performanceTier === "minimal";

  return (
    <div className={`volume-bars-3d faux-3d ${isStatic ? "is-static" : ""}`} aria-label={title}>
      <div className="volume-bars-head">
        <span>{title}</span>
        <strong>Peak {Math.round(maxValue)}%</strong>
      </div>
      <div className="volume-bars-grid">
        {items.map(({ rawValue, height, label, color }, index) => {
          return (
            <div
              key={`${label}-${index}`}
              className="volume-bar-shell"
              style={{
                ["--bar-color" as string]: color,
                ["--bar-height" as string]: `${height}%`,
                ["--bar-delay" as string]: `${index * 42}ms`,
              }}
            >
              <span className="volume-bar-value">{Math.round(rawValue)}%</span>
              <div className="volume-bar-column">
                <i className="volume-bar-face volume-bar-front" />
                <i className="volume-bar-face volume-bar-side" />
                <i className="volume-bar-face volume-bar-top" />
              </div>
              <span className="volume-bar-label">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="volume-bars-floor" />
    </div>
  );
}
