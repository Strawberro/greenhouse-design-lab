import type {
  Region, FrameSystem, CoverMaterial, WallMaterial, FoundationOpt,
  Scenario, Challenge, KnowledgeCard,
} from '../types'

export const REGIONS: Region[] = [
  { id: 'harbin', name: '东北严寒区', city: '哈尔滨', lat: 45.8, tWinterAvg: -15, tWinterMin: -30, snow: 0.7, wind: 0.55, sunshine: 2600, tagline: '雪大天寒，抗雪保温是核心' },
  { id: 'beijing', name: '华北寒冷区', city: '北京', lat: 39.9, tWinterAvg: -4, tWinterMin: -18, snow: 0.4, wind: 0.45, sunshine: 2600, tagline: '冬冷夏热，风雪兼顾' },
  { id: 'lanzhou', name: '西北寒冷干旱区', city: '兰州', lat: 36.1, tWinterAvg: -3, tWinterMin: -15, snow: 0.15, wind: 0.35, sunshine: 2650, tagline: '光好风大，昼夜温差大' },
  { id: 'shanghai', name: '华东夏热冬冷区', city: '上海', lat: 31.2, tWinterAvg: 4, tWinterMin: -6, snow: 0.2, wind: 0.55, sunshine: 1900, tagline: '台风暴雨，夏季降温排湿是重点' },
  { id: 'wuhan', name: '华中湿润区', city: '武汉', lat: 30.6, tWinterAvg: 3, tWinterMin: -8, snow: 0.35, wind: 0.3, sunshine: 1850, tagline: '阴冷寡照，高湿多病' },
  { id: 'guangzhou', name: '华南夏热冬暖区', city: '广州', lat: 23.1, tWinterAvg: 13, tWinterMin: 3, snow: 0.05, wind: 0.5, sunshine: 1700, tagline: '台风暴雨频繁，重在抗风排水' },
]

export const FRAMES: FrameSystem[] = [
  { id: 's-tube25', ghType: 'solar', name: 'φ25×1.2 单拱管', desc: '简易小棚常用', mAllow: 0.15, kgPerM: 0.71, pricePerKg: 5.8 },
  { id: 's-tube32', ghType: 'solar', name: 'φ32×1.5 单拱管', desc: '小型日光温室', mAllow: 0.25, kgPerM: 1.13, pricePerKg: 5.8 },
  { id: 's-tube40', ghType: 'solar', name: 'φ40×1.8 单拱管', desc: '中等跨度', mAllow: 0.45, kgPerM: 1.68, pricePerKg: 5.8 },
  { id: 's-tube48', ghType: 'solar', name: 'φ48×2.0 单拱管', desc: '大跨度加强', mAllow: 0.7, kgPerM: 2.28, pricePerKg: 5.8 },
  { id: 's-truss-l', ghType: 'solar', name: '轻型桁架拱（上弦φ32/下弦φ16）', desc: '钢管桁架，经济可靠', mAllow: 1.4, kgPerM: 2.4, pricePerKg: 5.8 },
  { id: 's-truss-h', ghType: 'solar', name: '重型桁架拱（上弦φ40/下弦φ20）', desc: '严寒大雪区推荐', mAllow: 3.0, kgPerM: 3.4, pricePerKg: 5.8 },
  { id: 'v-light', ghType: 'venlo', name: '轻型（立柱□100×100×2.5，桁架高0.5m）', desc: '雪小风小地区', mAllow: 12, kgPerSqm: 4.8, pricePerKg: 6.0 },
  { id: 'v-std', ghType: 'venlo', name: '标准型（立柱□120×120×3，桁架高0.7m）', desc: '通用规格', mAllow: 28, kgPerSqm: 6.2, pricePerKg: 6.0 },
  { id: 'v-heavy', ghType: 'venlo', name: '加强型（立柱□150×150×3.5，桁架高1.0m）', desc: '大风大雪区', mAllow: 55, kgPerSqm: 8.0, pricePerKg: 6.0 },
]

