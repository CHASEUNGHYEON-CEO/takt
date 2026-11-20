import { buildConfig, createSim, summarize, shiftProfit } from './engine.js?v=202611200100';

self.onmessage = (e) => {
  const { id, caseDef, levers, risk, reps, seed0 } = e.data;
  const cfg = buildConfig(caseDef, levers, risk);
  const runs = [];
  for (let r = 0; r < reps; r++) {
    const res = summarize(createSim(cfg, seed0 + r * 7919).runToEnd());
    res.profit = shiftProfit(cfg, res);
    runs.push(res);
  }
  self.postMessage({ id, runs });
};
