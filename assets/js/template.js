// Takt case form (양식): an Excel-friendly CSV with [sections].
// Users analyse a real company, fill this form, upload it to the Free Lab, and run it as written.
import { AUTOMATION, DEFAULT_ECON, DEFAULT_RISK, KINDS } from './engine.js?v=202611200100';

/* ---------- CSV primitives ---------- */
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === '\t') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map(r => r.map(x => x.trim()));
}
const cellOut = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCSV = rows => '﻿' + rows.map(r => r.map(cellOut).join(',')).join('\r\n');

/** Decode an uploaded file: UTF-8 first, then CP949/EUC-KR (Excel "CSV (쉼표로 분리)" on Korean Windows). */
export async function readFileText(file) {
  const buf = await file.arrayBuffer();
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch { return new TextDecoder('euc-kr').decode(buf); }
}

/* ---------- vocabularies ---------- */
const norm = k => String(k || '').replace(/\(.*?\)/g, '').replace(/[\s·_\-/]/g, '').toLowerCase();
const CASE_KEYS = { 회사: 'company', 산업: 'industry', 과제명: 'title', 태그: 'tags', 상황: 'situation', 미션: 'mission', 목표: 'mission', 제약: 'constraints', 제약조건: 'constraints', 수요: 'demand', 교대시간: 'shiftHours', 투자예산: 'budget', 예산: 'budget' };
const ECON_KEYS = { 공헌이익: 'margin', 인건비: 'labor', 불량유출클레임: 'claim', 클레임: 'claim', 폐기손실: 'scrap', 미납페널티: 'shortage', 연간교대수: 'shiftsPerYear', iot구축비: 'iotBase', iot설비당: 'iotPerMachine', iot사전감지율: 'iotPredict', iot수리시간비율: 'iotRepair', 전력단가: 'energyPrice' };
const SIM_KEYS = { 반복횟수: ['sim', 'reps'], 난수시드: ['sim', 'seed'], 품종교체: ['risk', 'changeovers'], 램프업기간: ['risk', 'rampWeeks'], 램프업초기효율: ['risk', 'rampStart'],
  si비용배수: ['risk', 'capexMult'], 순간정지배수: ['risk', 'microMult'], 수리시간배수: ['risk', 'mttrMult'], 로봇사이클배수: ['risk', 'speedMult'], 로봇고장간격배수: ['risk', 'mtbfMult'], 셋업시간배수: ['risk', 'setupMult'] };
export const PROFILE_ROWS = [['사이클 배수', 'cycle'], ['불량 배수', 'defect'], ['인력 비율', 'ops'], ['투자비(원/대)', 'capex'], ['운영비(원/h)', 'opex'], ['MTBF(h)', 'mtbf'], ['MTTR(min)', 'mttr'],
  ['순간정지 간격(분)', 'microEvery'], ['순간정지 시간(초)', 'microSec'], ['셋업(분)', 'setupMin'], ['검출률(%)', 'detect']];
export const PROFILE_COLS = [['협동로봇', 'cobot'], ['산업용로봇', 'industrial'], ['자동로딩셀', 'loadcell'], ['AI비전검사', 'aivision']];
const KIND_IN = { 수작업: 'manual', manual: 'manual', 작업자: 'manual', 설비: 'machine', machine: 'machine', 기계: 'machine', 검사: 'inspect', inspect: 'inspect' };
const KIND_OUT = { manual: '수작업', machine: '설비', inspect: '검사' };
const AUTO_IN = { '': null, 없음: null, 표준: null, none: null, 협동로봇: 'cobot', cobot: 'cobot', 산업용로봇: 'industrial', 산업용: 'industrial', industrial: 'industrial', 자동로딩셀: 'loadcell', loadcell: 'loadcell', ai비전검사: 'aivision', ai비전: 'aivision', aivision: 'aivision' };
const AUTO_OUT = { cobot: '협동로봇', industrial: '산업용로봇', loadcell: '자동로딩셀', aivision: 'AI비전검사' };
const num = v => { if (v == null || v === '') return NaN; return parseFloat(String(v).replace(/[,원%\s]/g, '')); };