export const COVERS: CoverMaterial[] = [
  { id: 'pe', name: 'PE 长寿流滴膜', tr: 0.87, u: 6.0, price: 8, life: 1.5, insulation: 0.3, note: '便宜但寿命短，透光衰减快' },
  { id: 'po', name: 'PO 薄膜', tr: 0.92, u: 5.5, price: 15, life: 4, insulation: 0.45, note: '高透光、强度高，性价比优选' },
  { id: 'eva', name: 'EVA 多功能膜', tr: 0.9, u: 5.0, price: 12, life: 2, insulation: 0.4, note: '流滴消雾性能好' },
  { id: 'glass5', name: '5mm 钢化玻璃', tr: 0.91, u: 5.8, price: 120, life: 20, insulation: 0.55, note: '寿命长、透光稳定' },
  { id: 'glass2', name: '中空钢化玻璃（5+9A+5）', tr: 0.83, u: 3.0, price: 230, life: 25, insulation: 0.85, note: '保温优异，严寒区适用' },
  { id: 'pc', name: 'PC 阳光板 8mm 中空', tr: 0.85, u: 3.3, price: 90, life: 10, insulation: 0.8, note: '轻质保温好，注意防紫外老化' },
]

export const WALLS: WallMaterial[] = [
  { id: 'w-earth', ghType: 'solar', name: '夯土墙', thickness: 1.2, heatScore: 0.65, pricePerM3: 90, note: '蓄热好、造价低，占地大' },
  { id: 'w-brick37', ghType: 'solar', name: '砖墙370＋内衬', thickness: 0.49, heatScore: 0.5, pricePerM3: 450, note: '坚固耐久，蓄热一般' },
  { id: 'w-brick-eps', ghType: 'solar', name: '砖墙240＋外贴苯板100', thickness: 0.34, heatScore: 0.8, pricePerM3: 520, note: '保温好，华北推荐' },
  { id: 'w-sandwich', ghType: 'solar', name: '彩钢岩棉夹芯板100mm', thickness: 0.1, heatScore: 0.85, pricePerM3: 600, note: '施工快，蓄热差需配蓄热体' },
  { id: 'vw-glass', ghType: 'venlo', name: '5mm 钢化玻璃墙', u: 5.8, heatScore: 0.35, pricePerSqm: 85, note: '通风好，造价适中' },
  { id: 'vw-pc', ghType: 'venlo', name: 'PC 阳光板墙', u: 3.3, heatScore: 0.6, pricePerSqm: 60, note: '保温优于单层玻璃' },
  { id: 'vw-dglass', ghType: 'venlo', name: '中空玻璃墙', u: 3.0, heatScore: 0.8, pricePerSqm: 170, note: '严寒区节能优选' },
]

export const FOUNDATIONS: FoundationOpt[] = [
  { id: 'f-brick', ghType: 'solar', name: '砖石基础', costPerM: 120, antiUplift: 1.0, note: '常规做法' },
  { id: 'f-rc', ghType: 'solar', name: '钢筋混凝土圈梁', costPerM: 220, antiUplift: 1.3, note: '整体性好' },
  { id: 'f-anchor', ghType: 'solar', name: '圈梁＋锚栓锚固', costPerM: 300, antiUplift: 1.8, note: '大风区推荐' },
  { id: 'vf-base', ghType: 'venlo', name: '独立柱基础', costPerCol: 350, antiUplift: 1.0, note: '通用做法' },
  { id: 'vf-pile', ghType: 'venlo', name: '桩基础＋锚固', costPerCol: 650, antiUplift: 1.9, note: '台风区推荐' },
]

export const SCENARIOS: Scenario[] = [
  { id: 'sunny', name: '☀ 晴冷天气', snow: 0, wind: 3, rain: 0, overcast: 0, hail: false, desc: '典型冬季晴天，检验采光与保温设计' },
  { id: 'snow', name: '❄ 大到暴雪', snow: 30, wind: 2, rain: 0, overcast: 0.2, hail: false, desc: '湿雪在拱面积聚，考验骨架抗雪能力' },
  { id: 'snowwind', name: '🌨 风雪交加', snow: 25, wind: 14, rain: 0, overcast: 0.3, hail: false, desc: '积雪＋风荷载叠加，最易压垮温室的天气' },
  { id: 'typhoon', name: '🌀 台风大风', snow: 0, wind: 32, rain: 80, overcast: 0.5, hail: false, desc: '强风掀顶，考验抗拔与抗风压' },
  { id: 'rain', name: '🌧 暴雨', snow: 0, wind: 8, rain: 120, overcast: 0.8, hail: false, desc: '天沟排水与墙面防漏' },
  { id: 'gloom', name: '☁ 连阴寡照', snow: 5, wind: 5, rain: 0, overcast: 0.7, hail: false, desc: '连续阴天积雪不化，光照骤减，考验采光储备' },
  { id: 'hail', name: '🧊 冰雹', snow: 0, wind: 10, rain: 20, overcast: 0.6, hail: true, desc: '冰雹冲击覆盖材料，考验抗冲击性能' },
]

