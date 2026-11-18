// Takt simulation engine — pure functions shared by the UI thread and Web Workers.
// Discrete-time (1 s) flow line: stations in series, finite buffers, blocking-after-service,
// operation-dependent failures, robot micro-stops, changeovers, defects + inspection.

export const KINDS = {
  manual:  { label: '수작업', setupMin: 5,  serverCapex: 30e6, kwRun: 0.3, kwIdle: 0.1 },
  machine: { label: '설비',   setupMin: 10, serverCapex: 250e6, kwRun: 15, kwIdle: 4 },
  inspect: { label: '검사',   setupMin: 5,  serverCapex: 30e6, kwRun: 0.5, kwIdle: 0.2 },
};

// Automation options per station kind. Robot profiles carry both the benefit and the risk side.
export const AUTOMATION = {
  cobot:      { kind: 'manual',  label: '협동로봇',         short: 'COBOT',
                cycle: 0.90, cv: 0.05, defect: 0.30, ops: 0.25, capex: 150e6, opex: 4000,
                mtbf: 6, mttr: 25, microEvery: 40, microSec: 90, setupMin: 15, robot: true, kwRun: 0.6, kwIdle: 0.2 },
  industrial: { kind: 'manual',  label: '산업용 로봇(펜스)', short: 'IND',
                cycle: 0.60, cv: 0.03, defect: 0.25, ops: 0.15, capex: 300e6, opex: 7000,
                mtbf: 9, mttr: 40, microEvery: 60, microSec: 75, setupMin: 30, robot: true, kwRun: 6, kwIdle: 1.5 },
  loadcell:   { kind: 'machine', label: '자동 로딩 셀',     short: 'CELL',
                cycle: 0.90, cv: 0.05, defect: 1.00, ops: 0.30, capex: 120e6, opex: 4000,
                microEvery: 90, microSec: 60, setupMin: 12, robot: true, kwRun: 2, kwIdle: 0.6 },
  aivision:   { kind: 'inspect', label: 'AI 비전검사',      short: 'AI',
                cycle: 0.60, cv: 0.05, defect: 1.00, ops: 0.25, capex: 80e6, opex: 3000,
                detect: 0.98, setupMin: 5, robot: false, kwRun: 1.2, kwIdle: 0.5 },
};
export const autoOptionsFor = kind => Object.entries(AUTOMATION).filter(([, a]) => a.kind === kind);

export const DEFAULT_ECON = {
  margin: 30000, labor: 35000, iotOpex: 3000, iotBase: 30e6, iotPerMachine: 5e6,
  iotPredict: 0.7, iotRepair: 0.3, shortage: 10000, claim: 300000, scrap: 20000, shiftsPerYear: 500,
  energyPrice: 170,     // 산업용 전력 단가 가정 (원/kWh) — EMS 지표용
 
};

// Risk knobs for robot deployment. Multipliers are relative to the vendor-nominal profile.
export const DEFAULT_RISK = {
  changeovers: 2,      // 품종 교체 횟수 / 교대
  microMult: 1,        // 순간정지 빈도 배수
  mtbfMult: 1,         // 로봇 고장 간격 배수
  mttrMult: 1,         // 로봇 수리시간 배수 (정비 숙련도)
  setupMult: 1,        // 로봇 체인지오버 시간 배수
  speedMult: 1,        // 로봇 사이클 배수 (안전 속도제한 등)
  capexMult: 1.0,      // SI 비용 초과 배수
  rampWeeks: 8,        // 램프업 기간
  rampStart: 0.6,      // 가동 첫 주 효율
  ideal: false,        // 이론상 로봇 (정지 없음) — 손실 분해용
  ramp: false,         // 램프업 기간 평균 성능으로 평가
};

const H = 3600, M = 60;

