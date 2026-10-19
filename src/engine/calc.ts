import type {
  AnalysisResult, CostItem, DesignConfig, Region, Season, Verdict, WeatherState,
} from '../types'
import { FRAMES, COVERS, WALLS, FOUNDATIONS, SEASONS } from '../data/catalog'

export const SNOW_RHO = 130 // 积雪密度 kg/m³（湿雪可达 200+）
export const VENLO_ANGLE = 26.5 // 文洛屋面坡角 °
export const WALL_H = 2.6 // 日光温室后墙高 m
const REAR_PROJ = 1.5 // 日光温室后屋面水平投影 m
const SAFETY = 1.4 // 荷载分项系数

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 日光温室前屋面圆拱几何：A(0,0.3) → B(c,H)，屋脊处切线水平 */
export function solarArch(span: number, H: number) {
  const c = span - REAR_PROJ
  const f = H - 0.3
  const cy = (c * c + 0.09 - H * H) / (0.6 - 2 * H)
  const R = H - cy
  const thA = Math.atan2(0.3 - cy, -c)
  const thB = Math.PI / 2
  const arcLen = R * (thA - thB)
  // 前屋面中部（弧长中点）切线倾角，用于采光计算
  const midTh = (thA + thB) / 2
  const slope = Math.abs(-Math.cos(midTh) / Math.sin(midTh))
  const betaMid = (Math.atan(slope) * 180) / Math.PI
  const chord = Math.hypot(c, f)
  return { c, f, cy, R, thA, thB, arcLen, betaMid, chord }
}

function snowShapeFactor(riseRatio: number): number {
  // GB 50009 拱形屋面积雪分布系数的教学简化插值
  const pts: [number, number][] = [[0.1, 1.0], [0.2, 0.8], [0.3, 0.65], [0.4, 0.55], [0.5, 0.45]]
  if (riseRatio <= 0.1) return 1.0
  for (let i = 1; i < pts.length; i++) {
    if (riseRatio <= pts[i][0]) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      return y0 + ((riseRatio - x0) / (x1 - x0)) * (y1 - y0)
    }
  }
  return 0.45
}

