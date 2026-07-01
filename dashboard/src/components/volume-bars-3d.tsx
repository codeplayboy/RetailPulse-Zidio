import { useLivingOS } from "../living-os";

const heights = [58, 86, 64, 92, 74, 96, 69, 88, 78, 100, 82, 93];
const colors = ["#a855f7", "#6366f1", "#22d3ee", "#f472b6"];

export default function VolumeBars3D() {
  const { reducedMotion } = useLivingOS();

  return (
    <div className={`volume-bars-3d faux-3d ${reducedMotion ? "is-static" : ""}`} aria-label="Three-dimensional volume bars">
      <div className="volume-bars-grid">
        {heights.map((height, index) => {
          const color = colors[index % colors.length];
          return (
            <div key={index} className="volume-bar-shell" style={{ ["--bar-color" as string]: color, ["--bar-height" as string]: `${height}%`, ["--bar-delay" as string]: `${index * 70}ms` }}>
              <span className="volume-bar-value">{height}</span>
              <div className="volume-bar-column">
                <i className="volume-bar-face volume-bar-front" />
                <i className="volume-bar-face volume-bar-side" />
                <i className="volume-bar-face volume-bar-top" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="volume-bars-floor" />
    </div>
  );
}
