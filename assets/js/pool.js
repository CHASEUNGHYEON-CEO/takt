// Parallel simulation pool: spreads replications over all CPU cores.
import { buildConfig, aggregate } from './engine.js?v=202611231110';

const SIZE = Math.max(2, Math.min(12, (navigator.hardwareConcurrency || 4) - 1));
let workers = [], queue = [], busy = new Map(), nextId = 1, cancelled = false;

function ensure() {
  if (workers.length) return;
  for (let i = 0; i < SIZE; i++) {
    const w = new Worker(new URL('./worker.js?v=202611231110', import.meta.url), { type: 'module' });
    w.onmessage = (e) => { const job = busy.get(w); busy.delete(w); job.resolve(e.data.runs); pump(); };
    w.onerror = (e) => { const job = busy.get(w); busy.delete(w); job && job.reject(e); pump(); };
    workers.push(w);
  }
}
function pump() {
  for (const w of workers) {
    if (busy.has(w) || !queue.length) continue;
    const job = queue.shift();
    busy.set(w, job);
    w.postMessage(job.msg);
  }
}
function submit(msg) {
  return new Promise((resolve, reject) => { queue.push({ msg, resolve, reject }); pump(); });
}

export const poolSize = SIZE;
export function cancelAll() {
  cancelled = true;
  const err = new Error('cancelled');
  queue.forEach(j => j.reject(err)); queue = [];
  busy.forEach(j => j.reject(err));
  workers.forEach(w => w.terminate()); workers = []; busy.clear();
}

/**
 * Evaluate many design points. points: [{key, levers}] ; returns Map key -> aggregate.
 * onProgress(doneSims, totalSims)
 */
export async function evaluate(caseDef, points, reps, onProgress, seed0 = 1000) {
  ensure(); cancelled = false;
  const chunk = Math.max(1, Math.ceil(reps / Math.max(1, Math.ceil(SIZE / points.length))));
  const total = points.length * reps; let done = 0;
  const plain = JSON.parse(JSON.stringify(caseDef));
  const results = new Map();
  await Promise.all(points.map(async (p) => {
    const parts = [];
    for (let r = 0; r < reps; r += chunk) {
      const n = Math.min(chunk, reps - r);
      parts.push(submit({ id: nextId++, caseDef: plain, levers: p.levers, risk: p.risk || {}, reps: n, seed0: seed0 + r * 7919 })
        .then(runs => { done += n; onProgress && onProgress(done, total); return runs; }));
    }
    const runs = (await Promise.all(parts)).flat();
    if (cancelled) return;
    results.set(p.key, aggregate(buildConfig(caseDef, p.levers, p.risk || {}), caseDef, runs));
  }));
  return results;
}
