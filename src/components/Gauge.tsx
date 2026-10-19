interface GaugeProps {
  label: string
  value: number // 利用率，1.0 = 承载极限
  display: string
  sub?: string
}

function pt(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = pt(cx, cy, r, a0)
  const p1 = pt(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M${p0.x.toFixed(2)},${p0.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`
}

/** 半圆形仪表：-210° → 30°，满量程对应利用率 1.3 */
export default function Gauge({ label, value, display, sub }: GaugeProps) {
  const A0 = -210
  const SWEEP = 240
  const p = Math.min(value / 1.3, 1)
  const color = value < 0.85 ? '#059669' : value < 1 ? '#d97706' : '#dc2626'
  const cx = 50, cy = 56, r = 38
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 72" className="w-full">
        <path d={arc(cx, cy, r, A0, A0 + SWEEP)} fill="none" stroke="#e2e8f0" strokeWidth={9} strokeLinecap="round" />
        {p > 0.005 && <path d={arc(cx, cy, r, A0, A0 + SWEEP * p)} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" />}
        {/* 100% 刻度线 */}
        {(() => {
          const t = A0 + SWEEP / 1.3
          const a = pt(cx, cy, r - 7, t)
          const b = pt(cx, cy, r + 7, t)
          return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#64748b" strokeWidth={1.4} />
        })()}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>{display}</text>
        {sub && <text x={cx} y={cy + 11} textAnchor="middle" fontSize={6.5} fill="#64748b">{sub}</text>}
      </svg>
      <div className="text-xs font-medium text-slate-600 -mt-1">{label}</div>
    </div>
  )
}
