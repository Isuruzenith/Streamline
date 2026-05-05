import { useEffect, useState } from "react";

/**
 * SpeedGraph - a tiny sparkline showing the last N speed samples.
 * Props:
 *   speed  {number|null}  bytes/s current sample
 *   active {boolean}
 */
const MAX_SAMPLES = 16;

export default function SpeedGraph({ speed, active }) {
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    if (speed != null && active) {
      setSamples((current) => [...current.slice(-(MAX_SAMPLES - 1)), speed]);
    } else if (!active) {
      setSamples([]);
    }
  }, [speed, active]);

  if (samples.length < 2) return null;

  const max = Math.max(...samples, 1);
  return (
    <div className="sl-speed-graph" aria-hidden="true" title="Speed graph">
      {samples.map((sample, index) => (
        <div
          key={index}
          className="sl-speed-graph-bar"
          style={{ height: `${Math.max(10, Math.round((sample / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}