export const CHALLENGES: Challenge[] = [
  {
    id: 'c-north', name: '关卡一 · 北国之冬', regionId: 'harbin', ghType: 'solar',
    brief: '为哈尔滨设计一座越冬日光温室：扛住 40cm 暴雪，夜间室内不低于 0℃（耐寒叶菜越冬；喜温果菜需另配加温），造价不超过 380 元/㎡。',
    hint: '暴雪地区优先上重型桁架拱并加密拱距；保温靠厚墙体＋优质膜＋保温被，必要时减小跨度降低雪弯矩。',
    weather: { snowDepth: 40, windSpeed: 10, rainfall: 0, overcast: 0.1, hail: false },
    season: 'winter', budgetPerSqm: 380,
    req: { maxSnowUtil: 0.9, minIndoor: 0, minLight: 0.6 },
  },
  {
    id: 'c-north2', name: '关卡二 · 华北风雪', regionId: 'beijing', ghType: 'solar',
    brief: '北京郊区建温室，风雪交加（30cm 雪＋14m/s 风）下骨架安全，且兼顾采光与造价（≤380 元/㎡）。',
    hint: '风雪叠加时要同时看抗雪和抗风两个仪表；轻型单管拱在此工况下会失效，试试桁架拱并调整间距。',
    weather: { snowDepth: 30, windSpeed: 14, rainfall: 0, overcast: 0.2, hail: false },
    season: 'winter', budgetPerSqm: 380,
    req: { maxSnowUtil: 0.85, maxWindUtil: 0.85, minLight: 0.65 },
  },
  {
    id: 'c-typhoon', name: '关卡三 · 台风考验', regionId: 'shanghai', ghType: 'venlo',
    brief: '在上海建文洛型玻璃温室，抵御 34m/s 台风，整体抗拔安全系数 ≥1.5，造价 ≤480 元/㎡。',
    hint: '台风区骨架选加强型、基础选桩基础＋锚固；减小开间和跨度能显著降低桁架弯矩（M∝qL²）。',
    weather: { snowDepth: 0, windSpeed: 34, rainfall: 100, overcast: 0.5, hail: false },
    season: 'summer', budgetPerSqm: 480,
    req: { maxWindUtil: 0.9, minAnchor: 1.5 },
  },
  {
    id: 'c-plateau', name: '关卡四 · 高原大风', regionId: 'lanzhou', ghType: 'solar',
    brief: '兰州高原风大且常有浮尘寡照，设计一座抗 20m/s 大风、寡照下有效透光率仍 ≥70% 的日光温室。',
    hint: '风是主要矛盾：重型桁架拱＋加密拱距＋锚固基础；采光选高透光 PO 膜，并适当提高脊高增大屋面角。',
    weather: { snowDepth: 10, windSpeed: 20, rainfall: 0, overcast: 0.25, hail: false },
    season: 'winter',
    req: { maxWindUtil: 0.85, minLight: 0.7 },
  },
  {
    id: 'c-south', name: '关卡五 · 岭南盛夏', regionId: 'guangzhou', ghType: 'venlo',
    brief: '广州夏季台风＋暴雨（30m/s 风、150mm 雨），建一座抗风安全的文洛温室，夏季采光与通风兼顾，造价 ≤450 元/㎡。',
    hint: '华南雪压几乎为零，骨架按风控制；覆盖材料在透光、保温、造价间权衡，别忘了天沟排水。',
    weather: { snowDepth: 0, windSpeed: 30, rainfall: 150, overcast: 0.3, hail: false },
    season: 'summer', budgetPerSqm: 450,
    req: { maxWindUtil: 0.9, minLight: 0.6 },
  },
]

