import { useMemo, useState } from 'react'
import type { Challenge, DesignConfig, Season, WeatherState } from './types'
import { REGIONS, SCENARIOS, CHALLENGES, FRAMES, COVERS, WALLS, FOUNDATIONS, SEASONS } from './data/catalog'
import { analyze } from './engine/calc'
import ControlPanel from './components/ControlPanel'
import GreenhouseCanvas from './components/GreenhouseCanvas'
import { AnalysisTab, CostTab } from './components/ResultsPanel'
import ChallengePanel from './components/ChallengePanel'
import KnowledgePanel from './components/KnowledgePanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import './sim.css'

const DEFAULT_CFG: DesignConfig = {
  ghType: 'solar', span: 8, length: 60, ridgeHeight: 4.2,
  frameSpacing: 1, spanCount: 4,
  frameId: 's-truss-l', coverId: 'po', wallId: 'w-brick-eps', foundationId: 'f-rc',
}

const SUNNY: WeatherState = { snowDepth: 0, windSpeed: 3, rainfall: 0, overcast: 0, hail: false }

const OVERALL_BADGE = {
  safe: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
} as const

export default function App() {
  const [cfg, setCfg] = useState<DesignConfig>(DEFAULT_CFG)
  const [regionId, setRegionId] = useState('beijing')
  const [weather, setWeather] = useState<WeatherState>(SUNNY)
  const [season, setSeason] = useState<Season>('winter')
  const [playing, setPlaying] = useState(true)
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null)
  const [scenarioId, setScenarioId] = useState('sunny')

  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[1]
  const result = useMemo(() => analyze(cfg, region, weather, season), [cfg, region, weather, season])

  const applyScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id)
    if (!s) return
    setScenarioId(id)
    setWeather({ snowDepth: s.snow, windSpeed: s.wind, rainfall: s.rain, overcast: s.overcast, hail: s.hail })
  }

  const applyChallenge = (c: Challenge) => {
    setActiveChallenge(c.id)
    setRegionId(c.regionId)
    setSeason(c.season)
    setWeather({ ...c.weather })
    const t = c.ghType
    setCfg({
      ...DEFAULT_CFG, ghType: t,
      span: t === 'solar' ? 8 : 9.6,
      ridgeHeight: t === 'solar' ? 4.2 : 5,
      length: t === 'solar' ? 60 : 48,
      frameSpacing: t === 'solar' ? 1 : 4.5,
      frameId: FRAMES.find((f) => f.ghType === t)!.id,
      coverId: COVERS.find((x) => (t === 'solar' ? x.id === 'po' : x.id === 'glass5'))!.id,
      wallId: WALLS.find((w) => w.ghType === t)!.id,
      foundationId: FOUNDATIONS.find((f) => f.ghType === t)!.id,
    })
  }

  const wslider = (label: string, key: keyof WeatherState, max: number, unit: string, step = 1) => (
    <div className="w-36 space-y-0.5">
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{weather[key] as number}{unit}</span>
      </div>
      <Slider value={[weather[key] as number]} min={0} max={max} step={step} onValueChange={([v]) => {
        setWeather({ ...weather, [key]: v })
        setScenarioId('custom')
      }} />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      <header className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white px-4 py-2.5 flex items-center justify-between shadow">
        <div>
          <h1 className="text-lg font-bold tracking-wide">🌱 温室结构设计模拟器</h1>
          <p className="text-[11px] text-emerald-100">《设施园艺学》教学工具 · 日光温室 / 文洛型玻璃温室 · 结构设计 · 材料选择 · 荷载验算 · 造价估算</p>
        </div>
        <Badge className={`${OVERALL_BADGE[result.overall]} text-sm px-3 py-1`}>
          {result.overall === 'safe' ? '结构安全' : result.overall === 'warning' ? '临界状态' : '危险！'}
        </Badge>
      </header>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)_390px] gap-3 p-3">
        {/* 左：参数配置 */}
        <aside className="bg-white rounded-xl border shadow-sm p-3 overflow-y-auto xl:max-h-[calc(100vh-92px)]">
          <ControlPanel cfg={cfg} setCfg={setCfg} regionId={regionId} setRegionId={setRegionId} />
        </aside>

        {/* 中：场景 + 画布 */}
        <main className="space-y-3 min-w-0">
          <div className="bg-white rounded-xl border shadow-sm p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 mr-1">天气场景：</span>
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applyScenario(s.id)}
                  className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${scenarioId === s.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-300 hover:border-sky-400'}`}
                >
                  {s.name}
                </button>
              ))}
              <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => setPlaying(!playing)}>
                {playing ? '⏸ 暂停动画' : '▶ 播放动画'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 mt-2.5 items-end">
              {wslider('雪深', 'snowDepth', 60, ' cm')}
              {wslider('风速', 'windSpeed', 40, ' m/s')}
              {wslider('降雨', 'rainfall', 200, ' mm', 10)}
              {wslider('寡照', 'overcast', 1, '', 0.05)}
              <div className="flex gap-1 items-center">
                <Label className="text-[10px] text-slate-500 mr-1">节气</Label>
                {SEASONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeason(s.id)}
                    className={`text-[11px] px-2 py-0.5 rounded border ${season === s.id ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-300 text-slate-600'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5">
              {SCENARIOS.find((s) => s.id === scenarioId)?.desc ?? '自定义天气：拖动滑块组合任意雪深、风速与寡照程度'}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-3">
            <GreenhouseCanvas cfg={cfg} region={region} weather={weather} season={season} result={result} playing={playing} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 mt-2 pt-2 border-t">
              <span><i className="inline-block w-3 h-0.5 bg-slate-600 align-middle mr-1" />骨架（{cfg.ghType === 'solar' ? '拱架' : '立柱桁架'}）</span>
              <span><i className="inline-block w-3 h-2 bg-sky-200 align-middle mr-1" />覆盖材料</span>
              <span><i className="inline-block w-3 h-2 bg-white border border-slate-300 align-middle mr-1" />积雪</span>
              {cfg.ghType === 'solar' && <span><i className="inline-block w-3 h-0.5 bg-orange-500 align-middle mr-1" />超载变形示意</span>}
              <span className="ml-auto">剖面按真实比例绘制 · {region.name}（{region.city}）</span>
            </div>
          </div>
        </main>

        {/* 右：结果 */}
        <aside className="bg-white rounded-xl border shadow-sm p-3 overflow-y-auto xl:max-h-[calc(100vh-92px)]">
          <Tabs defaultValue="check">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="check" className="text-xs">结构验算</TabsTrigger>
              <TabsTrigger value="cost" className="text-xs">造价分析</TabsTrigger>
              <TabsTrigger value="class" className="text-xs">知识课堂</TabsTrigger>
              <TabsTrigger value="game" className="text-xs">挑战任务</TabsTrigger>
            </TabsList>
            <TabsContent value="check" className="mt-3"><AnalysisTab result={result} cfg={cfg} region={region} weather={weather} /></TabsContent>
            <TabsContent value="cost" className="mt-3"><CostTab result={result} /></TabsContent>
            <TabsContent value="class" className="mt-3"><KnowledgePanel /></TabsContent>
            <TabsContent value="game" className="mt-3">
              <ChallengePanel challenges={CHALLENGES} activeId={activeChallenge} result={result} onApply={applyChallenge} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
}
