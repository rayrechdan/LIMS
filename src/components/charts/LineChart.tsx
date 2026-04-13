"use client";

export type LinePoint = { label: string; value: number };

export function LineChart({
  data,
  height = 220,
  stroke = "#0F6E56",
  fill = "rgba(29,158,117,0.12)",
}: {
  data: LinePoint[];
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  if (data.length === 0) return <Empty height={height} />;

  const W = 800;
  const H = height;
  const padL = 40, padR = 16, padT = 16, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = Math.ceil(max * 1.15);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - (d.value / niceMax) * innerH,
    ...d,
  }));

  const pathLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const pathArea = `${pathLine} L ${padL + (data.length - 1) * stepX} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  // Y-axis ticks (4 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padT + innerH * (1 - p),
    label: Math.round(niceMax * p),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="#E5E7EB" strokeDasharray="2 4" />
          <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="DM Mono, monospace">
            {t.label}
          </text>
        </g>
      ))}

      {/* Area + line */}
      <path d={pathArea} fill={fill} />
      <path d={pathLine} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke={stroke} strokeWidth="2" />
          <title>{`${p.label}: ${p.value}`}</title>
        </g>
      ))}

      {/* X labels */}
      {points.map((p, i) => {
        // Show every Nth label to avoid crowding
        const skip = Math.max(1, Math.floor(data.length / 8));
        if (i % skip !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="DM Sans, sans-serif">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}

function Empty({ height }: { height: number }) {
  return (
    <div style={{ height }} className="flex items-center justify-center text-sm text-gray">
      No data
    </div>
  );
}
