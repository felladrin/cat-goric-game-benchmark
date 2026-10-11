"use strict";
// ROUTE_BURN: the line names a gem whose collector floors vanish long before it.
const assert = require("assert");
delete process.env.ROUTE_BURN;
delete process.env.SHRINK_GEOM;
const B = require("./route_burn.cjs");

// L10 gem_c (287,68): deadline mf 335, its tower collector floors gone at mf 142.
assert.strictEqual(B.collectorsGone(10, 287, 68), 142);
assert.strictEqual(B.routeBurnLine(10, 287, 68, 74), "", "gate off: no line");

process.env.ROUTE_BURN = "1";
assert.ok(B.routeBurnLine(10, 287, 68, 74).includes("in about 68 moving frames"), B.routeBurnLine(10, 287, 68, 74));
assert.strictEqual(B.routeBurnLine(10, 287, 68, 150), "", "floors already gone: no line");
// L10 gem_a (229,123): collectors last to mf 602, deadline 610 -> not 'long before'.
assert.strictEqual(B.routeBurnLine(10, 229, 123, 450), "");
// L0 gem_c: collectors gone 650 vs deadline 725, a 75-frame lead, under MIN_LEAD.
assert.strictEqual(B.routeBurnLine(0, ...require("./experiments/gem_table.cjs")()[0][2], 500), "");
// SHRINK_GEOM on must not change which floors collect (full-width census).
process.env.SHRINK_GEOM = "1";
require("./platform_live.cjs").setClock(80);
assert.strictEqual(B.collectorsGone(9, ...require("./experiments/gem_table.cjs")()[9][0]), 100);
delete process.env.SHRINK_GEOM;
delete process.env.ROUTE_BURN;
console.log("test_route_burn: Failed: 0");
