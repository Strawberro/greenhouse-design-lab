import type { AnalysisResult, Challenge } from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  challenges: Challenge[]
  activeId: string | null
  result: AnalysisResult
  onApply: (c: Challenge) => void
}

interface CheckItem { label: string; pass: boolean }

export function checkChallenge(c: Challenge, r: AnalysisResult): CheckItem[] {
  const items: CheckItem[] = []
  if (c.req.maxSnowUtil !== undefined)
    items.push({ label: `抗雪利用率 ≤ ${(c.req.maxSnowUtil * 100).toFixed(0)}%（当前 ${(r.snow.utilization * 100).toFixed(0)}%）`, pass: r.snow.utilization <= c.req.maxSnowUtil })
  if (c.req.maxWindUtil !== undefined)
    items.push({ label: `抗风利用率 ≤ ${(c.req.maxWindUtil * 100).toFixed(0)}%（当前 ${(r.wind.mUtil * 100).toFixed(0)}%）`, pass: r.wind.mUtil <= c.req.maxWindUtil })
  if (c.req.minIndoor !== undefined)
    items.push({ label: `室内最低温 ≥ ${c.req.minIndoor}℃（当前 ${(r.thermal.indoorMin ?? 0).toFixed(1)}℃）`, pass: (r.thermal.indoorMin ?? 0) >= c.req.minIndoor })
  if (c.req.minLight !== undefined)
    items.push({ label: `有效透光率 ≥ ${(c.req.minLight * 100).toFixed(0)}%（当前 ${(r.light.effTR * 100).toFixed(0)}%）`, pass: r.light.effTR >= c.req.minLight })
  if (c.req.minAnchor !== undefined)
    items.push({ label: `抗拔安全系数 ≥ ${c.req.minAnchor}（当前 ${r.wind.anchorSafety > 50 ? '—' : r.wind.anchorSafety.toFixed(2)}）`, pass: r.wind.anchorSafety >= c.req.minAnchor })
  if (c.budgetPerSqm !== undefined)
    items.push({ label: `造价 ≤ ${c.budgetPerSqm} 元/㎡（当前 ${r.cost.perSqm.toFixed(0)} 元/㎡）`, pass: r.cost.perSqm <= c.budgetPerSqm })
  return items
}

export default function ChallengePanel({ challenges, activeId, result, onApply }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 leading-relaxed">
        点击「接受任务」载入任务场景，调整左侧参数与材料使全部条件达标。全部达成 ★★★，达成 80% 以上 ★★。
      </div>
      {challenges.map((c) => {
        const checks = checkChallenge(c, result)
        const passed = checks.filter((x) => x.pass).length
        const pct = checks.length ? passed / checks.length : 0
        const stars = pct >= 1 ? 3 : pct >= 0.8 ? 2 : pct >= 0.6 ? 1 : 0
        const active = activeId === c.id
        return (
          <div key={c.id} className={`rounded-lg border-2 p-3 ${active ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-slate-800">{c.name}</div>
              <div className="text-amber-500 text-sm tracking-wide">{stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'}</div>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.brief}</p>
            {active && (
              <div className="mt-2 space-y-1">
                {checks.map((ck) => (
                  <div key={ck.label} className={`text-[11px] font-medium ${ck.pass ? 'text-emerald-700' : 'text-red-600'}`}>
                    {ck.pass ? '✓' : '✗'} {ck.label}
                  </div>
                ))}
                <div className="text-[11px] text-sky-800 bg-sky-50 rounded p-1.5 mt-1">💡 {c.hint}</div>
              </div>
            )}
            <Button size="sm" variant={active ? 'outline' : 'default'} className="mt-2 h-7 text-xs" onClick={() => onApply(c)}>
              {active ? '重新载入场景' : '接受任务'}
            </Button>
          </div>
        )
      })}
      {activeId && (
        <Badge className="bg-emerald-600">任务进行中 · 在左侧调整设计，右侧实时判定</Badge>
      )}
    </div>
  )
}
