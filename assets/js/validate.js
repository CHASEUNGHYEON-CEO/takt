// Model verification & validation suite (Sargent-style V&V).
// Each test compares the simulator against a closed-form result from queueing / reliability / quality theory,
// or checks an internal property (determinism, convergence, variance reduction).
import { buildConfig, createSim, summarize, stats } from './engine.js?v=202611230651';

const S = (name, kind, n, cycle, cv, defect, buf, x = {}) => ({ name, kind, n, cycle, cv, defect, buf, ...x });
const mk = (stations, h = 8, demand = 400) => ({ id: 'validation', company: '검증', title: '검증', demand, shiftHours: h, budget: 0, econ: {}, risk: { changeovers: 0 }, stations, sim: { seed: 1000 } });
const lv = c => ({ iot: false, stations: c.stations.map(s => ({ n: s.n, auto: null, buf: s.buf })) });
const NO_SETUP = { changeovers: 0 };
const relErr = (sim, exp) => Math.abs(sim - exp) / Math.abs(exp);

export const TESTS = [
  { id: 'T1', group: '이론 검증', name: '단일 공정 처리율',
    what: '고장이 없는 수작업 공정 1개(사이클 60초, 변동계수 0.2)의 8시간 산출량',
    theory: '산출 = 대수 × T / 평균 사이클 = 1 × 28,800 / 60 = 480개', tol: 0.01, reps: 200,
    async run(R) { const c = mk([S('A', 'manual', 1, 60, 0.2, 0, 5)]); const r = (await R([{ key: 'x', levers: lv(c), risk: NO_SETUP }], this.reps, this.name, 0, c)).x;
      return { expected: 480, sim: r.good.mean, ci: r.good.ci95, unit: '개' }; } },
  { id: 'T2', group: '이론 검증', name: '병렬 서버 처리율',
    what: '같은 작업자 3명이 병렬로 일하는 공정(사이클 90초)',
    theory: '산출 = 3 × 28,800 / 90 = 960개', tol: 0.01, reps: 200,
    async run(R) { const c = mk([S('A', 'manual', 3, 90, 0.2, 0, 5)]); const r = (await R([{ key: 'x', levers: lv(c), risk: NO_SETUP }], this.reps, this.name, 0, c)).x;
      return { expected: 960, sim: r.good.mean, ci: r.good.ci95, unit: '개' }; } },
  { id: 'T3', group: '이론 검증', name: '설비 가용률 (MTBF·MTTR)',
    what: '평균 2시간마다 고장, 수리 30분인 설비 1대 (80시간 관측)',
    theory: '가용률 A = MTBF / (MTBF + MTTR) = 120 / 150 = 0.8 → 산출 = 80h × 60개/h × 0.8 = 3,840개', tol: 0.02, reps: 60,
    async run(R) { const c = mk([S('A', 'machine', 1, 60, 0.05, 0, 5, { mtbf: 2, mttr: 30 })], 80); const r = (await R([{ key: 'x', levers: lv(c), risk: NO_SETUP }], this.reps, this.name, 0, c)).x;
      return { expected: 3840, sim: r.good.mean, ci: r.good.ci95, unit: '개' }; } },
  { id: 'T4', group: '이론 검증', name: '병목 법칙 (제약이론)',
    what: '사이클 40 / 60 / 45초인 3공정 직렬 라인, 버퍼 20 (40시간)',
    theory: '라인 처리율 = 병목 공정 처리율 = 40h × 3,600 / 60 = 2,400개', tol: 0.02, reps: 60,
    async run(R) { const c = mk([S('A', 'manual', 1, 40, 0.1, 0, 20), S('B', 'manual', 1, 60, 0.1, 0, 20), S('C', 'manual', 1, 45, 0.1, 0, 20)], 40);
      const r = (await R([{ key: 'x', levers: lv(c), risk: NO_SETUP }], this.reps, this.name, 0, c)).x;
      return { expected: 2400, sim: r.good.mean, ci: r.good.ci95, unit: '개' }; } },
  { id: 'T5', group: '이론 검증', name: '불량 유출률 (검사 검출력)',
    what: '불량률 5% 공정 뒤에 검출률 80% 검사 (40시간)',
    theory: '유출 비율 = d(1−p) / (1 − d·p) = 0.05×0.2 / 0.96 = 1.042%', tol: 0.08, reps: 150,
    async run(R) { const c = mk([S('A', 'manual', 1, 30, 0.1, 0.05, 20), S('I', 'inspect', 1, 10, 0.1, 0, 20, { detect: 0.8 })], 40);
      const r = (await R([{ key: 'x', levers: lv(c), risk: NO_SETUP }], this.reps, this.name, 0, c)).x;
      return { expected: 0.05 * 0.2 / (1 - 0.04) * 100, sim: r.escaped.mean / (r.good.mean + r.escaped.mean) * 100, unit: '%' }; } },
  { id: 'T6', group: '이론 검증', name: 'Little의 법칙',
    what: '열린 케이스의 표준 라인을 80시간 운전 (교대 경계 효과 제거)',
    theory: '평균 재공 WIP = 처리율 TH × 평균 리드타임 LT', tol: 0.03, reps: 20,
    async run(R, C) { const c = { ...C, shiftHours: 80, id: 'validation-little' }; const r = (await R([{ key: 'x', levers: lv(c), risk: { ...(C.risk || {}) } }], this.reps, this.name, 0, c)).x;
      const th = (r.good.mean + r.escaped.mean + r.scrap.mean) / (80 * 60);
      return { expected: th * r.lt.mean, sim: r.wip.mean, unit: '개', note: `TH ${th.toFixed(3)}개/분 × LT ${r.lt.mean.toFixed(1)}분` }; } },
  { id: 'T7', group: '구현 검증', name: '재현성 (난수 시드)',
    what: '같은 시드로 두 번 실행',
    theory: '동일 입력 + 동일 시드 → 결과가 완전히 같아야 함', tol: 0, reps: 2,
    async run(R, C) { const cfg = buildConfig({ ...C, shiftHours: 2 }, lv(C)); const a = JSON.stringify(summarize(createSim(cfg, 42).runToEnd())), b = JSON.stringify(summarize(createSim(cfg, 42).runToEnd()));
      return { expected: 0, sim: a === b ? 0 : 1, unit: '차이', exact: true, note: a === b ? '두 실행 결과 일치' : '결과 불일치' }; } },
  { id: 'T8', group: '통계 검증', name: '반복 수렴 (1/√n)',
    what: '표준 라인 400회 반복에서 신뢰구간 폭이 반복 수에 따라 줄어드는지',
    theory: '95% 신뢰구간 반폭 ∝ 1/√n → 반복 4배마다 폭이 1/2', tol: 0.25, reps: 400,
    async run(R, C) { const r = (await R([{ key: 'x', levers: lv(C), risk: { ...(C.risk || {}) } }], this.reps, this.name, 0, C)).x;
      const ci = n => stats(r.goodDist.slice(0, n)).ci95, c25 = ci(25), c100 = ci(100), c400 = ci(400);
      const ratio = (c25 / c100 + c100 / c400) / 2;
      return { expected: 2, sim: ratio, unit: '배', note: `CI ±${c25.toFixed(1)} (25회) → ±${c100.toFixed(1)} (100회) → ±${c400.toFixed(1)} (400회)`, curve: [[25, c25], [50, ci(50)], [100, c100], [200, ci(200)], [400, c400]] }; } },
  { id: 'T9', group: '통계 검증', name: '공통 난수(CRN) 분산 감소',
    what: '표준 vs 대안(첫 수작업 공정 +1명) 차이의 분산: 같은 시드 vs 독립 시드',
    theory: 'CRN을 쓰면 비교 차이의 분산이 독립 실행보다 작아야 함', tol: 0, reps: 200,
    async run(R, C) { const base = lv(C), alt = lv(C); const i = Math.max(0, C.stations.findIndex(s => s.kind === 'manual')); alt.stations[i].n += 1;
      const risk = { ...(C.risk || {}) };
      const a = await R([{ key: 'b', levers: base, risk }, { key: 'd', levers: alt, risk }], this.reps, this.name + ' (CRN)', 0, C);
      const b = await R([{ key: 'd', levers: alt, risk }], this.reps, this.name + ' (독립)', 500000, C);
      const v = xs => stats(xs).sd ** 2;
      const crn = v(a.d.goodDist.map((x, k) => x - a.b.goodDist[k])), ind = v(b.d.goodDist.map((x, k) => x - a.b.goodDist[k]));
      return { expected: ind, sim: crn, unit: '분산', exact: true, pass: crn < ind, note: `차이 분산 ${crn.toFixed(1)} (CRN) vs ${ind.toFixed(1)} (독립) → ${((1 - crn / ind) * 100).toFixed(0)}% 감소` }; } },
];

export async function runSuite(R, C, onEach) {
  const results = [];
  for (const t of TESTS) {
    let r;
    try { r = await t.run(R, C); } catch { return null; } // a cancelled run returns null → property access throws
    if (!r) return null;
    const err = r.exact ? (r.pass !== undefined ? (r.pass ? 0 : 1) : r.sim) : relErr(r.sim, r.expected);
    const pass = r.pass !== undefined ? r.pass : r.exact ? r.sim === r.expected : err <= t.tol;
    results.push({ ...t, ...r, err, pass });
    onEach && onEach(results);
  }
  return results;
}
