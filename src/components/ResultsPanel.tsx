import type { AnalysisResult, DesignConfig, Region, WeatherState } from '../types'
import Gauge from './Gauge'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Props {
  result: AnalysisResult
  cfg: DesignConfig
  region: Region
  weather: WeatherState
}

const fmt = (n: number, d = 2) => n.toFixed(d)

export function AnalysisTab({ result, cfg, region, weather }: Props) {
  const isSolar = cfg.ghType === 'solar'
  const r = result
  const verdictStyle = {
    safe: { bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-700', label: '✓ 设计合理 · 结构安全' },
    warning: { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', label: '▲ 临界状态 · 建议加强' },
    danger: { bg: 'bg-red-50 border-red-400', text: 'text-red-700', label: '✗ 危险！结构将失效' },
  }[r.overall]

  const rows: [string, string][] = [
    ['基本雪压（地面）', `${fmt(r.snow.groundLoad)} kN/m²（雪深 ${weather.snowDepth}cm × 密度 ${130}kg/m³）`],
    ['积雪分布系数', `${fmt(r.snow.shapeFactor)}（${isSolar ? '拱形屋面利于滑落' : '双坡屋面取 1.0'}）`],
    ['屋面雪荷载', `${fmt(r.snow.roofLoad)} kN/m²`],
    ['拱架弯矩需求/承载力', `${fmt(r.snow.mDemand, 2)} / ${fmt(r.snow.mAllow, 2)} kN·m`],
    ['风压 w₀', `${fmt(r.wind.w0)} kN/m²（风速 ${weather.windSpeed} m/s）`],
    ['风骨架弯矩利用率', `${fmt(r.wind.mUtil * 100, 0)}%`],
    ['上拔力 / 结构自重', `${fmt(r.wind.uplift, 1)} / ${fmt(r.wind.deadWeight, 1)} kN`],
    ['抗拔安全系数', r.wind.anchorSafety > 50 ? '∞（无风）' : fmt(r.wind.anchorSafety)],
    ['冬至正午太阳高度角', `${fmt(r.light.sunAlt, 1)}°`],
    ['前屋面倾角 / 光线入射角', `${fmt(r.light.roofBeta, 1)}° / ${fmt(Math.abs(r.light.incidence), 1)}°`],
    ['有效透光率', `${fmt(r.light.effTR * 100, 0)}%（覆盖透光 × 入射修正 × 寡照修正）`],
    ...(isSolar
      ? [['估算室内最低温', `${fmt(r.thermal.indoorMin ?? 0, 1)} ℃（喜温作物需 ≥ 10 ℃）`] as [string, string]]
      : [
          ['冬季热负荷', `${fmt(r.thermal.heatLoad ?? 0, 0)} W/㎡`],
          ['冬季加温能耗', `${fmt(r.thermal.heatingKwh ?? 0, 0)} kWh/㎡`],
        ] as [string, string][]),
  ]

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border-2 p-3 text-center font-bold ${verdictStyle.bg} ${verdictStyle.text}`}>
        {verdictStyle.label}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Gauge label="抗雪承载" value={r.snow.utilization} display={`${fmt(r.snow.utilization * 100, 0)}%`} sub="需求/承载" />
        <Gauge label="抗风承载" value={r.wind.mUtil} display={`${fmt(r.wind.mUtil * 100, 0)}%`} sub="需求/承载" />
        <Gauge label="采光达标" value={r.light.score} display={`${fmt(r.light.effTR * 100, 0)}%`} sub="目标 70%" />
        <Gauge
          label={isSolar ? '保温达标' : '能耗水平'}
          value={isSolar ? 10 / Math.max(r.thermal.indoorMin ?? 0.1, 0.1) : (r.thermal.heatLoad ?? 0) / 130}
          display={isSolar ? `${fmt(r.thermal.indoorMin ?? 0, 1)}℃` : `${fmt(r.thermal.heatLoad ?? 0, 0)}W/㎡`}
          sub={isSolar ? '室内最低温' : '目标 ≤130'}
        />
      </div>
      <div className="rounded-lg border bg-white text-sm">
        <div className="px-3 py-2 border-b font-semibold text-slate-700">验算明细（{region.city} · 教学简化模型）</div>
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b last:border-0">
                <td className="px-3 py-1.5 text-slate-500 w-2/5">{k}</td>
                <td className="px-3 py-1.5 font-medium text-slate-800">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900 space-y-1">
        <div className="font-bold mb-1">💡 教学点评</div>
        {r.tips.map((t, i) => <div key={i}>{t}</div>)}
      </div>
    </div>
  )
}

export function CostTab({ result }: { result: AnalysisResult }) {
  const c = result.cost
  const maxItem = Math.max(...c.items.map((i) => i.subtotal))
  const inRange = c.perSqm >= c.marketLow && c.perSqm <= c.marketHigh
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white">
        <div className="px-3 py-2 border-b font-semibold text-slate-700 text-sm">分项造价</div>
        <div className="divide-y text-xs">
          {c.items.map((it) => (
            <div key={it.name} className="px-3 py-2">
              <div className="flex justify-between font-medium text-slate-800">
                <span>{it.name}</span>
                <span>¥ {it.subtotal.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="text-slate-400 mt-0.5">{it.detail}</div>
              <Progress value={(it.subtotal / maxItem) * 100} className="h-1 mt-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50 p-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-emerald-700">工程总造价（估算）</div>
            <div className="text-2xl font-bold text-emerald-800">¥ {c.total.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
          </div>
          <Badge className={inRange ? 'bg-emerald-600' : 'bg-amber-500'}>
            {c.perSqm.toFixed(0)} 元/㎡
          </Badge>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>市场低位 {c.marketLow}</span><span>市场高位 {c.marketHigh}</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-slate-200">
            <div className="absolute inset-y-0 left-1/3 right-1/3 bg-emerald-200 rounded-full" />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow"
              style={{ left: `calc(${Math.min(Math.max((c.perSqm / (c.marketHigh * 1.4)) * 100, 2), 97)}% - 7px)` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {inRange ? '✓ 单位造价处于市场合理区间' : c.perSqm < c.marketLow ? '偏低：材料规格或用量可能不足，请检查安全性' : '偏高：存在优化空间（跨度、材料选型）'}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 leading-relaxed">
        注：造价为教学估算模型（含材料、基础、安装），未含土地、内部栽培系统与地区人工差异，真实项目请以当地报价为准。
      </div>
    </div>
  )
}