export function analyze(
  cfg: DesignConfig,
  region: Region,
  weather: WeatherState,
  season: Season,
): AnalysisResult {
  const frame = FRAMES.find((f) => f.id === cfg.frameId) ?? FRAMES[0]
  const cover = COVERS.find((c) => c.id === cfg.coverId) ?? COVERS[0]
  const wall = WALLS.find((w) => w.id === cfg.wallId) ?? WALLS[0]
  const found = FOUNDATIONS.find((f) => f.id === cfg.foundationId) ?? FOUNDATIONS[0]
  const isSolar = cfg.ghType === 'solar'

  // ---------- 几何 ----------
  let groundArea: number, frontArea: number, rearArea: number
  let roofAreaVenlo = 0, wallAreaVenlo = 0, arcLen = 0, clearSpan = 0
  let beta = 0
  if (isSolar) {
    const g = solarArch(cfg.span, cfg.ridgeHeight)
    arcLen = g.arcLen
    clearSpan = g.chord
    beta = g.betaMid
    groundArea = cfg.span * cfg.length
    frontArea = g.arcLen * cfg.length
    rearArea = Math.hypot(REAR_PROJ, cfg.ridgeHeight - WALL_H) * cfg.length
  } else {
    const width = cfg.span * cfg.spanCount
    const cosA = Math.cos((VENLO_ANGLE * Math.PI) / 180)
    groundArea = width * cfg.length
    roofAreaVenlo = (width * cfg.length) / cosA
    wallAreaVenlo = 2 * cfg.length * cfg.ridgeHeight + 2 * width * cfg.ridgeHeight
    frontArea = roofAreaVenlo
    rearArea = 0
    clearSpan = cfg.span
    beta = VENLO_ANGLE
  }

  // ---------- 雪荷载 ----------
  const gA = isSolar ? solarArch(cfg.span, cfg.ridgeHeight) : null
  const groundSnow = ((weather.snowDepth / 100) * SNOW_RHO * 9.8) / 1000 // kN/m²
  const shapeFactor = gA ? snowShapeFactor(gA.f / gA.chord) : 1.0
  const roofSnow = groundSnow * shapeFactor
  const snowLine = roofSnow * cfg.frameSpacing // 每根骨架承担的线荷载 kN/m
  const mSnow = (snowLine * clearSpan * clearSpan) / 8
  const snowUtil = (SAFETY * mSnow) / frame.mAllow

  // ---------- 风荷载 ----------
  const w0 = (weather.windSpeed * weather.windSpeed) / 1600
  const bodyFactor = isSolar ? 1.1 : 1.3 // 体型系数（轻质屋面风吸控制）
  const netP = w0 * bodyFactor
  const windLine = netP * cfg.frameSpacing
  const mWind = (windLine * clearSpan * clearSpan) / 8
  const windMUtil = (SAFETY * mWind) / frame.mAllow

  // 整体抗拔：上拔力 vs 结构总重（含基础自重，基础重最后回填）
  const horizArea = gA ? gA.c * cfg.length : cfg.span * cfg.spanCount * cfg.length
  const uplift = netP * horizArea * 0.55
  let deadWeightN = 0

  // ---------- 采光 ----------
  const decl = SEASONS.find((s) => s.id === season)?.decl ?? -23.4
  const sunAlt = 90 - Math.abs(region.lat - decl)
  let incidence = 90 - sunAlt - beta
  incidence = clamp(incidence, -80, 80)
  const trFactor = clamp(Math.cos((Math.abs(incidence) * Math.PI) / 180), 0.15, 1)
  const effTR = cover.tr * trFactor * (1 - weather.overcast * 0.65)
  const lightScore = effTR / 0.7

  // ---------- 热工 ----------
  let indoorMin: number | null = null
  let heatLoad: number | null = null
  let heatingKwh: number | null = null
  if (isSolar) {
    // 教学模型：保温被 + 墙体 + 覆盖层的夜间温升贡献（ΔT ≈ 15~30℃）
    indoorMin = region.tWinterMin + 9 + wall.heatScore * 14 + cover.insulation * 10 + 6
  } else {
    const uEff = 0.55 * cover.u + 0.45 * (wall.u ?? 5.8)
    const dT = Math.max(0, 12 - region.tWinterMin)
    heatLoad = dT * (0.8 * uEff + 0.9) // W/m²
    heatingKwh = heatLoad * 2.16 // 冬季90天 24h
  }
  const meetsCrop = isSolar ? (indoorMin ?? 0) >= 10 : (heatLoad ?? 999) <= 130

  // ---------- 造价与自重 ----------
  const items: CostItem[] = []
  let steelKg = 0
  if (isSolar) {
    const count = Math.ceil(cfg.length / cfg.frameSpacing) + 1
    const archSteel = count * arcLen * (frame.kgPerM ?? 1.5)
    const braceSteel = (3 * cfg.length + 2 * cfg.span) * 2.2
    steelKg = (archSteel + braceSteel) * 1.05
    const steelCost = steelKg * frame.pricePerKg
    items.push({ name: '骨架（热镀锌钢管）', detail: `${steelKg.toFixed(0)} kg × ${frame.pricePerKg} 元/kg`, subtotal: steelCost })
    const coverCost = (frontArea + rearArea) * cover.price
    items.push({ name: `覆盖材料（${cover.name}）`, detail: `${(frontArea + rearArea).toFixed(0)} ㎡ × ${cover.price} 元/㎡`, subtotal: coverCost })
    const quiltCost = frontArea * 14
    items.push({ name: '保温被', detail: `${frontArea.toFixed(0)} ㎡ × 14 元/㎡`, subtotal: quiltCost })
    const wallVol = (WALL_H * cfg.length + (cfg.span * (cfg.ridgeHeight + WALL_H)) / 2) * (wall.thickness ?? 0.3)
    const wallCost = wallVol * (wall.pricePerM3 ?? 300)
    items.push({ name: `墙体（${wall.name}）`, detail: `${wallVol.toFixed(0)} m³ × ${wall.pricePerM3 ?? 300} 元/m³`, subtotal: wallCost })
    const per = 2 * (cfg.length + cfg.span)
    const foundCost = per * (found.costPerM ?? 150)
    items.push({ name: `基础（${found.name}）`, detail: `${per.toFixed(0)} m × ${found.costPerM ?? 150} 元/m`, subtotal: foundCost })
    items.push({ name: '门窗·卷被机·卡槽等', detail: '按座估列', subtotal: 12000 })
    const install = (steelCost + coverCost + wallCost) * 0.18
    items.push({ name: '安装人工', detail: '材料费 × 18%', subtotal: install })
    const coverKg = (frontArea + rearArea) * (cover.price <= 15 ? 0.15 : cover.id === 'pc' ? 1.6 : 12.5)
    deadWeightN = (steelKg + coverKg + wallVol * 1800) * 9.8
  } else {
    steelKg = groundArea * (frame.kgPerSqm ?? 6)
    const steelCost = steelKg * frame.pricePerKg
    items.push({ name: '主体热镀锌钢结构', detail: `${steelKg.toFixed(0)} kg（${frame.kgPerSqm} kg/㎡）× ${frame.pricePerKg} 元/kg`, subtotal: steelCost })
    const gutterM = cfg.spanCount * cfg.length
    const gutterCost = gutterM * 3.2 * 22
    items.push({ name: '铝合金天沟系统', detail: `${gutterM.toFixed(0)} m × 3.2 kg/m × 22 元/kg`, subtotal: gutterCost })
    items.push({ name: `屋面覆盖（${cover.name}）`, detail: `${roofAreaVenlo.toFixed(0)} ㎡ × ${cover.price} 元/㎡`, subtotal: roofAreaVenlo * cover.price })
    items.push({ name: `墙面（${wall.name}）`, detail: `${wallAreaVenlo.toFixed(0)} ㎡ × ${wall.pricePerSqm ?? 85} 元/㎡`, subtotal: wallAreaVenlo * (wall.pricePerSqm ?? 85) })
    const cols = (cfg.spanCount + 1) * (Math.floor(cfg.length / cfg.frameSpacing) + 1)
    const foundCost = cols * (found.costPerCol ?? 350)
    items.push({ name: `基础（${found.name}）`, detail: `${cols} 个柱基础 × ${found.costPerCol ?? 350} 元/个`, subtotal: foundCost })
    items.push({ name: '通风·遮阳·灌溉系统', detail: `${groundArea.toFixed(0)} ㎡ × 110 元/㎡`, subtotal: groundArea * 110 })
    const install = (steelCost + gutterCost) * 0.1
    items.push({ name: '安装人工', detail: '钢结构 × 10%', subtotal: install })
    const coverKg = (roofAreaVenlo + wallAreaVenlo) * (cover.id === 'pc' ? 1.6 : 12.5)
    const foundKgN = cols * (found.id === 'vf-pile' ? 1500 : 600) * 9.8 // 基础自重
    deadWeightN = (steelKg + coverKg) * 9.8 + foundKgN
  }
  const total = items.reduce((s, i) => s + i.subtotal, 0)
  const perSqm = total / groundArea
  const marketLow = isSolar ? 220 : 330
  const marketHigh = isSolar ? 450 : 560

  // ---------- 抗拔安全系数 ----------
  const anchorSafety = uplift > 0.01 ? ((deadWeightN / 1000) * 0.9 * found.antiUplift) / uplift : 99

  // ---------- 综合判定 ----------
  const memberUtil = Math.max(snowUtil, windMUtil)
  const checks: { t: Verdict }[] = [
    { t: memberUtil > 1 ? 'danger' : memberUtil > 0.85 ? 'warning' : 'safe' },
    { t: anchorSafety < 1 ? 'danger' : anchorSafety < 1.5 ? 'warning' : 'safe' },
    {
      t: meetsCrop ? 'safe' : isSolar
        ? ((indoorMin ?? 0) > 2 ? 'warning' : 'danger')
        : ((heatLoad ?? 0) < 180 ? 'warning' : 'danger'),
    },
  ]
  const overall: Verdict = checks.some((c) => c.t === 'danger')
    ? 'danger'
    : checks.some((c) => c.t === 'warning')
      ? 'warning'
      : 'safe'

  const tips: string[] = []
  if (snowUtil > 1) tips.push(`⚠ 暴雪下拱架弯矩需求是承载力的 ${(snowUtil * 100).toFixed(0)}%，结构将破坏！考虑桁架拱、加密骨架间距或减小跨度。`)
  else if (snowUtil > 0.85) tips.push(`雪荷载利用率已达 ${(snowUtil * 100).toFixed(0)}%，接近临界，建议留更大安全储备。`)
  if (windMUtil > 1) tips.push(`风荷载下骨架应力超限（${(windMUtil * 100).toFixed(0)}%），大风区请加强骨架、加密间距并做好锚固。`)
  if (uplift > 0.01 && anchorSafety < 1.5) tips.push(`整体抗拔安全系数 ${anchorSafety.toFixed(2)} < 1.5，大风天有被掀顶风险，建议桩基础＋锚固。`)
  if (isSolar && (indoorMin ?? 0) < 10) tips.push(`估算室内最低温 ${(indoorMin ?? 0).toFixed(1)}℃，喜温作物（番茄等）难以安全越冬，考虑加厚墙体、换保温覆盖或配置应急加温。`)
  if (!isSolar && (heatLoad ?? 0) > 130) tips.push(`冬季热负荷约 ${(heatLoad ?? 0).toFixed(0)} W/㎡（折合 ${(heatingKwh ?? 0).toFixed(0)} kWh/㎡·冬），加温能耗偏高，可考虑中空玻璃/PC板或双层结构。`)
  if (lightScore < 1) tips.push(`有效透光率 ${(effTR * 100).toFixed(0)}%（目标 70%）：可优化屋面角度、换高透光覆盖或减少寡照损失。`)
  if (weather.hail && (cover.id === 'pe' || cover.id === 'po' || cover.id === 'eva')) tips.push('冰雹对薄膜破坏性强，玻璃/PC板抗冲击更可靠。')
  if (tips.length === 0) tips.push('✓ 各工况下结构安全、性能达标，设计合理！可以尝试挑战模式检验更多场景。')

  return {
    geom: { groundArea, frontArea, rearArea, roofAreaVenlo, wallAreaVenlo, arcLen, steelKg },
    snow: { groundLoad: groundSnow, shapeFactor, roofLoad: roofSnow, mDemand: SAFETY * mSnow, mAllow: frame.mAllow, utilization: snowUtil },
    wind: { w0, netPressure: netP, mUtil: windMUtil, uplift, deadWeight: deadWeightN / 1000, anchorSafety },
    light: { sunAlt, roofBeta: beta, incidence, effTR, score: lightScore },
    thermal: { indoorMin, heatLoad, heatingKwh, meetsCrop },
    cost: { items, total, perSqm, marketLow, marketHigh },
    memberUtil, overall, tips,
  }
}
