// Minimal SVG chart kit. Every function returns an SVG string sized by viewBox; colors come from CSS vars.

export function niceTicks(min, max, count = 5) {
  if (!isFinite(min) || !isFinite(max)) return [0, 1];
  if (min === max) { const d = Math.abs(min) * 0.1 || 1; min -= d; max += d; }
  const span = max - min, step0 = span / count, mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= count) || 10 * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = []; for (let v = lo; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function frame(W, H, pad, xt, yt, X, Y, xfmt, yfmt) {
  let g = '';
  yt.forEach(v => { g += `<line class="gl" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pad.l - 6}" y="${Y(v) + 3.5}" text-anchor="end">${yfmt(v)}</text>`; });
  xt.forEach(v => { g += `<text x="${X(v)}" y="${H - pad.b + 15}" text-anchor="middle">${xfmt(v)}</text>`; });
  g += `<line class="ax" x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>`;
  return g;
}

/** series: [{label, color, pts:[[x,y]], band:[[x,lo,hi]], dash, width}] */
export function lineChart({ series, W = 640, H = 230, xfmt = v => v, yfmt = v => v, xmin, xmax, ymin, ymax, endLabels = true }) {
  const pad = { l: 46, r: endLabels ? 96 : 12, t: 10, b: 24 };
  const xs = series.flatMap(s => s.pts.map(p => p[0])), ys = series.flatMap(s => [...s.pts.map(p => p[1]), ...(s.band || []).flatMap(b => [b[1], b[2]])]);
  const xt = niceTicks(xmin ?? Math.min(...xs), xmax ?? Math.max(...xs), 6);
  const yt = niceTicks(ymin ?? Math.min(0, ...ys), ymax ?? Math.max(...ys), 4);
  const x0 = xmin ?? xt[0], x1 = xmax ?? xt[xt.length - 1], y0 = yt[0], y1 = yt[yt.length - 1];
  const X = v => pad.l + (W - pad.l - pad.r) * (v - x0) / (x1 - x0 || 1), Y = v => H - pad.b - (H - pad.t - pad.b) * (v - y0) / (y1 - y0 || 1);
  let g = frame(W, H, pad, xt.filter(v => v >= x0 && v <= x1), yt, X, Y, xfmt, yfmt);
  const labels = [];
  series.forEach(s => {
    if (s.band && s.band.length) {
      const up = s.band.map(b => `${X(b[0])},${Y(b[2])}`), dn = s.band.slice().reverse().map(b => `${X(b[0])},${Y(b[1])}`);
      g += `<polygon points="${up.concat(dn).join(' ')}" fill="${s.color}" opacity=".16"/>`;
    }
    if (!s.pts.length) return;
    g += `<polyline fill="none" stroke="${s.color}" stroke-width="${s.width || 1.75}" ${s.dash ? 'stroke-dasharray="4 4"' : ''} points="${s.pts.map(p => `${X(p[0])},${Y(p[1])}`).join(' ')}"/>`;
    if (s.dots) s.pts.forEach(p => { g += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="2.6" fill="${s.color}"/>`; });
    const lp = s.pts[s.pts.length - 1];
    if (endLabels && s.label) labels.push({ y: Y(lp[1]), x: X(lp[0]), text: s.label, color: s.color });
  });
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 13) labels[i].y = labels[i - 1].y + 13;
  labels.forEach(l => { g += `<text class="lbl" x="${l.x + 6}" y="${l.y + 4}" style="fill:${l.color}">${esc(l.text)}</text>`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** items: [{label, value, kind:'total'|'delta'}] — waterfall / value bridge */
export function waterfall({ items, W = 640, H = 260, fmt = v => v }) {
  const pad = { l: 12, r: 12, t: 22, b: 46 };
  let run = 0; const bars = items.map(it => {
    if (it.kind === 'total') { const b = { ...it, from: 0, to: it.value }; run = it.value; return b; }
    const b = { ...it, from: run, to: run + it.value }; run += it.value; return b;
  });
  const vals = bars.flatMap(b => [b.from, b.to, 0]);
  const yt = niceTicks(Math.min(...vals), Math.max(...vals), 4), y0 = yt[0], y1 = yt[yt.length - 1];
  const Y = v => H - pad.b - (H - pad.t - pad.b) * (v - y0) / (y1 - y0 || 1);
  const bw = (W - pad.l - pad.r) / bars.length;
  let g = `<line class="ax" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  bars.forEach((b, i) => {
    const x = pad.l + i * bw + bw * 0.18, w = bw * 0.64;
    const top = Y(Math.max(b.from, b.to)), h = Math.max(1, Math.abs(Y(b.from) - Y(b.to)));
    const color = b.kind === 'total' ? (b.accent ? 'var(--accent)' : 'var(--c-base)') : (b.value >= 0 ? 'var(--pos)' : 'var(--neg)');
    g += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="4" fill="${color}" ${b.kind === 'total' ? '' : 'fill-opacity=".28"'}/>`;
    if (i < bars.length - 1) g += `<line x1="${x + w}" x2="${x + bw}" y1="${Y(b.to)}" y2="${Y(b.to)}" stroke="var(--line-strong)" stroke-dasharray="2 2"/>`;
    g += `<text x="${x + w / 2}" y="${top - 6}" text-anchor="middle" class="strong" style="${b.kind === 'delta' ? `fill:${color}` : ''}">${(b.kind === 'delta' && b.value > 0 ? '+' : '') + fmt(b.value)}</text>`;
    const words = String(b.label).split('\n');
    words.forEach((wd, k) => { g += `<text class="lbl" x="${x + w / 2}" y="${H - pad.b + 16 + k * 13}" text-anchor="middle">${esc(wd)}</text>`; });
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** rows: [{label, value, note}] values are signed deltas around 0; sorted by |value| */
export function tornado({ rows, W = 640, rowH = 30, fmt = v => v, baseLabel = '기준' }) {
  const pad = { l: 190, r: 120, t: 18, b: 8 };
  const H = pad.t + pad.b + rows.length * rowH;
  const m = Math.max(1e-9, ...rows.map(r => Math.abs(r.value)));
  const cx = pad.l + (W - pad.l - pad.r) / 2, half = (W - pad.l - pad.r) / 2;
  let g = `<line class="ax" x1="${cx}" x2="${cx}" y1="${pad.t - 6}" y2="${H - pad.b}"/><text x="${cx}" y="${pad.t - 8}" text-anchor="middle">${esc(baseLabel)}</text>`;
  rows.forEach((r, i) => {
    const y = pad.t + i * rowH, w = Math.abs(r.value) / m * half;
    const x = r.value >= 0 ? cx : cx - w;
    const bad = r.bad ?? r.value > 0;
    g += `<text class="lbl" x="${pad.l - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(r.label)}</text>`;
    g += `<rect x="${x}" y="${y + 6}" width="${Math.max(1, w)}" height="${rowH - 12}" rx="4" fill="${bad ? 'var(--neg)' : 'var(--pos)'}" fill-opacity=".28"/>`;
    g += `<text x="${W - pad.r + 8}" y="${y + rowH / 2 + 4}" class="strong" style="fill:${bad ? 'var(--neg)' : 'var(--pos)'}">${esc(r.note ?? fmt(r.value))}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** SMORE-style: rows [{label,color,p5,lo,mean,hi,p95}] */
export function smore({ rows, W = 640, rowH = 30, fmt = v => v }) {
  const pad = { l: 150, r: 70, t: 8, b: 24 };
  const H = pad.t + pad.b + rows.length * rowH;
  const xt = niceTicks(Math.min(...rows.map(r => r.p5)), Math.max(...rows.map(r => r.p95)), 5);
  const x0 = xt[0], x1 = xt[xt.length - 1], X = v => pad.l + (W - pad.l - pad.r) * (v - x0) / (x1 - x0 || 1);
  let g = '';
  xt.forEach(v => { g += `<line class="gl" x1="${X(v)}" x2="${X(v)}" y1="${pad.t}" y2="${H - pad.b}"/><text x="${X(v)}" y="${H - 8}" text-anchor="middle">${fmt(v)}</text>`; });
  rows.forEach((r, i) => {
    const y = pad.t + i * rowH + rowH / 2;
    g += `<text class="lbl" x="${pad.l - 10}" y="${y + 4}" text-anchor="end">${esc(r.label)}</text>`;
    g += `<line x1="${X(r.p5)}" x2="${X(r.p95)}" y1="${y}" y2="${y}" stroke="${r.color}" stroke-width="1.5"/>`;
    g += `<line x1="${X(r.p5)}" x2="${X(r.p5)}" y1="${y - 5}" y2="${y + 5}" stroke="${r.color}"/><line x1="${X(r.p95)}" x2="${X(r.p95)}" y1="${y - 5}" y2="${y + 5}" stroke="${r.color}"/>`;
    g += `<rect x="${X(r.lo)}" y="${y - 7}" width="${Math.max(2, X(r.hi) - X(r.lo))}" height="14" fill="${r.color}" opacity=".35" stroke="${r.color}"/>`;
    g += `<line x1="${X(r.mean)}" x2="${X(r.mean)}" y1="${y - 9}" y2="${y + 9}" stroke="${r.color}" stroke-width="2.5"/>`;
    g += `<text x="${W - pad.r + 8}" y="${y + 4}" class="strong">${fmt(r.mean)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** groups: [{label,color,values}] overlaid histograms */
export function histogram({ groups, W = 640, H = 220, bins = 30, fmt = v => v }) {
  const all = groups.flatMap(g => g.values); if (!all.length) return '';
  let lo = Math.min(...all), hi = Math.max(...all); if (lo === hi) { lo -= 1; hi += 1; }
  const bw = (hi - lo) / bins;
  const counts = groups.map(g => { const c = new Array(bins).fill(0); g.values.forEach(v => c[Math.min(bins - 1, Math.floor((v - lo) / bw))]++); return c.map(x => x / g.values.length); });
  const ymax = Math.max(...counts.flat());
  const pad = { l: 40, r: 12, t: 10, b: 24 };
  const X = v => pad.l + (W - pad.l - pad.r) * (v - lo) / (hi - lo), Y = v => H - pad.b - (H - pad.t - pad.b) * v / ymax;
  const yt = niceTicks(0, ymax, 3);
  let g = frame(W, H, pad, niceTicks(lo, hi, 6).filter(v => v >= lo && v <= hi), yt.filter(v => v <= ymax * 1.001), X, Y, fmt, v => Math.round(v * 100) + '%');
  groups.forEach((gr, gi) => {
    const pts = []; counts[gi].forEach((c, i) => { pts.push(`${X(lo + i * bw)},${Y(c)}`, `${X(lo + (i + 1) * bw)},${Y(c)}`); });
    g += `<polygon points="${X(lo)},${Y(0)} ${pts.join(' ')} ${X(hi)},${Y(0)}" fill="${gr.color}" opacity=".22" stroke="${gr.color}" stroke-width="1.2"/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** pts: [{x,y,color,r,label,hl}] frontier: [[x,y]] */
export function scatter({ pts, frontier = [], W = 640, H = 300, xfmt = v => v, yfmt = v => v }) {
  const pad = { l: 52, r: 16, t: 16, b: 26 };
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xt = niceTicks(Math.min(0, ...xs), Math.max(...xs), 6), yt = niceTicks(Math.min(0, ...ys), Math.max(...ys), 5);
  const x0 = xt[0], x1 = xt[xt.length - 1], y0 = yt[0], y1 = yt[yt.length - 1];
  const X = v => pad.l + (W - pad.l - pad.r) * (v - x0) / (x1 - x0 || 1), Y = v => H - pad.b - (H - pad.t - pad.b) * (v - y0) / (y1 - y0 || 1);
  let g = frame(W, H, pad, xt, yt, X, Y, xfmt, yfmt);
  if (y0 < 0) g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line-strong)" stroke-dasharray="3 3"/>`;
  pts.filter(p => !p.hl).forEach(p => { g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r || 2.6}" fill="${p.color || 'var(--c-base)'}" opacity=".7"/>`; });
  if (frontier.length) g += `<polyline fill="none" stroke="var(--accent)" stroke-width="1.75" points="${frontier.map(p => `${X(p[0])},${Y(p[1])}`).join(' ')}"/>`;
  frontier.forEach(p => { g += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3" fill="var(--accent)"/>`; });
  pts.filter(p => p.hl).forEach(p => {
    g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="6" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
    if (p.label) g += `<text x="${X(p.x) + 10}" y="${Y(p.y) - 8}" class="strong" style="fill:var(--accent)">${esc(p.label)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** Yamazumi (line-balance) chart: grouped bars of effective cycle time per station vs takt. groups: [{label,color}], rows: [{label, values:[...]}] */
export function yamazumi({ rows, groups, takt, W = 640, H = 280, fmt = v => v }) {
  const pad = { l: 44, r: 16, t: 20, b: 40 };
  const ymax = Math.max(takt * 1.15, ...rows.flatMap(r => r.values));
  const yt = niceTicks(0, ymax, 4), y1 = yt[yt.length - 1];
  const Y = v => H - pad.b - (H - pad.t - pad.b) * v / y1;
  const cw = (W - pad.l - pad.r) / rows.length, bw = Math.min(34, cw * 0.7 / groups.length);
  let g = '';
  yt.forEach(v => { g += `<line class="gl" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pad.l - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; });
  rows.forEach((r, i) => {
    const cx = pad.l + cw * i + cw / 2, x0 = cx - bw * groups.length / 2;
    r.values.forEach((v, j) => {
      const over = v > takt;
      g += `<rect x="${x0 + j * bw + 2}" y="${Y(v)}" width="${bw - 4}" height="${Y(0) - Y(v)}" rx="3" fill="${over ? 'var(--neg)' : groups[j].color}" ${j === 0 ? 'fill-opacity=".45"' : ''}/>`;
      g += `<text x="${x0 + j * bw + bw / 2}" y="${Y(v) - 5}" text-anchor="middle" class="${j === groups.length - 1 ? 'strong' : ''}">${fmt(v)}</text>`;
    });
    g += `<text class="lbl" x="${cx}" y="${H - pad.b + 18}" text-anchor="middle">${esc(r.label)}</text>`;
  });
  g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(takt)}" y2="${Y(takt)}" stroke="var(--neg)" stroke-dasharray="6 4" stroke-width="1.5"/>`;
  g += `<text x="${W - pad.r}" y="${Y(takt) - 6}" text-anchor="end" class="strong" style="fill:var(--neg)">Takt ${fmt(takt)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/** Pareto frontier (min x, max y) */
export function frontierOf(points) {
  const s = [...points].sort((a, b) => a.x - b.x || b.y - a.y); const f = []; let best = -Infinity;
  s.forEach(p => { if (p.y > best) { f.push(p); best = p.y; } });
  return f;
}
