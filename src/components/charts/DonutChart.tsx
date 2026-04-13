"use client";

export type DonutSlice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const dash = `${len} ${C - len}`;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}

        {/* Center label */}
        <g transform={`rotate(90 ${cx} ${cy})`}>
          {centerValue != null && (
            <text x={cx} y={cy + 2} textAnchor="middle" fontSize="22" fontWeight="600" fill="#111827" fontFamily="DM Mono, monospace">
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10" fill="#6B7280">
              {centerLabel}
            </text>
          )}
        </g>
      </svg>

      <ul className="space-y-2 flex-1 min-w-0">
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[12px] text-ink-soft truncate">{d.label}</span>
              </div>
              <span className="text-[11px] font-mono-data text-gray flex-shrink-0">{d.value} · {pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
