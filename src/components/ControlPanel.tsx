import type { DesignConfig, GhType } from '../types'
import { REGIONS, FRAMES, COVERS, WALLS, FOUNDATIONS } from '../data/catalog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  cfg: DesignConfig
  setCfg: (c: DesignConfig) => void
  regionId: string
  setRegionId: (id: string) => void
}

function ParamSlider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <Label className="text-slate-600">{label}</Label>
        <span className="font-semibold text-emerald-700">{value}{unit}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

export default function ControlPanel({ cfg, setCfg, regionId, setRegionId }: Props) {
  const isSolar = cfg.ghType === 'solar'
  const upd = (patch: Partial<DesignConfig>) => setCfg({ ...cfg, ...patch })
  const switchType = (t: GhType) => {
    if (t === cfg.ghType) return
    setCfg({
      ...cfg, ghType: t,
      span: t === 'solar' ? 8 : 9.6,
      ridgeHeight: t === 'solar' ? 4.2 : 5,
      length: t === 'solar' ? 60 : 48,
      frameSpacing: t === 'solar' ? 1 : 4.5,
      spanCount: t === 'venlo' ? 4 : cfg.spanCount,
      frameId: FRAMES.find((f) => f.ghType === t)!.id,
      coverId: COVERS.find((c) => (t === 'solar' ? ['pe', 'po', 'eva'].includes(c.id) : ['glass5', 'pc', 'glass2'].includes(c.id)))!.id,
      wallId: WALLS.find((w) => w.ghType === t)!.id,
      foundationId: FOUNDATIONS.find((f) => f.ghType === t)!.id,
    })
  }

  const selCls = 'border-2 rounded-lg p-2 cursor-pointer text-center transition-colors'
  return (
    <div className="space-y-5">
      {/* 温室类型 */}
      <div>
        <Label className="text-sm font-bold text-slate-700">① 温室类型</Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div className={`${selCls} ${isSolar ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => switchType('solar')}>
            <div className="text-2xl">🏜</div>
            <div className="text-xs font-bold mt-0.5">日光温室</div>
            <div className="text-[10px] text-slate-400">单栋 · 后墙蓄热 · 薄膜/被</div>
          </div>
          <div className={`${selCls} ${!isSolar ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => switchType('venlo')}>
            <div className="text-2xl">🏢</div>
            <div className="text-xs font-bold mt-0.5">文洛型玻璃温室</div>
            <div className="text-[10px] text-slate-400">连栋 · 桁架天沟 · 玻璃</div>
          </div>
        </div>
      </div>

      {/* 地域 */}
      <div>
        <Label className="text-sm font-bold text-slate-700">② 建设地域（气候分区）</Label>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {REGIONS.map((r) => (
            <div
              key={r.id}
              onClick={() => setRegionId(r.id)}
              className={`${selCls} !p-1.5 ${regionId === r.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="text-[11px] font-bold">{r.name}</div>
              <div className="text-[10px] text-slate-400">{r.city}</div>
              <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                雪压{r.snow} · 风压{r.wind}<br />冬极温{r.tWinterMin}℃ · 日照{r.sunshine}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 结构参数 */}
      <div className="space-y-3">
        <Label className="text-sm font-bold text-slate-700">③ 结构参数</Label>
        {isSolar ? (
          <>
            <ParamSlider label="跨度" value={cfg.span} min={6} max={12} step={0.5} unit=" m" onChange={(v) => upd({ span: v })} />
            <ParamSlider label="脊高" value={cfg.ridgeHeight} min={3.2} max={5.5} step={0.1} unit=" m" onChange={(v) => upd({ ridgeHeight: v })} />
            <ParamSlider label="长度" value={cfg.length} min={30} max={100} step={5} unit=" m" onChange={(v) => upd({ length: v })} />
            <ParamSlider label="拱杆间距" value={cfg.frameSpacing} min={0.8} max={1.5} step={0.1} unit=" m" onChange={(v) => upd({ frameSpacing: v })} />
          </>
        ) : (
          <>
            <ParamSlider label="单跨跨度" value={cfg.span} min={6.4} max={12} step={0.8} unit=" m" onChange={(v) => upd({ span: v })} />
            <ParamSlider label="跨数" value={cfg.spanCount} min={3} max={9} step={1} unit=" 跨" onChange={(v) => upd({ spanCount: v })} />
            <ParamSlider label="檐高" value={cfg.ridgeHeight} min={3.5} max={6.5} step={0.1} unit=" m" onChange={(v) => upd({ ridgeHeight: v })} />
            <ParamSlider label="长度" value={cfg.length} min={24} max={72} step={6} unit=" m" onChange={(v) => upd({ length: v })} />
            <ParamSlider label="开间" value={cfg.frameSpacing} min={4} max={8} step={0.5} unit=" m" onChange={(v) => upd({ frameSpacing: v })} />
          </>
        )}
      </div>

      {/* 材料 */}
      <div className="space-y-3">
        <Label className="text-sm font-bold text-slate-700">④ 材料选择</Label>
        {[
          { key: 'frameId' as const, label: '骨架', options: FRAMES.filter((f) => f.ghType === cfg.ghType).map((f) => ({ id: f.id, name: f.name, note: f.desc })) },
          { key: 'coverId' as const, label: '覆盖', options: COVERS.map((c) => ({ id: c.id, name: `${c.name}（透光${(c.tr * 100).toFixed(0)}%·${c.price}元/㎡·${c.life}年）`, note: c.note })) },
          { key: 'wallId' as const, label: isSolar ? '墙体' : '墙面', options: WALLS.filter((w) => w.ghType === cfg.ghType).map((w) => ({ id: w.id, name: w.name, note: w.note })) },
          { key: 'foundationId' as const, label: '基础', options: FOUNDATIONS.filter((f) => f.ghType === cfg.ghType).map((f) => ({ id: f.id, name: f.name, note: f.note })) },
        ].map((g) => (
          <div key={g.key} className="space-y-1">
            <Label className="text-xs text-slate-600">{g.label}</Label>
            <Select value={cfg[g.key]} onValueChange={(v) => upd({ [g.key]: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {g.options.map((o) => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
