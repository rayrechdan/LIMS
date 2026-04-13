"use client";

export type LJPoint = {
  id: string;
  runAt: string;
  value: number;
  zScore: number;
  status: string;
  westgardRule: string | null;
  technician: string | null;
};

export function LeveyJenningsChart({
  points,
  mean,
  sd,
  unit,
  height = 320,
}: {
  points: LJPoint[];
  mean: number;
  sd: number;
  unit?: string | null;
  height?: number;
}) {
  if (points.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-sm text-gray">No QC runs in this period</div>;
  }

  const W = 1000;
  const H = height;
  const padL = 60, padR = 16, padT = 16, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Y scale: ±4 SD
  const yMin = -4;
  const yMax = 4;
  const yToPx = (z: number) => padT + innerH - ((z - yMin) / (yMax - yMin)) * innerH;
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;

  const meanY = yToPx(0);
  const p1 = yToPx(1), n1 = yToPx(-1);
  const p2 = yToPx(2), n2 = yToPx(-2);
  const p3 = yToPx(3), n3 = yToPx(-3);

  const pathData = points.map((p, i) => {
    const x = padL + i * xStep;
    const y = yToPx(p.zScore);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  // Y axis labels
  const yLabels = [
    { z: 3, label: `+3SD`, color: "#DC2626" },
    { z: 2, label: `+2SD`, color: "#D97706" },
    { z: 1, label: `+1SD`, color: "#9CA3AF" },
    { z: 0, label: `Mean`, color: "#0F6E56" },
    { z: -1, label: `-1SD`, color: "#9CA3AF" },
    { z: -2, label: `-2SD`, color: "#D97706" },
    { z: -3, label: `-3SD`, color: "#DC2626" },
  ];

  function pointColor(p: LJPoint) {
    if (p.status === "OUT_OF_RANGE") return "#DC2626";
    if (p.status === "WARNING") return "#D97706";
    return "#0F6E56";
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* SD bands */}
        <rect x={padL} y={p2} width={innerW} height={n2 - p2} fill="rgba(217,119,6,0.04)" />
        <rect x={padL} y={p1} width={innerW} height={n1 - p1} fill="rgba(22,163,74,0.04)" />

        {/* SD lines */}
        <line x1={padL} x2={W - padR} y1={p3} y2={p3} stroke="#DC2626" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
        <line x1={padL} x2={W - padR} y1={p2} y2={p2} stroke="#D97706" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
        <line x1={padL} x2={W - padR} y1={p1} y2={p1} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
        <line x1={padL} x2={W - padR} y1={meanY} y2={meanY} stroke="#0F6E56" strokeWidth="1.5" />
        <line x1={padL} x2={W - padR} y1={n1} y2={n1} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
        <line x1={padL} x2={W - padR} y1={n2} y2={n2} stroke="#D97706" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
        <line x1={padL} x2={W - padR} y1={n3} y2={n3} stroke="#DC2626" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

        {/* Y labels (left = SD label, right = actual value) */}
        {yLabels.map((y, i) => (
          <g key={i}>
            <text x={padL - 8} y={yToPx(y.z) + 3} textAnchor="end" fontSize="10" fill={y.color} fontWeight="600">{y.label}</text>
            <text x={padL - 32} y={yToPx(y.z) + 3} textAnchor="end" fontSize="9" fill="#9CA3AF" fontFamily="DM Mono, monospace">
              {(mean + y.z * sd).toFixed(2)}
            </text>
          </g>
        ))}

        {/* Connecting line */}
        <path d={pathData} fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeOpacity="0.45" />

        {/* Data points */}
        {points.map((p, i) => {
          const x = padL + i * xStep;
          const y = yToPx(Math.max(-4, Math.min(4, p.zScore)));
          const color = pointColor(p);
          const isViolation = p.status === "OUT_OF_RANGE";
          return (
            <g key={p.id}>
              {isViolation && (
                <circle cx={x} cy={y} r="9" fill={color} fillOpacity="0.18" />
              )}
              <circle cx={x} cy={y} r={isViolation ? 5 : 4} fill={color} stroke="#fff" strokeWidth="1.5" />
              {isViolation && p.westgardRule && (
                <text x={x} y={y - 12} textAnchor="middle" fontSize="9" fontWeight="700" fill={color} fontFamily="DM Mono, monospace">
                  {p.westgardRule.replace("_", "-")}
                </text>
              )}
              <title>{`${new Date(p.runAt).toLocaleDateString()} · ${p.value} ${unit || ""} (z=${p.zScore.toFixed(2)})${p.westgardRule ? ` · ${p.westgardRule.replace("_", "-")}` : ""}`}</title>
            </g>
          );
        })}

        {/* X axis labels — show every Nth */}
        {points.map((p, i) => {
          const skip = Math.max(1, Math.floor(points.length / 8));
          if (i % skip !== 0 && i !== points.length - 1) return null;
          const x = padL + i * xStep;
          const d = new Date(p.runAt);
          return (
            <text key={i} x={x} y={H - 10} textAnchor="middle" fontSize="9" fill="#6B7280" fontFamily="DM Sans, sans-serif">
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