/** Automation profiles with per-case overrides (caseDef.automation = {cobot:{mtbf:4,...}}). */
export function profiles(caseDef) {
  const o = (caseDef && caseDef.automation) || {}, out = {};
  for (const k in AUTOMATION) out[k] = { ...AUTOMATION[k], ...(o[k] || {}) };
  return out;
}

export function effectiveStation(s, risk = DEFAULT_RISK, P = AUTOMATION) {
  const k = KINDS[s.kind] || KINDS.manual;
  const a = s.auto && P[s.auto] && P[s.auto].kind === s.kind ? P[s.auto] : null;
  let cycle = +s.cycle, cv = +s.cv, defect = +s.defect || 0, detect = +s.detect || 0, ops = 1, opex = 0;
  let mtbf = s.mtbf ? s.mtbf * H : Infinity, mttr = s.mttr ? s.mttr * M : 0;
  let microMean = Infinity, microSec = 0, setup = k.setupMin * M;
  if (a) {
    cycle *= a.cycle; cv = Math.min(cv, a.cv); defect *= a.defect; ops = a.ops; opex = a.opex;
    if (a.detect) detect = a.detect;
    setup = a.setupMin * M;
    if (a.robot) {
      cycle *= risk.speedMult;
      if (a.mtbf) { mtbf = a.mtbf * H * risk.mtbfMult; mttr = a.mttr * M * risk.mttrMult; }
      else if (isFinite(mtbf)) { mtbf *= risk.mtbfMult; mttr *= risk.mttrMult; }
      if (a.microEvery) { microMean = a.microEvery * M / risk.microMult; microSec = a.microSec; }
      setup *= risk.setupMult;
      if (risk.ramp) { cycle /= (risk.rampStart + 1) / 2; microMean /= 2; }
      if (risk.ideal) { mtbf = Infinity; microMean = Infinity; setup = k.setupMin * M; }
    }
  }
  const kwRun = (k.kwRun || 0) + (a ? a.kwRun || 0 : 0), kwIdle = (k.kwIdle || 0) + (a ? a.kwIdle || 0 : 0);
  return { kwRun, kwIdle, name: s.name, kind: s.kind, auto: a ? s.auto : null, autoLabel: a ? a.label : null, robot: !!(a && a.robot),
           n: Math.max(1, s.n | 0), buf: Math.max(1, s.buf | 0),
           cycle: Math.max(1, cycle), cv, defect, detect, mtbf, mttr, microMean, microSec, setup, ops, opex };
}

export function buildConfig(caseDef, levers = {}, riskOverride = {}) {
  const st = levers.stations || [];
  return {
    shiftSec: caseDef.shiftHours * H,
    demand: caseDef.demand,
    iot: !!levers.iot,
    econ: { ...DEFAULT_ECON, ...caseDef.econ },
    risk: { ...DEFAULT_RISK, ...(caseDef.risk || {}), ...riskOverride },
    auto: profiles(caseDef),
    stations: caseDef.stations.map((s, i) => ({ ...s, ...(st[i] || {}) })),
  };
}

