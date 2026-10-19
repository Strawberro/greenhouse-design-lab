import { useMemo } from 'react'
import type { AnalysisResult, DesignConfig, Region, Season, WeatherState } from '../types'
import { solarArch, VENLO_ANGLE } from '../engine/calc'
import { COVERS, WALLS, SEASONS } from '../data/catalog'

interface Props {
  cfg: DesignConfig
  region: Region
  weather: WeatherState
  season: Season
  result: AnalysisResult
  playing: boolean
}

const D2R = Math.PI / 180

/** SVG 弧线路径辅助 */
function polar(cx: number, cy: number, r: number, th: number) {
  return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) }
}

export default function GreenhouseCanvas({ cfg, region, weather, season, result, playing }: Props) {
  const isSolar = cfg.ghType === 'solar'
  const cover = COVERS.find((c) => c.id === cfg.coverId) ?? COVERS[0]
  const wall = WALLS.find((w) => w.id === cfg.wallId) ?? WALLS[0]
  const decl = SEASONS.find((s) => s.id === season)?.decl ?? -23.4
  const sunAlt = 90 - Math.abs(region.lat - decl)

  // ---------- 天气粒子 ----------
  const snowflakes = useMemo(
    () => Array.from({ length: Math.min(60, 8 + weather.snowDepth * 2) }, (_, i) => ({
      x: Math.random() * 100, delay: Math.random() * 6, dur: 3 + Math.random() * 4, r: 1.5 + Math.random() * 2.5, o: 0.5 + Math.random() * 0.5, key: i,
    })),
    [weather.snowDepth],
  )
  const raindrops = useMemo(
    () => Array.from({ length: Math.min(70, weather.rainfall / 2) }, (_, i) => ({
      x: Math.random() * 100, delay: Math.random() * 2, dur: 0.5 + Math.random() * 0.5, key: i,
    })),
    [weather.rainfall],
  )
  const windArrows = useMemo(
    () => Array.from({ length: Math.min(10, Math.ceil(weather.windSpeed / 4)) }, (_, i) => ({
      y: 12 + Math.random() * 55, delay: Math.random() * 3, dur: Math.max(0.6, 4 - weather.windSpeed / 10), key: i,
    })),
    [weather.windSpeed],
  )

  const danger = result.overall === 'danger'
  const warn = result.overall === 'warning'

  // ================= 日光温室剖面 =================
  if (isSolar) {
    const H = cfg.ridgeHeight
    const S = cfg.span
    const g = solarArch(S, H)
    const padL = 2.2, padR = 2.2
    const W = S + padL + padR
    const groundY = H + 1.8
    const Y = (y: number) => groundY - y
    const A = { x: padL + 0, y: Y(0.3) }
    const B = { x: padL + g.c, y: Y(H) }
    const wallX0 = padL + S - Math.max(0.35, (wall.thickness ?? 0.3) * 0.5)
    const wallX1 = padL + S
    const snowD = Math.min(weather.snowDepth / 100, 0.6)

    // 积雪：沿拱弧法向偏移
    const snowPts: string[] = []
    const steps = 14
    for (let i = 0; i <= steps; i++) {
      const th = g.thB + ((g.thA - g.thB) * i) / steps
      const p = polar(padL + g.c, g.cy, g.R + snowD, th)
      snowPts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${(groundY - p.y).toFixed(2)}`)
    }
    // 拱变形虚线（弯矩超限示意）
    const deflectPts: string[] = []
    const dAmt = result.snow.utilization > 0.85 ? Math.min((result.snow.utilization - 0.85) * 0.9, 0.55) : 0
    for (let i = 0; i <= steps; i++) {
      const th = g.thB + ((g.thA - g.thB) * i) / steps
      const p = polar(padL + g.c, g.cy, g.R - dAmt, th)
      deflectPts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${(groundY - p.y).toFixed(2)}`)
    }

    return (
      <svg viewBox={`0 0 ${W} ${groundY + 1.2}`} className={`w-full h-auto select-none ${danger && playing ? 'gh-shake' : ''}`}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={weather.overcast > 0.5 ? '#94a3b8' : '#7dd3fc'} />
            <stop offset="100%" stopColor={weather.overcast > 0.5 ? '#cbd5e1' : '#e0f2fe'} />
          </linearGradient>
          <linearGradient id="wallg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a16207" /><stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={groundY + 1.2} fill="url(#sky)" />
        {weather.overcast > 0.05 && <rect x={0} y={0} width={W} height={groundY + 1.2} fill="#64748b" opacity={weather.overcast * 0.35} />}
        {/* 地面 */}
        <rect x={0} y={groundY} width={W} height={1.2} fill="#65a30d" opacity={0.85} />
        <line x1={0} y1={groundY} x2={W} y2={groundY} stroke="#3f6212" strokeWidth={0.06} />
        {/* 太阳与光线 */}
        {sunAlt > 8 && (
          <g opacity={playing ? 1 : 0.85}>
            <circle cx={padL - 1.2} cy={1.2} r={0.55} fill="#fbbf24">
              {playing && <animate attributeName="r" values="0.55;0.65;0.55" dur="3s" repeatCount="indefinite" />}
            </circle>
            {Array.from({ length: 3 }, (_, i) => {
              const sx = padL + 0.6 + i * 2.2
              return (
                <line key={i} x1={sx} y1={Y(H) - 2.4 - i * 0.4} x2={sx + 2.4 * Math.cos(sunAlt * D2R)} y2={Y(H) - 2.4 - i * 0.4 + 2.4 * Math.sin(sunAlt * D2R)} stroke="#f59e0b" strokeWidth={0.07} strokeDasharray="0.3 0.25" markerEnd="url(#arr)" />
              )
            })}
          </g>
        )}
        <defs>
          <marker id="arr" markerWidth="4" markerHeight="4" refX="2" refY="2"><path d="M0,0 L4,2 L0,4 z" fill="#f59e0b" /></marker>
        </defs>
        {/* 风箭头 */}
        {playing && windArrows.map((a) => (
          <g key={a.key} className="wx-wind" style={{ animationDuration: `${a.dur}s`, animationDelay: `${a.delay}s` }}>
            <line x1={-2} y1={`${a.y}%`} x2={1.4} y2={`${a.y}%`} stroke="#0ea5e9" strokeWidth={0.09} markerEnd="url(#arrw)" opacity={0.75} />
          </g>
        ))}
        <defs><marker id="arrw" markerWidth="5" markerHeight="5" refX="3" refY="2.5"><path d="M0,0 L5,2.5 L0,5 z" fill="#0ea5e9" /></marker></defs>
        {/* 后墙 */}
        <rect x={wallX0} y={Y(2.6)} width={wallX1 - wallX0} height={2.6} fill="url(#wallg)" stroke="#713f12" strokeWidth={0.04} />
        {/* 后屋面 */}
        <line x1={B.x} y1={B.y} x2={wallX0} y2={Y(2.6)} stroke="#64748b" strokeWidth={0.14} />
        {/* 前屋面拱架 */}
        <path d={`M${A.x},${A.y} A${g.R},${g.R} 0 0 1 ${B.x},${B.y}`} fill="none" stroke={danger ? '#dc2626' : '#475569'} strokeWidth={cfg.frameId.includes('truss') ? 0.22 : 0.12} strokeLinecap="round" />
        {/* 变形虚线 */}
        {dAmt > 0 && <path d={deflectPts.join(' ')} fill="none" stroke="#ea580c" strokeWidth={0.07} strokeDasharray="0.25 0.18" opacity={0.9} />}
        {/* 桁架示意 */}
        {cfg.frameId.includes('truss') && (
          <path d={`M${A.x},${A.y - 0.18} A${g.R},${g.R} 0 0 1 ${B.x},${B.y - 0.18}`} fill="none" stroke="#64748b" strokeWidth={0.06} strokeDasharray="0.3 0.2" />
        )}
        {/* 覆盖膜 */}
        <path d={`M${A.x},${A.y} A${g.R},${g.R} 0 0 1 ${B.x},${B.y}`} fill={cover.id === 'pe' || cover.id === 'po' || cover.id === 'eva' ? 'rgba(125,211,252,0.28)' : 'rgba(148,163,184,0.32)'} stroke="none" transform="translate(0,-0.06)" />
        {/* 骨架间距标注 */}
        <g stroke="#334155" strokeWidth={0.03} opacity={0.7}>
          <line x1={A.x} y1={groundY} x2={A.x} y2={groundY + 0.35} /><line x1={A.x + cfg.frameSpacing} y1={groundY} x2={A.x + cfg.frameSpacing} y2={groundY + 0.35} />
          <line x1={A.x} y1={groundY + 0.28} x2={A.x + cfg.frameSpacing} y2={groundY + 0.28} />
        </g>
        <text x={A.x + cfg.frameSpacing / 2} y={groundY + 0.62} fontSize={0.3} textAnchor="middle" fill="#334155">间距 {cfg.frameSpacing}m</text>
        {/* 积雪 */}
        {snowD > 0.005 && <path d={snowPts.join(' ')} fill="#f8fafc" opacity={0.95} stroke="#e2e8f0" strokeWidth={0.04} />}
        {/* 雪花 */}
        {playing && snowflakes.map((f) => (
          <circle key={f.key} className="wx-snow" cx={`${f.x}%`} cy={-1} r={f.r / 28} fill="#fff" opacity={f.o} style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />
        ))}
        {/* 雨 */}
        {playing && raindrops.map((r) => (
          <line key={r.key} className="wx-rain" x1={`${r.x}%`} y1={-1} x2={`${r.x}%`} y2={0.6} stroke="#0284c7" strokeWidth={0.05} style={{ animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }} />
        ))}
        {/* 冰雹 */}
        {playing && weather.hail && snowflakes.slice(0, 25).map((f) => (
          <circle key={`h${f.key}`} className="wx-hail" cx={`${f.x}%`} cy={-1} r={0.09} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.02} style={{ animationDuration: `${(f.dur / 3).toFixed(1)}s`, animationDelay: `${f.delay}s` }} />
        ))}
        {/* 尺寸标注 */}
        <g stroke="#0f172a" strokeWidth={0.03} opacity={0.65}>
          <line x1={padL} y1={groundY + 0.85} x2={padL + S} y2={groundY + 0.85} strokeDasharray="0.15 0.1" />
          <line x1={padL} y1={groundY + 0.75} x2={padL} y2={groundY + 0.95} /><line x1={padL + S} y1={groundY + 0.75} x2={padL + S} y2={groundY + 0.95} />
        </g>
        <text x={padL + S / 2} y={groundY + 1.15} fontSize={0.32} textAnchor="middle" fill="#0f172a">跨度 {S} m</text>
        <text x={B.x + 0.25} y={Y(H) - 0.25} fontSize={0.3} fill="#0f172a">脊高 {H}m</text>
        <text x={wallX0 + 0.1} y={Y(2.6) - 0.15} fontSize={0.26} fill="#78350f">后墙 {wall.name}</text>
        {/* 状态角标 */}
        {danger && (
          <g className="gh-blink">
            <rect x={padL + 0.2} y={0.3} width={3.6} height={0.75} rx={0.15} fill="#dc2626" />
            <text x={padL + 2} y={0.82} fontSize={0.42} textAnchor="middle" fill="#fff">⚠ 结构危险</text>
          </g>
        )}
        {warn && !danger && (
          <rect x={padL + 0.2} y={0.3} width={3.6} height={0.75} rx={0.15} fill="#d97706" />
        )}
        {warn && !danger && <text x={padL + 2} y={0.82} fontSize={0.42} textAnchor="middle" fill="#fff">临界状态</text>}
      </svg>
    )
  }

  // ================= 文洛型温室立面 =================
  const H = cfg.ridgeHeight
  const width = cfg.span * cfg.spanCount
  const roofRise = (cfg.span / 2) * Math.tan(VENLO_ANGLE * D2R)
  const padL = 1.6, padR = 1.6
  const W = width + padL + padR
  const groundY = H + roofRise + 1.6
  const snowD = Math.min(weather.snowDepth / 100, 0.5)

  // 锯齿屋面线
  const zig: string[] = []
  for (let i = 0; i < cfg.spanCount; i++) {
    const x0 = padL + i * cfg.span
    const xr = x0 + cfg.span / 2
    zig.push(`${i === 0 ? 'M' : 'L'}${x0},${groundY - H}`)
    zig.push(`L${xr},${groundY - H - roofRise}`)
    zig.push(`L${x0 + cfg.span},${groundY - H}`)
  }
  // 雪：锯齿向上偏移
  const zigsnow: string[] = []
  for (let i = 0; i < cfg.spanCount; i++) {
    const x0 = padL + i * cfg.span
    const xr = x0 + cfg.span / 2
    zigsnow.push(`${i === 0 ? 'M' : 'L'}${x0},${groundY - H - snowD}`)
    zigsnow.push(`L${xr},${groundY - H - roofRise - snowD * 1.4}`)
    zigsnow.push(`L${x0 + cfg.span},${groundY - H - snowD}`)
  }

  const cols: number[] = []
  for (let x = 0; x <= width + 0.01; x += cfg.frameSpacing) cols.push(padL + x)
  const dangerWind = result.wind.mUtil > 1 || result.wind.anchorSafety < 1

  return (
    <svg viewBox={`0 0 ${W} ${groundY + 1.4}`} className={`w-full h-auto select-none ${danger && playing ? 'gh-shake' : ''}`}>
      <defs>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={weather.overcast > 0.5 ? '#94a3b8' : '#7dd3fc'} />
          <stop offset="100%" stopColor={weather.overcast > 0.5 ? '#cbd5e1' : '#e0f2fe'} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={groundY + 1.4} fill="url(#sky2)" />
      {weather.overcast > 0.05 && <rect x={0} y={0} width={W} height={groundY + 1.4} fill="#64748b" opacity={weather.overcast * 0.35} />}
      <rect x={0} y={groundY} width={W} height={1.4} fill="#65a30d" opacity={0.85} />
      <line x1={0} y1={groundY} x2={W} y2={groundY} stroke="#3f6212" strokeWidth={0.06} />
      {/* 立柱 */}
      {cols.map((x, i) => (
        <g key={i}>
          <rect x={x - 0.07} y={groundY - H} width={0.14} height={H} fill={dangerWind ? '#dc2626' : '#475569'} />
          {i % 2 === 0 && <line x1={x} y1={groundY - H} x2={x} y2={groundY - H - 0.7} stroke="#64748b" strokeWidth={0.05} />}
        </g>
      ))}
      {/* 玻璃分格 */}
      {cols.slice(0, -1).map((x, i) => (
        <g key={`g${i}`}>
          <line x1={x} y1={groundY - H / 2} x2={x + cfg.frameSpacing} y2={groundY - H / 2} stroke="#94a3b8" strokeWidth={0.03} opacity={0.8} />
          {i % 2 === 0 && <rect x={x + 0.15} y={groundY - H + 0.25} width={cfg.frameSpacing - 0.3} height={0.5} fill="rgba(125,211,252,0.25)" stroke="#94a3b8" strokeWidth={0.02} />}
        </g>
      ))}
      {/* 屋面 */}
      <path d={zig.join(' ')} fill="rgba(148,163,184,0.25)" stroke="#64748b" strokeWidth={0.12} strokeLinejoin="round" />
      {/* 屋脊桁架示意 */}
      {cfg.frameId === 'v-heavy' && <path d={zig.join(' ')} transform="translate(0,-0.35)" fill="none" stroke="#94a3b8" strokeWidth={0.05} strokeDasharray="0.3 0.2" />}
      {/* 天沟 */}
      {Array.from({ length: cfg.spanCount - 1 }, (_, i) => {
        const x = padL + (i + 1) * cfg.span
        return <rect key={i} x={x - 0.16} y={groundY - H - 0.12} width={0.32} height={0.22} fill="#94a3b8" stroke="#64748b" strokeWidth={0.03} />
      })}
      {/* 雪 */}
      {snowD > 0.005 && <path d={zigsnow.join(' ')} fill="#f8fafc" opacity={0.95} stroke="#e2e8f0" strokeWidth={0.04} />}
      {/* 天气动画 */}
      {playing && snowflakes.map((f) => (
        <circle key={f.key} className="wx-snow" cx={`${f.x}%`} cy={-1} r={f.r / 30} fill="#fff" opacity={f.o} style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />
      ))}
      {playing && raindrops.map((r) => (
        <line key={r.key} className="wx-rain" x1={`${r.x}%`} y1={-1} x2={`${r.x}%`} y2={0.5} stroke="#0284c7" strokeWidth={0.045} style={{ animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s` }} />
      ))}
      {playing && windArrows.map((a) => (
        <g key={a.key} className="wx-wind" style={{ animationDuration: `${a.dur}s`, animationDelay: `${a.delay}s` }}>
          <line x1={-1.6} y1={`${a.y}%`} x2={1} y2={`${a.y}%`} stroke="#0ea5e9" strokeWidth={0.08} markerEnd="url(#arrw2)" opacity={0.75} />
        </g>
      ))}
      <defs><marker id="arrw2" markerWidth="5" markerHeight="5" refX="3" refY="2.5"><path d="M0,0 L5,2.5 L0,5 z" fill="#0ea5e9" /></marker></defs>
      {playing && weather.hail && snowflakes.slice(0, 25).map((f) => (
        <circle key={`h${f.key}`} className="wx-hail" cx={`${f.x}%`} cy={-1} r={0.08} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.02} style={{ animationDuration: `${(f.dur / 3).toFixed(1)}s`, animationDelay: `${f.delay}s` }} />
      ))}
      {/* 标注 */}
      <text x={padL + width / 2} y={groundY + 0.75} fontSize={0.34} textAnchor="middle" fill="#0f172a">
        总宽 {width} m（{cfg.spanCount} 跨 × {cfg.span} m）· 檐高 {H} m · 开间 {cfg.frameSpacing} m
      </text>
      <text x={padL + 0.2} y={groundY - H - roofRise - 0.4} fontSize={0.3} fill="#334155">屋面角 26.5°</text>
      {danger && (
        <g className="gh-blink">
          <rect x={padL + 0.2} y={0.3} width={3.6} height={0.75} rx={0.15} fill="#dc2626" />
          <text x={padL + 2} y={0.82} fontSize={0.42} textAnchor="middle" fill="#fff">⚠ 结构危险</text>
        </g>
      )}
      {warn && !danger && <text x={padL + 0.4} y={0.8} fontSize={0.42} fill="#d97706">▲ 临界状态</text>}
    </svg>
  )
}
