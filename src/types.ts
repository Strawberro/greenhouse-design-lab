export type GhType = 'solar' | 'venlo'
export type Season = 'winter' | 'spring' | 'summer' | 'autumn'
export type Verdict = 'safe' | 'warning' | 'danger'

/** 气候分区（教学用典型值） */
export interface Region {
  id: string
  name: string
  city: string
  lat: number
  tWinterAvg: number // 冬季平均气温 ℃
  tWinterMin: number // 冬季极端低温 ℃
  snow: number // 基本雪压 kN/m²
  wind: number // 基本风压 kN/m²
  sunshine: number // 年日照时数 h
  tagline: string
}

export interface WeatherState {
  snowDepth: number // cm
  windSpeed: number // m/s
  rainfall: number // mm
  overcast: number // 0-1 寡照程度
  hail: boolean
}

export interface DesignConfig {
  ghType: GhType
  span: number // 跨度 m
  length: number // 长度 m
  ridgeHeight: number // 日光：脊高 m；文洛：檐高 m
  frameSpacing: number // 日光：拱杆间距 m；文洛：开间 m
  spanCount: number // 文洛跨数
  frameId: string
  coverId: string
  wallId: string
  foundationId: string
}

export interface FrameSystem {
  id: string
  ghType: GhType
  name: string
  desc: string
  mAllow: number // 容许弯矩 kN·m（含稳定折减）
  kgPerM?: number // 每延米骨架重量 kg/m（日光拱杆）
  kgPerSqm?: number // 用钢量 kg/m²（文洛）
  pricePerKg: number
}

export interface CoverMaterial {
  id: string
  name: string
  tr: number // 透光率
  u: number // 传热系数 W/m²·K
  price: number // 元/m²
  life: number // 寿命 年
  insulation: number // 0-1 保温评分
  note: string
}

export interface WallMaterial {
  id: string
  ghType: GhType
  name: string
  thickness?: number // m（日光后墙，文洛忽略）
  heatScore: number // 0-1 保温/蓄热评分
  pricePerM3?: number
  u?: number // 文洛墙面传热系数
  pricePerSqm?: number // 文洛墙面单价
  note: string
}

export interface FoundationOpt {
  id: string
  ghType: GhType
  name: string
  costPerM?: number
  costPerCol?: number
  antiUplift: number // 抗拔放大系数
  note: string
}

export interface Scenario {
  id: string
  name: string
  snow: number
  wind: number
  rain: number
  overcast: number
  hail: boolean
  desc: string
}

export interface ChallengeReq {
  maxSnowUtil?: number
  maxWindUtil?: number
  minIndoor?: number
  minLight?: number
  minAnchor?: number
}

export interface Challenge {
  id: string
  name: string
  brief: string
  hint: string
  regionId: string
  ghType: GhType
  weather: WeatherState
  season: Season
  budgetPerSqm?: number
  req: ChallengeReq
}

export interface KnowledgeCard {
  id: string
  title: string
  formula?: string
  body: string
}

export interface CostItem {
  name: string
  detail: string
  subtotal: number
}

export interface AnalysisResult {
  geom: {
    groundArea: number
    frontArea: number
    rearArea: number
    roofAreaVenlo: number
    wallAreaVenlo: number
    arcLen: number
    steelKg: number
  }
  snow: {
    groundLoad: number
    shapeFactor: number
    roofLoad: number
    mDemand: number
    mAllow: number
    utilization: number
  }
  wind: {
    w0: number
    netPressure: number
    mUtil: number
    uplift: number
    deadWeight: number
    anchorSafety: number
  }
  light: {
    sunAlt: number
    roofBeta: number
    incidence: number
    effTR: number
    score: number
  }
  thermal: {
    indoorMin: number | null
    heatLoad: number | null
    heatingKwh: number | null
    meetsCrop: boolean
  }
  cost: {
    items: CostItem[]
    total: number
    perSqm: number
    marketLow: number
    marketHigh: number
  }
  memberUtil: number
  overall: Verdict
  tips: string[]
}