/* ---------- export: case -> form ---------- */
export function caseToRows(C, scenarios = [], { guide = true } = {}) {
  const E = { ...DEFAULT_ECON, ...(C.econ || {}) }, R = { ...DEFAULT_RISK, ...(C.risk || {}) }, sim = { reps: 300, seed: 1000, ...(C.sim || {}) };
  const P = {}; for (const k in AUTOMATION) P[k] = { ...AUTOMATION[k], ...((C.automation || {})[k] || {}) };
  const g = t => guide ? [['※ ' + t]] : [];
  const rows = [
    ['TAKT 시뮬레이션 양식 v1'],
    ...g('실제 사례를 분석해 값을 채운 뒤 Takt › 자유 시뮬레이션에 업로드하세요. [대괄호] 섹션 이름과 열 순서는 바꾸지 마세요. ※로 시작하는 행은 무시됩니다.'),
    [],
    ['[케이스]'], ['항목', '값'],
    ['회사', C.company], ['산업', C.industry], ['과제명', C.title], ['태그', (C.tags || []).join('; ')],
    ['상황', C.situation], ['미션', C.mission], ['제약', C.constraints],
    ['수요(개/교대)', C.demand], ['교대시간(h)', C.shiftHours], ['투자예산(원)', C.budget],
    [],
    ['[경제성]'], ['항목', '값'],
    ['공헌이익(원/개)', E.margin], ['인건비(원/인·h)', E.labor], ['불량유출 클레임(원/건)', E.claim], ['폐기손실(원/개)', E.scrap], ['미납페널티(원/개)', E.shortage],
    ['연간교대수', E.shiftsPerYear], ['IoT 구축비(원)', E.iotBase], ['IoT 설비당(원)', E.iotPerMachine], ['IoT 사전감지율(%)', E.iotPredict * 100], ['IoT 수리시간비율', E.iotRepair], ['전력단가(원/kWh)', E.energyPrice],
    [],
    ['[공정]'],
    ...g('유형: 수작업 / 설비 / 검사. 변동계수 = 사이클 표준편차 ÷ 평균. MTBF·MTTR은 고장이 있는 설비만 입력. 검출률은 검사 공정만.'),
    ['공정명', '유형', '대수', '사이클(s)', '변동계수', '불량률(%)', '버퍼', 'MTBF(h)', 'MTTR(min)', '검출률(%)'],
    ...C.stations.map(s => [s.name, KIND_OUT[s.kind], s.n, s.cycle, s.cv, +(s.defect * 100).toFixed(4), s.buf, s.mtbf ?? '', s.mttr ?? '', s.kind === 'inspect' ? +((s.detect || 0) * 100).toFixed(2) : '']),
    [],
    ['[시뮬레이션 조건]'], ['항목', '값'],
    ['반복횟수', sim.reps], ['난수시드', sim.seed], ['품종교체(회/교대)', R.changeovers], ['램프업기간(주)', R.rampWeeks], ['램프업초기효율', R.rampStart],
    ['SI비용배수', R.capexMult], ['순간정지배수', R.microMult], ['수리시간배수', R.mttrMult], ['로봇사이클배수', R.speedMult], ['로봇고장간격배수', R.mtbfMult], ['셋업시간배수', R.setupMult],
    [],
    ['[자동화 프로필]'],
    ...g('업체 견적·사양서 값으로 덮어쓰세요. 빈칸은 기본값을 씁니다.'),
    ['항목', ...PROFILE_COLS.map(c => c[0])],
    ...PROFILE_ROWS.map(([label, key]) => [label, ...PROFILE_COLS.map(([, a]) => { const v = P[a][key]; return v == null ? '' : key === 'detect' ? v * 100 : v; })]),
    [],
    ['[시나리오]'],
    ...g('같은 시나리오명의 행은 하나의 시나리오로 합쳐집니다. 대수·버퍼 빈칸은 표준값. 자동화: 없음 / 협동로봇 / 산업용로봇 / 자동로딩셀(설비) / AI비전검사(검사). IoT: 예/아니오.'),
    ['시나리오명', '공정명', '대수', '자동화', '버퍼', 'IoT'],
    ...scenarios.flatMap(sc => {
      const out = [];
      sc.levers.stations.forEach((l, i) => {
        const b = C.stations[i];
        if (l.n !== b.n || l.auto || l.buf !== b.buf) out.push([sc.name, b.name, l.n, l.auto ? AUTO_OUT[l.auto] : '없음', l.buf, sc.levers.iot ? '예' : '아니오']);
      });
      if (!out.length && sc.levers.iot) out.push([sc.name, C.stations[0].name, '', '없음', '', '예']);
      return out;
    }),
  ];
  return rows;
}

