import * as E from './engine.js?v=202611231110';
import { evaluate, cancelAll, poolSize } from './pool.js?v=202611231110';
import { PRESETS, loadCustom, saveCustom, allCases, blankCase } from './cases.js?v=202611231110';
import * as CH from './charts.js?v=202611231110';
import * as TPL from './template.js?v=202611231110';
import * as V from './validate.js?v=202611231110';
import * as SH from './share.js?v=202611231110';

/* ============================== utilities ============================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));

const ICON = {
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  line: '<rect x="2" y="9" width="5" height="6"/><rect x="9.5" y="9" width="5" height="6"/><rect x="17" y="9" width="5" height="6"/><path d="M7 12h2.5M14.5 12H17"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 4h6M2 13v3M22 13v3"/><path d="M9 13v1M15 13v1"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
  report: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', upload: '<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', copy: '<rect x="8" y="8" width="13" height="13" rx="1"/><path d="M16 8V4H3v13h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', check: '<path d="M4 12l5 5L20 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>', up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  down: '<path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7M8 21v-7h8v7"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>', arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>', arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.5-1.5a4 4 0 0 0-5-5z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.5"/>',
  badge: '<path d="M12 3l2.5 2 3.2-.3.9 3.1 2.7 1.8-1.2 3 1.2 3-2.7 1.8-.9 3.1-3.2-.3L12 21l-2.5-2-3.2.3-.9-3.1-2.7-1.8 1.2-3-1.2-3 2.7-1.8.9-3.1 3.2.3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>', swap: '<path d="M7 4l-4 4 4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${ICON[n] || ''}</svg>`;

const fmt = {
  won(v) { if (!isFinite(v)) return '—'; const a = Math.abs(v), s = v < 0 ? '−' : ''; if (a >= 1e8) return s + (a / 1e8).toFixed(a >= 1e10 ? 0 : 2) + '억'; if (a >= 1e4) return s + Math.round(a / 1e4).toLocaleString() + '만'; return s + Math.round(a).toLocaleString(); },
  n(v, d = 0) { return isFinite(v) ? v.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '−') : '—'; },
  pct(v, d = 0) { return isFinite(v) ? (v * 100).toFixed(d) + '%' : '—'; },
  sgn(v, f = x => fmt.n(x)) { if (!isFinite(v)) return '—'; return (v > 0 ? '+' : v < 0 ? '−' : '±') + f(Math.abs(v)); },
  mo(v) { return !isFinite(v) || v < 0 ? '회수 불가' : v >= 120 ? '120개월+' : v.toFixed(1) + '개월'; },
};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
function download(name, text, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
/** Content width of the current page in px, from layout tokens (charts are drawn 1:1 so text never shrinks). */
function pageW(split = true) {
  const v = k => parseFloat(css(k)) || 0, main = $('#main').clientWidth;
  const insp = split && innerWidth >= 1280 ? v('--insp-w') : 0;
  return Math.min(main - insp, split ? Infinity : v('--page-max')) - 2 * v('--page-x');
}
/** Inner width of a panel that takes `frac` of the row (panel padding 24px each side). */
const f75 = part => innerWidth >= 1680 ? part / 12 : 1;   // .grid75 stacks below 1680px
const chartW = (frac, split = true) => Math.max(300, Math.round((pageW(split) - (frac < 1 ? (parseFloat(css('--gap')) || 20) : 0)) * frac - 48));

/* ============================== state ============================== */
const S = {
  view: 'cases', C: null, levers: null, sel: 0,
  risk: { ...E.DEFAULT_RISK },
  live: null, liveWhich: 'design', playing: false, speed: 40,
  robot: null, robotReps: 100,
  expTab: 'mc', mc: null, mcReps: 300, mcSel: null, sweep: null, opt: null,
  sweepCfg: { target: 'n', st: 0, from: 1, to: 4, step: 1, kpi: 'gain', reps: 60 },
  optCfg: { n: true, auto: true, iot: true, budget: true, maxEval: 400 },
  editing: null, busy: false,
};
const SKEY = 'takt.session.v1';
function persist() { try { localStorage.setItem(SKEY, JSON.stringify({ caseId: S.C?.id, levers: S.levers, risk: S.risk, draft: S.C })); } catch {} }
const yr = C => ({ ...E.DEFAULT_ECON, ...C.econ }).shiftsPerYear;
const repOpts = (list, cur) => [...new Set([...list, cur])].filter(Boolean).sort((a, b) => a - b);
const scenKey = id => 'takt.scen.' + id;
const loadScen = () => { try { return JSON.parse(localStorage.getItem(scenKey(S.C.id))) || []; } catch { return []; } };
const saveScen = list => { try { localStorage.setItem(scenKey(S.C.id), JSON.stringify(list)); } catch {} };

const baseLevers = C => ({ iot: false, stations: C.stations.map(s => ({ n: s.n, auto: null, buf: s.buf })) });
const cfgOf = (lv, risk = S.risk) => E.buildConfig(S.C, lv, risk);
const hasRobot = lv => lv.stations.some(s => s.auto && E.AUTOMATION[s.auto]?.robot);
const spY = () => ({ ...E.DEFAULT_ECON, ...S.C.econ }).shiftsPerYear;

function describe(lv, C = S.C) {
  const p = [];
  lv.stations.forEach((s, i) => {
    const b = C.stations[i];
    if (s.auto) p.push(`${b.name} ${E.AUTOMATION[s.auto].label}${s.n > 1 ? ` ×${s.n}` : ''}`);
    if (s.n !== b.n) p.push(`${b.name} ${b.n}→${s.n}대`);
    if (s.buf !== b.buf) p.push(`${b.name} 버퍼 ${b.buf}→${s.buf}`);
    if (s.cycle != null && Math.abs(s.cycle - b.cycle) > 0.05) p.push(`${b.name} 작업 ${b.cycle}→${(+s.cycle).toFixed(1)}s`);
  });
  if (lv.iot) p.push('IoT 예지보전');
  return p.length ? p.join(' · ') : '표준 (변경 없음)';
}

/* ============================== run status ============================== */
let runT0 = 0;
function showRun(label, frac, done, total) {
  $('#runstat').hidden = false;
  const el = (performance.now() - runT0) / 1000;
  const eta = frac > 0.02 ? Math.max(0, el / frac - el) : NaN;
  $('#runLabel').innerHTML = `<span class="mono">${label} · ${fmt.n(done || 0)}/${fmt.n(total || 0)} sims${isFinite(eta) ? ` · ${eta.toFixed(0)}s 남음` : ''}</span>`;
  $('#runBar').style.width = (frac * 100).toFixed(1) + '%';
}
async function run(points, reps, label, seed0, caseDef = S.C, opts = {}) {
  if (S.busy) { toast('다른 실험이 실행 중입니다'); return null; }
  S.busy = true; runT0 = performance.now(); showRun(label, 0, 0, points.length * reps);
  // Seed mode: 'fixed' reuses the case seed (identical reruns); 'random' draws a new base seed per run.
  const random = S.seedMode === 'random' && !opts.fixed;
  const base = random ? 1 + Math.floor(Math.random() * 2e9) : (caseDef.sim?.seed ?? 1000);
  if (!opts.fixed) S.lastSeed = base;
  try {
    const res = await evaluate(caseDef, points, reps, (d, t) => showRun(label, d / t, d, t), seed0 != null ? base + seed0 : base);
    const secs = (performance.now() - runT0) / 1000;
    toast(`${fmt.n(points.length * reps)}회 시뮬레이션 완료 · ${secs.toFixed(1)}초`);
    return Object.assign(Object.fromEntries(res), { _meta: { sims: points.length * reps, secs, seed: base, random } });
  } catch (e) {
    if (e && e.message !== 'cancelled') { console.error(e); toast('실행 오류: ' + (e.message || e)); }
    return null;
  } finally { S.busy = false; $('#runstat').hidden = true; }
}
$('#runCancel').onclick = () => { cancelAll(); toast('실행을 취소했습니다'); };

/* ============================== seed mode ============================== */
S.seedMode = 'fixed'; S.lastSeed = null;
function seedTag(meta) {
  if (!meta || meta.seed == null) return '';
  return meta.random
    ? `<button class="tag acc" data-pin-seed="${meta.seed}" title="이 시드를 케이스에 고정하면 같은 결과를 언제든 재현합니다">시드 ${meta.seed} · 무작위 · 고정하기</button>`
    : `<span class="tag" title="고정 시드 — 다시 실행해도 같은 결과">시드 ${meta.seed} · 고정</span>`;
}
function renderSeedSeg() {
  $$('#seedSeg button').forEach(b => b.classList.toggle('on', b.dataset.m === S.seedMode));
}
function setSeedMode(m, quiet) {
  S.seedMode = m; try { localStorage.setItem('takt.seedMode', m); } catch {}
  renderSeedSeg();
  if (!quiet) toast(m === 'random' ? '이제 실행할 때마다 새 난수 시드를 씁니다 (결과에 사용한 시드가 표시됩니다)' : `고정 시드 ${S.C?.sim?.seed ?? 1000}로 돌아왔습니다 — 다시 실행해도 같은 결과`);
}
$('#seedSeg').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b && b.dataset.m !== S.seedMode) { setSeedMode(b.dataset.m); if (S.view === 'line') resetLive(); } });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pin-seed]'); if (!b || !S.C) return;
  const seed = +b.dataset.pinSeed;
  S.C.sim = { ...(S.C.sim || {}), seed }; persist();
  setSeedMode('fixed', true);
  toast(`시드 ${seed}를 케이스에 고정했습니다 — 다시 실행하면 이 결과가 그대로 재현됩니다`);
  b.outerHTML = `<span class="tag" title="케이스에 고정된 시드">시드 ${seed} · 고정됨</span>`;
});

