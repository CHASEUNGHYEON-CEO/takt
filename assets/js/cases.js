// Preset case library. All presets are fictional teaching cases built on typical industry figures.
// Users add their own company problems through the Case Editor (stored in localStorage).

const S = (name, kind, n, cycle, cv, defect, buf, extra = {}) => ({ name, kind, n, cycle, cv, defect, buf, ...extra });

export const PRESETS = [
  {
    id: 'auto-parts-delay', source: 'preset',
    company: 'A사', industry: '자동차부품', title: '주문 30% 증가로 인한 납기 지연',
    tags: ['납기', '병목', '협동로봇'],
    situation: '완성차 고객사 주문이 교대당 420개로 늘었지만 라인은 약 350개만 생산해 매주 납기 지연 페널티가 발생하고 있다.',
    mission: '교대당 420개 이상을 안정적으로 생산하면서 투자 회수기간 24개월 이내의 대안을 제안하라.',
    constraints: '투자 예산 5억 원. 추가 채용은 2명까지 가능.',
    demand: 420, shiftHours: 8, budget: 5e8,
    econ: { margin: 30000 },
    stations: [
      S('소재 투입', 'manual', 1, 45, 0.20, 0.002, 6),
      S('CNC 가공', 'machine', 2, 105, 0.08, 0.010, 6, { mtbf: 3, mttr: 25 }),
      S('조립', 'manual', 2, 150, 0.30, 0.030, 6),
      S('품질 검사', 'inspect', 1, 50, 0.20, 0, 6, { detect: 0.80 }),
      S('포장·출하', 'manual', 1, 40, 0.20, 0.002, 6),
    ],
  },
  {
    id: 'machining-breakdown', source: 'preset',
    company: 'B사', industry: '정밀가공', title: '노후 설비의 잦은 고장',
    tags: ['가용률', 'IoT', '예지보전'],
    situation: '노후 CNC가 평균 72분마다 멈추고 수리에 45분이 걸린다. 생산 계획을 지키지 못해 고객 신뢰가 떨어지고 있다.',
    mission: '교대당 400개를 달성하라. 설비 추가 구매(대당 2.5억)와 IoT 예지보전 중 무엇이 경제적인가?',
    constraints: '투자 예산 4억 원.',
    demand: 400, shiftHours: 8, budget: 4e8,
    econ: { margin: 35000 },
    stations: [
      S('소재 투입', 'manual', 1, 40, 0.20, 0.002, 5),
      S('CNC 가공', 'machine', 2, 90, 0.08, 0.010, 5, { mtbf: 1.2, mttr: 45 }),
      S('연마', 'machine', 1, 55, 0.10, 0.010, 5, { mtbf: 5, mttr: 20 }),
      S('품질 검사', 'inspect', 1, 50, 0.20, 0, 5, { detect: 0.85 }),
      S('포장·출하', 'manual', 1, 45, 0.20, 0.002, 5),
    ],
  },
  {
    id: 'food-quality', source: 'preset',
    company: 'C사', industry: '식품포장', title: '품질 클레임 급증',
    tags: ['품질', 'AI 비전', '원인공정'],
    situation: '수작업 실링 공정 불량률이 4%로 높고, 육안 검사는 불량의 75%만 잡아낸다. 유통사 클레임(건당 30만 원)이 급증했다.',
    mission: '불량 유출을 교대당 2건 이하로 줄이면서 생산량 850개를 유지하라. 원인 공정 개선과 검사 강화 중 무엇이 나은가?',
    constraints: '투자 예산 3억 원.',
    demand: 850, shiftHours: 8, budget: 3e8,
    econ: { margin: 8000 },
    stations: [
      S('계량', 'manual', 1, 25, 0.20, 0.005, 8),
      S('충전', 'machine', 1, 28, 0.05, 0.005, 8, { mtbf: 4, mttr: 15 }),
      S('실링', 'manual', 2, 55, 0.30, 0.040, 8),
      S('품질 검사', 'inspect', 1, 30, 0.25, 0, 8, { detect: 0.75 }),
      S('포장', 'manual', 1, 28, 0.20, 0.002, 8),
    ],
  },
  {
    id: 'ecommerce-fulfillment', source: 'preset',
    company: 'D사', industry: '이커머스 물류', title: '프로모션 시즌 출고 적체',
    tags: ['물류', '피킹', '변동성'],
    situation: '대형 프로모션 기간 주문이 교대당 1,500건까지 늘지만 피킹·검수 구간의 처리 편차가 커서 당일 출고율이 떨어진다.',
    mission: '교대당 1,500건 당일 출고를 달성하라. 피킹 인력 증원과 자동화(AMR 피킹 보조) 중 무엇이 나은가?',
    constraints: '투자 예산 6억 원. 단기 인력 증원은 3명까지.',
    demand: 1500, shiftHours: 8, budget: 6e8,
    econ: { margin: 4000, claim: 30000, shortage: 3000, scrap: 2000 },
    stations: [
      S('주문 할당', 'manual', 1, 12, 0.15, 0.001, 15),
      S('피킹', 'manual', 4, 85, 0.45, 0.010, 15),
      S('검수', 'inspect', 2, 32, 0.30, 0, 15, { detect: 0.85 }),
      S('포장', 'manual', 2, 30, 0.25, 0.003, 15),
      S('분류·출고', 'machine', 1, 15, 0.05, 0.001, 15, { mtbf: 6, mttr: 20 }),
    ],
  },
  {
    id: 'battery-module', source: 'preset',
    company: 'E사', industry: '배터리 모듈', title: '신규 라인 램프업 지연',
    tags: ['램프업', '용접', '복합 문제'],
    situation: '신규 모듈 라인이 목표 생산의 75% 수준에 머물러 있다. 레이저 용접기 고장과 수작업 체결 불량이 동시에 발생한다.',
    mission: '교대당 300모듈을 달성하고 불량 유출을 1건 이하로 낮춰라. 여러 수단을 조합해야 할 수 있다.',
    constraints: '투자 예산 8억 원.',
    demand: 300, shiftHours: 8, budget: 8e8,
    econ: { margin: 120000, claim: 2000000, scrap: 150000 },
    stations: [
      S('셀 적층', 'machine', 1, 80, 0.05, 0.004, 4, { mtbf: 6, mttr: 20 }),
      S('레이저 용접', 'machine', 1, 88, 0.06, 0.012, 4, { mtbf: 1.8, mttr: 35 }),
      S('버스바 체결', 'manual', 2, 170, 0.30, 0.025, 4),
      S('절연·EOL 검사', 'inspect', 1, 75, 0.15, 0, 4, { detect: 0.88 }),
      S('출하', 'manual', 1, 60, 0.20, 0.001, 4),
    ],
  },
];

const KEY = 'takt.cases.v1';
export function loadCustom() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
export function saveCustom(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }
export function allCases() { return [...PRESETS, ...loadCustom()]; }

export function blankCase() {
  return {
    id: 'custom-' + Date.now().toString(36), source: 'custom',
    company: '', industry: '', title: '', tags: [],
    situation: '', mission: '', constraints: '',
    demand: 400, shiftHours: 8, budget: 5e8,
    econ: { margin: 30000 },
    stations: [
      S('공정 1', 'manual', 1, 60, 0.20, 0.005, 5),
      S('공정 2', 'machine', 1, 60, 0.08, 0.005, 5, { mtbf: 4, mttr: 20 }),
      S('검사', 'inspect', 1, 40, 0.20, 0, 5, { detect: 0.85 }),
    ],
  };
}