export function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function createSim(cfg, seed, { trace = false } = {}) {
  const rng = mulberry32(seed);
  const gauss = () => { const u = rng() || 1e-9, v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const expo = m => isFinite(m) ? -Math.log(1 - rng()) * m : Infinity;
  const S = cfg.stations.map(raw => {
    const p = effectiveStation(raw, cfg.risk, cfg.auto);
    p.q = []; p.cnt = { busy: 0, blocked: 0, down: 0, idle: 0, minor: 0, fail: 0, pm: 0, setup: 0, micro: 0 }; p.proc = 0; p.defm = 0;
    p.servers = Array.from({ length: p.n }, () => ({ st: 'idle', rem: 0, item: null, ttf: expo(p.mtbf), tm: expo(p.microMean), down: 0, dk: '' }));
    return p;
  });
  const E = cfg.econ, T = cfg.shiftSec;
  const coTimes = new Set(Array.from({ length: cfg.risk.changeovers | 0 }, (_, j) => Math.round(T * (j + 1) / ((cfg.risk.changeovers | 0) + 1))));
  const sim = { t: 0, cfg, S, started: 0, done: 0, good: 0, escaped: 0, scrap: 0, ltSum: 0, wipSum: 0,
                failures: 0, predicted: 0, micro: 0, series: trace ? [{ t: 0, good: 0, wip: 0 }] : null };
  const last = S.length - 1;
  const cycleOf = s => Math.max(s.cycle * 0.3, s.cycle * (1 + s.cv * gauss()));

  function tryPush(i, v) {
    const item = v.item;
    if (i === last) {
      sim.done++; sim.ltSum += sim.t - item.t0;
      if (item.d) sim.escaped++; else sim.good++;
    } else {
      const nx = S[i + 1];
      if (nx.q.length >= nx.buf) { v.st = 'blocked'; return; }
      nx.q.push(item);
    }
    v.item = null; v.st = 'idle';
  }
  /** Start the next item. carry ≥ 0: time left in this second after a completion; carry < 0: fresh start (whole second worked). */
  function pull(i, s, v, carry) {
    let item = null;
    if (i === 0) { item = { t0: sim.t + (carry > 0 ? 1 - carry : 0), d: false }; sim.started++; }
    else if (s.q.length) item = s.q.shift();
    if (!item) return false;
    v.item = item; v.st = 'busy';
    v.rem = cycleOf(s) - (carry >= 0 ? carry : 1);
    return true;
  }
  function finish(i, v) {
    const s = S[i], item = v.item;
    s.proc++;
    if (!item.d && rng() < s.defect) { item.d = true; s.defm++; }
    if (s.kind === 'inspect' && item.d && rng() < s.detect) { sim.scrap++; v.item = null; v.st = 'idle'; return; }
    tryPush(i, v);
  }
  sim.step = function () {
    if (coTimes.has(sim.t)) {
      for (const s of S) for (const v of s.servers) if (v.st === 'busy' || v.st === 'idle') { v.st = 'down'; v.dk = 'setup'; v.down = s.setup; }
    }
    for (let i = last; i >= 0; i--) {
      const s = S[i];
      for (const v of s.servers) {
        if (v.st === 'down') {
          if (v.dk === 'setup' || v.dk === 'micro') s.cnt.minor++; else s.cnt.down++;
          s.cnt[v.dk === 'pm' ? 'pm' : v.dk === 'setup' ? 'setup' : v.dk === 'micro' ? 'micro' : 'fail']++;
          if (--v.down <= 0) { v.st = v.item ? 'busy' : 'idle'; v.dk = ''; }
          continue;
        }
        if (v.st === 'busy') {
          s.cnt.busy++; v.rem--; v.ttf--; v.tm--;
          if (v.ttf <= 0) {
            sim.failures++;
            let rep = expo(s.mttr); v.dk = 'fail';
            if (cfg.iot && rng() < E.iotPredict) { rep *= E.iotRepair; v.dk = 'pm'; sim.predicted++; }
            v.st = 'down'; v.down = Math.max(1, rep); v.ttf = expo(s.mtbf);
            continue;
          }
          if (v.tm <= 0) {
            sim.micro++; v.st = 'down'; v.dk = 'micro'; v.down = Math.max(1, expo(s.microSec)); v.tm = expo(s.microMean);
            continue;
          }
          if (v.rem <= 0) {
            // Item finished part-way through this second: hand the unused fraction to the next item
            // so cycles are not rounded up to whole seconds (validated against n·3600/c).
            const carry = -v.rem;
            finish(i, v);
            if (v.st === 'idle') pull(i, s, v, carry);
          }
          continue;
        }
        if (v.st === 'blocked') { s.cnt.blocked++; tryPush(i, v); continue; }
        if (pull(i, s, v, -1)) s.cnt.busy++; else s.cnt.idle++;
      }
    }
    sim.t++;
    const wip = sim.started - sim.done - sim.scrap;
    sim.wipSum += wip;
    if (trace && sim.t % 60 === 0) sim.series.push({ t: sim.t, good: sim.good, wip });
  };
  sim.runToEnd = function () { while (sim.t < T) sim.step(); return sim; };
  return sim;
}

// state order: busy, blocked, down(fail/pm), idle(starved), minor(micro-stop/changeover)
export const STATE_KEYS = ['busy', 'blocked', 'down', 'idle', 'minor'];

export function summarize(sim) {
  const T = Math.max(1, sim.t);
  const sx = sim.S.map(s => ({ proc: s.proc, defm: s.defm, busy: s.cnt.busy, blocked: s.cnt.blocked, idle: s.cnt.idle, fail: s.cnt.fail, pm: s.cnt.pm, setup: s.cnt.setup, micro: s.cnt.micro,
    kwh: (s.cnt.busy * s.kwRun + (s.n * T - s.cnt.busy) * s.kwIdle) / 3600 }));
  return {
    good: sim.good, escaped: sim.escaped, scrap: sim.scrap, done: sim.done,
    lt: sim.done ? sim.ltSum / sim.done / 60 : 0,
    wip: sim.wipSum / T, failures: sim.failures, predicted: sim.predicted, micro: sim.micro,
    kwh: sx.reduce((a, x) => a + x.kwh, 0),
    st: sim.S.map(s => { const tot = s.n * T; return STATE_KEYS.map(k => s.cnt[k] / tot); }),
    sx,
  };
}

/** Station-level OEE (TPM): A × P × Q with the six-loss breakdown, from aggregated means. */
export function oee(cfg, agg) {
  const T = cfg.shiftSec;
  return agg.sx.map((x, i) => {
    const p = effectiveStation(cfg.stations[i], cfg.risk, cfg.auto), tot = p.n * T;
    const stops = x.fail + x.pm + x.setup, run = Math.max(1, tot - stops);
    const A = run / tot, P = Math.min(1, x.proc * p.cycle / run), Q = x.proc ? (x.proc - x.defm) / x.proc : 1;
    return { name: p.name, A, P, Q, oee: A * P * Q, ct: p.cycle / p.n, cycle: p.cycle, n: p.n, kwh: x.kwh,
      loss: { fail: (x.fail + x.pm) / tot, setup: x.setup / tot, micro: x.micro / tot, flow: (x.blocked + x.idle) / tot,
              speed: Math.max(0, x.busy - x.proc * p.cycle) / tot, defect: Math.min(x.busy, x.defm * p.cycle) / tot } };
  });
}
/** Line-level industrial metrics: line OEE, line balance ratio, value-added ratio, takt gap, energy per unit. */
export function lineMetrics(cfg, agg) {
  const st = oee(cfg, agg), T = cfg.shiftSec, takt = T / cfg.demand;
  const cts = st.map(s => s.ct), maxCt = Math.max(...cts);
  const good = agg.good.mean, out = good + agg.escaped.mean;
  return {
    stations: st, takt, maxCt,
    lineOEE: good * maxCt / T,
    lbr: cts.reduce((a, b) => a + b, 0) / (cts.length * maxCt),
    vaRatio: agg.lt.mean > 0 ? st.reduce((a, s) => a + s.cycle, 0) / (agg.lt.mean * 60) : 0,
    kwh: agg.kwh.mean, kwhPerUnit: out > 0 ? agg.kwh.mean / out : 0,
  };
}

// ---------- economics ----------
export function capex(cfg, caseDef) {
  const E = cfg.econ; let c = 0;
  cfg.stations.forEach((s, i) => {
    const k = KINDS[s.kind], base = caseDef.stations[i];
    c += Math.max(0, s.n - base.n) * (s.serverCapex ?? k.serverCapex);
    const a = s.auto && cfg.auto[s.auto];
    if (a && a.kind === s.kind) c += s.n * a.capex * (a.robot ? cfg.risk.capexMult : 1);
  });
  if (cfg.iot) c += E.iotBase + cfg.stations.filter(s => s.mtbf).reduce((a, s) => a + s.n, 0) * E.iotPerMachine;
  return c;
}
export function headcount(cfg) {
  return cfg.stations.reduce((a, raw) => { const p = effectiveStation(raw, cfg.risk, cfg.auto); return a + p.n * p.ops; }, 0);
}
/** Per-shift P&L breakdown from mean outcomes. */
export function pnl(cfg, m) {
  const E = cfg.econ, h = cfg.shiftSec / H;
  const shipped = m.good + m.escaped, sold = Math.min(shipped, cfg.demand), short = Math.max(0, cfg.demand - shipped);
  let labor = 0, opex = 0;
  cfg.stations.forEach(raw => { const p = effectiveStation(raw, cfg.risk, cfg.auto); labor += p.n * p.ops * E.labor * h; opex += p.n * p.opex * h; });
  if (cfg.iot) opex += E.iotOpex * h;
  const r = { revenue: sold * E.margin, shortage: short * E.shortage, claim: m.escaped * E.claim, scrap: m.scrap * E.scrap, labor, opex, energy: (m.kwh || 0) * (E.energyPrice || 0) };
  r.profit = r.revenue - r.shortage - r.claim - r.scrap - r.labor - r.opex - r.energy;
  return r;
}
export const shiftProfit = (cfg, r) => pnl(cfg, r).profit;

export function theoreticalCapacity(raw, risk, P = AUTOMATION) {
  const p = effectiveStation(raw, risk, P);
  const avail = isFinite(p.mtbf) ? p.mtbf / (p.mtbf + p.mttr) : 1;
  const microLoss = isFinite(p.microMean) ? p.microMean / (p.microMean + p.microSec) : 1;
  return p.n * 3600 / p.cycle * avail * microLoss;
}

// ---------- statistics ----------
export function stats(xs) {
  const n = xs.length, mean = xs.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const q = p => sorted[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  return { n, mean, sd, ci95: 1.96 * sd / Math.sqrt(n), min: sorted[0], p5: q(0.05), p50: q(0.5), p95: q(0.95), max: sorted[n - 1] };
}

export function aggregate(cfg, caseDef, runs) {
  const pick = k => runs.map(r => r[k]);
  const nS = runs[0].st.length;
  const st = Array.from({ length: nS }, (_, i) => STATE_KEYS.map((_, j) => runs.reduce((a, r) => a + r.st[i][j], 0) / runs.length));
  const agg = {
    reps: runs.length,
    good: stats(pick('good')), escaped: stats(pick('escaped')), scrap: stats(pick('scrap')),
    lt: stats(pick('lt')), wip: stats(pick('wip')), profit: stats(pick('profit')),
    failures: stats(pick('failures')), micro: stats(pick('micro')), kwh: stats(pick('kwh')),
    serviceLevel: runs.filter(r => r.good + r.escaped >= cfg.demand).length / runs.length,
    goodDist: pick('good'), escDist: pick('escaped'), ltDist: pick('lt'), wipDist: pick('wip'),
    st, capex: capex(cfg, caseDef), headcount: headcount(cfg),
    sx: Array.from({ length: nS }, (_, i) => {
      const o = {}; for (const k in runs[0].sx[i]) o[k] = runs.reduce((a, r) => a + r.sx[i][k], 0) / runs.length; return o;
    }),
  };
  agg.pnl = pnl(cfg, { good: agg.good.mean, escaped: agg.escaped.mean, scrap: agg.scrap.mean, kwh: agg.kwh.mean });
  return agg;
}

export function bottleneck(st) {
  let bi = 0, bv = -1; st.forEach((s, i) => { const v = s[0] + s[2] + s[4]; if (v > bv) { bv = v; bi = i; } }); return bi;
}
