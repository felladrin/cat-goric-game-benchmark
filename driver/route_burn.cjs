"use strict";
// ROUTE_BURN (gated, off by default): a gem whose every collector floor is
// destroyed by the lasers well before the gem itself.
//
// The objective menu's clock is the gem's own deadline (route_clock.gemDeadline),
// but a floating gem can only be collected from the floors whose jump arcs touch
// it, and those floors shrink and vanish under the lasers (platform_live.cjs).
// On L10, gem_c's deadline is mf 335 while its only collector floors (the tower
// at x 330) are gone at mf 142. At the decisive state (261.75,150) mf 74 the
// model, holding gem_a or gem_b, walks away from gem_c's only route in 75 of
// the lives that lost it, while 5 of the 7 lives that won held gem_c there
// (docs/results.md, 2026-10-11).
//
// Collector = a full-width floor from which standing, or a held jump, jump_left
// or jump_right from some x, touches the gem's box (16x16, the box the
// NEG_HOLD census uses). The floor is gone when every platform in it has scale 0.
// The line is a fact about the floors, not advice: when they are gone, in frames.
const A = require("./arc.cjs");
const R = require("./reachability.cjs");
const L = require("./level_data.cjs");
const { scaleAt } = require("./platform_live.cjs");
const RC = require("./route_clock.cjs");

const MIN_LEAD = 100; // the floors must go at least this many frames before the gem ("long before")
const MAX_AHEAD = 200; // and within this many frames of now
const CAT_H = 18;
const cache = new Map();

function vanishMf(x, y) {
  for (let m = 0; m < 2000; m++) if (scaleAt(x, y, m) <= 0) return m;
  return Infinity;
}

// Last movingFrame at which any collector floor of the gem still exists, or null
// when no floor collects it. Static geometry at clock 0 decides WHICH floors
// collect; scaleAt decides WHEN they vanish.
function collectorsGone(level, gx, gy) {
  const ck = `${level}|${gx},${gy}`;
  if (cache.has(ck)) return cache.get(ck);
  const prev = process.env.SHRINK_GEOM;
  delete process.env.SHRINK_GEOM; // full-width floors, no clock needed
  let last = null;
  try {
    const hit = (cx, cy) => cx < gx + 8 && cx + 1 > gx - 8 && cy - CAT_H < gy + 8 && cy > gy - 8;
    for (const r of R.runsOf(level)) {
      let collects = false;
      for (let x = Math.ceil(r.left); x <= r.right && !collects; x += 2) {
        if (hit(x, r.y)) { collects = true; break; }
        for (const act of ["jump", "jump_left", "jump_right"]) {
          let t = false;
          A.simulate(level, x, r.y, 0, CAT_H, act, 0, { grounded: true, onFrame: (fx, fy) => { if (hit(fx, fy)) t = true; } });
          if (t) { collects = true; break; }
        }
      }
      if (!collects) continue;
      const gone = Math.max(...L.platforms(level).filter(([px, py]) => py === r.y && px >= r.left && px <= r.right).map(([px, py]) => vanishMf(px, py)));
      last = last == null ? gone : Math.max(last, gone);
    }
  } finally {
    if (prev === undefined) delete process.env.SHRINK_GEOM; else process.env.SHRINK_GEOM = prev;
  }
  cache.set(ck, last);
  return last;
}

// The sentence appended to the gem's menu line, or "".
function routeBurnLine(level, gx, gy, mf) {
  if (process.env.ROUTE_BURN !== "1") return "";
  const gone = collectorsGone(level, gx, gy);
  if (gone == null) return "";
  if (gone > RC.gemDeadline(gx, gy) - MIN_LEAD) return "";
  const n = Math.round(gone - mf);
  if (n <= 0 || n > MAX_AHEAD) return "";
  return ` Every floor this gem can be collected from is destroyed by the lasers in about ${n} moving frames, long before the gem itself.`;
}

module.exports = { collectorsGone, routeBurnLine };