/* ============================== shell ============================== */
const NAV = [
  ['cases', 'folder', '케이스'], ['free', 'sheet', '자유 시뮬레이션'], ['line', 'line', '라인 모델'], ['cond', 'sliders', '시뮬레이션 조건'],
  ['robot', 'bot', '로봇 영향 분석'], ['decide', 'swap', '대안·반전 조건'], ['ops', 'gauge', 'OEE·라인 지표'], ['exp', 'flask', '실험'], ['report', 'report', '시나리오·보고서'], ['valid', 'badge', '모델 검증'],
];
const NO_CASE_OK = ['cases', 'free', 'valid'];
function renderNav() {
  $$('#nav a').forEach(a => {
    const entry = NAV.find(n => n[0] === a.dataset.view); if (!entry) { a.hidden = true; return; }
    const [v, icon, label] = entry;
    a.innerHTML = `${ic(icon)}<span>${label}</span>`; a.title = label;
    a.classList.toggle('on', S.view === v || (v === 'cases' && S.view === 'editor'));
    a.style.opacity = !S.C && !NO_CASE_OK.includes(v) ? .4 : 1;
  });
  $('#navFoot').innerHTML = `병렬 워커 ${poolSize}개<br>1초 단위 흐름라인 모델<br>교육·연구용 · 무료`;
  $('#crumb').innerHTML = S.C ? `<span>케이스</span><span class="tx3">/</span><b>${esc(S.C.company)} · ${esc(S.C.title)}</b>` : '<span>케이스 라이브러리</span>';
  const sb = $('#shareBtn'); sb.hidden = !S.C; if (S.C) sb.innerHTML = ic('share') + '공유';
}
$('#nav').addEventListener('click', e => {
  const a = e.target.closest('a[data-view]'); if (!a) return;
  if (!S.C && !NO_CASE_OK.includes(a.dataset.view)) { toast('먼저 케이스를 열거나 자유 시뮬레이션에서 양식을 올리세요'); return; }
  setView(a.dataset.view);
});
function setView(v) {
  if (S.view === 'line' && v !== 'line') stopLive();
  S.view = v; location.hash = v;
  $$('.view').forEach(el => el.classList.toggle('on', el.id === 'v-' + v));
  renderNav();
  ({ cases: renderCases, editor: renderEditor, line: renderLine, robot: renderRobot, exp: renderExp, report: renderReport, free: renderFree, cond: renderCond, ops: renderOps, valid: renderValid, decide: renderDecide })[v]?.();
  $('#main').scrollTop = 0;
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('takt.theme.v2', t); } catch {}
  $('#themeBtn').innerHTML = ic(t === 'dark' ? 'sun' : 'moon');
  if (S.view === 'line') drawLive(true);
}
$('#themeBtn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

function openCase(id, levers, draft) {
  const C = draft && draft.id === id ? draft : allCases().find(c => c.id === id); if (!C) return false;
  S.C = clone(C); S.levers = levers && levers.stations?.length === C.stations.length ? levers : baseLevers(C);
  if (!levers) S.risk = { ...E.DEFAULT_RISK, ...(C.risk || {}) };
  if (C.sim?.reps) { S.mcReps = C.sim.reps; S.robotReps = Math.min(500, Math.max(50, Math.round(C.sim.reps / 3))); }
  S.sel = 0; S.robot = null; S.mc = null; S.sweep = null; S.opt = null; S.mcSel = null;
  S.sweepCfg.st = 0;
  persist(); resetLive();
  return true;
}

/* ============================== CASES ============================== */
function renderCases() {
  const list = allCases();
  $('#v-cases').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">케이스 라이브러리</div><h1>케이스</h1>
      <p>컨설팅 과제 단위로 라인을 모델링합니다. 프리셋은 산업별 전형적 수치로 만든 <b>교육용 가상 케이스</b>이며, 실제 기업 문제는 <b>새 케이스</b>로 직접 입력하거나 CSV로 붙여넣을 수 있습니다.</p></div>
      <div class="actions">
        <button class="btn" id="impBtn">${ic('upload')}JSON 가져오기</button>
        <button class="btn primary" id="newBtn">${ic('plus')}새 케이스</button>
      </div></div>
    <div class="panel"><div class="tbl-wrap"><table class="t">
      <thead><tr><th>케이스</th><th>산업</th><th>목표 /교대</th><th>Takt</th><th>공정</th><th>예산</th><th style="text-align:left">핵심 이슈</th><th>출처</th><th></th></tr></thead>
      <tbody>${list.map(c => `<tr data-id="${esc(c.id)}" style="cursor:pointer">
        <td class="txt"><b>${esc(c.company)}</b> <span class="tx2">${esc(c.title)}</span>${S.C?.id === c.id ? ' <span class="tag acc">열림</span>' : ''}</td>
        <td class="txt tx2">${esc(c.industry)}</td>
        <td>${fmt.n(c.demand)}</td>
        <td>${fmt.n(c.shiftHours * 3600 / c.demand, 1)}s</td>
        <td>${c.stations.length}</td>
        <td>${fmt.won(c.budget)}</td>
        <td class="txt" style="text-align:left">${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}</td>
        <td class="txt tx2" style="text-align:right">${c.source === 'custom' ? '내 케이스' : '프리셋'}</td>
        <td style="width:1%"><div class="actions" style="justify-content:flex-end;flex-wrap:nowrap">
          <button class="btn sm ghost" data-act="edit" title="${c.source === 'custom' ? '편집' : '복제해서 편집'}">${ic(c.source === 'custom' ? 'edit' : 'copy')}</button>
          <button class="btn sm ghost" data-act="export" title="JSON 내보내기">${ic('download')}</button>
          ${c.source === 'custom' ? `<button class="btn sm ghost" data-act="del" title="삭제">${ic('trash')}</button>` : ''}
          <button class="btn sm" data-act="open">열기 ${ic('arrow')}</button></div></td>
      </tr>`).join('')}</tbody></table></div></div>
    <div class="grid3" style="margin-top:var(--gap)">
      ${[['01', '문제 정의', '회사·산업, 문제 상황, 미션, 제약, 수요(교대당), 예산과 경제성 지표를 입력합니다.'],
         ['02', '라인 모델', '공정별 대수·사이클·변동계수·불량률·버퍼·MTBF/MTTR·검출률. 엑셀에서 표를 복사해 붙여넣을 수 있습니다.'],
         ['03', '표준 대비 실험', '현재 운영을 표준으로 고정하고, 로봇·IoT·AI 설계안을 수천 회 반복 실험해 차이를 설명합니다.']]
        .map(([n, h, p]) => `<div style="border-top:1px solid var(--line-strong);padding-top:10px"><div class="label">${n}</div><div style="font-weight:600;margin:4px 0">${h}</div><div class="tx2">${p}</div></div>`).join('')}
    </div></div>`;
  $('#newBtn').onclick = () => { S.editing = blankCase(); setView('editor'); };
  $('#impBtn').onclick = () => $('#fileIn').click();
  $('#v-cases tbody').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const c = allCases().find(x => x.id === tr.dataset.id);
    const act = e.target.closest('[data-act]')?.dataset.act || 'open';
    if (act === 'open') { openCase(c.id); setView('line'); }
    if (act === 'edit') { S.editing = c.source === 'custom' ? clone(c) : { ...clone(c), id: 'custom-' + Date.now().toString(36), source: 'custom', company: c.company + ' (사본)' }; setView('editor'); }
    if (act === 'export') download(`takt-case-${c.id}.json`, JSON.stringify(c, null, 2));
    if (act === 'del' && confirm(`'${c.company} ${c.title}' 케이스를 삭제할까요? 되돌릴 수 없습니다.`)) {
      saveCustom(loadCustom().filter(x => x.id !== c.id));
      if (S.C?.id === c.id) S.C = null;
      renderCases(); renderNav();
    }
  });
}
$('#fileIn').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  try {
    const c = JSON.parse(await f.text());
    if (!Array.isArray(c.stations) || !c.stations.length) throw new Error('stations 배열이 없습니다');
    c.id = 'custom-' + Date.now().toString(36); c.source = 'custom';
    saveCustom([...loadCustom(), c]); toast('케이스를 가져왔습니다'); renderCases();
  } catch (err) { toast('가져오기 실패: ' + err.message); }
};

/* ============================== EDITOR ============================== */
const KIND_OPTS = [['manual', '수작업'], ['machine', '설비'], ['inspect', '검사']];
function renderEditor() {
  const c = S.editing; if (!c) { setView('cases'); return; }
  const ec = { ...E.DEFAULT_ECON, ...c.econ };
  const f = (key, label, val, type = 'text', cls = '', hint = '') => `<div class="field ${cls}"><label>${label}</label><input data-k="${key}" type="${type}" value="${esc(val)}" ${type === 'number' ? 'step="any"' : ''}>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  const ta = (key, label, val, cls = 'w4', ph = '') => `<div class="field ${cls}"><label>${label}</label><textarea data-k="${key}" rows="3" placeholder="${ph}">${esc(val)}</textarea></div>`;
  $('#v-editor').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">케이스 편집</div><h1>${c.company ? esc(c.company + ' · ' + c.title) : '새 케이스'}</h1>
      <p>실제 기업에서 수집한 데이터(현장 관찰, MES, 공정 기록)를 입력하세요. 수치가 정확할수록 표준 대비 비교가 의미 있어집니다.</p></div>
      <div class="actions"><button class="btn ghost" id="edCancel">취소</button><button class="btn" id="edExport">${ic('download')}JSON</button><button class="btn" id="edSave">${ic('save')}저장</button><button class="btn primary" id="edSaveOpen">저장 후 열기 ${ic('arrow')}</button></div></div>

    <div class="panel"><div class="panel-h"><h3>문제 정의</h3><span class="sub">컨설팅 브리프</span></div><div class="panel-b"><div class="form">
      ${f('company', '회사', c.company, 'text', '', '실명 대신 A사처럼 익명화 권장')}${f('industry', '산업', c.industry)}${f('title', '과제명', c.title, 'text', 'w2')}
      ${ta('situation', '상황 (As-Is 문제)', c.situation, 'w4', '예: 주문이 늘었지만 조립 공정 처리량이 부족해 납기 지연이 반복된다')}
      ${ta('mission', '미션 / 목표', c.mission, 'w2')}${ta('constraints', '제약 조건', c.constraints, 'w2')}
      ${f('tags', '태그 (쉼표 구분)', (c.tags || []).join(', '), 'text', 'w2')}
    </div></div></div>

    <div class="panel" style="margin-top:var(--gap)"><div class="panel-h"><h3>목표 & 경제성</h3><span class="sub">연간 효과·회수기간 계산 기준</span></div><div class="panel-b"><div class="form">
      ${f('demand', '수요 (개/교대)', c.demand, 'number')}${f('shiftHours', '교대 시간 (h)', c.shiftHours, 'number')}
      ${f('budget', '투자 예산 (억원)', c.budget / 1e8, 'number')}${f('econ.shiftsPerYear', '연간 교대 수', ec.shiftsPerYear, 'number')}
      ${f('econ.margin', '단위당 공헌이익 (원)', ec.margin, 'number')}${f('econ.labor', '인건비 (원/인·h)', ec.labor, 'number')}
      ${f('econ.claim', '불량 유출 클레임 (원/건)', ec.claim, 'number')}${f('econ.scrap', '폐기 손실 (원/개)', ec.scrap, 'number')}
      ${f('econ.shortage', '미납 페널티 (원/개)', ec.shortage, 'number', '', '마진 손실 외 추가 페널티')}
      ${f('risk.changeovers', '품종 교체 (회/교대)', c.risk?.changeovers ?? E.DEFAULT_RISK.changeovers, 'number', '', '다품종일수록 로봇에 불리')}
    </div></div></div>

    <div class="panel" style="margin-top:var(--gap)"><div class="panel-h"><h3>공정 (Stations)</h3>
      <div class="actions"><button class="btn sm" id="edAdd">${ic('plus')}공정 추가</button></div></div>
      <div class="tbl-wrap"><table class="t" id="edTable"><thead><tr>
        <th>#</th><th style="text-align:left">공정명</th><th style="text-align:left">유형</th><th>대수</th><th>사이클 s</th><th>변동계수</th><th>불량률 %</th><th>버퍼</th><th>MTBF h</th><th>MTTR min</th><th>검출률 %</th><th></th>
      </tr></thead><tbody>${c.stations.map((s, i) => `<tr data-i="${i}">
        <td>${i + 1}</td>
        <td style="min-width:120px"><input data-f="name" value="${esc(s.name)}"></td>
        <td style="min-width:90px"><select data-f="kind">${KIND_OPTS.map(([v, l]) => `<option value="${v}" ${s.kind === v ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        <td style="width:64px"><input data-f="n" type="number" min="1" value="${s.n}"></td>
        <td style="width:80px"><input data-f="cycle" type="number" value="${s.cycle}"></td>
        <td style="width:74px"><input data-f="cv" type="number" step="0.01" value="${s.cv}"></td>
        <td style="width:74px"><input data-f="defect" type="number" step="0.1" value="${+(s.defect * 100).toFixed(3)}"></td>
        <td style="width:64px"><input data-f="buf" type="number" min="1" value="${s.buf}"></td>
        <td style="width:74px"><input data-f="mtbf" type="number" step="0.1" value="${s.mtbf ?? ''}" placeholder="—"></td>
        <td style="width:74px"><input data-f="mttr" type="number" value="${s.mttr ?? ''}" placeholder="—"></td>
        <td style="width:74px"><input data-f="detect" type="number" value="${s.kind === 'inspect' ? +((s.detect || 0) * 100).toFixed(1) : ''}" ${s.kind === 'inspect' ? '' : 'disabled placeholder="—"'}></td>
        <td style="width:1%;white-space:nowrap"><button class="btn sm ghost" data-m="up" title="위로">${ic('arrowUp')}</button><button class="btn sm ghost" data-m="down" title="아래로">${ic('arrowDown')}</button><button class="btn sm ghost" data-m="del" title="삭제">${ic('x')}</button></td>
      </tr>`).join('')}</tbody></table></div>
      <div class="panel-b" style="border-top:1px solid var(--line)">
        <div class="label" style="margin-bottom:6px">CSV / 엑셀 붙여넣기</div>
        <div class="tx2" style="margin-bottom:8px">열 순서: <span class="mono">공정명, 유형(수작업/설비/검사), 대수, 사이클s, 변동계수, 불량률%, 버퍼, MTBF h, MTTR min, 검출률%</span>. 머리글 행은 자동으로 건너뜁니다. 기존 공정을 대체합니다.</div>
        <textarea id="csvIn" rows="4" style="width:100%" placeholder="조립,수작업,2,150,0.3,3,6,,,&#10;CNC 가공,설비,2,105,0.08,1,6,3,25,"></textarea>
        <div class="actions" style="margin-top:8px"><button class="btn sm" id="csvApply">붙여넣기 적용</button></div>
      </div></div>
    <p class="tx3" style="margin-top:var(--gap)">용어 — <b>변동계수(CV)</b>: 사이클 타임 표준편차÷평균 (수작업 0.2~0.4, 자동 0.03~0.1). <b>MTBF</b>: 평균 고장 간격(가동시간 기준). <b>MTTR</b>: 평균 수리 시간. <b>검출률</b>: 검사 공정이 불량을 잡아내는 비율.</p>
  </div>`;

  const root = $('#v-editor');
  root.querySelectorAll('[data-k]').forEach(inp => inp.addEventListener('input', () => {
    const k = inp.dataset.k, v = inp.type === 'number' ? parseFloat(inp.value) : inp.value;
    if (k === 'tags') c.tags = inp.value.split(',').map(s => s.trim()).filter(Boolean);
    else if (k === 'budget') c.budget = (v || 0) * 1e8;
    else if (k.startsWith('econ.')) { c.econ = c.econ || {}; c.econ[k.slice(5)] = v; }
    else if (k.startsWith('risk.')) { c.risk = c.risk || {}; c.risk[k.slice(5)] = v; }
    else c[k] = v;
  }));
  const tb = $('#edTable tbody', root);
  tb.addEventListener('input', e => {
    const tr = e.target.closest('tr'), i = +tr.dataset.i, fld = e.target.dataset.f, s = c.stations[i];
    let v = e.target.value;
    if (fld === 'name' || fld === 'kind') s[fld] = v;
    else { v = parseFloat(v); if (fld === 'defect' || fld === 'detect') v = isFinite(v) ? v / 100 : 0; if ((fld === 'mtbf' || fld === 'mttr') && !isFinite(v)) { delete s[fld]; return; } s[fld] = isFinite(v) ? v : 0; }
    if (fld === 'kind') { if (v === 'inspect') { s.detect = s.detect || 0.85; s.defect = 0; } renderEditor(); }
  });
  tb.addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    const i = +b.closest('tr').dataset.i, L = c.stations;
    if (b.dataset.m === 'del') { if (L.length > 1) L.splice(i, 1); }
    if (b.dataset.m === 'up' && i > 0) [L[i - 1], L[i]] = [L[i], L[i - 1]];
    if (b.dataset.m === 'down' && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
    renderEditor();
  });
  $('#edAdd').onclick = () => { c.stations.push({ name: '공정 ' + (c.stations.length + 1), kind: 'manual', n: 1, cycle: 60, cv: 0.2, defect: 0.005, buf: 5 }); renderEditor(); };
  $('#csvApply').onclick = () => {
    const kindMap = { '수작업': 'manual', manual: 'manual', '설비': 'machine', machine: 'machine', '검사': 'inspect', inspect: 'inspect' };
    const rows = $('#csvIn').value.split(/\r?\n/).map(l => l.split(/\t|,/).map(x => x.trim())).filter(r => r.length >= 4 && r[0]);
    const st = rows.filter(r => isFinite(parseFloat(r[2]))).map(r => {
      const kind = kindMap[r[1]] || 'manual', num = (j, d) => { const v = parseFloat(r[j]); return isFinite(v) ? v : d; };
      const s = { name: r[0], kind, n: Math.max(1, num(2, 1) | 0), cycle: num(3, 60), cv: num(4, 0.2), defect: num(5, 0) / 100, buf: Math.max(1, num(6, 5) | 0) };
      if (isFinite(parseFloat(r[7]))) { s.mtbf = num(7); s.mttr = num(8, 20); }
      if (kind === 'inspect') { s.detect = num(9, 85) / 100; s.defect = 0; }
      return s;
    });
    if (!st.length) { toast('인식된 행이 없습니다. 열 순서를 확인하세요'); return; }
    c.stations = st; toast(`${st.length}개 공정을 불러왔습니다`); renderEditor();
  };
  const save = () => {
    if (!c.company || !c.title) { toast('회사와 과제명을 입력하세요'); return false; }
    if (!(c.demand > 0) || !(c.shiftHours > 0)) { toast('수요와 교대 시간은 0보다 커야 합니다'); return false; }
    if (c.stations.some(s => !(s.cycle > 0))) { toast('모든 공정의 사이클 타임을 입력하세요'); return false; }
    const list = loadCustom(), i = list.findIndex(x => x.id === c.id);
    if (i >= 0) list[i] = clone(c); else list.push(clone(c));
    saveCustom(list); toast('저장했습니다'); return true;
  };
  $('#edSave').onclick = () => { if (save()) setView('cases'); };
  $('#edSaveOpen').onclick = () => { if (save()) { openCase(c.id); setView('line'); } };
  $('#edCancel').onclick = () => setView('cases');
  $('#edExport').onclick = () => download(`takt-case-${c.id}.json`, JSON.stringify(c, null, 2));
}

/* ============================== LINE ============================== */
let liveRaf = 0, liveFrame = 0;
function resetLive() {
  if (!S.C) return;
  const lv = S.liveWhich === 'base' ? baseLevers(S.C) : S.levers;
  S.liveSeed = S.seedMode === 'random' ? 1 + Math.floor(Math.random() * 2e9) : 7;
  S.live = E.createSim(cfgOf(lv), S.liveSeed, { trace: true });
  stopLive(); if (S.view === 'line') drawLive(true);
}
function stopLive() { S.playing = false; cancelAnimationFrame(liveRaf); const b = $('#playBtn'); if (b) b.innerHTML = ic('play') + '시작'; }
function liveLoop() {
  if (!S.playing) return;
  const T = S.live.cfg.shiftSec;
  for (let k = 0; k < S.speed && S.live.t < T; k++) S.live.step();
  drawLive(++liveFrame % 6 === 0);
  if (S.live.t >= T) { stopLive(); $('#playBtn').innerHTML = ic('reset') + '다시 실행'; return; }
  liveRaf = requestAnimationFrame(liveLoop);
}

function renderLine() {
  const C = S.C, demandH = C.demand / C.shiftHours;
  $('#v-line').innerHTML = `<div class="split"><div class="page">
    <div class="page-head"><div><div class="label">라인 모델 ·${esc(C.industry)}</div><h1>${esc(C.company)} · ${esc(C.title)}</h1></div>
      <div class="actions"><button class="btn" data-go="robot">${ic('bot')}로봇 영향 분석</button><button class="btn" data-go="exp">${ic('flask')}실험</button></div></div>
    <div class="brief"><div><div class="label">상황</div><p>${esc(C.situation)}</p></div><div><div class="label">미션</div><p>${esc(C.mission)}</p></div><div><div class="label">제약</div><p>${esc(C.constraints)}</p></div></div>
    <div class="kpis" id="lineKpis" style="margin-top:var(--gap)"></div>
    <div class="panel" style="margin-top:var(--gap)">
      <div class="panel-h"><h3>생산 라인 · 1교대 실시간 <span class="sub">클릭하면 공정 선택</span></h3>
        <div class="actions">
          <div class="seg" id="liveWhich"><button data-w="base">표준</button><button data-w="design">현재 설계</button></div>
          <select id="speedSel" style="width:auto">${[[8, '×8'], [40, '×40'], [200, '×200'], [900, '×900']].map(([v, l]) => `<option value="${v}" ${S.speed == v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <button class="btn" id="liveReset">${ic('reset')}</button><button class="btn primary" id="playBtn">${ic('play')}시작</button>
        </div></div>
      <div class="panel-b"><div class="line-wrap"><canvas class="line" id="lineCv"></canvas></div>
        <div class="legend" style="margin-top:8px">${[['busy', '가공'], ['blocked', '막힘'], ['down', '고장'], ['pm', 'IoT 예지정비'], ['minor', '순간정지·체인지오버'], ['idle', '대기(일감 없음)']].map(([k, l]) => `<span><i class="dot" style="background:var(--st-${k})"></i>${l}</span>`).join('')}<span class="tx3" style="margin-left:auto" id="clock"></span></div></div>
      <div class="kpis flat" id="liveKpis" style="border-top:1px solid var(--line)"></div>
    </div>
    <div class="grid2" style="margin-top:var(--gap)">
      <div class="panel"><div class="panel-h"><h3>공정별 시간 구성</h3><span class="sub">가공+고장+정지 비중이 가장 큰 공정이 병목</span></div><div class="panel-b"><div class="sbars" id="liveBars"></div></div></div>
      <div class="panel"><div class="panel-h"><h3>누적 양품 vs 목표</h3><span class="sub" id="paceTxt"></span></div><div class="panel-b" id="liveChart"></div></div>
    </div>
  </div>
  <aside class="inspector" id="lineInsp"></aside></div>`;

  $$('#liveWhich button').forEach(b => { b.classList.toggle('on', b.dataset.w === S.liveWhich); b.onclick = () => { S.liveWhich = b.dataset.w; renderLine(); resetLive(); }; });
  $('#speedSel').onchange = e => S.speed = +e.target.value;
  $('#liveReset').onclick = resetLive;
  $('#playBtn').onclick = () => {
    if (S.live.t >= S.live.cfg.shiftSec) resetLive();
    S.playing = !S.playing; $('#playBtn').innerHTML = S.playing ? ic('pause') + '일시정지' : ic('play') + '시작';
    if (S.playing) liveRaf = requestAnimationFrame(liveLoop);
  };
  $$('[data-go]', $('#v-line')).forEach(b => b.onclick = () => setView(b.dataset.go));
  $('#lineCv').onclick = e => {
    const r = e.target.getBoundingClientRect(), x = e.clientX - r.left, n = S.C.stations.length;
    const geo = lineGeo(r.width, n); const i = Math.floor((x - geo.left) / (geo.bw + geo.gap));
    if (i >= 0 && i < n) { S.sel = i; renderInspector(); drawLive(false); }
  };
  renderLineKpis(); renderInspector(); drawLive(true);
}

function renderLineKpis() {
  const C = S.C, cfg = cfgOf(S.levers), base = cfgOf(baseLevers(C));
  const caps = cfg.stations.map(s => E.theoreticalCapacity(s, cfg.risk, cfg.auto)), minCap = Math.min(...caps), bi = caps.indexOf(minCap);
  const bcaps = base.stations.map(s => E.theoreticalCapacity(s, base.risk, base.auto)), bmin = Math.min(...bcaps);
  const cap = E.capex(cfg, C), hc = E.headcount(cfg), bhc = E.headcount(base);
  const takt = C.shiftHours * 3600 / C.demand;
  $('#lineKpis').innerHTML = [
    ['Takt time', fmt.n(takt, 1), 's/개', `수요 ${fmt.n(C.demand / C.shiftHours, 1)}개/h`],
    ['병목 이론능력', fmt.n(minCap, 1), '개/h', `${esc(cfg.stations[bi].name)} · 표준 ${fmt.n(bmin, 1)}`, minCap < C.demand / C.shiftHours ? 'neg' : 'pos'],
    ['투자비', fmt.won(cap), '원', `예산 ${fmt.won(C.budget)}`, cap > C.budget ? 'neg' : ''],
    ['투입 인력', fmt.n(hc, 2), '명/교대', `표준 대비 ${fmt.sgn(hc - bhc, x => fmt.n(x, 2))}`],
    ['설계 변경', String(describe(S.levers) === '표준 (변경 없음)' ? 0 : describe(S.levers).split(' · ').length), '건', esc(describe(S.levers))],
  ].map(([k, v, u, d, cls]) => `<div class="kpi"><div class="label">${k}</div><div class="v ${cls || ''}">${v}<small>${u}</small></div><div class="d" title="${d}">${d}</div></div>`).join('');
}

function renderInspector() {
  const C = S.C, cfg = cfgOf(S.levers), need = C.demand / C.shiftHours;
  const el = $('#lineInsp'); if (!el) return;
  const p = E.effectiveStation(cfg.stations[S.sel], cfg.risk, cfg.auto), raw = C.stations[S.sel];
  const a = p.auto ? E.AUTOMATION[p.auto] : null;
  el.innerHTML = `
    <div class="insp-sec"><div class="label"><span>설계 레버</span><button class="btn sm ghost" id="toStd">${ic('reset')}표준으로</button></div>
      <div class="tx3" style="font-size:12px">표준 = 현재 운영 상태. 레버를 바꾸면 '현재 설계'가 됩니다.</div></div>
    ${cfg.stations.map((s, i) => {
      const cap = E.theoreticalCapacity(s, cfg.risk, cfg.auto), lv = S.levers.stations[i], b = C.stations[i];
      const opts = E.autoOptionsFor(s.kind);
      return `<div class="st-row ${i === S.sel ? 'sel' : ''}" data-i="${i}">
        <div class="top"><span class="nm">${i + 1}. ${esc(s.name)} <span class="tx3" style="font-weight:400">${E.KINDS[s.kind].label}</span></span>
          <span class="cap ${cap < need ? 'short' : ''}" title="이론능력 = 대수×3600/사이클×가용률">${fmt.n(cap, 1)}/h</span></div>
        <div class="ctl">
          <span class="tx3">대수</span><span class="stepper"><button data-a="n-">−</button><span class="${lv.n !== b.n ? 'acc' : ''}">${lv.n}</span><button data-a="n+">+</button></span>
          <span class="tx3">버퍼</span><span class="stepper"><button data-a="b-">−</button><span class="${lv.buf !== b.buf ? 'acc' : ''}">${lv.buf}</span><button data-a="b+">+</button></span>
          <select data-a="auto"><option value="">${s.kind === 'inspect' ? '육안 검사 (표준)' : s.kind === 'machine' ? '수동 로딩 (표준)' : '작업자 (표준)'}</option>${opts.map(([k, o]) => `<option value="${k}" ${lv.auto === k ? 'selected' : ''}>${o.label}</option>`).join('')}</select>
        </div></div>`;
    }).join('')}
    <div class="insp-sec"><label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="iotChk" ${S.levers.iot ? 'checked' : ''}><b>IoT 예지보전</b></label>
      <div class="tx3" style="font-size:12px;margin-top:4px">고장의 70%를 사전 감지 → 수리시간 30%로 단축. 구축 ${fmt.won(E.DEFAULT_ECON.iotBase)} + 설비당 ${fmt.won(E.DEFAULT_ECON.iotPerMachine)}</div></div>
    <div class="insp-sec"><div class="label"><span>${esc(p.name)} 상세</span><span class="tag ${a ? 'acc' : ''}">${a ? a.label : '표준'}</span></div>
      <dl class="kv">
        <dt>유효 사이클</dt><dd>${fmt.n(p.cycle, 1)} s</dd>
        <dt>변동계수</dt><dd>${fmt.n(p.cv, 2)}</dd>
        ${p.kind !== 'inspect' ? `<dt>불량률</dt><dd>${fmt.pct(p.defect, 2)}</dd>` : `<dt>검출률</dt><dd>${fmt.pct(p.detect, 0)}</dd>`}
        <dt>MTBF / MTTR</dt><dd>${isFinite(p.mtbf) ? fmt.n(p.mtbf / 3600, 1) + 'h / ' + fmt.n(p.mttr / 60, 0) + 'm' : '—'}</dd>
        <dt>순간정지</dt><dd>${isFinite(p.microMean) ? `${fmt.n(p.microMean / 60, 0)}분마다 ${fmt.n(p.microSec, 0)}s` : '—'}</dd>
        <dt>체인지오버</dt><dd>${fmt.n(p.setup / 60, 0)}분 × ${cfg.risk.changeovers}회</dd>
        <dt>인력</dt><dd>${fmt.n(p.n * p.ops, 2)}명</dd>
        <dt>원 데이터</dt><dd>${raw.cycle}s · CV ${raw.cv}</dd>
      </dl></div>
    <div class="insp-sec"><div class="label"><span>시나리오로 저장</span></div>
      <div style="display:flex;gap:6px"><input id="scName" placeholder="시나리오 이름" style="flex:1"><button class="btn sm" id="scSave">${ic('save')}저장</button></div>
      <div class="tx3" style="font-size:12px;margin-top:6px">${esc(describe(S.levers))}</div></div>`;
  el.querySelectorAll('.st-row').forEach(row => {
    const i = +row.dataset.i, lv = S.levers.stations[i];
    row.addEventListener('click', e => {
      const act = e.target.closest('[data-a]')?.dataset.a;
      if (act === 'n+') lv.n = Math.min(8, lv.n + 1); else if (act === 'n-') lv.n = Math.max(1, lv.n - 1);
      else if (act === 'b+') lv.buf = Math.min(30, lv.buf + 1); else if (act === 'b-') lv.buf = Math.max(1, lv.buf - 1);
      else if (act === 'auto') return;
      S.sel = i; changed();
    });
    row.querySelector('select').addEventListener('change', e => { lv.auto = e.target.value || null; S.sel = i; changed(); });
  });
  $('#iotChk').onchange = e => { S.levers.iot = e.target.checked; changed(); };
  $('#toStd').onclick = () => { S.levers = baseLevers(C); changed(); };
  $('#scSave').onclick = () => {
    const name = $('#scName').value.trim() || describe(S.levers);
    const list = loadScen(); list.push({ id: Date.now().toString(36), name, levers: clone(S.levers) }); saveScen(list);
    toast(`시나리오 '${name}' 저장`); $('#scName').value = '';
  };
}
function changed() { persist(); S.robot = null; renderInspector(); renderLineKpis(); if (S.liveWhich === 'design') resetLive(); else drawLive(true); }

function lineGeo(W, n) { const left = 46, right = 64, gap = W < 900 ? 40 : 48; return { left, right, gap, bw: (W - left - right - gap * (n - 1)) / n }; }
function drawLive(full) {
  const cv = $('#lineCv'); if (!cv || !S.live) return;
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, Hh = Math.round(Math.min(240, Math.max(190, W * 0.18)));
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); cv.style.height = Hh + 'px'; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh);
  const L = S.live, St = L.S, n = St.length, g = lineGeo(W, n), top = 14, bh = Hh - 34;
  const r = E.summarize(L), bn = L.t > 900 ? E.bottleneck(r.st) : -1;
  const col = { busy: css('--st-busy'), blocked: css('--st-blocked'), fail: css('--st-down'), pm: css('--st-pm'), micro: css('--st-minor'), setup: css('--st-minor'), idle: css('--st-idle') };
  const tx = css('--tx'), tx2 = css('--tx2'), tx3 = css('--tx3'), acc = css('--accent'), neg = css('--neg'), s2 = css('--s2'), line = css('--line');
  const sans = '"Pretendard Variable", Pretendard, sans-serif';
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = tx3; ctx.font = `600 11px ${sans}`; ctx.textAlign = 'center';
  ctx.fillText('원자재', g.left / 2 - 2, top + bh / 2 - 2); ctx.font = `600 14px ${sans}`; ctx.fillText('∞', g.left / 2 - 2, top + bh / 2 + 16);
  St.forEach((s, i) => {
    const x = g.left + i * (g.bw + g.gap);
    if (i > 0) { // buffer stack
      const bx = x - g.gap / 2 - 9, cap = s.buf, shown = Math.min(cap, 10), slotH = Math.min(7, (bh - 44) / shown - 2);
      ctx.fillStyle = tx3; ctx.font = `600 11px ${sans}`; ctx.textAlign = 'center';
      ctx.fillText('버퍼', x - g.gap / 2, top + 14);
      ctx.fillStyle = tx; ctx.font = `700 12px ${sans}`; ctx.fillText(`${s.q.length}/${cap}`, x - g.gap / 2, top + 30);
      const filled = Math.round(s.q.length / cap * shown);
      for (let k = 0; k < shown; k++) { const y = top + bh - 10 - (k + 1) * (slotH + 2); ctx.fillStyle = k < filled ? tx3 : line; rr(bx, y, 18, slotH, 2); ctx.fill(); }
    }
    const sel = i === S.sel, isB = i === bn;
    ctx.fillStyle = s2; rr(x, top, g.bw, bh, 12); ctx.fill();
    if (isB || sel) { ctx.strokeStyle = isB ? neg : acc; ctx.lineWidth = 2; rr(x + 1, top + 1, g.bw - 2, bh - 2, 11); ctx.stroke(); }
    ctx.fillStyle = tx; ctx.font = `700 14px ${sans}`; ctx.textAlign = 'left';
    ctx.fillText(s.name, x + 14, top + 24, g.bw - 28);
    ctx.fillStyle = s.auto ? acc : tx3; ctx.font = `600 11.5px ${sans}`;
    ctx.fillText(s.auto ? E.AUTOMATION[s.auto].label : E.KINDS[s.kind].label, x + 14, top + 41, g.bw - 28);
    const sz = 14, per = Math.max(1, Math.floor((g.bw - 28) / 20));
    s.servers.forEach((v, k) => {
      const sx = x + 14 + (k % per) * 20, sy = top + 52 + Math.floor(k / per) * 20;
      ctx.fillStyle = v.st === 'down' ? (col[v.dk] || col.fail) : col[v.st];
      rr(sx, sy, sz, sz, 4); ctx.fill();
    });
    const u = r.st[i];
    ctx.fillStyle = tx3; ctx.font = `600 11px ${sans}`; ctx.fillText('가동률', x + 14, top + bh - 32);
    ctx.fillStyle = tx; ctx.font = `800 18px ${sans}`; ctx.fillText((u[0] * 100).toFixed(0) + '%', x + 14, top + bh - 12);
    if (g.bw >= 130) { ctx.fillStyle = tx3; ctx.font = `600 11.5px ${sans}`; ctx.textAlign = 'right'; ctx.fillText(`대기 ${s.q.length}`, x + g.bw - 14, top + bh - 13); }
    if (isB) { ctx.fillStyle = neg; rr(x + g.bw - 50, top + 10, 40, 22, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 11.5px ${sans}`; ctx.textAlign = 'center'; ctx.fillText('병목', x + g.bw - 30, top + 25); }
  });
  const ox = W - g.right + 14;
  ctx.textAlign = 'left'; ctx.fillStyle = tx3; ctx.font = `600 11px ${sans}`; ctx.fillText('출하', ox, top + bh / 2 - 18);
  ctx.fillStyle = tx; ctx.font = `800 22px ${sans}`; ctx.fillText(L.good, ox, top + bh / 2 + 6);
  ctx.fillStyle = tx3; ctx.font = `600 12px ${sans}`; ctx.fillText('/ ' + L.cfg.demand, ox, top + bh / 2 + 24);

  // live kpis
  const T = L.cfg.shiftSec, hrs = L.t / 3600, exp = L.cfg.demand * L.t / T, pace = exp > 0 ? L.good / exp : NaN;
  $('#clock').textContent = `T+${String(Math.floor(L.t / 3600)).padStart(2, '0')}:${String(Math.floor(L.t % 3600 / 60)).padStart(2, '0')} / ${L.cfg.shiftSec / 3600}h · ${S.liveWhich === 'base' ? '표준' : '현재 설계'} · 시드 ${S.liveSeed}`;
  $('#liveKpis').innerHTML = [
    ['양품', fmt.n(L.good), '개', `목표 ${L.cfg.demand}`],
    ['목표 대비 페이스', isFinite(pace) ? fmt.n(pace * 100, 0) : '—', '%', '', isFinite(pace) ? (pace >= 1 ? 'pos' : 'neg') : ''],
    ['처리율', hrs > 0 ? fmt.n(L.good / hrs, 1) : '—', '개/h', ''],
    ['리드타임', r.lt ? fmt.n(r.lt, 1) : '—', '분', ''],
    ['재공 WIP', fmt.n(r.wip, 1), '개', ''],
    ['고장 / 순간정지', `${L.failures}/${L.micro}`, '회', L.predicted ? `IoT 예측 ${L.predicted}` : ''],
    ['불량 유출', fmt.n(L.escaped), '건', `폐기 ${L.scrap}`, L.escaped ? 'neg' : ''],
  ].map(([k, v, u, d, cls]) => `<div class="kpi"><div class="label">${k}</div><div class="v ${cls || ''}">${v}<small>${u}</small></div><div class="d">${d || '&nbsp;'}</div></div>`).join('');
  $('#liveBars').innerHTML = stateBars(r.st, St.map(s => s.name), bn);
  if (full) {
    const pts = L.series.map(p => [p.t / 3600, p.good]);
    $('#liveChart').innerHTML = CH.lineChart({ W: chartW(.5), H: 220, xmin: 0, xmax: T / 3600, ymin: 0, ymax: Math.max(L.cfg.demand * 1.1, L.good),
      series: [{ label: '목표', color: 'var(--c-base)', dash: true, pts: [[0, 0], [T / 3600, L.cfg.demand]] }, { label: '양품', color: 'var(--accent)', pts }],
      xfmt: v => v + 'h', yfmt: v => fmt.n(v) });
    $('#paceTxt').textContent = isFinite(pace) ? (pace >= 1 ? '목표 페이스 이상' : `목표 대비 ${fmt.n((1 - pace) * 100, 0)}% 뒤처짐`) : '';
  }
}

function stateBars(st, names, bn = -1) {
  const keys = ['busy', 'blocked', 'down', 'minor', 'idle'], idx = [0, 1, 2, 4, 3];
  return st.map((s, i) => `<div class="sbar"><span class="nm">${i === bn ? `<span class="acc">●</span> ` : ''}${esc(names[i])}</span>
    <div class="bar" title="가공 ${fmt.pct(s[0])} · 막힘 ${fmt.pct(s[1])} · 고장 ${fmt.pct(s[2])} · 정지 ${fmt.pct(s[4])} · 대기 ${fmt.pct(s[3])}">${idx.map((j, k) => `<i style="width:${s[j] * 100}%;background:var(--st-${keys[k]})"></i>`).join('')}</div>
    <span class="v">${fmt.pct(s[0])}</span></div>`).join('');
}

/* ============================== ROBOT IMPACT ============================== */
function robotCapex(lv) {
  const P = E.profiles(S.C);
  return lv.stations.reduce((a, s) => { const o = s.auto && P[s.auto]; return a + (o && o.robot ? o.capex * s.n * S.risk.capexMult : 0); }, 0);
}
async function runRobot() {
  const R = S.risk, base = baseLevers(S.C), lv = clone(S.levers);
  const co2 = R.changeovers > 0 ? R.changeovers * 2 : 2;
  const pts = [
    ['base', base, R], ['nom', lv, R], ['ideal', lv, { ...R, ideal: true }], ['ramp', lv, { ...R, ramp: true }],
    ['s_micro', lv, { ...R, microMult: R.microMult * 2 }], ['s_mtbf', lv, { ...R, mtbfMult: R.mtbfMult * 0.5 }],
    ['s_mttr', lv, { ...R, mttrMult: R.mttrMult * 2 }], ['s_setup', lv, { ...R, setupMult: R.setupMult * 2 }],
    ['s_co', lv, { ...R, changeovers: co2 }], ['b_co', base, { ...R, changeovers: co2 }], ['s_speed', lv, { ...R, speedMult: R.speedMult * 1.15 }],
  ].map(([key, levers, risk]) => ({ key, levers, risk }));
  const res = await run(pts, S.robotReps, '로봇 영향 분석');
  if (!res) return;
  S.robot = { res, levers: lv, risk: { ...R }, reps: S.robotReps };
  renderRobot();
}

function robotModel() {
  const { res, levers, risk } = S.robot, Y = spY(), perWeek = Y / 50;
  const P = k => res[k].pnl;
  const gain = (k, b = 'base') => (P(k).profit - P(b).profit) * Y;
  const capex = res.nom.capex;
  const rampLoss = Math.max(0, P('nom').profit - P('ramp').profit) * risk.rampWeeks * perWeek;
  const pb = (g, cap = capex, rl = rampLoss) => g > 0 ? (cap + rl) / g * 12 : Infinity;
  const g0 = gain('nom'), pb0 = pb(g0);
  const b = P('base'), n = P('nom'), id = P('ideal');
  const bridge = {
    thru: ((id.revenue - id.shortage) - (b.revenue - b.shortage)) * Y,
    stop: ((n.revenue - n.shortage) - (id.revenue - id.shortage)) * Y,
    labor: (b.labor - n.labor) * Y,
    quality: ((b.claim + b.scrap) - (n.claim + n.scrap)) * Y,
    opex: (b.opex - n.opex) * Y,
    energy: (b.energy - n.energy) * Y,
  };
  const siCap = capex + robotCapex(levers) * 0.6;
  const stress = [
    ['순간정지 빈도 ×2', pb(gain('s_micro'))], ['로봇 고장 간격 ×½', pb(gain('s_mtbf'))],
    ['정비 미숙련 (수리 ×2)', pb(gain('s_mttr'))], ['로봇 셋업시간 ×2', pb(gain('s_setup'))],
    ['품종 교체 횟수 ×2', pb(gain('s_co', 'b_co'))], ['안전 속도제한 +15%', pb(gain('s_speed'))],
    ['SI·설치비 +60%', pb(g0, siCap)], ['램프업 기간 ×2', pb(g0, capex, rampLoss * 2)],
  ].map(([label, v]) => ({ label, pb: v }));
  const worst = Math.max(...stress.map(s => s.pb));
  return { res, levers, risk, Y, gain, g0, pb0, capex, rampLoss, bridge, stress, worst, bnB: E.bottleneck(res.base.st), bnN: E.bottleneck(res.nom.st) };
}

function renderRobot() {
  const C = S.C, lv = S.levers, robotOn = hasRobot(lv);
  const manual = C.stations.map((s, i) => [s, i]).filter(([s]) => s.kind === 'manual' || s.kind === 'machine');
  const stale = S.robot && JSON.stringify(S.robot.levers) !== JSON.stringify(lv);
  $('#v-robot').innerHTML = `<div class="split"><div class="page">
    <div class="page-head"><div><div class="label">로봇 영향 · 표준 대비</div><h1>로봇 도입 영향 분석</h1>
      <p>현재 운영(표준)을 기준선으로 고정하고, 로봇 설계안의 <b>이점</b>과 <b>문제점</b>을 시뮬레이션으로 분해합니다. 이론상 로봇과 실제 로봇(고장·순간정지·셋업)을 따로 돌려 손실의 출처까지 보여줍니다.</p></div>
      <div class="actions">
        <select id="robReps" style="width:auto">${repOpts([50, 100, 200, 500], S.robotReps).map(v => `<option value="${v}" ${S.robotReps == v ? 'selected' : ''}>조건당 ${v}회</option>`).join('')}</select>
        <button class="btn primary" id="robRun" ${robotOn ? '' : 'disabled'}>${ic('play')}분석 실행 · ${fmt.n(11 * S.robotReps)} sims</button></div></div>

    <div class="panel"><div class="panel-h"><h3>분석 대상 설계</h3><span class="sub">${robotOn ? esc(describe(lv)) : '로봇이 포함된 설계가 없습니다. 아래에서 고르거나 라인 모델에서 설계하세요.'}</span></div>
      <div class="panel-b"><div class="actions">
        ${manual.map(([s, i]) => E.autoOptionsFor(s.kind).filter(([, o]) => o.robot).map(([k, o]) => {
          const on = lv.stations[i].auto === k;
          return `<button class="btn sm ${on ? 'primary' : ''}" data-rb="${i}:${k}">${on ? ic('check') : ic('plus')}${esc(s.name)} · ${o.label}</button>`;
        }).join('')).join('')}
        <button class="btn sm ghost" data-go="line">${ic('line')}라인 모델에서 상세 설계</button>
      </div></div></div>

    <div id="robOut" style="margin-top:var(--gap)">${S.robot ? (stale ? `<div class="callout" style="margin-bottom:12px"><p>${ic('alert')} 설계가 바뀌었습니다. 아래 결과는 이전 설계(<b>${esc(describe(S.robot.levers))}</b>) 기준입니다. 다시 실행하세요.</p></div>` : '') + robotResults() :
      `<div class="empty">${ic('bot')}<div style="margin-top:8px">로봇 설계를 선택하고 <b>분석 실행</b>을 누르면 11개 조건 × ${S.robotReps}회 시뮬레이션으로<br>표준 대비 가치 브리지, 리스크 토네이도, 병목 이동, 이점·문제점을 생성합니다.</div></div>`}</div>
  </div><aside class="inspector">${riskInspector()}</aside></div>`;
  $('#robReps').onchange = e => { S.robotReps = +e.target.value; renderRobot(); };
  $('#robRun').onclick = runRobot;
  $$('[data-rb]').forEach(b => b.onclick = () => {
    const [i, k] = b.dataset.rb.split(':'); const st = S.levers.stations[+i];
    st.auto = st.auto === k ? null : k; persist(); renderRobot();
  });
  $$('[data-go]', $('#v-robot')).forEach(b => b.onclick = () => setView(b.dataset.go));
  bindRisk();
}

function riskInspector() {
  const R = S.risk, num = (k, label, step, unit, hint) => `<div class="field" style="margin-bottom:10px"><label>${label}</label>
    <div style="display:flex;gap:6px;align-items:center"><input type="number" data-r="${k}" value="${R[k]}" step="${step}" style="width:90px"><span class="tx3">${unit}</span></div>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  const skill = R.mttrMult <= 1 ? 'hi' : R.mttrMult <= 1.5 ? 'mid' : 'lo';
  return `<div class="insp-sec"><div class="label"><span>리스크 가정</span><button class="btn sm ghost" id="riskReset">${ic('reset')}기본값</button></div>
      <div class="tx3" style="font-size:12px">기준 가정입니다. 토네이도 차트는 각 항목을 스트레스 값으로 바꿔 회수기간 변화를 측정합니다.</div></div>
    <div class="insp-sec">
      ${num('changeovers', '품종 교체', 1, '회/교대', '로봇 셋업은 수작업(5분)보다 깁니다')}
      ${num('rampWeeks', '램프업 기간', 1, '주', '가동 초기 학습·튜닝 기간')}
      ${num('rampStart', '램프업 초기 효율', 0.05, '×', '첫 주 성능 (0.6 = 60%)')}
      ${num('capexMult', 'SI·설치비 배수', 0.05, '×', '로봇 본체 대비 통합 비용 반영')}
      ${num('microMult', '순간정지 빈도 배수', 0.1, '×', '부품 공급 편차가 크면 ↑')}
      ${num('speedMult', '로봇 사이클 배수', 0.05, '×', '협동 작업 속도제한 ↑')}
      <div class="field"><label>정비 숙련도</label><div class="seg" id="skillSeg">
        <button data-s="hi" class="${skill === 'hi' ? 'on' : ''}">숙련</button><button data-s="mid" class="${skill === 'mid' ? 'on' : ''}">보통</button><button data-s="lo" class="${skill === 'lo' ? 'on' : ''}">미숙련</button></div>
        <span class="hint">수리시간 ×1 / ×1.5 / ×2</span></div>
    </div>
    <div class="insp-sec"><div class="label"><span>로봇 프로필</span><span class="tx3" style="font-size:12px;font-weight:500">업체 공칭값</span></div>
      <table class="t"><thead><tr><th></th><th>협동</th><th>산업용</th></tr></thead><tbody>
        ${[['사이클 배수', 'cycle', v => '×' + v], ['MTBF', 'mtbf', v => v + 'h'], ['MTTR', 'mttr', v => v + 'm'], ['순간정지', 'microEvery', v => v + '분'], ['셋업', 'setupMin', v => v + '분'], ['인력', 'ops', v => '×' + v], ['투자/대', 'capex', v => fmt.won(v)]]
          .map(([l, k, f]) => { const P = E.profiles(S.C); return `<tr><td class="txt">${l}</td><td>${f(P.cobot[k])}</td><td>${f(P.industrial[k])}</td></tr>`; }).join('')}
      </tbody></table>
      <div class="tx3" style="font-size:11.5px;margin-top:8px">협동로봇은 펜스 없이 사람과 함께 일하는 대신 속도·힘 제한을 받고, 산업용 로봇은 빠르지만 안전펜스·면적·셋업 부담이 큽니다.</div></div>`;
}
function bindRisk() {
  $$('[data-r]').forEach(inp => inp.onchange = () => { const v = parseFloat(inp.value); if (isFinite(v) && v >= 0) { S.risk[inp.dataset.r] = v; persist(); if (S.view === 'robot') renderRobot(); } });
  $$('#skillSeg button').forEach(b => b.onclick = () => { S.risk.mttrMult = { hi: 1, mid: 1.5, lo: 2 }[b.dataset.s]; persist(); renderRobot(); });
  const rr = $('#riskReset'); if (rr) rr.onclick = () => { S.risk = { ...E.DEFAULT_RISK, ...(S.C.risk || {}) }; persist(); renderRobot(); };
}

function robotResults() {
  const M = robotModel(), { res } = M, b = res.base, n = res.nom, names = S.C.stations.map(s => s.name);
  const dGood = n.good.mean - b.good.mean, dEsc = n.escaped.mean - b.escaped.mean, dHc = n.headcount - b.headcount;
  const moved = M.bnB !== M.bnN;
  const verdict = M.g0 > 0
    ? `${esc(describe(M.levers))} — 연간 순효과 <span class="acc">${fmt.sgn(M.g0, fmt.won)}원</span>, 회수기간 <span class="acc">${fmt.mo(M.pb0)}</span>${M.worst > M.pb0 * 1.3 ? `. 단, 스트레스 조건에서는 최대 ${fmt.mo(M.worst)}까지 늘어납니다` : ''}.`
    : `${esc(describe(M.levers))} — 표준 대비 연간 ${fmt.won(M.g0)}원으로 <span class="neg">경제성이 없습니다</span>.`;
  const bridgeItems = [
    { label: '표준\n이익', value: b.pnl.profit * M.Y, kind: 'total' },
    { label: '처리량\n(이론)', value: M.bridge.thru, kind: 'delta' },
    { label: '로봇\n정지 손실', value: M.bridge.stop, kind: 'delta' },
    { label: '인건비\n절감', value: M.bridge.labor, kind: 'delta' },
    { label: '품질\n비용', value: M.bridge.quality, kind: 'delta' },
    { label: '로봇\n운영비', value: M.bridge.opex, kind: 'delta' },
    { label: '전력비\n(EMS)', value: M.bridge.energy, kind: 'delta' },
    { label: '로봇 설계\n이익', value: n.pnl.profit * M.Y, kind: 'total', accent: true },
  ];
  const torRows = M.stress.map(s => ({ label: s.label, value: (isFinite(s.pb) ? s.pb : M.pb0 + 60) - M.pb0, note: `${fmt.mo(s.pb)}` }))
    .sort((a, c) => Math.abs(c.value) - Math.abs(a.value));
  const rows = [
    ['양품 /교대', b.good.mean, n.good.mean, v => fmt.n(v, 1), 1, `±${fmt.n(n.good.ci95, 1)}`],
    ['목표 달성 교대 비율', b.serviceLevel, n.serviceLevel, v => fmt.pct(v), 1],
    ['양품 변동 (표준편차)', b.good.sd, n.good.sd, v => fmt.n(v, 1), -1],
    ['리드타임 (분)', b.lt.mean, n.lt.mean, v => fmt.n(v, 1), -1],
    ['평균 재공 (개)', b.wip.mean, n.wip.mean, v => fmt.n(v, 1), -1],
    ['불량 유출 /교대', b.escaped.mean, n.escaped.mean, v => fmt.n(v, 2), -1],
    ['폐기 /교대', b.scrap.mean, n.scrap.mean, v => fmt.n(v, 1), -1],
    ['고장 /교대', b.failures.mean, n.failures.mean, v => fmt.n(v, 1), -1],
    ['순간정지 /교대', b.micro.mean, n.micro.mean, v => fmt.n(v, 1), -1],
    ['투입 인력 (명)', b.headcount, n.headcount, v => fmt.n(v, 2), -1],
    ['교대당 이익', b.pnl.profit, n.pnl.profit, v => fmt.won(v), 1],
  ];
  // benefits & problems
  const robots = M.levers.stations.map((s, i) => ({ s, i, o: s.auto && E.AUTOMATION[s.auto] })).filter(x => x.o && x.o.robot);
  const ben = [], prob = [];
  if (dGood > 0.5) ben.push(['up', `<b>처리량 +${fmt.n(dGood, 1)}개/교대</b> — 목표 달성 교대 비율 ${fmt.pct(b.serviceLevel)} → ${fmt.pct(n.serviceLevel)}`]);
  if (M.bridge.labor > 0) ben.push(['users', `<b>인건비 절감 ${fmt.won(M.bridge.labor)}원/년</b> — 투입 인력 ${fmt.n(b.headcount, 2)} → ${fmt.n(n.headcount, 2)}명/교대`]);
  if (dEsc < -0.05) ben.push(['shield', `<b>불량 유출 ${fmt.n(-dEsc, 2)}건/교대 감소</b> — 품질비용 ${fmt.won(M.bridge.quality)}원/년 절감 (로봇의 반복 정밀도)`]);
  if (n.good.sd < b.good.sd * 0.9) ben.push(['check', `<b>산출 변동성 ${fmt.n((1 - n.good.sd / b.good.sd) * 100, 0)}% 감소</b> — 표준편차 ${fmt.n(b.good.sd, 1)} → ${fmt.n(n.good.sd, 1)}개, 납기 예측 가능성 향상`]);
  if (n.lt.mean < b.lt.mean * 0.95) ben.push(['clock', `<b>리드타임 ${fmt.n(b.lt.mean, 1)} → ${fmt.n(n.lt.mean, 1)}분</b>`]);
  if (M.bridge.stop < 0) prob.push(['alert', `<b>로봇 정지 손실 ${fmt.won(-M.bridge.stop)}원/년</b> — 고장 ${fmt.n(n.failures.mean - b.failures.mean, 1)}회·순간정지 ${fmt.n(n.micro.mean, 1)}회/교대 증가. 이론상 로봇 대비 처리량이 줄어드는 몫`]);
  if (moved) prob.push(['swap', `<b>병목 이동: ${esc(names[M.bnB])} → ${esc(names[M.bnN])}</b> — 로봇이 병목을 풀면 다음 제약이 드러납니다. ${esc(names[M.bnN])} 능력이 새 산출 상한입니다`]);
  else if (robots.every(r => r.i !== M.bnB)) prob.push(['swap', `<b>병목이 아닌 공정에 로봇 투입</b> — 병목(${esc(names[M.bnB])})이 그대로라 처리량 이점이 제한적입니다 (제약이론)`]);
  if (M.rampLoss > 0) prob.push(['clock', `<b>램프업 1년차 손실 ${fmt.won(M.rampLoss)}원</b> — ${M.risk.rampWeeks}주간 초기 효율 ${fmt.pct(M.risk.rampStart)}에서 시작. 회수기간에 반영됨`]);
  const coS = M.stress.find(s => s.label.startsWith('품종')), setS = M.stress.find(s => s.label.startsWith('로봇 셋업'));
  prob.push(['reset', `<b>유연성</b> — 로봇 셋업 ${robots.map(r => E.profiles(S.C)[r.s.auto].setupMin + '분').join('/')} vs 수작업 5분. 품종 교체가 2배가 되면 회수 ${fmt.mo(coS.pb)}, 셋업이 2배면 ${fmt.mo(setS.pb)}`]);
  const mttrS = M.stress.find(s => s.label.startsWith('정비'));
  prob.push(['wrench', `<b>정비 역량</b> — 사내 로봇 정비 인력이 미숙련이면 회수 ${fmt.mo(mttrS.pb)}. 정비 교육·보전 계약 비용 검토 필요`]);
  const siS = M.stress.find(s => s.label.startsWith('SI'));
  prob.push(['alert', `<b>투자비 초과 리스크</b> — SI·설치·안전설비가 60% 늘면 회수 ${fmt.mo(siS.pb)}`]);
  if (dHc < -0.3) prob.push(['users', `<b>인력 재배치 ${fmt.n(-dHc, 1)}명/교대</b> — 정량 효과에 포함되지 않은 전환 교육·노사 협의 필요`]);
  if (robots.some(r => r.s.auto === 'cobot')) prob.push(['shield', '<b>협동로봇 안전</b> — 사람과 공존하므로 위험성 평가와 속도·힘 제한이 필요하고, 제한이 강해지면(+15%) 회수 ' + fmt.mo(M.stress.find(s => s.label.startsWith('안전')).pb)]);
  if (robots.some(r => r.s.auto === 'industrial')) prob.push(['shield', '<b>산업용 로봇 안전펜스</b> — 펜스·인터록 설치 면적이 필요하고 라인 레이아웃 변경이 수반됩니다']);

  return `
    <div class="callout"><div class="label" style="margin-bottom:4px;display:flex;gap:8px;align-items:center">결론 · 시뮬레이션 ${fmt.n(M.res._meta.sims)}회 ${seedTag(M.res._meta)} ${validBadge()}</div><h2>${verdict}</h2>
      <p>${moved ? `병목은 ${esc(names[M.bnB])}에서 ${esc(names[M.bnN])}(으)로 이동합니다. ` : ''}이론상 로봇 대비 실제 로봇은 정지로 연간 ${fmt.won(Math.abs(M.bridge.stop))}원을 잃습니다. 램프업을 반영한 1년차 손실은 ${fmt.won(M.rampLoss)}원입니다.</p></div>
    <div class="kpis" style="margin-top:var(--gap)">
      ${[['연간 순효과', fmt.sgn(M.g0, fmt.won), '원', '표준 대비', M.g0 > 0 ? 'pos' : 'neg'],
         ['투자비', fmt.won(M.capex), '원', `SI 배수 ×${M.risk.capexMult} 반영`, M.capex > S.C.budget ? 'neg' : ''],
         ['회수기간', fmt.mo(M.pb0).replace('개월', ''), isFinite(M.pb0) ? '개월' : '', `스트레스 최대 ${fmt.mo(M.worst)}`, isFinite(M.pb0) && M.pb0 <= 24 ? 'pos' : 'neg'],
         ['양품 Δ', fmt.sgn(dGood, x => fmt.n(x, 1)), '개/교대', `${fmt.n(b.good.mean, 0)} → ${fmt.n(n.good.mean, 0)}`, dGood >= 0 ? 'pos' : 'neg'],
         ['불량 유출 Δ', fmt.sgn(dEsc, x => fmt.n(x, 2)), '건/교대', `${fmt.n(b.escaped.mean, 2)} → ${fmt.n(n.escaped.mean, 2)}`, dEsc <= 0 ? 'pos' : 'neg'],
         ['인력 Δ', fmt.sgn(dHc, x => fmt.n(x, 2)), '명/교대', `${fmt.n(b.headcount, 1)} → ${fmt.n(n.headcount, 1)}`, '']]
        .map(([k, v, u, d, c]) => `<div class="kpi"><div class="label">${k}</div><div class="v ${c}">${v}<small>${u}</small></div><div class="d">${d}</div></div>`).join('')}
    </div>
    <div class="grid75" style="margin-top:var(--gap)">
      <div class="panel"><div class="panel-h"><h3>가치 브리지 · 연간</h3><span class="sub">표준 이익 → 로봇 설계 이익</span></div><div class="panel-b">
        <p class="chart-sub">${M.bridge.labor > Math.abs(M.bridge.thru) ? '효과의 대부분은 인건비 절감에서 나옵니다' : M.bridge.thru > 0 ? '효과의 대부분은 처리량 증가에서 나옵니다' : '처리량 효과가 없어 비용 절감에 의존합니다'}. 빨간 막대가 로봇이 만드는 비용입니다.</p>
        ${CH.waterfall({ items: bridgeItems, fmt: v => fmt.won(v), W: chartW(f75(7)), H: Math.min(340, Math.max(260, Math.round(chartW(f75(7)) * 0.38))) })}</div></div>
      <div class="panel"><div class="panel-h"><h3>리스크 토네이도 · 회수기간</h3><span class="sub">기준 ${fmt.mo(M.pb0)}</span></div><div class="panel-b">
        <p class="chart-sub">가장 위험한 가정: <b>${esc(torRows[0].label)}</b> (${torRows[0].note}). 각 가정을 하나씩 악화시킨 결과입니다.</p>
        ${CH.tornado({ rows: torRows, W: chartW(f75(5)), baseLabel: '기준 ' + fmt.mo(M.pb0), fmt: v => fmt.sgn(v, x => fmt.n(x, 1)) })}</div></div>
    </div>
    <div class="grid2" style="margin-top:var(--gap)">
      <div class="panel"><div class="panel-h"><h3>로봇 도입의 이점</h3><span class="sub">표준 대비 · 정량</span></div><div class="panel-b"><ul class="notes">${ben.length ? ben.map(([i, t]) => `<li>${ic(i, 'pos')}<span>${t}</span></li>`).join('') : '<li>' + ic('info') + '<span>뚜렷한 이점이 관측되지 않았습니다.</span></li>'}</ul></div></div>
      <div class="panel"><div class="panel-h"><h3>발생 가능한 문제점</h3><span class="sub">시뮬레이션 기반 + 정성</span></div><div class="panel-b"><ul class="notes">${prob.map(([i, t]) => `<li>${ic(i, 'neg')}<span>${t}</span></li>`).join('')}</ul></div></div>
    </div>
    <div class="grid75" style="margin-top:var(--gap)">
      <div class="panel"><div class="panel-h"><h3>표준 vs 로봇 설계</h3><span class="sub">${M.res.base.reps}회 반복 평균</span></div><div class="tbl-wrap"><table class="t">
        <thead><tr><th>지표</th><th>표준</th><th>로봇 설계</th><th>Δ</th></tr></thead>
        <tbody>${rows.map(([l, x, y, f, dir, extra]) => { const d = y - x, good = d * dir > 0; return `<tr><td class="txt">${l}</td><td>${f(x)}</td><td>${f(y)}${extra ? ` <span class="tx3">${extra}</span>` : ''}</td><td class="${Math.abs(d) < 1e-9 ? '' : good ? 'pos' : 'neg'}">${fmt.sgn(d, v => f(v).replace('−', ''))}</td></tr>`; }).join('')}
          <tr><td class="txt">병목 공정</td><td class="txt" style="text-align:right">${esc(names[M.bnB])}</td><td class="txt" style="text-align:right">${esc(names[M.bnN])}</td><td class="${moved ? 'warn' : ''}">${moved ? '이동' : '동일'}</td></tr>
        </tbody></table></div></div>
      <div class="panel"><div class="panel-h"><h3>병목 이동 · 공정 시간 구성</h3></div><div class="panel-b">
        <div class="label" style="margin-bottom:6px">표준</div><div class="sbars">${stateBars(b.st, names, M.bnB)}</div>
        <div class="label" style="margin:14px 0 6px">로봇 설계</div><div class="sbars">${stateBars(n.st, names, M.bnN)}</div>
        <div class="legend" style="margin-top:10px">${[['busy', '가공'], ['blocked', '막힘'], ['down', '고장'], ['minor', '순간정지·셋업'], ['idle', '대기']].map(([k, l]) => `<span><i class="dot" style="background:var(--st-${k})"></i>${l}</span>`).join('')}</div>
      </div></div>
    </div>
    <p class="tx3" style="margin-top:var(--gap)">방법 — 11개 조건(표준, 로봇 기준, 이론상 로봇, 램프업, 스트레스 7종)을 동일 난수(CRN)로 각 ${M.res.base.reps}회 실행. 회수기간 = (투자비 + 램프업 손실) ÷ 연간 순효과. 연간 = ${M.Y}교대.</p>`;
}

/* ============================== EXPERIMENTS ============================== */
function scenarioPool() {
  return [{ key: 'base', name: '표준 (AS-IS)', levers: baseLevers(S.C) }, { key: 'design', name: '현재 설계', levers: clone(S.levers) },
    ...loadScen().map(s => ({ key: 's_' + s.id, name: s.name, levers: s.levers }))];
}
const SCOL = ['var(--c-base)', 'var(--c-1)', 'var(--c-2)', 'var(--c-3)', 'var(--c-4)', 'var(--c-5)'];

function renderExp() {
  const tabs = [['mc', 'Monte Carlo 비교'], ['sweep', '민감도 분석'], ['opt', '최적 투자 탐색']];
  $('#v-exp').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">병렬 워커 ${poolSize}개로 실행</div><h1>실험</h1>
      <p>대규모 반복 실험으로 우연이 아닌 차이를 확인합니다. 모든 실험은 공통 난수(CRN)를 써서 시나리오 간 비교가 공정합니다.</p></div></div>
    <div class="tabs">${tabs.map(([k, l]) => `<button data-t="${k}" class="${S.expTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="expBody"></div></div>`;
  $$('.tabs button', $('#v-exp')).forEach(b => b.onclick = () => { S.expTab = b.dataset.t; renderExp(); });
  ({ mc: renderMC, sweep: renderSweep, opt: renderOpt })[S.expTab]();
}

// ---- Monte Carlo
function renderMC() {
  const pool = scenarioPool();
  if (!S.mcSel) S.mcSel = ['base', 'design'];
  $('#expBody').innerHTML = `<div class="panel"><div class="panel-h"><h3>실험 설정</h3>
      <div class="actions"><select id="mcReps" style="width:auto">${repOpts([100, 300, 1000, 2000], S.mcReps).map(v => `<option value="${v}" ${S.mcReps == v ? 'selected' : ''}>시나리오당 ${fmt.n(v)}회</option>`).join('')}</select>
      <button class="btn primary" id="mcRun">${ic('play')}실행</button></div></div>
    <div class="panel-b"><div class="actions">${pool.map(p => `<label class="tag" style="height:26px;cursor:pointer;gap:6px"><input type="checkbox" data-k="${p.key}" ${S.mcSel.includes(p.key) ? 'checked' : ''}>${esc(p.name)}</label>`).join('')}</div>
      <div class="tx3" style="margin-top:8px">시나리오는 라인 모델 인스펙터에서 저장합니다. 선택: ${S.mcSel.length}개 · 총 ${fmt.n(S.mcSel.length * S.mcReps)}회 시뮬레이션</div></div></div>
    <div id="mcOut" style="margin-top:var(--gap)">${S.mc ? mcResults() : '<div class="empty">시나리오를 고르고 실행하세요. 결과는 평균만이 아니라 95% 신뢰구간과 P5–P95 범위로 표시됩니다.</div>'}</div>`;
  $$('#expBody [data-k]').forEach(c => c.onchange = () => { S.mcSel = $$('#expBody [data-k]').filter(x => x.checked).map(x => x.dataset.k); renderMC(); });
  $('#mcReps').onchange = e => { S.mcReps = +e.target.value; renderMC(); };
  $('#mcRun').onclick = async () => {
    const pts = scenarioPool().filter(p => S.mcSel.includes(p.key));
    if (!pts.some(p => p.key === 'base')) pts.unshift(scenarioPool()[0]);
    const res = await run(pts.map(p => ({ key: p.key, levers: p.levers, risk: S.risk })), S.mcReps, 'Monte Carlo');
    if (res) { S.mc = { res, pts }; renderMC(); }
  };
}
function mcResults() { return compareBlock(S.C, S.mc.res, S.mc.pts, 'mc'); }
function compareBlock(C, res, pts, id, extraCol) {
  const Y = yr(C), b = res.base;
  const rows = pts.map((p, i) => {
    const r = res[p.key], gain = (r.pnl.profit - b.pnl.profit) * Y, pb = gain > 0 ? r.capex / gain * 12 : Infinity;
    return { ...p, r, gain, pb, color: SCOL[i % SCOL.length] };
  });
  const cand = rows.filter(x => x.key !== 'base' && x.r.capex <= C.budget && x.r.good.mean + x.r.escaped.mean >= C.demand && x.gain > 0);
  const best = [...cand].sort((a, c) => c.gain - a.gain)[0];
  const csv = () => download(`takt-${id}-${C.id}.csv`, '﻿' + ['scenario,capex,good_mean,good_ci95,good_p5,good_p95,service_level,lead_time,wip,escaped,headcount,profit_per_shift,annual_gain,payback_months',
    ...rows.map(x => [x.name, x.r.capex, x.r.good.mean, x.r.good.ci95, x.r.good.p5, x.r.good.p95, x.r.serviceLevel, x.r.lt.mean, x.r.wip.mean, x.r.escaped.mean, x.r.headcount, x.r.pnl.profit, x.gain, x.pb].map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : (+v).toFixed(3)).join(','))].join('\n'), 'text/csv');
  setTimeout(() => { const b2 = $('#' + id + 'Csv'); if (b2) b2.onclick = csv; });
  return `<div class="panel"><div class="panel-h"><h3>시나리오 비교 · 표준 고정</h3><div class="actions"><span class="sub">시뮬레이션 ${fmt.n(res._meta.sims)}회 · ${res._meta.secs.toFixed(1)}초</span>${seedTag(res._meta)}<button class="btn sm" id="${id}Csv">${ic('download')}CSV</button></div></div>
    <div class="tbl-wrap"><table class="t"><thead><tr><th>시나리오</th><th>투자비</th><th>양품 평균 ±CI</th><th>P5–P95</th><th>목표 달성</th><th>리드타임</th><th>불량 유출</th><th>교대당 이익</th><th>연간 효과</th><th>회수</th>${extraCol ? '<th></th>' : ''}</tr></thead>
    <tbody>${rows.map(x => `<tr class="${x.key === 'base' ? 'base' : ''} ${best && x.key === best.key ? 'best' : ''}">
      <td class="txt"><i class="dot" style="background:${x.color}"></i> ${esc(x.name)} ${best && x.key === best.key ? '<span class="tag acc">권고</span>' : ''}${x.r.capex > C.budget ? ' <span class="tag neg">예산 초과</span>' : ''}</td>
      <td>${fmt.won(x.r.capex)}</td><td>${fmt.n(x.r.good.mean, 1)} <span class="tx3">±${fmt.n(x.r.good.ci95, 1)}</span></td><td>${fmt.n(x.r.good.p5)}–${fmt.n(x.r.good.p95)}</td>
      <td class="${x.r.serviceLevel >= 0.9 ? 'pos' : x.r.serviceLevel < 0.5 ? 'neg' : ''}">${fmt.pct(x.r.serviceLevel)}</td><td>${fmt.n(x.r.lt.mean, 1)}m</td><td>${fmt.n(x.r.escaped.mean, 2)}</td>
      <td>${fmt.won(x.r.pnl.profit)}</td><td class="${x.gain > 0 ? 'pos' : x.gain < 0 ? 'neg' : ''}">${x.key === 'base' ? '기준' : fmt.sgn(x.gain, fmt.won)}</td><td>${x.key === 'base' ? '—' : fmt.mo(x.pb)}</td>${extraCol ? `<td style="width:1%">${extraCol(x)}</td>` : ''}</tr>`).join('')}</tbody></table></div></div>
    <div class="grid2" style="margin-top:var(--gap)">
      <div class="panel"><div class="panel-h"><h3>양품 /교대 · 평균, 95% CI, P5–P95</h3></div><div class="panel-b">
        <p class="chart-sub">${best ? `${esc(best.name)}가 예산 내에서 목표를 달성하는 최고 수익 대안입니다` : '예산 내에서 평균 목표를 달성하는 대안이 아직 없습니다'}.</p>
        ${CH.smore({ rows: rows.map(x => ({ label: x.name.length > 18 ? x.name.slice(0, 17) + '…' : x.name, color: x.color, p5: x.r.good.p5, p95: x.r.good.p95, lo: x.r.good.mean - x.r.good.ci95, hi: x.r.good.mean + x.r.good.ci95, mean: x.r.good.mean })), fmt: v => fmt.n(v), W: chartW(.5, false) })}</div></div>
      <div class="panel"><div class="panel-h"><h3>양품 분포</h3><span class="sub">목표 ${C.demand}개</span></div><div class="panel-b">
        ${CH.histogram({ groups: rows.map(x => ({ color: x.color, values: x.r.goodDist })), fmt: v => fmt.n(v), W: chartW(.5, false), H: 240 })}
        <div class="legend">${rows.map(x => `<span><i class="dot" style="background:${x.color}"></i>${esc(x.name)}</span>`).join('')}</div></div></div>
    </div>`;
}

