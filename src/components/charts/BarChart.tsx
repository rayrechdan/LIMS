"use client";

export type BarItem = { label: string; value: number; secondary?: number; color?: string };

export function BarChart({
  data,
  height = 240,
  primaryColor = "#0F6E56",
  secondaryColor = "#94A3B8",
  primaryLabel,
  secondaryLabel,
  unit = "",
}: {
  data: BarItem[];
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  unit?: string;
}) {
  if (data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-sm text-gray">No data</div>;

  const W = 800;
  const H = height;
  const padL = 40, padR = 16, padT = 16, padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const grouped = data.some((d) => d.secondary != null);
  const max = Math.max(...data.flatMap((d) => [d.value, d.secondary ?? 0]), 1);
  const niceMax = Math.ceil(max * 1.15);

  const groupW = innerW / data.length;
  const barW = grouped ? Math.min(18, (groupW * 0.4)) : Math.min(36, groupW * 0.6);
  const gap = grouped ? 4 : 0;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: padT + innerH * (1 - p),
    label: Math.round(niceMax * p),
  }));

  return (
    <div>
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

        {/* Bars */}
        {data.map((d, i) => {
          const cx = padL + groupW * i + groupW / 2;
          const h1 = (d.value / niceMax) * innerH;
          const h2 = d.secondary != null ? (d.secondary / niceMax) * innerH : 0;

          if (grouped) {
            const x1 = cx - barW - gap / 2;
            const x2 = cx + gap / 2;
            return (
              <g key={i}>
                <rect x={x1} y={padT + innerH - h1} width={barW} height={h1} rx="2" fill={d.color || primaryColor}>
                  <title>{`${d.label}: ${d.value}${unit}`}</title>
                </rect>
                <rect x={x2} y={padT + innerH - h2} width={barW} height={h2} rx="2" fill={secondaryColor}>
                  <title>{`${d.label}: ${d.secondary}${unit}`}</title>
                </rect>
                <text x={cx} y={H - 18} textAnchor="middle" fontSize="10" fill="#6B7280">{d.label}</text>
              </g>
            );
          }

          return (
            <g key={i}>
              <rect x={cx - barW / 2} y={padT + innerH - h1} width={barW} height={h1} rx="3" fill={d.color || primaryColor}>
                <title>{`${d.label}: ${d.value}${unit}`}</title>
              </rect>
              <text x={cx} y={H - 18} textAnchor="middle" fontSize="10" fill="#6B7280">{d.label}</text>
              <text x={cx} y={padT + innerH - h1 - 6} textAnchor="middle" fontSize="10" fill="#111827" fontFamily="DM Mono, monospace">{d.value}</text>
            </g>
          );
        })}
      </svg>

      {grouped && (primaryLabel || secondaryLabel) && (
        <div className="flex items-center justify-center gap-5 text-[11px] text-gray mt-1">
          {primaryLabel && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: primaryColor }} />
              {primaryLabel}
            </span>
          )}
          {secondaryLabel && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: secondaryColor }} />
              {secondaryLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
