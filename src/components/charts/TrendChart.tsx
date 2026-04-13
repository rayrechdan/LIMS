"use client";

export type TrendPoint = {
  label: string;
  value: number;
  flag?: "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH" | null;
};

export function TrendChart({
  data,
  refLow,
  refHigh,
  unit,
  height = 320,
  color = "#0F6E56",
}: {
  data: TrendPoint[];
  refLow?: number | null;
  refHigh?: number | null;
  unit?: string;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-sm text-gray">No data available</div>;
  }

  const W = 1000;
  const H = height;
  const padL = 50, padR = 20, padT = 20, padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Y range padded around data + reference range
  const allValues = data.map((d) => d.value);
  if (refLow != null) allValues.push(refLow);
  if (refHigh != null) allValues.push(refHigh);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const range = dataMax - dataMin;
  const yMin = dataMin - range * 0.15;
  const yMax = dataMax + range * 0.15;

  const yToPx = (v: number) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;

  // Reference range band
  const bandTop = refHigh != null ? yToPx(refHigh) : padT;
  const bandBottom = refLow != null ? yToPx(refLow) : padT + innerH;
  const bandHeight = bandBottom - bandTop;

  // Path
  const pathLine = data.map((d, i) => `${i === 0 ? "M" : "L"} ${padL + i * xStep} ${yToPx(d.value)}`).join(" ");
  const pathArea = `${pathLine} L ${padL + (data.length - 1) * xStep} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  // Y ticks (5)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padT + innerH * (1 - p),
    label: +(yMin + (yMax - yMin) * p).toFixed(1),
  }));

  function pointColor(p: TrendPoint) {
    if (p.flag === "CRITICAL_LOW" || p.flag === "CRITICAL_HIGH") return "#DC2626";
    if (p.flag === "LOW" || p.flag === "HIGH") return "#D97706";
    if (refLow != null && p.value < refLow) return "#D97706";
    if (refHigh != null && p.value > refHigh) return "#D97706";
    return color;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Reference range band */}
      {(refLow != null || refHigh != null) && (
        <>
          <rect
            x={padL}
            y={bandTop}
            width={innerW}
            height={bandHeight}
            fill="rgba(22,163,74,0.10)"
            stroke="rgba(22,163,74,0.25)"
            strokeDasharray="4 4"
          />
          {refHigh != null && (
            <text x={padL + innerW - 4} y={bandTop - 4} textAnchor="end" fontSize="10" fill="#16A34A" fontFamily="DM Mono, monospace">
              upper {refHigh}{unit ? ` ${unit}` : ""}
            </text>
          )}
          {refLow != null && (
            <text x={padL + innerW - 4} y={bandBottom + 12} textAnchor="end" fontSize="10" fill="#16A34A" fontFamily="DM Mono, monospace">
              lower {refLow}{unit ? ` ${unit}` : ""}
            </text>
          )}
        </>
      )}

      {/* Y grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="#E5E7EB" strokeDasharray="2 4" />
          <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF" fontFamily="DM Mono, monospace">{t.label}</text>
        </g>
      ))}

      {/* Area + line */}
      <path d={pathArea} fill="rgba(15,110,86,0.08)" />
      <path d={pathLine} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {data.map((d, i) => {
        const x = padL + i * xStep;
        const y = yToPx(d.value);
        const c = pointColor(d);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="#fff" stroke={c} strokeWidth="2.5" />
            <title>{`${d.label}: ${d.value}${unit ? ` ${unit}` : ""}`}</title>
          </g>
        );
      })}

      {/* X labels */}
      {data.map((d, i) => {
        const skip = Math.max(1, Math.floor(data.length / 10));
        if (i % skip !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={padL + i * xStep} y={H - 12} textAnchor="middle" fontSize="10" fill="#6B7280">{d.label}</text>
        );
      })}
    </svg>
  );
}