// ---- Sweep
const SWEEP_TARGETS = [['n', '공정 대수'], ['buf', '공정 버퍼'], ['changeovers', '품종 교체 (회/교대)'], ['microMult', '로봇 순간정지 배수'], ['mttrMult', '수리시간 배수'], ['capexMult', 'SI 비용 배수']];
const SWEEP_KPI = [['gain', '연간 효과 (표준 대비)'], ['good', '양품 /교대'], ['lt', '리드타임'], ['wip', '재공']];
function renderSweep() {
  const c = S.sweepCfg, stTarget = c.target === 'n' || c.target === 'buf';
  $('#expBody').innerHTML = `<div class="panel"><div class="panel-h"><h3>민감도 분석 설정</h3><span class="sub">현재 설계를 기준으로 한 변수만 바꿔 KPI 곡선을 그립니다</span></div>
    <div class="panel-b"><div class="form">
      <div class="field"><label>변수</label><select id="swT">${SWEEP_TARGETS.map(([k, l]) => `<option value="${k}" ${c.target === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>공정</label><select id="swS" ${stTarget ? '' : 'disabled'}>${S.C.stations.map((s, i) => `<option value="${i}" ${c.st == i ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div class="field"><label>KPI</label><select id="swK">${SWEEP_KPI.map(([k, l]) => `<option value="${k}" ${c.kpi === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>반복 / 점</label><select id="swR">${[30, 60, 150, 300].map(v => `<option ${c.reps == v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>시작</label><input type="number" id="swF" value="${c.from}" step="any"></div>
      <div class="field"><label>끝</label><input type="number" id="swTo" value="${c.to}" step="any"></div>
      <div class="field"><label>간격</label><input type="number" id="swSt" value="${c.step}" step="any"></div>
      <div class="field"><label>&nbsp;</label><button class="btn primary" id="swRun">${ic('play')}실행</button></div>
    </div></div></div>
    <div id="swOut" style="margin-top:var(--gap)">${S.sweep ? sweepResults() : '<div class="empty">예: 조립 공정 대수를 1→4로 바꿀 때 연간 효과가 어디서 꺾이는지, 품종 교체가 늘면 로봇 설계의 효과가 얼마나 줄어드는지 확인합니다.</div>'}</div>`;
  const bind = (id, k, num) => $(id).onchange = e => { c[k] = num ? parseFloat(e.target.value) : e.target.value; if (k === 'target') { Object.assign(c, { n: { from: 1, to: 4, step: 1 }, buf: { from: 1, to: 15, step: 2 }, changeovers: { from: 0, to: 8, step: 1 }, microMult: { from: 0.5, to: 3, step: 0.5 }, mttrMult: { from: 0.5, to: 3, step: 0.5 }, capexMult: { from: 1, to: 2, step: 0.2 } }[c.target]); } renderSweep(); };
  bind('#swT', 'target'); bind('#swS', 'st', true); bind('#swK', 'kpi'); bind('#swR', 'reps', true); bind('#swF', 'from', true); bind('#swTo', 'to', true); bind('#swSt', 'step', true);
  $('#swRun').onclick = async () => {
    const xs = []; for (let v = c.from; v <= c.to + 1e-9 && xs.length < 40; v += c.step) xs.push(+v.toFixed(6));
    if (!xs.length || !(c.step > 0)) { toast('범위를 확인하세요'); return; }
    const pts = [];
    xs.forEach((x, j) => {
      const lv = clone(S.levers); let risk = { ...S.risk };
      if (c.target === 'n') lv.stations[c.st].n = Math.max(1, Math.round(x));
      else if (c.target === 'buf') lv.stations[c.st].buf = Math.max(1, Math.round(x));
      else risk[c.target] = x;
      pts.push({ key: 'x' + j, levers: lv, risk });
      pts.push({ key: 'b' + j, levers: baseLevers(S.C), risk });
    });
    const res = await run(pts, c.reps, '민감도 분석');
    if (res) { S.sweep = { res, xs, cfg: { ...c } }; renderSweep(); }
  };
}
function sweepResults() {
  const { res, xs, cfg } = S.sweep, Y = spY();
  const lab = SWEEP_TARGETS.find(t => t[0] === cfg.target)[1] + (cfg.target === 'n' || cfg.target === 'buf' ? ` · ${S.C.stations[cfg.st].name}` : '');
  const val = (j, kind) => {
    const r = res['x' + j], b = res['b' + j];
    if (cfg.kpi === 'gain') { const m = (r.pnl.profit - b.pnl.profit) * Y, ci = r.profit.ci95 * Y; return kind === 'm' ? m : kind === 'lo' ? m - ci : m + ci; }
    const s = r[cfg.kpi]; return kind === 'm' ? s.mean : kind === 'lo' ? s.mean - s.ci95 : s.mean + s.ci95;
  };
  const f = cfg.kpi === 'gain' ? v => fmt.won(v) : v => fmt.n(v, 1);
  const pts = xs.map((x, j) => [x, val(j, 'm')]);
  const bestJ = pts.reduce((bi, p, j) => (cfg.kpi === 'lt' || cfg.kpi === 'wip' ? p[1] < pts[bi][1] : p[1] > pts[bi][1]) ? j : bi, 0);
  return `<div class="panel"><div class="panel-h"><h3>${esc(SWEEP_KPI.find(k => k[0] === cfg.kpi)[1])} vs ${esc(lab)}</h3><span class="sub">시뮬레이션 ${fmt.n(res._meta.sims)}회 · 음영 = 95% CI ${seedTag(res._meta)}</span></div><div class="panel-b">
    <p class="chart-sub">최적점은 ${esc(lab)} = <b>${xs[bestJ]}</b> (${f(pts[bestJ][1])}). ${cfg.kpi === 'gain' && pts[pts.length - 1][1] < pts[bestJ][1] ? '이 지점을 넘으면 추가 투자의 한계효용이 음수가 됩니다.' : ''}</p>
    ${CH.lineChart({ W: chartW(1, false), H: 300, series: [{ label: '', color: 'var(--accent)', dots: true, pts, band: xs.map((x, j) => [x, val(j, 'lo'), val(j, 'hi')]) }], xfmt: v => fmt.n(v, cfg.step < 1 ? 1 : 0), yfmt: f, endLabels: false })}
    </div><div class="tbl-wrap"><table class="t"><thead><tr><th>${esc(lab)}</th><th>양품 /교대</th><th>목표 달성</th><th>리드타임</th><th>재공</th><th>투자비</th><th>연간 효과</th></tr></thead><tbody>
    ${xs.map((x, j) => { const r = res['x' + j], b = res['b' + j]; return `<tr class="${j === bestJ ? 'best' : ''}"><td>${x}</td><td>${fmt.n(r.good.mean, 1)}</td><td>${fmt.pct(r.serviceLevel)}</td><td>${fmt.n(r.lt.mean, 1)}m</td><td>${fmt.n(r.wip.mean, 1)}</td><td>${fmt.won(r.capex)}</td><td class="${(r.pnl.profit - b.pnl.profit) > 0 ? 'pos' : 'neg'}">${fmt.sgn((r.pnl.profit - b.pnl.profit) * Y, fmt.won)}</td></tr>`; }).join('')}
    </tbody></table></div></div>`;
}

// ---- Optimizer
function renderOpt() {
  const c = S.optCfg, C = S.C;
  const space = optSpace();
  const total = space.reduce((a, s) => a * s.length, 1) * (c.iot ? 2 : 1);
  $('#expBody').innerHTML = `<div class="panel"><div class="panel-h"><h3>최적 투자 탐색</h3><span class="sub">레버 조합을 대량 평가해 투자비 대비 효과의 효율적 경계를 찾습니다</span></div>
    <div class="panel-b"><div class="actions" style="gap:16px">
      <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-o="n" ${c.n ? 'checked' : ''}>대수 +0/+1/+2</label>
      <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-o="auto" ${c.auto ? 'checked' : ''}>자동화·로봇 옵션</label>
      <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-o="iot" ${c.iot ? 'checked' : ''}>IoT 예지보전</label>
      <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-o="budget" ${c.budget ? 'checked' : ''}>예산 ${fmt.won(C.budget)} 이내만</label>
      <select id="optMax" style="width:auto">${[200, 400, 1000, 2000].map(v => `<option value="${v}" ${c.maxEval == v ? 'selected' : ''}>최대 ${fmt.n(v)}개 설계</option>`).join('')}</select>
      <button class="btn primary" id="optRun">${ic('play')}탐색 실행</button></div>
      <div class="tx3" style="margin-top:8px">탐색 공간 ${fmt.n(total)}개 설계 · 1차 선별 설계당 6회, 상위 10개는 60회로 재검증 · 예상 최대 ${fmt.n(Math.min(total, c.maxEval) * 6 + 600)}회 시뮬레이션</div></div></div>
    <div id="optOut" style="margin-top:var(--gap)">${S.opt ? optResults() : '<div class="empty">어떤 조합이 같은 돈으로 가장 큰 효과를 내는지 찾습니다. 결과는 투자비–연간효과 산점도와 효율적 경계로 표시됩니다.</div>'}</div>`;
  $$('[data-o]').forEach(x => x.onchange = () => { c[x.dataset.o] = x.checked; renderOpt(); });
  $('#optMax').onchange = e => { c.maxEval = +e.target.value; renderOpt(); };
  $('#optRun').onclick = runOpt;
}
function optSpace() {
  const c = S.optCfg;
  return S.C.stations.map((s, i) => {
    const ns = c.n ? [s.n, s.n + 1, s.n + 2] : [S.levers.stations[i].n];
    const autos = c.auto ? [null, ...E.autoOptionsFor(s.kind).map(([k]) => k)] : [S.levers.stations[i].auto];
    return ns.flatMap(n => autos.map(auto => ({ n, auto, buf: S.levers.stations[i].buf })));
  });
}
async function runOpt() {
  const c = S.optCfg, space = optSpace(), iots = c.iot ? [false, true] : [S.levers.iot];
  const total = space.reduce((a, s) => a * s.length, 1) * iots.length;
  const seen = new Set(), cands = [];
  const make = idx => ({ iot: iots[idx[space.length]], stations: space.map((s, i) => ({ ...s[idx[i]] })) });
  const push = lv => { const k = JSON.stringify(lv); if (seen.has(k)) return; seen.add(k); const cap = E.capex(cfgOf(lv), S.C); if (c.budget && cap > S.C.budget) return; cands.push(lv); };
  push(baseLevers(S.C));
  if (total <= c.maxEval * 1.5) {
    const dims = [...space.map(s => s.length), iots.length], idx = dims.map(() => 0);
    for (let k = 0; k < total; k++) { push(make(idx)); for (let d = 0; d < dims.length; d++) { if (++idx[d] < dims[d]) break; idx[d] = 0; } }
  } else {
    let guard = 0;
    while (cands.length < c.maxEval && guard++ < c.maxEval * 30) push(make([...space.map(s => Math.floor(Math.random() * s.length)), Math.floor(Math.random() * iots.length)]));
  }
  const list = cands.slice(0, c.maxEval).map((lv, j) => ({ key: 'c' + j, levers: lv, risk: S.risk }));
  const r1 = await run(list, 6, `탐색 1단계 (${list.length}개 설계)`, 3000);
  if (!r1) return;
  const Y = spY(), b1 = r1.c0;
  const scored = list.map(p => ({ ...p, cap: r1[p.key].capex, gain: (r1[p.key].pnl.profit - b1.pnl.profit) * Y, ok: r1[p.key].good.mean + r1[p.key].escaped.mean >= S.C.demand }));
  const top = [...scored].filter(x => x.key !== 'c0').sort((a, b) => b.gain - a.gain).slice(0, 10);
  const r2 = await run([list[0], ...top].map(p => ({ key: p.key, levers: p.levers, risk: S.risk })), 60, '탐색 2단계 (상위 10개 재검증)', 9000);
  if (!r2) return;
  const b2 = r2.c0;
  const finals = top.map(p => { const r = r2[p.key], gain = (r.pnl.profit - b2.pnl.profit) * Y; return { ...p, r, gain, pb: gain > 0 ? r.capex / gain * 12 : Infinity, ok: r.good.mean + r.escaped.mean >= S.C.demand }; }).sort((a, b) => b.gain - a.gain);
  S.opt = { scored, finals, sims: r1._meta.sims + r2._meta.sims, secs: r1._meta.secs + r2._meta.secs, total };
  renderOpt();
}
function optResults() {
  const { scored, finals, sims, secs } = S.opt;
  const fr = CH.frontierOf(scored.map(s => ({ x: s.cap, y: s.gain })));
  const rec = finals.find(f => f.ok) || finals[0];
  setTimeout(() => {
    $$('[data-apply]').forEach(b => b.onclick = () => { S.levers = clone(finals[+b.dataset.apply].levers); persist(); S.robot = null; resetLive(); toast('현재 설계에 적용했습니다'); });
    $$('[data-save]').forEach(b => b.onclick = () => { const f = finals[+b.dataset.save]; const list = loadScen(); list.push({ id: Date.now().toString(36), name: '최적화 · ' + describe(f.levers), levers: clone(f.levers) }); saveScen(list); toast('시나리오로 저장했습니다'); });
  });
  return `<div class="grid2">
    <div class="panel"><div class="panel-h"><h3>투자비 vs 연간 효과</h3><span class="sub">${fmt.n(scored.length)}개 설계 · ${fmt.n(sims)} sims · ${secs.toFixed(1)}s</span></div><div class="panel-b">
      <p class="chart-sub">주황 선이 효율적 경계입니다. 경계 아래의 점은 같은 돈으로 더 나은 대안이 있다는 뜻입니다.</p>
      ${CH.scatter({ W: chartW(.5, false), H: 340, pts: [...scored.map(s => ({ x: s.cap, y: s.gain, color: s.ok ? 'var(--c-2)' : 'var(--c-base)' })), ...(rec ? [{ x: rec.r.capex, y: rec.gain, hl: true, label: '권고' }] : [])], frontier: fr.map(p => [p.x, p.y]), xfmt: v => fmt.won(v), yfmt: v => fmt.won(v) })}
      <div class="legend"><span><i class="dot" style="background:var(--c-2)"></i>목표 달성 설계</span><span><i class="dot" style="background:var(--c-base)"></i>목표 미달</span><span><i class="dot" style="background:var(--accent)"></i>효율적 경계</span></div></div></div>
    <div class="panel"><div class="panel-h"><h3>상위 10개 · 60회 재검증</h3></div><div class="tbl-wrap"><table class="t">
      <thead><tr><th>설계</th><th>투자비</th><th>양품</th><th>연간 효과</th><th>회수</th><th></th></tr></thead>
      <tbody>${finals.map((f, j) => `<tr class="${f === rec ? 'best' : ''}"><td class="txt" style="max-width:260px">${f === rec ? '<span class="tag acc">권고</span> ' : ''}${esc(describe(f.levers))}${f.ok ? '' : ' <span class="tag neg">목표 미달</span>'}</td>
        <td>${fmt.won(f.r.capex)}</td><td>${fmt.n(f.r.good.mean, 0)}</td><td class="${f.gain > 0 ? 'pos' : 'neg'}">${fmt.sgn(f.gain, fmt.won)}</td><td>${fmt.mo(f.pb)}</td>
        <td><div class="actions" style="flex-wrap:nowrap"><button class="btn sm" data-apply="${j}" title="현재 설계에 적용">적용</button><button class="btn sm ghost" data-save="${j}" title="시나리오 저장">${ic('save')}</button></div></td></tr>`).join('')}</tbody></table></div></div>
  </div>`;
}

/* ============================== REPORT ============================== */
function renderReport() {
  const C = S.C, list = loadScen(), M = S.robot ? robotModel() : null, names = C.stations.map(s => s.name);
  const mcRows = S.mc ? S.mc.pts.map(p => ({ p, r: S.mc.res[p.key] })) : [];
  $('#v-report').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">의사결정 정리</div><h1>시나리오 · 보고서</h1><p>저장한 시나리오를 관리하고, 최근 분석 결과로 컨설팅 1페이지 보고서를 만듭니다.</p></div>
      <div class="actions no-print"><button class="btn" id="scExport">${ic('download')}시나리오 JSON</button><button class="btn primary" id="prBtn">${ic('print')}보고서 인쇄 / PDF</button></div></div>
    <div class="panel no-print"><div class="panel-h"><h3>저장된 시나리오</h3><span class="sub">${list.length}개</span></div>
      ${list.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>이름</th><th style="text-align:left">변경 내용</th><th>투자비</th><th></th></tr></thead><tbody>
        ${list.map((s, j) => `<tr><td class="txt"><b>${esc(s.name)}</b></td><td class="txt tx2">${esc(describe(s.levers))}</td><td>${fmt.won(E.capex(cfgOf(s.levers), C))}</td>
          <td style="width:1%"><div class="actions" style="flex-wrap:nowrap"><button class="btn sm" data-ld="${j}">설계로 불러오기</button><button class="btn sm ghost" data-del="${j}">${ic('trash')}</button></div></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="panel-b tx3">라인 모델 인스펙터 하단에서 현재 설계를 시나리오로 저장할 수 있습니다.</div>'}</div>

    <div style="margin-top:var(--gap)">${reproPanel()}</div>
    <article class="panel" style="margin-top:var(--gap)"><div class="panel-b" style="padding:28px 32px;max-width:960px">
      <div class="label">Takt 컨설팅 브리프 ·${new Date().toISOString().slice(0, 10)}</div>
      <h2 style="font-size:24px;margin:6px 0 2px;letter-spacing:-.01em">${esc(C.company)} ${esc(C.title)}</h2>
      <div class="tx2">${esc(C.industry)} · 수요 ${fmt.n(C.demand)}개/교대 · 예산 ${fmt.won(C.budget)}원</div>
      ${M ? `<div class="callout" style="margin:18px 0"><div class="label">권고</div><h2 style="font-size:17px">${M.g0 > 0 ? `${esc(describe(M.levers))} 도입 — 연간 ${fmt.sgn(M.g0, fmt.won)}원, 회수 ${fmt.mo(M.pb0)}` : `${esc(describe(M.levers))}는 표준 대비 경제성이 없음`}</h2></div>` : ''}
      <h3 style="margin:20px 0 6px;font-size:14px">1. 문제 정의</h3><p style="margin:0">${esc(C.situation)}</p><p class="tx2" style="margin:6px 0 0">미션: ${esc(C.mission)} / 제약: ${esc(C.constraints)}</p>
      <h3 style="margin:20px 0 6px;font-size:14px">2. AS-IS 진단</h3>
      ${M ? `<p style="margin:0">표준 라인의 병목은 <b>${esc(names[M.bnB])}</b>이며, 교대당 양품 ${fmt.n(M.res.base.good.mean, 1)}개(목표 달성 교대 ${fmt.pct(M.res.base.serviceLevel)}), 불량 유출 ${fmt.n(M.res.base.escaped.mean, 2)}건, 교대당 이익 ${fmt.won(M.res.base.pnl.profit)}원입니다.</p>` : '<p class="tx3" style="margin:0">로봇 영향 분석을 실행하면 자동으로 채워집니다.</p>'}
      <h3 style="margin:20px 0 6px;font-size:14px">3. 대안 비교</h3>
      ${mcRows.length ? `<table class="t"><thead><tr><th>시나리오</th><th>투자비</th><th>양품</th><th>목표 달성</th><th>불량 유출</th><th>연간 효과</th></tr></thead><tbody>
        ${mcRows.map(({ p, r }) => { const g = (r.pnl.profit - S.mc.res.base.pnl.profit) * spY(); return `<tr class="${p.key === 'base' ? 'base' : ''}"><td class="txt">${esc(p.name)}</td><td>${fmt.won(r.capex)}</td><td>${fmt.n(r.good.mean, 1)}</td><td>${fmt.pct(r.serviceLevel)}</td><td>${fmt.n(r.escaped.mean, 2)}</td><td>${p.key === 'base' ? '기준' : fmt.sgn(g, fmt.won)}</td></tr>`; }).join('')}</tbody></table>`
        : '<p class="tx3" style="margin:0">실험 › Monte Carlo 비교를 실행하면 표가 채워집니다.</p>'}
      ${(() => { const D = S.decide && S.decide.caseId === C.id ? S.decide : null; if (!D) return ''; const sc = scoreAlts(C, D.res, D.alts, S.target), fl = D.flip, an = D.alts.find(a => a.key === D.sel)?.name;
        const top = fl ? fl.factors.filter(f => f.margin != null).sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin)).slice(0, 3) : [];
        return `<h3 style="margin:20px 0 6px;font-size:14px">3-1. 저비용 대안과 결론 반전 조건</h3><p style="margin:0">권고: <b>${esc(sc.rec.name)}</b> — ${esc(sc.rec.why)}. 3년 순효과 ${fmt.sgn(sc.rec.net3, fmt.won)}원, 회수 ${fmt.mo(sc.rec.pb)} (목표 ${S.target}개월).</p>` +
          (top.length ? `<ul class="notes">${top.map(F => `<li>${ic('alert', 'neg')}<span>${esc(flipSentence(fl, F, an))}</span></li>`).join('')}</ul>` : ''); })()}
      <h3 style="margin:20px 0 6px;font-size:14px">4. 로봇 도입 리스크</h3>
      ${M ? `<ul class="notes">${M.stress.slice().sort((a, b) => b.pb - a.pb).slice(0, 4).map(s => `<li>${ic('alert', 'neg')}<span>${esc(s.label)} → 회수 ${fmt.mo(s.pb)} (기준 ${fmt.mo(M.pb0)})</span></li>`).join('')}</ul>` : '<p class="tx3" style="margin:0">로봇 영향 분석 결과가 없습니다.</p>'}
      <h3 style="margin:20px 0 6px;font-size:14px">5. 주요 가정</h3>
      <p class="tx2" style="margin:0">1초 이산시간 흐름라인 시뮬레이션, 공통 난수 반복 실험. 인건비 ${fmt.n(({ ...E.DEFAULT_ECON, ...C.econ }).labor)}원/h, 공헌이익 ${fmt.n(({ ...E.DEFAULT_ECON, ...C.econ }).margin)}원/개, 클레임 ${fmt.won(({ ...E.DEFAULT_ECON, ...C.econ }).claim)}원/건, 연 ${spY()}교대. 품종 교체 ${S.risk.changeovers}회/교대, 램프업 ${S.risk.rampWeeks}주, SI 배수 ×${S.risk.capexMult}. 로봇 성능은 업체 공칭값 기반 가정이며 실제 도입 전 현장 검증이 필요합니다.</p>
    </div></article></div>`;
  $('#prBtn').onclick = () => window.print();
  $('#pkgExport').onclick = exportPackage;
  $('#pkgCheck').onclick = () => $('#pkgIn').click();
  $('#scExport').onclick = () => download(`takt-scenarios-${C.id}.json`, JSON.stringify(list, null, 2));
  $$('[data-ld]').forEach(b => b.onclick = () => { S.levers = clone(list[+b.dataset.ld].levers); persist(); S.robot = null; resetLive(); toast('현재 설계로 불러왔습니다'); });
  $$('[data-del]', $('#v-report')).forEach(b => b.onclick = () => { if (confirm('이 시나리오를 삭제할까요?')) { list.splice(+b.dataset.del, 1); saveScen(list); renderReport(); } });
}

/* ============================== SIMULATION CONDITIONS ============================== */
const COND_GROUPS = [
  ['실행 조건', '반복 횟수와 난수 시드는 모든 실험의 기본값입니다. 시드가 같으면 결과가 재현됩니다.', [
    ['sim.reps', '기본 반복 횟수', '회', 1], ['sim.seed', '난수 시드', '', 1], ['shiftHours', '교대 시간', 'h', 0.5], ['demand', '수요', '개/교대', 1], ['econ.shiftsPerYear', '연간 교대 수', '교대', 1], ['budget', '투자 예산', '원', 1e7]]],
  ['경제성', '연간 효과와 회수기간 계산에 쓰입니다. 회사 재무자료·견적서 값으로 바꾸세요.', [
    ['econ.margin', '공헌이익', '원/개', 100], ['econ.labor', '인건비', '원/인·h', 1000], ['econ.claim', '불량 유출 클레임', '원/건', 10000], ['econ.scrap', '폐기 손실', '원/개', 1000],
    ['econ.shortage', '미납 페널티', '원/개', 1000], ['econ.iotBase', 'IoT 구축비', '원', 1e6], ['econ.iotPerMachine', 'IoT 설비당', '원', 1e5], ['econ.iotPredict', 'IoT 사전감지율', '0~1', 0.05], ['econ.iotRepair', 'IoT 정비 시 수리시간 비율', '0~1', 0.05], ['econ.energyPrice', '전력 단가 (EMS)', '원/kWh', 5]]],
  ['로봇 리스크 가정', '로봇 영향 분석의 기준 조건입니다. 토네이도 차트는 이 값을 기준으로 스트레스를 줍니다.', [
    ['risk.changeovers', '품종 교체', '회/교대', 1], ['risk.rampWeeks', '램프업 기간', '주', 1], ['risk.rampStart', '램프업 초기 효율', '0~1', 0.05], ['risk.capexMult', 'SI·설치비 배수', '×', 0.05],
    ['risk.microMult', '순간정지 빈도 배수', '×', 0.1], ['risk.mttrMult', '수리시간 배수', '×', 0.1], ['risk.speedMult', '로봇 사이클 배수', '×', 0.05], ['risk.mtbfMult', '로봇 고장 간격 배수', '×', 0.1], ['risk.setupMult', '로봇 셋업시간 배수', '×', 0.1]]],
];
function getPath(C, path) {
  const [a, b] = path.split('.');
  if (!b) return C[a];
  if (a === 'econ') return { ...E.DEFAULT_ECON, ...C.econ }[b];
  if (a === 'risk') return S.risk[b];
  if (a === 'sim') return ({ reps: 300, seed: 1000, ...(C.sim || {}) })[b];
}
function setPath(C, path, v) {
  const [a, b] = path.split('.');
  if (!b) { C[a] = v; return; }
  C[a] = C[a] || {}; C[a][b] = v;
  if (a === 'risk') S.risk[b] = v;
  if (path === 'sim.reps') { S.mcReps = v; S.robotReps = Math.min(500, Math.max(50, Math.round(v / 3))); }
}
function renderCond() {
  const C = S.C, P = E.profiles(C);
  $('#v-cond').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">${esc(C.company)} · ${esc(C.title)}</div><h1>시뮬레이션 조건</h1>
      <p>이 케이스의 모든 실험에 적용되는 조건입니다. 값을 바꾸면 즉시 반영되고, 라인 모델·로봇 분석·실험이 이 조건으로 다시 계산됩니다.</p></div>
      <div class="actions"><button class="btn" id="cdReset">${ic('reset')}원래 값으로</button><button class="btn" id="cdExport">${ic('sheet')}양식(CSV)으로 내보내기</button><button class="btn primary" id="cdSave">${ic('save')}${C.source === 'custom' ? '케이스에 저장' : '내 케이스로 저장'}</button></div></div>
    <div class="stack">
      ${COND_GROUPS.map(([title, desc, fields]) => `<div class="panel"><div class="panel-h"><h3>${title}</h3><span class="sub">${desc}</span></div><div class="panel-b"><div class="form">
        ${fields.map(([path, label, unit, step]) => `<div class="field"><label>${label}</label><div style="display:flex;gap:8px;align-items:center"><input type="number" data-p="${path}" value="${getPath(C, path)}" step="${step}" style="flex:1"><span class="tx3" style="font-size:13px;white-space:nowrap">${unit}</span></div></div>`).join('')}
      </div></div></div>`).join('')}
      <div class="panel"><div class="panel-h"><h3>로봇·자동화 프로필</h3><span class="sub">업체 사양서·견적서 값으로 바꾸세요. 모든 시나리오에 적용됩니다.</span></div>
        <div class="tbl-wrap"><table class="t" id="profTbl"><thead><tr><th>항목</th>${TPL.PROFILE_COLS.map(([l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>
          ${TPL.PROFILE_ROWS.map(([label, key]) => `<tr><td class="txt">${label}</td>${TPL.PROFILE_COLS.map(([, a]) => { const v = P[a][key]; return `<td style="width:15%">${v == null ? '<span class="tx3">—</span>' : `<input type="number" data-a="${a}" data-k="${key}" value="${key === 'detect' ? v * 100 : v}" step="any">`}</td>`; }).join('')}</tr>`).join('')}
        </tbody></table></div></div>
    </div></div>`;
  const touch = () => { S.robot = null; S.mc = null; S.sweep = null; S.opt = null; persist(); resetLive(); };
  $$('#v-cond [data-p]').forEach(inp => inp.onchange = () => {
    const v = parseFloat(inp.value); if (!isFinite(v) || v < 0) { toast('0 이상의 숫자를 입력하세요'); inp.value = getPath(C, inp.dataset.p); return; }
    setPath(C, inp.dataset.p, inp.dataset.p === 'sim.reps' ? Math.min(3000, Math.max(10, Math.round(v))) : v); touch(); toast('조건을 반영했습니다');
  });
  $$('#profTbl input').forEach(inp => inp.onchange = () => {
    let v = parseFloat(inp.value); if (!isFinite(v) || v < 0) return;
    if (inp.dataset.k === 'detect') v = Math.min(1, v / 100);
    C.automation = C.automation || {}; (C.automation[inp.dataset.a] = C.automation[inp.dataset.a] || {})[inp.dataset.k] = v; touch(); toast('프로필을 반영했습니다');
  });
  $('#cdReset').onclick = () => {
    const orig = allCases().find(c => c.id === C.id); if (!orig) return;
    ['econ', 'risk', 'sim', 'automation', 'demand', 'shiftHours', 'budget'].forEach(k => { if (orig[k] === undefined) delete C[k]; else C[k] = clone(orig[k]); });
    S.risk = { ...E.DEFAULT_RISK, ...(C.risk || {}) }; touch(); renderCond(); toast('원래 값으로 되돌렸습니다');
  };
  $('#cdExport').onclick = () => download(`takt-양식-${C.company}-${C.title}.csv`.replace(/[\\/:*?"<>|\s]+/g, '_'), TPL.toCSV(TPL.caseToRows({ ...C, risk: { ...S.risk } }, loadScen())), 'text/csv');
  $('#cdSave').onclick = () => {
    const list = loadCustom(), save = { ...clone(C), risk: { ...S.risk } };
    if (C.source !== 'custom') { const scen = loadScen(); Object.assign(save, { id: 'custom-' + Date.now().toString(36), source: 'custom', company: C.company + ' (조건 수정)' }); S.C = save; saveScen(scen); }
    const i = list.findIndex(x => x.id === save.id); if (i >= 0) list[i] = save; else list.push(save);
    saveCustom(list); persist(); renderNav(); toast('내 케이스로 저장했습니다');
  };
}

/* ============================== FREE LAB ============================== */
S.free = null;
const EXAMPLE_SCEN = () => {
  const C = PRESETS[0], b = baseLevers(C);
  const a = clone(b); a.stations[2].auto = 'cobot';
  const c = clone(b); c.stations[2].n = 3;
  const d = clone(b); d.stations[2].auto = 'industrial'; d.stations[1].auto = 'loadcell'; d.iot = true;
  return [{ name: '조립 협동로봇', levers: a }, { name: '조립 작업자 1명 추가', levers: c }, { name: '산업용 로봇 + 로딩셀 + IoT', levers: d }];
};
function blankForm() {
  return { company: '', industry: '', title: '', tags: [], situation: '', mission: '', constraints: '', demand: '', shiftHours: 8, budget: '', econ: {},
    stations: [{ name: '공정1', kind: 'manual', n: 1, cycle: 60, cv: 0.2, defect: 0.005, buf: 5 }, { name: '공정2', kind: 'machine', n: 1, cycle: 60, cv: 0.08, defect: 0.005, buf: 5, mtbf: 4, mttr: 20 }, { name: '검사', kind: 'inspect', n: 1, cycle: 40, cv: 0.2, defect: 0, buf: 5, detect: 0.85 }] };
}
async function loadForm(text, name) {
  let parsed;
  try {
    if (/^\s*\{/.test(text)) { const c = JSON.parse(text); parsed = { case: { ...c, id: 'custom-' + Date.now().toString(36), source: 'custom' }, scenarios: c.scenarios || [], errors: [], warnings: [] }; }
    else parsed = TPL.rowsToCase(TPL.parseCSV(text));
  } catch (e) { parsed = { case: null, scenarios: [], errors: ['파일을 읽을 수 없습니다: ' + e.message], warnings: [] }; }
  S.free = { parsed, name, res: null };
  renderFree();
}
function renderFree() {
  const F = S.free, P = F?.parsed, C = P?.case, ok = P && !P.errors.length && C;
  $('#v-free').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">자유 시뮬레이션</div><h1>내가 분석한 실제 사례를 그대로 돌려보세요</h1>
      <p>표준 양식에 현장 분석 결과(공정, 사이클, 불량, 고장, 비용, 검토할 대안)를 채워 올리면, 양식에 적힌 조건 그대로 표준 라인과 모든 대안을 시뮬레이션합니다.</p></div></div>

    <div class="grid3">
      ${[['1', '양식 받기', '엑셀에서 열리는 CSV 양식입니다. 작성 예시를 먼저 보면 쉽습니다.', `<div class="actions"><button class="btn primary sm" id="fDlBlank">${ic('download')}빈 양식</button><button class="btn sm" id="fDlEx">${ic('download')}작성 예시</button></div>`],
         ['2', '사례 분석·작성', '현장 관찰, MES·설비 로그, 견적서에서 값을 옮겨 적습니다. 검토할 대안은 [시나리오]에 여러 개 적을 수 있습니다.', '<span class="tx3" style="font-size:13px">엑셀 저장 형식: CSV UTF-8 또는 CSV(쉼표로 분리) 모두 가능</span>'],
         ['3', '올리고 실행', '양식을 검증해 오류를 알려주고, 통과하면 지정한 반복 횟수로 실행합니다.', `<div class="actions"><button class="btn primary sm" id="fUp">${ic('upload')}양식 올리기</button><button class="btn sm" id="fPasteBtn">붙여넣기</button></div>`]]
        .map(([n, h, p, act]) => `<div class="panel"><div class="panel-b" style="padding-top:22px"><div class="tag acc" style="margin-bottom:10px">STEP ${n}</div><div style="font-weight:700;font-size:17px;margin-bottom:6px">${h}</div><p class="tx2" style="margin:0 0 14px;font-size:14px">${p}</p>${act}</div></div>`).join('')}
    </div>
    <div class="panel" id="fPasteBox" style="margin-top:var(--gap)" hidden><div class="panel-b" style="padding-top:20px">
      <textarea id="fPaste" rows="8" style="width:100%" placeholder="엑셀에서 양식 전체를 복사해 붙여넣거나 CSV 텍스트를 붙여넣으세요"></textarea>
      <div class="actions" style="margin-top:10px"><button class="btn primary sm" id="fPasteGo">불러오기</button></div></div></div>

    ${P ? `<div style="margin-top:24px">
      <div class="callout ${P.errors.length ? 'warn-box' : ''}">
        <div class="label">${esc(F.name || '붙여넣은 양식')}</div>
        <h2>${P.errors.length ? `오류 ${P.errors.length}건을 고치면 실행할 수 있습니다` : `${esc(C.company)} · ${esc(C.title)} — 공정 ${C.stations.length}개, 대안 ${P.scenarios.length}개 준비 완료`}</h2>
        ${P.errors.length ? `<ul class="notes">${P.errors.map(e => `<li>${ic('alert', 'neg')}<span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
        ${P.warnings.length ? `<ul class="notes">${P.warnings.map(w => `<li>${ic('info')}<span>${esc(w)}</span></li>`).join('')}</ul>` : ''}
      </div>
      ${C && C.stations.length ? `<div class="grid2" style="margin-top:var(--gap)">
        <div class="panel"><div class="panel-h"><h3>표준 라인 (양식 기준)</h3><span class="sub">수요 ${fmt.n(C.demand)}개/교대 · ${C.shiftHours}h · Takt ${fmt.n(C.shiftHours * 3600 / C.demand, 1)}s</span></div>
          <div class="tbl-wrap"><table class="t"><thead><tr><th>공정</th><th>유형</th><th>대수</th><th>사이클</th><th>CV</th><th>불량</th><th>MTBF/MTTR</th><th>이론능력</th></tr></thead><tbody>
          ${C.stations.map(s => { const cap = E.theoreticalCapacity(s, { ...E.DEFAULT_RISK, ...C.risk }, E.profiles(C)); return `<tr><td class="txt"><b>${esc(s.name)}</b></td><td class="txt" style="text-align:right">${E.KINDS[s.kind].label}</td><td>${s.n}</td><td>${s.cycle}s</td><td>${s.cv}</td><td>${s.kind === 'inspect' ? '검출 ' + fmt.pct(s.detect) : fmt.pct(s.defect, 1)}</td><td>${s.mtbf ? s.mtbf + 'h/' + s.mttr + 'm' : '—'}</td><td class="${cap < C.demand / C.shiftHours ? 'neg' : ''}">${fmt.n(cap, 1)}/h</td></tr>`; }).join('')}
          </tbody></table></div></div>
        <div class="panel"><div class="panel-h"><h3>검토할 대안</h3><span class="sub">반복 ${fmt.n(C.sim?.reps || 300)}회 · 시드 ${C.sim?.seed ?? 1000}</span></div>
          ${P.scenarios.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>시나리오</th><th style="text-align:left">변경 내용</th></tr></thead><tbody>
            ${P.scenarios.map(s => `<tr><td class="txt"><b>${esc(s.name)}</b></td><td class="txt tx2">${esc(describe(s.levers, C))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="panel-b tx3">시나리오가 없어 표준 라인만 진단합니다.</div>'}
          <div class="panel-b"><div class="actions">
            <button class="btn primary" id="fRun" ${ok ? '' : 'disabled'}>${ic('play')}시뮬레이션 실행 · ${fmt.n((P.scenarios.length + 1) * (C.sim?.reps || 300))}회</button>
            <button class="btn" id="fSave" ${ok ? '' : 'disabled'}>${ic('save')}내 케이스로 저장 후 열기</button></div></div></div>
      </div>` : ''}
      <div id="fOut" style="margin-top:var(--gap)">${F.res ? compareBlock(C, F.res, [{ key: 'base', name: '표준 (양식 기준)' }, ...P.scenarios.map(s => ({ key: 's_' + s.id, name: s.name, levers: s.levers }))], 'free',
        x => x.key !== 'base' && hasRobot(x.levers) ? `<button class="btn sm" data-rob="${x.key}">${ic('bot')}로봇 분석</button>` : '') : ''}</div>
    </div>` : `<div class="empty" style="margin-top:24px">${ic('sheet')}<div style="margin-top:10px">아직 올린 양식이 없습니다.<br>작성 예시를 받아 A사 사례가 어떻게 적혀 있는지 먼저 확인해 보세요.</div></div>`}

    <div class="panel" style="margin-top:24px"><div class="panel-h"><h3>양식 작성 가이드</h3><span class="sub">실제 사례 분석 시 어디서 값을 구하나</span></div><div class="tbl-wrap"><table class="t">
      <thead><tr><th>섹션</th><th style="text-align:left">무엇을 적나</th><th style="text-align:left">데이터 출처</th></tr></thead><tbody>
      ${[['[케이스]', '회사·산업·과제명, 상황(문제), 미션(목표 KPI), 제약, 수요(개/교대), 교대시간, 투자예산', '인터뷰, 사업보고서, 생산계획'],
         ['[경제성]', '단위당 공헌이익, 시간당 인건비, 클레임·폐기·미납 비용, 연간 교대 수', '손익 자료, 원가표, 품질비용 보고서'],
         ['[공정]', '공정명, 유형, 대수, 평균 사이클(초), 변동계수, 불량률, 버퍼, MTBF·MTTR, 검출률', '시간 연구(스톱워치 30회 이상), MES, 설비 고장 이력, 품질 데이터'],
         ['[시뮬레이션 조건]', '반복 횟수, 난수 시드, 품종 교체, 램프업, SI 배수 등 로봇 리스크 가정', '도입 사례, SI 업체 인터뷰, 보수적 가정'],
         ['[자동화 프로필]', '로봇·자동화 설비의 사이클 배수, 고장, 순간정지, 셋업, 투자비, 운영비', '업체 사양서·견적서, 레퍼런스 고객'],
         ['[시나리오]', '검토할 대안. 같은 이름의 여러 행 = 한 대안 (예: 조립 협동로봇 + IoT)', '컨설팅 가설']]
        .map(r => `<tr><td class="txt"><b>${r[0]}</b></td><td class="txt">${r[1]}</td><td class="txt tx2">${r[2]}</td></tr>`).join('')}
      </tbody></table></div></div>
  </div>`;

  $('#fDlBlank').onclick = () => download('takt-양식-빈양식.csv', TPL.toCSV(TPL.caseToRows(blankForm(), [])), 'text/csv');
  $('#fDlEx').onclick = () => download('takt-양식-작성예시-A사.csv', TPL.toCSV(TPL.caseToRows(PRESETS[0], EXAMPLE_SCEN())), 'text/csv');
  $('#fUp').onclick = () => $('#formIn').click();
  $('#fPasteBtn').onclick = () => { $('#fPasteBox').hidden = !$('#fPasteBox').hidden; };
  $('#fPasteGo').onclick = () => { const t = $('#fPaste').value.trim(); if (t) loadForm(t, '붙여넣은 양식'); };
  if (!P) return;
  const run1 = $('#fRun');
  if (run1) run1.onclick = async () => {
    const R = { ...E.DEFAULT_RISK, ...(C.risk || {}) };
    const pts = [{ key: 'base', levers: baseLevers(C), risk: R }, ...P.scenarios.map(s => ({ key: 's_' + s.id, levers: s.levers, risk: R }))];
    const res = await run(pts, C.sim?.reps || 300, '자유 시뮬레이션', undefined, C);
    if (res) { F.res = res; renderFree(); $('#fOut')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  const saveOpen = () => {
    const list = loadCustom(); if (!list.some(x => x.id === C.id)) list.push(clone(C)); saveCustom(list);
    try { localStorage.setItem(scenKey(C.id), JSON.stringify(P.scenarios.map(s => ({ id: s.id, name: s.name, levers: s.levers })))); } catch {}
    openCase(C.id);
  };
  const sv = $('#fSave'); if (sv) sv.onclick = () => { saveOpen(); toast('내 케이스로 저장했습니다'); setView('line'); };
  $$('[data-rob]').forEach(b => b.onclick = () => {
    const sc = P.scenarios.find(s => 's_' + s.id === b.dataset.rob); saveOpen();
    S.levers = clone(sc.levers); persist(); resetLive(); setView('robot');
    if (!hasRobot(S.levers)) toast('이 시나리오에는 로봇이 없어 분석 대상을 골라야 합니다');
  });
}
$('#formIn').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  loadForm(await TPL.readFileText(f), f.name);
};

/* ============================== MODEL VALIDATION ============================== */
const VKEY = 'takt.validation.v1';
const loadValid = () => { try { return JSON.parse(localStorage.getItem(VKEY)); } catch { return null; } };
const saveValid = v => { try { localStorage.setItem(VKEY, JSON.stringify(v)); } catch {} };
function validBadge() {
  const v = loadValid(); if (!v?.results?.length) return '<span class="tag">모델 미검증</span>';
  const ok = v.results.every(r => r.pass) && v.results.length === V.TESTS.length;
  return `<span class="tag ${ok ? 'pos' : 'neg'}" title="모델 검증 화면에서 확인">${ok ? `모델 검증 ${v.results.length}/${v.results.length} 통과` : '모델 검증 일부 실패'} · ${esc(v.date.slice(0, 10))}</span>`;
}
function vfmt(r, v) { if (r.unit === '%') return v.toFixed(3) + '%'; if (r.unit === '배') return '×' + v.toFixed(2); if (r.unit === '분산' || r.unit === '차이') return fmt.n(v, 1); return fmt.n(v, 1) + r.unit; }

function renderValid() {
  const VR = loadValid(), C = S.C;
  const rs = VR?.results || [], passN = rs.filter(r => r.pass).length;
  const conv = rs.find(r => r.id === 'T8')?.curve;
  $('#v-valid').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">신뢰성</div><h1>모델 검증</h1>
      <p>시뮬레이터가 맞는 답을 내는지 두 단계로 확인합니다. <b>이론 검증</b>은 정답이 알려진 문제(대기행렬·신뢰성·품질 이론)에서 오차를 재고, <b>현장 검증</b>은 실제 기업의 생산 실적과 비교합니다.</p></div>
      <div class="actions">${rs.length ? `<button class="btn" id="vCsv">${ic('download')}검증 리포트 CSV</button>` : ''}<button class="btn primary" id="vRun">${ic('play')}전체 검증 실행 · 9개 항목</button></div></div>

    <div class="callout">
      <div class="label">${VR ? `마지막 검증 · ${esc(VR.date)} · 기준 케이스 ${esc(VR.caseName)}` : '아직 검증하지 않았습니다'}</div>
      <h2>${rs.length ? (passN === rs.length ? `검증 ${rs.length}개 항목 모두 통과 — 이론값 대비 최대 오차 ${fmt.pct(Math.max(...rs.filter(r => r.group === '이론 검증').map(r => r.err)), 2)}` : `${rs.length}개 중 ${passN}개 통과 — 실패 항목을 확인하세요`) : '검증을 실행하면 9개 항목의 통과 여부가 여기에 표시됩니다'}</h2>
      <p>이론 검증으로 "코드가 의도대로 계산하는가(Verification)"를, 현장 검증으로 "모델이 실제 라인을 대표하는가(Validation)"를 확인합니다. 두 단계를 모두 거친 모델의 결론만 의사결정에 쓰는 것이 시뮬레이션 실무의 표준입니다.</p>
    </div>

    <div class="panel"><div class="panel-h"><h3>이론 검증 · 구현 검증 · 통계 검증</h3><span class="sub">허용 오차 안이면 통과</span></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>ID</th><th style="text-align:left">테스트</th><th style="text-align:left">이론 / 기준</th><th>기대값</th><th>시뮬레이션</th><th>오차</th><th>허용</th><th>결과</th></tr></thead><tbody>
      ${V.TESTS.map(t => { const r = rs.find(x => x.id === t.id); return `<tr>
        <td>${t.id}</td>
        <td class="txt l"><b>${esc(t.name)}</b><div class="tx3" style="font-size:12.5px">${esc(t.group)} · ${esc(t.what)}</div></td>
        <td class="txt tx2 l" style="max-width:340px">${esc(t.theory)}${r?.note ? `<div class="tx3" style="font-size:12.5px;margin-top:2px">${esc(r.note)}</div>` : ''}</td>
        <td>${r ? (r.exact ? '—' : vfmt(r, r.expected)) : '—'}</td>
        <td>${r ? (r.exact ? '—' : vfmt(r, r.sim) + (r.ci ? ` <span class="tx3">±${fmt.n(r.ci, 1)}</span>` : '')) : '—'}</td>
        <td>${r ? (r.exact ? '—' : fmt.pct(r.err, 2)) : '—'}</td>
        <td class="tx3">${t.tol ? '±' + fmt.pct(t.tol, 0) : '정확히'}</td>
        <td>${r ? `<span class="tag ${r.pass ? 'pos' : 'neg'}">${r.pass ? '통과' : '실패'}</span>` : '<span class="tag">대기</span>'}</td></tr>`; }).join('')}
      </tbody></table></div></div>

    <div class="grid2">
      <div class="panel"><div class="panel-h"><h3>반복 횟수와 신뢰구간</h3><span class="sub">몇 번 돌려야 믿을 수 있나</span></div><div class="panel-b">
        ${conv ? `<p class="chart-sub">반복을 4배 늘리면 신뢰구간 폭이 절반이 됩니다. 이 케이스는 ±${fmt.n(conv[2][1], 1)}개 정밀도에 100회, ±${fmt.n(conv[4][1], 1)}개에 400회가 필요합니다.</p>
          ${CH.lineChart({ W: chartW(.5, false), H: 230, xmin: 0, ymin: 0, series: [
            { label: '이론 1/√n', color: 'var(--c-base)', dash: true, pts: [25, 50, 100, 200, 400].map(n => [n, conv[0][1] * Math.sqrt(25 / n)]) },
            { label: '시뮬레이션', color: 'var(--accent)', dots: true, pts: conv }], xfmt: v => v + '회', yfmt: v => '±' + fmt.n(v, 1) })}`
          : '<div class="tx3">검증을 실행하면 표시됩니다.</div>'}</div></div>
      <div class="panel"><div class="panel-h"><h3>현장 검증 · 실제 실적과 비교</h3><span class="sub">${C ? esc(C.company + ' ' + C.title) + ' · 표준 라인' : '케이스를 열면 사용할 수 있습니다'}</span></div><div class="panel-b">
        ${C ? `<p class="chart-sub">MES·생산일보에서 실제 교대당 실적을 입력하세요. 오차 10% 이내면 모델을 의사결정에 써도 됩니다.</p>
          <div class="form" style="grid-template-columns:repeat(3,1fr)">
            <div class="field"><label>실제 양품 (개/교대)</label><input type="number" id="haGood" value="${C.actual?.good ?? ''}" placeholder="예: 352"></div>
            <div class="field"><label>실제 리드타임 (분)</label><input type="number" id="haLt" value="${C.actual?.lt ?? ''}" placeholder="선택"></div>
            <div class="field"><label>병목 가동률 (%)</label><input type="number" id="haUtil" value="${C.actual?.util ?? ''}" placeholder="선택"></div>
          </div>
          <div class="actions" style="margin-top:14px"><button class="btn primary" id="haRun">${ic('play')}현장 데이터와 비교</button></div>
          <div id="haOut" style="margin-top:14px">${S.hist ? histTable() : ''}</div>` : `<button class="btn" data-go="cases">${ic('folder')}케이스 열기</button>`}
      </div></div>
    </div>

    <div class="panel"><div class="panel-h"><h3>검증 방법론</h3><span class="sub">면접·보고서에서 이렇게 설명하세요</span></div><div class="tbl-wrap"><table class="t">
      <thead><tr><th style="text-align:left">단계</th><th style="text-align:left">질문</th><th style="text-align:left">Takt에서 하는 일</th></tr></thead><tbody>
      ${[['Verification (구현 검증)', '코드가 설계대로 계산하는가?', '대기행렬·신뢰성·품질 이론의 정답과 비교 (T1–T6), 시드 재현성 (T7)'],
         ['Statistical validity (통계 검증)', '결과가 우연이 아닌가?', '반복 수에 따른 신뢰구간 수렴 (T8), 공통 난수로 비교 오차 축소 (T9), 모든 결과에 95% CI 표시'],
         ['Operational validation (현장 검증)', '모델이 실제 라인을 대표하는가?', '실제 실적(양품·리드타임·가동률)과 표준 라인 시뮬레이션 비교, 오차 10% 기준'],
         ['Data validity (데이터 검증)', '입력값이 믿을 만한가?', 'MES 로그에서 사이클·변동계수·MTBF·MTTR을 직접 추정 (OEE·라인 지표 화면)']]
        .map(r => `<tr><td class="txt"><b>${r[0]}</b></td><td class="txt">${r[1]}</td><td class="txt tx2">${r[2]}</td></tr>`).join('')}
      </tbody></table></div></div>
  </div>`;
  $$('[data-go]', $('#v-valid')).forEach(b => b.onclick = () => setView(b.dataset.go));
  $('#vRun').onclick = async () => {
    const base = S.C || PRESETS[0];
    const results = await V.runSuite((pts, reps, label, seed0, cd) => run(pts, reps, '검증 ' + label, seed0, cd, { fixed: true }), base, part => {
      saveValid({ date: new Date().toISOString().slice(0, 16).replace('T', ' '), caseName: base.company + ' ' + base.title, results: part }); renderValid();
    });
    if (!results) toast('검증이 중단되었습니다');
  };
  const csvB = $('#vCsv'); if (csvB) csvB.onclick = () => download('takt-model-validation.csv', TPL.toCSV([
    ['Takt 모델 검증 리포트', VR.date, VR.caseName], [],
    ['ID', '구분', '테스트', '이론', '기대값', '시뮬레이션', '95% CI', '오차', '허용', '결과', '비고'],
    ...rs.map(r => [r.id, r.group, r.name, r.theory, r.exact ? '' : r.expected, r.exact ? '' : r.sim, r.ci ?? '', r.exact ? '' : r.err, r.tol, r.pass ? '통과' : '실패', r.note || ''])]), 'text/csv');
  const hb = $('#haRun'); if (hb) hb.onclick = async () => {
    const num = id => { const v = parseFloat($(id).value); return isFinite(v) ? v : null; };
    const a = { good: num('#haGood'), lt: num('#haLt'), util: num('#haUtil') };
    if (a.good == null && a.lt == null && a.util == null) { toast('실제 값을 하나 이상 입력하세요'); return; }
    S.C.actual = a; persist();
    const res = await run([{ key: 'base', levers: baseLevers(S.C), risk: S.risk }], S.C.sim?.reps || 300, '현장 검증');
    if (res) { S.hist = { a, r: res.base }; renderValid(); }
  };
}
function histTable() {
  const { a, r } = S.hist, bi = E.bottleneck(r.st), util = (r.st[bi][0]) * 100;
  const rows = [['양품 (개/교대)', a.good, r.good.mean, 0.10], ['리드타임 (분)', a.lt, r.lt.mean, 0.15], [`병목 가동률 (%) · ${S.C.stations[bi].name}`, a.util, util, 0.10]].filter(x => x[1] != null);
  return `<table class="t"><thead><tr><th>지표</th><th>실제</th><th>시뮬레이션</th><th>오차</th><th>판정</th></tr></thead><tbody>
    ${rows.map(([l, act, sim, tol]) => { const e = Math.abs(sim - act) / Math.abs(act || 1); const ok = e <= tol, warn = e <= tol * 2;
      return `<tr><td class="txt">${esc(l)}</td><td>${fmt.n(act, 1)}</td><td>${fmt.n(sim, 1)}</td><td>${fmt.pct(e, 1)}</td><td><span class="tag ${ok ? 'pos' : warn ? '' : 'neg'}">${ok ? '통과' : warn ? '주의' : '재보정 필요'}</span></td></tr>`; }).join('')}
    </tbody></table>
    <p class="tx3" style="font-size:13px;margin:10px 0 0">재보정: 오차가 크면 병목 공정의 사이클·변동계수·MTBF/MTTR을 MES 실측값으로 바꾸세요 (OEE·라인 지표 › MES 데이터).</p>`;
}

/* ============================== OEE · LINE METRICS · EMS · MES ============================== */
const LOSS = [['oee', '가치 생산 (OEE)', 'var(--st-busy)'], ['fail', '고장', 'var(--st-down)'], ['setup', '셋업·교체', 'var(--st-minor)'], ['micro', '순간정지', 'var(--warn)'],
  ['speed', '속도 저하', '#C9A227'], ['defect', '불량', '#F7A8AE'], ['flow', '흐름 대기 (막힘·결품)', 'var(--st-idle)']];
function renderOps() {
  const C = S.C, O = S.ops && JSON.stringify(S.ops.levers) === JSON.stringify(S.levers) ? S.ops : null;
  $('#v-ops').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">${esc(C.company)} · ${esc(C.title)}</div><h1>OEE · 라인 지표</h1>
      <p>제조 현장이 실제로 쓰는 지표로 표준과 현재 설계를 비교합니다: <b>OEE</b>(설비종합효율, TPM), <b>라인 밸런스</b>(Yamazumi·LBR), <b>VSM 부가가치 비율</b>, <b>EMS 에너지 원단위</b>. 입력값은 <b>MES 로그</b>로 보정할 수 있습니다.</p></div>
      <div class="actions"><button class="btn primary" id="opRun">${ic('play')}지표 계산 · 표준·설계 각 ${fmt.n(S.C.sim?.reps || 300)}회</button></div></div>
    ${O ? opsResults(O) : `<div class="empty">${ic('gauge')}<div style="margin-top:10px">지표 계산을 누르면 표준 라인과 현재 설계(${esc(describe(S.levers))})의 OEE, 6대 로스, 라인 밸런스, 에너지 원단위를 계산합니다.</div></div>`}
    ${mesPanel()}
  </div>`;
  $('#opRun').onclick = async () => {
    const lv = clone(S.levers);
    const res = await run([{ key: 'base', levers: baseLevers(C), risk: S.risk }, { key: 'nom', levers: lv, risk: S.risk }], C.sim?.reps || 300, 'OEE·라인 지표');
    if (res) { S.ops = { res, levers: lv }; renderOps(); }
  };
  bindMes();
}
function opsResults(O) {
  const C = S.C, cb = cfgOf(baseLevers(C)), cn = cfgOf(O.levers), b = E.lineMetrics(cb, O.res.base), n = E.lineMetrics(cn, O.res.nom);
  const Y = yr(C), price = ({ ...E.DEFAULT_ECON, ...C.econ }).energyPrice;
  const kpi = (k, v0, v1, f, good, sub) => { const d = v1 - v0, better = good > 0 ? d > 0 : d < 0;
    return `<div class="kpi"><div class="label">${k}</div><div class="v">${f(v1)}</div><div class="d"><span class="${Math.abs(d) < 1e-9 ? '' : better ? 'pos' : 'neg'}">${d >= 0 ? '▲' : '▼'} ${f(Math.abs(d)).replace('−', '')}</span> · 표준 ${f(v0)}${sub ? ' · ' + sub : ''}</div></div>`; };
  const same = describe(O.levers) === '표준 (변경 없음)';
  return `
    <div class="kpis">
      ${kpi('라인 OEE', b.lineOEE, n.lineOEE, v => fmt.pct(v, 1), 1)}
      ${kpi('라인 밸런스율 LBR', b.lbr, n.lbr, v => fmt.pct(v, 1), 1)}
      ${kpi('병목 CT', b.maxCt, n.maxCt, v => fmt.n(v, 1) + 's', -1, `Takt ${fmt.n(n.takt, 1)}s`)}
      ${kpi('부가가치 비율 (VSM)', b.vaRatio, n.vaRatio, v => fmt.pct(v, 1), 1)}
      ${kpi('에너지 원단위 (EMS)', b.kwhPerUnit, n.kwhPerUnit, v => fmt.n(v, 3) + 'kWh', -1, '개당')}
      ${kpi('연간 전력비', b.kwh * price * Y, n.kwh * price * Y, v => fmt.won(v), -1)}
    </div>
    ${same ? `<div class="callout warn-box"><p>현재 설계가 표준과 같습니다. 라인 모델이나 로봇 영향 분석에서 설계를 바꾸면 차이가 보입니다.</p></div>` : ''}
    <div class="grid75">
      <div class="panel"><div class="panel-h"><h3>Yamazumi · 공정별 CT vs Takt</h3><span class="sub">빨간 막대 = Takt 초과 (수요를 못 맞추는 공정)</span></div><div class="panel-b">
        <p class="chart-sub">라인 밸런스율 ${fmt.pct(n.lbr, 0)} — ${n.lbr >= 0.85 ? '공정 간 작업량이 고르게 분배되어 있습니다' : '공정 간 작업량 편차가 커서 유휴 인력·설비가 생깁니다. 작업 재분배(라인 밸런싱)를 검토하세요'}.</p>
        ${CH.yamazumi({ W: chartW(f75(7), false), H: 290, takt: n.takt, groups: [{ label: '표준', color: 'var(--c-base)' }, { label: '설계', color: 'var(--accent)' }],
          rows: n.stations.map((s, i) => ({ label: s.name, values: [b.stations[i].ct, s.ct] })), fmt: v => fmt.n(v, 0) })}
        <div class="legend"><span><i class="dot" style="background:var(--c-base);opacity:.5"></i>표준</span><span><i class="dot" style="background:var(--accent)"></i>현재 설계</span><span><i class="dot" style="background:var(--neg)"></i>Takt 초과</span></div></div></div>
      <div class="panel"><div class="panel-h"><h3>지표 해설</h3></div><div class="panel-b"><ul class="notes">
        <li>${ic('gauge')}<span><b>OEE = 가용률 × 성능 × 품질</b>. 세계적 수준은 85% 전후로 알려져 있습니다. 공정 OEE는 고장·셋업(가용률), 순간정지·대기(성능), 불량(품질) 손실을 한 숫자로 보여줍니다.</span></li>
        <li>${ic('line')}<span><b>LBR = Σ CT ÷ (공정 수 × 최대 CT)</b>. 100%면 모든 공정이 같은 속도입니다.</span></li>
        <li>${ic('clock')}<span><b>부가가치 비율 = 총 가공시간 ÷ 리드타임</b> (VSM). 나머지는 기다리는 시간입니다.</span></li>
        <li>${ic('up')}<span><b>에너지 원단위 = kWh ÷ 생산량</b> (EMS). 대기 중에도 소비하는 전력이 원단위를 키웁니다. 전력 단가 ${fmt.n(price)}원/kWh는 조건 화면에서 바꿀 수 있습니다.</span></li>
      </ul></div></div>
    </div>
    <div class="panel"><div class="panel-h"><h3>공정별 OEE · TPM 손실</h3><span class="sub">현재 설계 기준 · ${O.res.nom.reps}회 평균</span></div>
      <div class="tbl-wrap"><table class="t"><thead><tr><th>공정</th><th>표준 OEE</th><th>설계 OEE</th><th>가용률 A</th><th>성능 P</th><th>품질 Q</th><th style="text-align:left;min-width:320px">시간 구성 (설계)</th><th>kWh/교대</th></tr></thead><tbody>
      ${n.stations.map((s, i) => { const parts = [['oee', s.oee], ...Object.entries(s.loss)]; const big = Object.entries(s.loss).sort((x, y) => y[1] - x[1])[0];
        return `<tr><td class="txt"><b>${esc(s.name)}</b></td><td>${fmt.pct(b.stations[i].oee, 1)}</td><td class="${s.oee > b.stations[i].oee + 0.005 ? 'pos' : s.oee < b.stations[i].oee - 0.005 ? 'neg' : ''}">${fmt.pct(s.oee, 1)}</td>
          <td>${fmt.pct(s.A, 1)}</td><td>${fmt.pct(s.P, 1)}</td><td>${fmt.pct(s.Q, 1)}</td>
          <td class="txt l"><div class="bar" style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--hover)" title="최대 손실: ${LOSS.find(l => l[0] === big[0])[1]} ${fmt.pct(big[1])}">${LOSS.map(([k, , c]) => { const v = k === 'oee' ? s.oee : s.loss[k]; return `<i style="display:block;width:${v * 100}%;background:${c}"></i>`; }).join('')}</div>
            <div class="tx3" style="font-size:12px;margin-top:4px">최대 손실: ${LOSS.find(l => l[0] === big[0])[1]} ${fmt.pct(big[1])}</div></td>
          <td>${fmt.n(b.stations[i].kwh, 1)} → <b>${fmt.n(s.kwh, 1)}</b></td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="panel-b"><div class="legend">${LOSS.map(([, l, c]) => `<span><i class="dot" style="background:${c}"></i>${l}</span>`).join('')}</div></div></div>`;
}

// ---- MES log → parameter estimation (data validity)
function mesPanel() {
  const M = S.mes;
  return `<div class="panel"><div class="panel-h"><h3>MES 데이터로 입력값 보정</h3><span class="sub">MES·생산일보의 사이클 실측과 정지 기록 → 평균·변동계수·MTBF·MTTR 추정</span></div>
    <div class="panel-b">
      <div class="actions"><button class="btn sm" id="mesSample">${ic('download')}MES 로그 양식 (샘플 데이터)</button><button class="btn sm primary" id="mesUp">${ic('upload')}MES 로그 올리기</button>
        <span class="tx3" style="font-size:13px">[관측] 관측기간(h) · [사이클] 공정명, 사이클(s) · [정지] 공정명, 유형(고장/셋업/순간정지), 지속(min)</span></div>
      ${M ? `<div style="margin-top:16px">${M.errors.length ? `<ul class="notes">${M.errors.map(e => `<li>${ic('alert', 'neg')}<span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
        <div class="tbl-wrap"><table class="t"><thead><tr><th><input type="checkbox" id="mesAll" checked></th><th style="text-align:left">공정</th><th>사이클 표본</th><th>사이클 (현재 → 추정)</th><th>변동계수</th><th>고장 수</th><th>MTBF h</th><th>MTTR min</th></tr></thead><tbody>
        ${M.est.map((e, j) => `<tr><td style="width:1%"><input type="checkbox" data-mes="${j}" checked></td><td class="txt"><b>${esc(e.name)}</b></td><td>${e.n}</td>
          <td>${fmt.n(e.cur.cycle, 1)} → <b>${e.cycle != null ? fmt.n(e.cycle, 1) : '—'}</b></td><td>${fmt.n(e.cur.cv, 2)} → <b>${e.cv != null ? fmt.n(e.cv, 2) : '—'}</b></td>
          <td>${e.fails}</td><td>${e.cur.mtbf ?? '—'} → <b>${e.mtbf != null ? fmt.n(e.mtbf, 2) : '—'}</b></td><td>${e.cur.mttr ?? '—'} → <b>${e.mttr != null ? fmt.n(e.mttr, 1) : '—'}</b></td></tr>`).join('')}
        </tbody></table></div>
        <div class="actions" style="margin-top:12px"><button class="btn primary" id="mesApply">${ic('check')}선택한 추정값을 케이스에 적용</button><span class="tx3" style="font-size:13px">적용 후 모델 검증 › 현장 검증으로 실제 실적과 다시 비교하세요.</span></div></div>` : ''}
    </div></div>`;
}
function mesSampleCSV() {
  const C = S.C, H = 40, g = () => { const u = Math.random() || 1e-9, v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const rows = [['TAKT MES 로그 양식 v1'], ['※ 샘플 데이터입니다. 실제 MES·생산일보 기록으로 바꿔 올리세요. ※ 행은 무시됩니다.'], [], ['[관측]'], ['관측기간(h)', H], [], ['[사이클]'], ['공정명', '사이클(s)']];
  C.stations.forEach(s => { for (let k = 0; k < 40; k++) rows.push([s.name, Math.max(s.cycle * 0.3, s.cycle * (1 + s.cv * g())).toFixed(1)]); });
  rows.push([], ['[정지]'], ['공정명', '유형', '지속(min)']);
  C.stations.forEach(s => { if (!s.mtbf) return; const k = Math.max(1, Math.round(H * s.n / (s.mtbf + s.mttr / 60))); for (let j = 0; j < k; j++) rows.push([s.name, '고장', (-Math.log(1 - Math.random()) * s.mttr).toFixed(1)]); });
  return TPL.toCSV(rows);
}
function estimateMes(text) {
  const C = S.C, rows = TPL.parseCSV(text), errors = [];
  let sec = null, H = null; const cyc = {}, stops = {};
  rows.forEach((r, li) => {
    if (!r.length || r.every(x => !x) || /^※/.test(r[0])) return;
    const m = r[0].match(/^\[(.+)\]$/); if (m) { sec = m[1].replace(/\s/g, ''); return; }
    if (sec === '관측') { const v = parseFloat(r[1]); if (isFinite(v)) H = v; }
    else if (sec === '사이클') { const v = parseFloat(r[1]); if (!isFinite(v)) return; (cyc[r[0]] = cyc[r[0]] || []).push(v); }
    else if (sec === '정지') { const v = parseFloat(r[2]); if (!isFinite(v)) return; if (!/고장|fail/i.test(r[1])) return; (stops[r[0]] = stops[r[0]] || []).push(v); }
  });
  if (!H) errors.push('[관측] 관측기간(h)이 없어 MTBF를 계산할 수 없습니다');
  [...Object.keys(cyc), ...Object.keys(stops)].forEach(nm => { if (!C.stations.some(s => s.name === nm)) errors.push(`공정 '${nm}'이 케이스에 없습니다 (공정명을 맞춰 주세요)`); });
  const est = C.stations.map((s, i) => {
    const xs = cyc[s.name] || [], st = xs.length >= 2 ? E.stats(xs) : null, fs = stops[s.name] || [];
    const down = fs.reduce((a, b) => a + b, 0);
    if (xs.length && xs.length < 20) errors.push(`'${s.name}' 사이클 표본이 ${xs.length}개뿐입니다 (시간 연구는 30개 이상 권장)`);
    return { i, name: s.name, n: xs.length, cycle: st ? st.mean : null, cv: st ? st.sd / st.mean : null, fails: fs.length,
      mtbf: H && fs.length ? (H * s.n * 60 - down) / fs.length / 60 : null, mttr: fs.length ? down / fs.length : null,
      cur: { cycle: s.cycle, cv: s.cv, mtbf: s.mtbf, mttr: s.mttr } };
  });
  return { est, errors };
}
function bindMes() {
  $('#mesSample').onclick = () => download(`takt-MES로그-${S.C.company}.csv`.replace(/[\\/:*?"<>|\s]+/g, '_'), mesSampleCSV(), 'text/csv');
  $('#mesUp').onclick = () => $('#mesIn').click();
  const all = $('#mesAll'); if (all) all.onchange = () => $$('[data-mes]').forEach(c => c.checked = all.checked);
  const ap = $('#mesApply'); if (ap) ap.onclick = () => {
    let k = 0;
    $$('[data-mes]').filter(c => c.checked).forEach(c => {
      const e = S.mes.est[+c.dataset.mes], s = S.C.stations[e.i];
      if (e.cycle != null) { s.cycle = +e.cycle.toFixed(2); s.cv = +e.cv.toFixed(3); k++; }
      if (e.mtbf != null && e.mtbf > 0) { s.mtbf = +e.mtbf.toFixed(2); s.mttr = +e.mttr.toFixed(1); }
    });
    S.mes = null; S.ops = null; S.robot = null; S.mc = null; S.hist = null; persist(); resetLive(); renderOps();
    toast(`${k}개 공정에 MES 추정값을 적용했습니다. 영구 저장은 시뮬레이션 조건 › 저장`);
  };
}
$('#mesIn').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  S.mes = estimateMes(await TPL.readFileText(f)); renderOps();
};

/* ============================== DECISION: ALTERNATIVES + FLIP CONDITIONS ============================== */
S.decide = null; S.target = 24;
const aggMeans = r => ({ good: r.good.mean, escaped: r.escaped.mean, scrap: r.scrap.mean, kwh: r.kwh.mean });

/** Standard low-cost alternatives generated from the case's bottleneck, plus robot options. */
function genAlternatives(C) {
  const base = baseLevers(C), cfg = cfgOf(base);
  const load = cfg.stations.map(s => { const p = E.effectiveStation(s, cfg.risk, cfg.auto); return p.cycle / p.n / (isFinite(p.mtbf) ? p.mtbf / (p.mtbf + p.mttr) : 1); });
  const b = load.indexOf(Math.max(...load)), bs = C.stations[b];
  const A = [{ key: 'base', name: '현행 유지 (표준)', type: '기준', why: '추가 투자 없음', levers: base }];
  { const lv = clone(base); let add = 0;
    [b, b + 1].forEach(i => { if (i > 0 && i < C.stations.length) { const a = Math.max(3, lv.stations[i].buf); lv.stations[i].buf += a; lv.stations[i].extraCapex = a * 1e6; add += a; } });
    if (add) A.push({ key: 'buf', name: '병목 앞뒤 버퍼 확대', type: '운영 개선', why: `${bs.name} 앞뒤 버퍼 +${add}칸 (칸당 100만 원 가정) — 막힘·결품 흡수`, levers: lv }); }
  if (bs.kind === 'manual') {
    const nb = [b - 1, b + 1].filter(j => j >= 0 && j < C.stations.length && C.stations[j].kind === 'manual').sort((x, y) => load[x] - load[y]);
    if (nb.length) {
      const j = nb[0], cb = bs.cycle, nB = bs.n, cj = C.stations[j].cycle, nJ = C.stations[j].n;
      const t = Math.min((cb * nJ - cj * nB) / (nB + nJ), cb * 0.3);
      if (t > 1) { const lv = clone(base); lv.stations[b].cycle = +(cb - t).toFixed(1); lv.stations[j].cycle = +(cj + t).toFixed(1); lv.stations[b].extraCapex = 5e6;
        A.push({ key: 'rebal', name: '작업 재분배 (라인 밸런싱)', type: '운영 개선', why: `${bs.name} 작업 ${t.toFixed(1)}초를 ${C.stations[j].name}(으)로 이전 — 표준작업 개정·교육 500만 원 가정`, levers: lv }); }
    }
  }
  { const lv = clone(base); lv.stations[b].n += 1;
    A.push({ key: 'staff', name: `병목 ${bs.kind === 'machine' ? '설비' : '인원'} +1`, type: bs.kind === 'machine' ? '설비 투자' : '인력', why: `${bs.name} ${bs.n}→${bs.n + 1}${bs.kind === 'machine' ? '대' : '명'}`, levers: lv }); }
  if (C.stations.some(s => s.mtbf)) { const lv = clone(base); lv.iot = true; A.push({ key: 'iot', name: 'IoT 예지보전', type: '디지털', why: '설비 고장의 70% 사전 감지 → 수리시간 30% (가정)', levers: lv }); }
  E.autoOptionsFor(bs.kind).forEach(([k, o]) => { const lv = clone(base); lv.stations[b].auto = k;
    A.push({ key: 'auto_' + k, name: `병목 ${o.label}`, type: o.robot ? '로봇·자동화' : '디지털', why: `${bs.name} ${bs.n}대를 ${o.label}로 전환`, levers: lv, robot: !!o.robot }); });
  if (hasRobot(S.levers) && !A.some(a => JSON.stringify(a.levers) === JSON.stringify(S.levers)))
    A.push({ key: 'design', name: '현재 설계', type: '로봇·자동화', why: describe(S.levers), levers: clone(S.levers), robot: true });
  return { alts: A, bottleneck: b };
}
function scoreAlts(C, res, alts, target) {
  const Y = yr(C), b = res.base;
  const rows = alts.map(a => { const r = res[a.key], gain = a.key === 'base' ? 0 : (r.pnl.profit - b.pnl.profit) * Y;
    return { ...a, r, gain, pb: a.key === 'base' ? 0 : gain > 0 ? r.capex / gain * 12 : Infinity, net3: 3 * gain - r.capex, meets: r.good.mean + r.escaped.mean >= C.demand }; });
  const ok = rows.filter(x => x.key !== 'base' && x.pb <= target && x.r.capex <= C.budget);
  const rec = (ok.length ? ok : rows.filter(x => x.key !== 'base' && x.net3 > 0)).sort((x, y) => y.net3 - x.net3)[0] || rows[0];
  return { rows, rec };
}

/** Find where payback crosses the target along a factor. f(x) → payback months. */
function findFlip(xs, pbs, cur, target, exactF) {
  const feas = pbs.map(p => p <= target);
  let best = null;
  for (let k = 0; k < xs.length - 1; k++) {
    if (feas[k] === feas[k + 1]) continue;
    let lo = xs[k], hi = xs[k + 1], x;
    if (exactF) { const fl = feas[k]; for (let it = 0; it < 50; it++) { const m = (lo + hi) / 2; if ((exactF(m) <= target) === fl) lo = m; else hi = m; } x = (lo + hi) / 2; }
    else if (isFinite(pbs[k]) && isFinite(pbs[k + 1])) x = lo + (target - pbs[k]) * (hi - lo) / (pbs[k + 1] - pbs[k]);
    else x = (lo + hi) / 2;
    if (!best || Math.abs(x - cur) < Math.abs(best - cur)) best = x;
  }
  return best;
}

async function runDecide() {
  const C = S.C, { alts, bottleneck } = genAlternatives(C);
  const res = await run(alts.map(a => ({ key: a.key, levers: a.levers, risk: S.risk })), C.sim?.reps || 300, '대안 비교');
  if (!res) return;
  const sc = scoreAlts(C, res, alts, S.target);
  const robotAlts = sc.rows.filter(x => x.robot).sort((x, y) => (x.r.capex <= C.budget ? 0 : 1) - (y.r.capex <= C.budget ? 0 : 1) || y.net3 - x.net3);
  S.decide = { caseId: C.id, alts, res, bottleneck, sel: (robotAlts[0] || sc.rec).key, flip: null, sims: res._meta.sims };
  renderDecide();
  await runFlip();
}

async function runFlip() {
  const D = S.decide, C = S.C, alt = D.alts.find(a => a.key === D.sel), ra = D.res[alt.key], rb = D.res.base, target = S.target;
  const ec = { ...E.DEFAULT_ECON, ...C.econ };
  const pbAt = (mod, rA = ra, rB = rb) => {
    const C2 = { ...C, econ: { ...C.econ, ...(mod.econ || {}) }, demand: mod.demand ?? C.demand };
    const gain = (E.pnl(E.buildConfig(C2, alt.levers, S.risk), aggMeans(rA)).profit - E.pnl(E.buildConfig(C2, baseLevers(C), S.risk), aggMeans(rB)).profit) * yr(C2);
    return gain > 0 ? rA.capex * (mod.capexMult ?? 1) / gain * 12 : Infinity;
  };
  const geo = (lo, hi, n) => Array.from({ length: n }, (_, i) => lo * (hi / lo) ** (i / (n - 1)));
  const factors = [
    { id: 'labor', label: '인건비', unit: '원/인·h', cur: ec.labor, f: x => pbAt({ econ: { labor: x } }), xs: geo(ec.labor * 0.05, ec.labor * 6, 80), fmt: v => fmt.n(v) },
    { id: 'demand', label: '수요', unit: '개/교대', cur: C.demand, f: x => pbAt({ demand: x }), xs: geo(C.demand * 0.1, C.demand * 3, 80), fmt: v => fmt.n(v) },
    { id: 'margin', label: '단위당 공헌이익', unit: '원/개', cur: ec.margin, f: x => pbAt({ econ: { margin: x } }), xs: geo(ec.margin * 0.05, ec.margin * 10, 80), fmt: v => fmt.n(v) },
    { id: 'capex', label: '투자비 (견적 오차)', unit: '배', cur: 1, f: x => pbAt({ capexMult: x }), xs: geo(0.1, 12, 80), fmt: v => '×' + v.toFixed(2) },
    { id: 'claim', label: '불량 유출 클레임 비용', unit: '원/건', cur: ec.claim, f: x => pbAt({ econ: { claim: x } }), xs: geo(Math.max(1000, ec.claim * 0.01), ec.claim * 30, 80), fmt: v => fmt.won(v) },
    { id: 'energy', label: '전력 단가', unit: '원/kWh', cur: ec.energyPrice, f: x => pbAt({ econ: { energyPrice: x } }), xs: geo(5, Math.max(50, ec.energyPrice) * 30, 80), fmt: v => fmt.n(v) },
  ];
  const out = factors.map(F => ({ ...F, thr: findFlip(F.xs, F.xs.map(F.f), F.cur, target, F.f) }));
  const usesRobot = alt.levers.stations.some(s => s.auto && E.AUTOMATION[s.auto]?.robot);
  if (usesRobot) {
    const R = S.risk, simF = [
      { id: 'microMult', label: '로봇 순간정지 빈도', unit: '배', mults: [0.5, 1, 2, 3, 5, 8, 12] },
      { id: 'mtbfMult', label: '로봇 고장 간격 (MTBF)', unit: '배', mults: [0.1, 0.2, 0.33, 0.5, 0.75, 1, 2] },
      { id: 'mttrMult', label: '로봇 수리시간 (정비 숙련도)', unit: '배', mults: [0.5, 1, 2, 3, 5, 8, 12] },
    ];
    const pts = [{ key: 'b', levers: baseLevers(C), risk: R }];
    simF.forEach(F => F.mults.forEach((m, k) => pts.push({ key: `${F.id}_${k}`, levers: alt.levers, risk: { ...R, [F.id]: R[F.id] * m } })));
    const res = await run(pts, 80, '결론 반전 조건');
    if (!res) return;
    simF.forEach(F => {
      const xs = F.mults.map(m => R[F.id] * m), pbs = F.mults.map((m, k) => pbAt({}, res[`${F.id}_${k}`], res.b));
      out.push({ ...F, cur: R[F.id], xs, pbs, thr: findFlip(xs, pbs, R[F.id], target), fmt: v => '×' + v.toFixed(2), sim: true });
    });
    D.flipSims = res._meta.sims;
  }
  const pb0 = pbAt({});
  D.flip = { alt: alt.key, target, pb0, feasible: pb0 <= target, factors: out.map(F => {
    const margin = F.thr == null ? null : (F.thr - F.cur) / F.cur;
    const flipSide = F.thr == null ? null : F.thr > F.cur ? '이상' : '이하';
    return { id: F.id, label: F.label, unit: F.unit, cur: F.cur, thr: F.thr, margin, flipSide, fmt: F.fmt, sim: !!F.sim };
  }) };
  renderDecide();
}

function flipSentence(fl, F, altName) {
  if (F.thr == null) return `${F.label}: 검토 범위 안에서는 결론이 바뀌지 않습니다.`;
  const thr = `${F.fmt(F.thr)}${F.unit === '배' ? '' : ' ' + F.unit}`;
  return fl.feasible
    ? `${F.label}이(가) 현재 ${F.fmt(F.cur)}에서 ${thr} ${F.flipSide}${F.flipSide === "이상" ? "이" : "가"} 되면 회수기간이 ${fl.target}개월을 넘어 '${altName}' 추천이 뒤집힙니다 (여유 ${fmt.sgn(F.margin * 100, x => fmt.n(x, 0))}%).`
    : `${F.label}이(가) ${thr} ${F.flipSide}${F.flipSide === "이상" ? "이" : "가"} 되어야 '${altName}'의 회수기간이 ${fl.target}개월 이내가 됩니다 (현재 대비 ${fmt.sgn(F.margin * 100, x => fmt.n(x, 0))}%).`;
}

function renderDecide() {
  const C = S.C, D = S.decide && S.decide.caseId === C.id ? S.decide : null;
  const sc = D ? scoreAlts(C, D.res, D.alts, S.target) : null;
  const altName = D ? D.alts.find(a => a.key === D.sel)?.name : '';
  const fl = D?.flip && D.flip.alt === D.sel ? D.flip : null;
  const ranked = fl ? fl.factors.filter(f => f.margin != null).sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin)) : [];
  $('#v-decide').innerHTML = `<div class="page">
    <div class="page-head"><div><div class="label">${esc(C.company)} · ${esc(C.title)}</div><h1>대안 비교 · 결론 반전 조건</h1>
      <p>로봇을 사기 전에 컨설턴트가 반드시 하는 두 가지 검토입니다. <b>① 더 싼 대안은 없는가</b> (버퍼·작업 재분배·증원·IoT를 같은 가정으로 비교), <b>② 어떤 조건이면 추천이 뒤집히는가</b> (손익분기 값을 자동 탐색).</p></div>
      <div class="actions"><label class="tx2" style="display:flex;gap:8px;align-items:center;font-size:14px">목표 회수기간 <input type="number" id="dcT" value="${S.target}" min="1" style="width:80px"> 개월</label>
        <button class="btn primary" id="dcRun">${ic('play')}대안 비교 + 반전 조건 실행</button></div></div>
    ${!D ? `<div class="empty">${ic('swap')}<div style="margin-top:10px">실행하면 병목 공정(${esc(C.stations[genAlternatives(C).bottleneck].name)})을 기준으로 대안 ${genAlternatives(C).alts.length - 1}개를 자동으로 만들고, 표준과 같은 난수로 비교합니다.</div></div>` : `
    <div class="callout"><div class="label" style="display:flex;gap:8px;align-items:center">권고 · 시뮬레이션 ${fmt.n(D.sims + (D.flipSims || 0))}회 ${seedTag(D.res._meta)} ${validBadge()}</div>
      <h2>${sc.rec.key === 'base' ? '현행 유지가 가장 낫습니다 — 검토한 대안 중 목표 회수기간을 만족하는 것이 없습니다' : `'${esc(sc.rec.name)}' — 3년 순효과 ${fmt.sgn(sc.rec.net3, fmt.won)}원, 회수 ${fmt.mo(sc.rec.pb)}`}</h2>
      <p>${esc(sc.rec.why)}. 투자비 ${fmt.won(sc.rec.r.capex)}원, 연간 효과 ${fmt.sgn(sc.rec.gain, fmt.won)}원. 기준: 회수기간 ${S.target}개월 이내·예산 ${fmt.won(C.budget)}원 이내 대안 중 3년 순효과(3×연간 효과 − 투자비) 최대.</p></div>
    <div class="grid75">
      <div class="panel"><div class="panel-h"><h3>대안 비교 · 표준 고정</h3><span class="sub">같은 난수(CRN) · ${D.res.base.reps}회 반복</span></div>
        <div class="tbl-wrap"><table class="t"><thead><tr><th>대안</th><th>투자비</th><th>양품 /교대</th><th>목표 달성</th><th>연간 효과</th><th>회수</th><th>3년 순효과</th></tr></thead><tbody>
        ${sc.rows.map(x => `<tr class="${x.key === 'base' ? 'base' : ''} ${x.key === sc.rec.key ? 'best' : ''}">
          <td class="txt l"><span class="tag ${x.type === '로봇·자동화' ? 'acc' : ''}">${esc(x.type)}</span> <b>${esc(x.name)}</b> ${x.key === sc.rec.key ? '<span class="tag pos">권고</span>' : ''}<div class="tx3" style="font-size:12.5px">${esc(x.why)}</div></td>
          <td>${fmt.won(x.r.capex)}</td><td>${fmt.n(x.r.good.mean, 1)} <span class="tx3">±${fmt.n(x.r.good.ci95, 1)}</span></td>
          <td class="${x.r.serviceLevel >= 0.9 ? 'pos' : x.r.serviceLevel < 0.5 ? 'neg' : ''}">${fmt.pct(x.r.serviceLevel)}</td>
          <td class="${x.gain > 0 ? 'pos' : x.gain < 0 ? 'neg' : ''}">${x.key === 'base' ? '기준' : fmt.sgn(x.gain, fmt.won)}</td>
          <td>${x.key === 'base' ? '—' : fmt.mo(x.pb)}</td><td class="${x.net3 > 0 ? 'pos' : x.net3 < 0 ? 'neg' : ''}">${x.key === 'base' ? '—' : fmt.sgn(x.net3, fmt.won)}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="panel"><div class="panel-h"><h3>3년 순효과</h3><span class="sub">3 × 연간 효과 − 투자비</span></div><div class="panel-b">
        <p class="chart-sub">${sc.rows.filter(x => x.type === '운영 개선' && x.net3 > 0).length ? '운영 개선만으로도 이익이 납니다. 로봇은 이 대안들보다 나을 때만 정당화됩니다.' : '운영 개선만으로는 충분하지 않습니다.'}</p>
        ${CH.tornado({ rows: sc.rows.filter(x => x.key !== 'base').sort((a, b) => b.net3 - a.net3).map(x => ({ label: x.name.length > 14 ? x.name.slice(0, 13) + '…' : x.name, value: x.net3, note: fmt.won(x.net3), bad: x.net3 < 0 })), W: chartW(f75(5)), baseLabel: '0원', fmt: v => fmt.won(v) })}</div></div>
    </div>

    <div class="panel"><div class="panel-h"><h3>결론 반전 조건</h3>
      <div class="actions"><span class="tx2" style="font-size:14px">분석 대상</span><select id="dcSel" style="width:auto">${D.alts.filter(a => a.key !== 'base').map(a => `<option value="${a.key}" ${a.key === D.sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
      <button class="btn sm" id="dcFlip">${ic('play')}다시 분석</button></div></div>
      <div class="panel-b">${fl ? `
        <p class="chart-sub">'${esc(altName)}'의 현재 회수기간은 <b>${fmt.mo(fl.pb0)}</b>로 목표 ${fl.target}개월을 ${fl.feasible ? '<span class="pos">충족</span>합니다. 아래 값을 넘으면 결론이 뒤집힙니다' : '<span class="neg">충족하지 못합니다</span>. 아래 값이 되어야 기준을 충족합니다'}. 여유가 작을수록 취약한 가정입니다.</p>
        <ul class="notes" style="margin-bottom:12px">${ranked.length ? '' : `<li>${ic('check', 'pos')}<span>검토한 범위(인건비 0.05~6배, 투자비 0.1~12배, 로봇 순간정지·수리시간 최대 12배 등) 안에서는 결론이 뒤집히지 않습니다. 매우 견고한 결론이므로, 목표 회수기간을 줄이거나 다른 대안을 골라 비교해 보세요.</span></li>`}${ranked.slice(0, 3).map(F => `<li>${ic(Math.abs(F.margin) < 0.25 ? 'alert' : 'info', Math.abs(F.margin) < 0.25 ? 'neg' : '')}<span>${esc(flipSentence(fl, F, altName))}</span></li>`).join('')}</ul>
        <div class="grid2">
          <div>${ranked.length ? CH.tornado({ rows: ranked.map(F => ({ label: F.label.length > 15 ? F.label.slice(0, 14) + '…' : F.label, value: F.margin * 100, note: `${F.fmt(F.thr)} (${fmt.sgn(F.margin * 100, x => fmt.n(x, 0))}%)`, bad: Math.abs(F.margin) < 0.25 })), W: chartW(.5, false), baseLabel: '현재 가정', fmt: v => fmt.n(v, 0) + '%' }) : '<div class="tx3">검토 범위 안에서 결론이 바뀌는 요인이 없습니다.</div>'}</div>
          <div class="tbl-wrap"><table class="t"><thead><tr><th>요인</th><th>현재</th><th>반전 임계값</th><th>여유</th></tr></thead><tbody>
            ${fl.factors.map(F => `<tr><td class="txt l">${esc(F.label)}${F.sim ? ' <span class="tag">시뮬레이션</span>' : ''}</td><td>${F.fmt(F.cur)}</td><td>${F.thr == null ? '<span class="tx3">범위 내 없음</span>' : `<b>${F.fmt(F.thr)}</b> ${F.flipSide}`}</td>
              <td class="${F.margin == null ? '' : Math.abs(F.margin) < 0.25 ? 'neg' : 'pos'}">${F.margin == null ? '—' : fmt.sgn(F.margin * 100, x => fmt.n(x, 0)) + '%'}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
        <p class="tx3" style="font-size:13px;margin:12px 0 0">경제 요인(인건비·수요·공헌이익·투자비·클레임·전력)은 같은 시뮬레이션 결과에서 손익을 다시 계산해 정확히 탐색하고, 로봇 요인은 7개 값에서 각 80회씩 다시 시뮬레이션해 보간합니다. 면접·보고서에서는 여유가 가장 작은 가정부터 현장에서 확인하세요.</p>`
        : '<div class="tx3">분석 중이거나 아직 분석하지 않았습니다.</div>'}</div></div>`}
  </div>`;
  $('#dcT').onchange = e => { const v = parseFloat(e.target.value); if (v > 0) { S.target = v; if (S.decide) { S.decide.flip = null; renderDecide(); runFlip(); } } };
  $('#dcRun').onclick = runDecide;
  const sel = $('#dcSel'); if (sel) sel.onchange = e => { S.decide.sel = e.target.value; S.decide.flip = null; renderDecide(); runFlip(); };
  const fb = $('#dcFlip'); if (fb) fb.onclick = runFlip;
}

/* ============================== REPRODUCIBILITY PACKAGE ============================== */
S.repro = null;
const pickRes = r => ({ good: r.good.mean, goodCi: r.good.ci95, escaped: r.escaped.mean, lt: r.lt.mean, wip: r.wip.mean, profitPerShift: r.pnl.profit, capex: r.capex, kwh: r.kwh.mean });
async function exportPackage() {
  const C = S.C, lv = clone(S.levers), reps = C.sim?.reps || 300;
  const caseDef = { ...clone(C), risk: { ...S.risk } };
  const res = await run([{ key: 'base', levers: baseLevers(caseDef), risk: S.risk }, { key: 'design', levers: lv, risk: S.risk }], reps, '재현 패키지', undefined, caseDef);
  if (!res) return;
  caseDef.sim = { ...(caseDef.sim || {}), seed: res._meta.seed };
  const v = loadValid();
  const pkg = {
    format: 'takt-reproducibility-package', formatVersion: 1, engine: E.ENGINE_VERSION, created: new Date().toISOString(),
    app: location.origin + location.pathname, source: 'https://github.com/CHASEUNGHYEON-CEO/takt',
    howToReproduce: 'Takt › 시나리오·보고서 › 재현 검사에 이 파일을 올리면 같은 입력·시드·반복 수로 다시 실행해 기대 결과와 비교합니다.',
    run: { reps, seed: res._meta.seed, seedMode: res._meta.random ? 'random (recorded)' : 'fixed', replicationSeeds: 'seed + r × 7919 (r = 0…reps−1)', designDescription: describe(lv, caseDef) },
    case: caseDef, levers: lv,
    expected: { base: pickRes(res.base), design: pickRes(res.design) },
    tolerance: { sameEngineVersion: '완전 일치 (상대오차 1e-9)', otherEngineVersion: '양품 ±max(2×95%CI, 1%), 그 외 ±2%' },
    modelValidation: v ? { date: v.date, passed: v.results.filter(r => r.pass).length, total: v.results.length } : null,
  };
  download(`takt-재현패키지-${C.company}-${pkg.created.slice(0, 10)}.json`.replace(/[\\/:*?"<>|\s]+/g, '_'), JSON.stringify(pkg, null, 2));
  toast('재현 패키지를 내보냈습니다');
}
async function checkPackage(text, name) {
  let pkg; try { pkg = JSON.parse(text); } catch { toast('JSON 파일이 아닙니다'); return; }
  if (pkg.format !== 'takt-reproducibility-package') { toast('Takt 재현 패키지가 아닙니다'); return; }
  const C = pkg.case, risk = C.risk || {};
  const res = await run([{ key: 'base', levers: baseLevers(C), risk }, { key: 'design', levers: pkg.levers, risk }], pkg.run.reps, '재현 검사', undefined, C, { fixed: true });
  if (!res) return;
  const same = pkg.engine === E.ENGINE_VERSION, rows = [];
  [['base', '표준'], ['design', '설계']].forEach(([k, lbl]) => {
    const got = pickRes(res[k]), exp = pkg.expected[k];
    [['good', '양품 /교대'], ['escaped', '불량 유출'], ['lt', '리드타임'], ['wip', '평균 재공'], ['profitPerShift', '교대당 이익'], ['capex', '투자비']].forEach(([m, label]) => {
      const e = exp[m], g = got[m], diff = Math.abs(g - e), rel = diff / Math.max(1e-9, Math.abs(e));
      const tol = same ? 1e-9 : m === 'good' ? Math.max(2 * exp.goodCi, Math.abs(e) * 0.01) / Math.max(1e-9, Math.abs(e)) : 0.02;
      rows.push({ scen: lbl, label, e, g, rel, pass: rel <= tol + 1e-12 });
    });
  });
  S.repro = { name, pkg, rows, same, pass: rows.every(r => r.pass) };
  renderReport();
}
function reproPanel() {
  const R = S.repro;
  return `<div class="panel no-print"><div class="panel-h"><h3>재현 패키지</h3><span class="sub">입력·시드·반복 수·엔진 버전·기대 결과를 한 파일로 — 누구나 같은 결과를 재현하고 가정을 바꿔 반박할 수 있게</span></div>
    <div class="panel-b"><div class="actions">
      <button class="btn primary" id="pkgExport">${ic('download')}현재 설계로 재현 패키지 내보내기</button>
      <button class="btn" id="pkgCheck">${ic('upload')}재현 검사 (패키지 올리기)</button>
      <span class="tx3" style="font-size:13px">엔진 버전 ${E.ENGINE_VERSION} · 시드 ${S.C?.sim?.seed ?? 1000} · 반복 ${fmt.n(S.C?.sim?.reps || 300)}회</span></div>
      ${R ? `<div style="margin-top:16px"><div class="callout ${R.pass ? '' : 'warn-box'}" style="padding:16px 20px"><div class="label">${esc(R.name)} · 엔진 ${esc(R.pkg.engine)}${R.same ? ' (현재와 같음 → 완전 일치 기준)' : ' (현재와 다름 → 통계적 허용 오차 기준)'}</div>
          <h2 style="font-size:20px">${R.pass ? `재현 성공 — ${R.rows.length}개 지표 모두 기대 결과와 일치` : `재현 실패 — ${R.rows.filter(r => !r.pass).length}개 지표가 허용 오차를 벗어남`}</h2></div>
        <div class="tbl-wrap" style="margin-top:12px"><table class="t"><thead><tr><th>시나리오</th><th>지표</th><th>기대</th><th>재실행</th><th>차이</th><th>결과</th></tr></thead><tbody>
          ${R.rows.map(r => `<tr><td class="txt l">${r.scen}</td><td class="txt l">${r.label}</td><td>${fmt.n(r.e, 2)}</td><td>${fmt.n(r.g, 2)}</td><td>${r.rel < 1e-9 ? '0' : fmt.pct(r.rel, 3)}</td><td><span class="tag ${r.pass ? 'pos' : 'neg'}">${r.pass ? '일치' : '불일치'}</span></td></tr>`).join('')}
        </tbody></table></div></div>` : ''}
    </div></div>`;
}
$('#pkgIn').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  checkPackage(await f.text(), f.name);
};

/* ============================== SHARE LINKS ============================== */
const SHARE_VIEWS = { line: '라인 모델', cond: '시뮬레이션 조건', robot: '로봇 영향 분석', decide: '대안·반전 조건', ops: 'OEE·라인 지표', exp: '실험', report: '시나리오·보고서' };
const AUTO_RUN = { robot: () => hasRobot(S.levers) && runRobot(), decide: () => runDecide(), ops: () => $('#opRun')?.click() };
async function buildShareLink(run) {
  const view = SHARE_VIEWS[S.view] ? S.view : 'line';
  const c = clone(S.C); delete c.actual;
  if (S.seedMode === 'random' && S.lastSeed) c.sim = { ...(c.sim || {}), seed: S.lastSeed };
  const payload = { v: 1, c, l: S.levers, r: S.risk, t: S.target, view, run: !!run && !!AUTO_RUN[view] };
  return location.origin + location.pathname + '#s=' + await SH.encodeShare(payload);
}
async function openShare() {
  const pop = $('#sharePop');
  if (!pop.hidden) { pop.hidden = true; return; }
  const view = SHARE_VIEWS[S.view] ? S.view : 'line', canRun = !!AUTO_RUN[view];
  pop.innerHTML = `<div class="label" style="color:var(--tx);font-size:16px;font-weight:800">분석 공유 링크</div>
    <p class="tx2" style="margin:6px 0 14px;font-size:14px">받는 사람이 링크를 열면 <b>${esc(S.C.company)} · ${esc(S.C.title)}</b>의 케이스·설계·가정이 그대로 열리고, <b>${SHARE_VIEWS[view]}</b> 화면으로 이동합니다. 시드 <b>${S.seedMode === 'random' && S.lastSeed ? S.lastSeed : (S.C.sim?.seed ?? 1000)}</b>로 고정되어 결과도 똑같이 재현됩니다.</p>
    ${canRun ? `<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin-bottom:12px;cursor:pointer"><input type="checkbox" id="shRun" checked> 열자마자 분석을 자동 실행</label>` : ''}
    <div style="display:flex;gap:8px"><input id="shUrl" readonly style="flex:1" value="링크 만드는 중…"><button class="btn primary" id="shCopy">${ic('copy')}복사</button></div>
    <p class="tx3" style="font-size:12.5px;margin:12px 0 0;line-height:1.6">${ic('shield')} 데이터는 서버에 저장되지 않고 링크 안에만 담깁니다. 링크를 가진 사람은 내용을 볼 수 있으니, 실제 기업 자료는 회사명·민감 수치를 익명화한 뒤 공유하세요.</p>`;
  pop.hidden = false;
  const refresh = async () => { const u = await buildShareLink($('#shRun')?.checked); $('#shUrl').value = u; $('#shUrl').title = `${u.length.toLocaleString()}자`; };
  await refresh();
  const r = $('#shRun'); if (r) r.onchange = refresh;
  $('#shCopy').onclick = async () => {
    const u = $('#shUrl').value;
    try { await navigator.clipboard.writeText(u); toast('공유 링크를 복사했습니다'); }
    catch { $('#shUrl').select(); toast('링크를 선택했습니다. Ctrl+C로 복사하세요'); }
  };
}
$('#shareBtn').onclick = e => { e.stopPropagation(); openShare(); };
document.addEventListener('click', e => { const p = $('#sharePop'); if (!p.hidden && !p.contains(e.target)) p.hidden = true; });

/** Import a shared analysis from #s=… ; returns the view to open (or null). */
async function importShare(hash) {
  let p; try { p = await SH.decodeShare(hash.slice(2)); } catch { toast('공유 링크를 읽을 수 없습니다 (링크가 잘렸을 수 있습니다)'); return null; }
  if (!p || p.v !== 1 || !p.c?.stations?.length) { toast('지원하지 않는 공유 링크입니다'); return null; }
  const fp = SH.fingerprint(JSON.stringify(p.c));
  const id = 'shared-' + fp, list = loadCustom();
  if (!list.some(x => x.id === id)) {
    list.push({ ...p.c, id, source: 'custom', tags: [...new Set([...(p.c.tags || []), '공유받음'])] });
    saveCustom(list);
  }
  openCase(id, p.l);
  if (p.r) S.risk = { ...E.DEFAULT_RISK, ...p.r };
  if (p.t) S.target = p.t;
  setSeedMode('fixed', true); // reproduce exactly what the sender saw
  persist(); resetLive();
  history.replaceState(null, '', location.pathname + '#' + (SHARE_VIEWS[p.view] ? p.view : 'line'));
  return { view: SHARE_VIEWS[p.view] ? p.view : 'line', run: p.run };
}

/* ============================== boot ============================== */
(async function boot() {
  let theme = 'light'; try { theme = localStorage.getItem('takt.theme.v2') || 'light'; } catch {}
  applyTheme(theme);
  let sess = null; try { sess = JSON.parse(localStorage.getItem(SKEY)); } catch {}
  if (sess?.risk) S.risk = { ...E.DEFAULT_RISK, ...sess.risk };
  try { S.seedMode = localStorage.getItem('takt.seedMode') === 'random' ? 'random' : 'fixed'; } catch {}
  renderSeedSeg();
  const shared = location.hash.startsWith('#s=') ? await importShare(location.hash.slice(1)) : null;
  if (shared) {
    setView(shared.view);
    toast(`공유받은 분석을 열었습니다 · 내 케이스에 '공유받음'으로 저장됨`);
    if (shared.run && AUTO_RUN[shared.view]) setTimeout(() => AUTO_RUN[shared.view](), 300);
  } else {
    if (sess?.caseId) openCase(sess.caseId, sess.levers, sess.draft);
    const want = location.hash.slice(1);
    setView(['free', 'valid'].includes(want) ? want : S.C && ['line', 'robot', 'exp', 'report', 'cond', 'ops', 'decide'].includes(want) ? want : 'cases');
  }
  if (innerWidth < 760 && !sessionStorage.getItem('takt.mobileOk')) {
    const n = document.createElement('div'); n.className = 'mobile-note';
    n.innerHTML = `<div><div style="font-size:20px;font-weight:800;margin-bottom:8px">Takt는 PC용 분석 도구예요</div>
      <p class="tx2" style="margin:0 0 16px">수천 번의 시뮬레이션과 넓은 표·차트를 쓰기 때문에 PC 브라우저에서 열어야 제대로 보입니다. 링크를 복사해 PC로 보내 보세요.</p>
      <div class="actions"><button class="btn primary" id="mnCopy">${ic('copy')}링크 복사</button><button class="btn" id="mnGo">그래도 보기</button></div></div>`;
    document.body.appendChild(n);
    $('#mnCopy').onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast('링크를 복사했습니다'); } catch { toast(location.href); } };
    $('#mnGo').onclick = () => { try { sessionStorage.setItem('takt.mobileOk', '1'); } catch {} n.remove(); };
  }
  let rz = 0;
  addEventListener('resize', () => {
    if (S.view === 'line') drawLive(true);
    clearTimeout(rz); rz = setTimeout(() => { if (['robot', 'exp', 'free'].includes(S.view)) ({ robot: renderRobot, exp: renderExp, free: renderFree })[S.view](); }, 200);
  });
})();

// A share link opened in a tab that already has Takt loaded only changes the hash — import it then too.
addEventListener('hashchange', async () => {
  if (!location.hash.startsWith('#s=')) return;
  const sh = await importShare(location.hash.slice(1));
  if (!sh) return;
  setView(sh.view);
  toast(`공유받은 분석을 열었습니다 · 내 케이스에 '공유받음'으로 저장됨`);
  if (sh.run && AUTO_RUN[sh.view]) setTimeout(() => AUTO_RUN[sh.view](), 300);
});

// Tablets held in portrait (760–999px, touch): the app keeps its PC layout, so suggest landscape.
(function rotateHint() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const show = () => {
    const narrow = innerWidth >= 760 && innerWidth < 1000, el = $('.rotate-hint');
    if (coarse && narrow && !el && !sessionStorage.getItem('takt.rotateOk')) {
      const n = document.createElement('div'); n.className = 'rotate-hint';
      n.innerHTML = `<span>태블릿은 가로로 돌리면 화면 전체가 보여요</span><button>닫기</button>`;
      n.querySelector('button').onclick = () => { try { sessionStorage.setItem('takt.rotateOk', '1'); } catch {} n.remove(); };
      document.body.appendChild(n);
    } else if (el && !narrow) el.remove();
  };
  show(); addEventListener('resize', show);
})();