/* ---------- import: form -> case ---------- */
export function rowsToCase(rows) {
  const errors = [], warnings = [];
  const C = { id: 'custom-' + Date.now().toString(36), source: 'custom', company: '', industry: '', title: '', tags: [], situation: '', mission: '', constraints: '',
    demand: NaN, shiftHours: 8, budget: 5e8, econ: {}, risk: {}, sim: {}, automation: {}, stations: [] };
  const scenMap = new Map();
  let sec = null, header = null;
  rows.forEach((r, li) => {
    const line = li + 1;
    if (!r.length || r.every(x => !x)) return;
    if (/^※|^\/\//.test(r[0])) return;
    const m = r[0].match(/^\[(.+)\]$/);
    if (m) { sec = norm(m[1]); header = null; return; }
    if (!sec) return;
    const kv = () => { const key = norm(r[0]); return key === '항목' ? null : [key, r[1]]; };
    if (sec === '케이스') {
      const p = kv(); if (!p) return; const f = CASE_KEYS[p[0]]; if (!f) { warnings.push(`${line}행: 알 수 없는 케이스 항목 '${r[0]}'`); return; }
      if (f === 'tags') C.tags = String(p[1] || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
      else if (['demand', 'shiftHours', 'budget'].includes(f)) C[f] = num(p[1]);
      else C[f] = p[1] || '';
    } else if (sec === '경제성') {
      const p = kv(); if (!p) return; const f = ECON_KEYS[p[0]]; if (!f) { warnings.push(`${line}행: 알 수 없는 경제성 항목 '${r[0]}'`); return; }
      let v = num(p[1]); if (!isFinite(v)) return; if (f === 'iotPredict' && v > 1) v /= 100; C.econ[f] = v;
    } else if (sec === '공정') {
      if (!header) { if (!isFinite(num(r[2]))) { header = r; return; } header = []; }
      const kind = KIND_IN[norm(r[1])];
      if (!r[0]) return;
      if (!kind) { errors.push(`${line}행: 공정 '${r[0]}'의 유형 '${r[1]}'을 알 수 없습니다 (수작업/설비/검사)`); return; }
      const s = { name: r[0], kind, n: Math.max(1, Math.round(num(r[2]) || 1)), cycle: num(r[3]), cv: isFinite(num(r[4])) ? num(r[4]) : 0.2,
        defect: (isFinite(num(r[5])) ? num(r[5]) : 0) / 100, buf: Math.max(1, Math.round(num(r[6]) || 5)) };
      if (!(s.cycle > 0)) errors.push(`${line}행: 공정 '${s.name}'의 사이클 타임이 없습니다`);
      if (s.cv > 1.5) warnings.push(`${line}행: '${s.name}' 변동계수 ${s.cv}는 비정상적으로 큽니다 (보통 0.03~0.5)`);
      if (isFinite(num(r[7]))) { s.mtbf = num(r[7]); s.mttr = isFinite(num(r[8])) ? num(r[8]) : 20; }
      if (kind === 'inspect') { s.detect = (isFinite(num(r[9])) ? num(r[9]) : 85) / 100; s.defect = 0; }
      if (C.stations.some(x => x.name === s.name)) errors.push(`${line}행: 공정명 '${s.name}'이 중복됩니다`);
      C.stations.push(s);
    } else if (sec === '시뮬레이션조건') {
      const p = kv(); if (!p) return; const f = SIM_KEYS[p[0]]; if (!f) { warnings.push(`${line}행: 알 수 없는 조건 '${r[0]}'`); return; }
      const v = num(p[1]); if (!isFinite(v)) return; C[f[0]][f[1]] = v;
    } else if (sec === '자동화프로필') {
      if (!header) { header = r.map(norm); return; }
      const rowDef = PROFILE_ROWS.find(([label]) => norm(label) === norm(r[0]));
      if (!rowDef) { warnings.push(`${line}행: 알 수 없는 프로필 항목 '${r[0]}'`); return; }
      header.forEach((h, j) => {
        if (j === 0) return; const col = PROFILE_COLS.find(([l]) => norm(l) === h); if (!col) return;
        let v = num(r[j]); if (!isFinite(v)) return; if (rowDef[1] === 'detect' && v > 1) v /= 100;
        (C.automation[col[1]] = C.automation[col[1]] || {})[rowDef[1]] = v;
      });
    } else if (sec === '시나리오') {
      if (!header) { if (norm(r[0]) === '시나리오명') { header = r; return; } header = []; }
      if (!r[0]) return;
      if (!scenMap.has(r[0])) scenMap.set(r[0], { rows: [], line });
      scenMap.get(r[0]).rows.push({ r, line });
    }
  });
  // validation
  if (!C.stations.length) errors.push('[공정] 섹션에 공정이 하나도 없습니다');
  if (!(C.demand > 0)) errors.push('[케이스] 수요(개/교대)를 입력하세요');
  if (!(C.shiftHours > 0)) errors.push('[케이스] 교대시간(h)을 입력하세요');
  if (!C.company) warnings.push('회사명이 비어 있어 "내 사례"로 표시됩니다');
  if (!C.title) C.title = '자유 시뮬레이션';
  if (!C.company) C.company = '내 사례';
  if (C.sim.reps > 3000) { warnings.push('반복횟수는 최대 3,000회로 제한됩니다'); C.sim.reps = 3000; }
  // scenarios
  const scenarios = [];
  for (const [name, { rows: rs }] of scenMap) {
    const lv = { iot: false, stations: C.stations.map(s => ({ n: s.n, auto: null, buf: s.buf })) };
    let ok = true;
    rs.forEach(({ r, line }) => {
      const i = C.stations.findIndex(s => s.name === r[1]);
      if (r[5] && /^(예|y|yes|o|true|1)$/i.test(r[5])) lv.iot = true;
      if (!r[1]) return;
      if (i < 0) { errors.push(`${line}행: 시나리오 '${name}'의 공정 '${r[1]}'이 [공정]에 없습니다`); ok = false; return; }
      const st = lv.stations[i], s = C.stations[i];
      if (isFinite(num(r[2]))) st.n = Math.max(1, Math.round(num(r[2])));
      if (isFinite(num(r[4]))) st.buf = Math.max(1, Math.round(num(r[4])));
      const a = AUTO_IN[norm(r[3])];
      if (a === undefined) { errors.push(`${line}행: 자동화 '${r[3]}'을 알 수 없습니다`); ok = false; return; }
      if (a && AUTOMATION[a].kind !== s.kind) { errors.push(`${line}행: '${AUTO_OUT[a]}'는 ${KINDS[AUTOMATION[a].kind].label} 공정용인데 '${s.name}'은 ${KINDS[s.kind].label} 공정입니다`); ok = false; return; }
      st.auto = a;
    });
    if (ok) scenarios.push({ id: Math.random().toString(36).slice(2, 8), name, levers: lv });
  }
  if (!scenarios.length && !errors.length) warnings.push('[시나리오]가 없어 표준 라인만 실행합니다');
  return { case: C, scenarios, errors, warnings };
}