export const KNOWLEDGE: KnowledgeCard[] = [
  {
    id: 'k-snow', title: '基本雪压与雪荷载',
    formula: 'sₖ = 雪深 × 积雪密度 × g',
    body: '雪荷载是温室冬季最致命的可变荷载。基本雪压是空旷平坦地面50年一遇最大积雪自重（kN/m²）。东北可达0.7，华南几乎为零。屋面实际雪荷载还要乘以积雪分布系数：拱形、陡坡屋面不利于积雪停留，系数小于1；平屋面则接近1。湿雪密度可达新雪的2倍以上，一场“湿暴雪”远比重雪更危险。',
  },
  {
    id: 'k-wind', title: '风荷载：风速与风压',
    formula: 'w₀ = v² / 1600 （kN/m²）',
    body: '风压与风速平方成正比：10m/s 的风只有 0.06 kN/m²，而 34m/s 的台风可达 0.72 kN/m²，相差12倍！轻质温室屋面受风吸（上拔）控制，框架要验算抗弯，整体要验算抗倾覆与基础抗拔。台风区应采用桩基础＋锚固，并把天沟、门窗等薄弱部位锁牢。',
  },
  {
    id: 'k-arch', title: '拱形屋面的力学智慧',
    formula: '拱矢比 f/l 越大 → 积雪系数越小',
    body: '拱架把竖向荷载转化为沿拱轴的压力，矢跨比（拱高/弦长）越大，屋面越陡，积雪越容易滑落。但拱脚会产生向外的水平推力，需要更可靠的基础和纵拉杆来平衡。圆管截面各方向受力均匀，是拱架的理想截面；大跨度应采用桁架拱——用两根弦杆加腹杆，用很少的材料获得很大的抗弯能力。',
  },
  {
    id: 'k-light', title: '合理采光角与冬至设计',
    formula: '冬至正午太阳高度角 = 90° − 当地纬度 − 23.5°',
    body: '日光温室采光设计的控制日是冬至：北半球太阳最“低”的一天。屋面倾角与太阳高度角越匹配（入射角越小），透光越多。纬度越高，冬至太阳越低，屋面就要更“立”一些。PO膜初始透光率约92%，PE膜约87%，但流滴膜结露、灰尘都会让透光率打折扣，设计要留余量。',
  },
  {
    id: 'k-wall', title: '后墙蓄热：日光温室的“电池”',
    body: '日光温室夜间不靠加温而靠白天蓄热、夜间放热。夯土墙、砖墙热容量大，是免费蓄热体；苯板等外保温层则像“保温瓶”。理想做法是“蓄热＋保温”组合：白天蓄热体吸热，夜间保温层把热量锁在室内。严寒地区墙体过薄，再贵的膜也救不了夜温。',
  },
  {
    id: 'k-cover', title: '覆盖材料：透光、保温、寿命的三角',
    body: '薄膜便宜、透光好但寿命短（PE 1-2年、PO 3-5年），需要算整个寿命期的更换成本；玻璃透光稳定、寿命20年以上，但单玻保温差、造价高；PC中空板和双层中空玻璃保温好，适合严寒与连阴寡照地区。选择时把“初次造价÷寿命”摊成年成本再比较。',
  },
  {
    id: 'k-venlo', title: '文洛型温室：工业化温室的构造',
    body: '文洛（Venlo）型是连栋玻璃温室的经典形式：每跨屋面为对称双坡，屋脊高、天沟低，雨水顺坡汇入铝合金天沟排出。主体为热镀锌轻钢柱＋桁架屋架，网格模数化（常用跨度8-9.6m、开间4-4.5m、檐高4-6.5m）。它的优势是空间大、环境控制精确，适合现代工厂化生产；缺点是造价高、冬季加温能耗大。',
  },
  {
    id: 'k-check', title: '结构验算的基本逻辑',
    formula: '1.4 × 荷载效应 ≤ 构件抗力',
    body: '设计的基本思路：先算“作用”（雪、风、自重等荷载产生的内力），再算“抗力”（构件和基础能承受多少），最后比较。荷载分项系数1.4是留给不确定性的安全储备。本模拟器用简化的梁模型估算拱架弯矩：M = qL²/8，再与骨架容许弯矩对比——真实工程还要验算稳定、长细比、连接节点，但定性规律完全一致。',
  },
]

export const SEASONS: { id: 'winter' | 'spring' | 'summer' | 'autumn'; name: string; decl: number }[] = [
  { id: 'winter', name: '冬至', decl: -23.4 },
  { id: 'spring', name: '春分', decl: 0 },
  { id: 'summer', name: '夏至', decl: 23.4 },
  { id: 'autumn', name: '秋分', decl: 0 },
]

export const GH_TYPE_NAMES: Record<string, string> = { solar: '日光温室', venlo: '文洛型玻璃温室' }
