// Mixing Bench — recipe solver.
// Given a target color and a set of paints, finds 1-3 paint combinations
// (with mixing ratios) whose Mixbox-predicted mixture is perceptually
// closest to the target (CIEDE2000 in CIELAB).
//
// Works in the browser (window.PaintSolver, expects window.mixbox) and in
// Node (module.exports, requires ../vendor/mixbox.js) so the solver can be
// unit-tested outside the page.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/mixbox.js'));
  } else {
    root.PaintSolver = factory(root.mixbox);
  }
})(typeof self !== 'undefined' ? self : this, function (mixbox) {
  'use strict';

  // ---------- color conversions ----------

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(rgb) {
    return '#' + rgb.map(function (c) {
      return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
    }).join('');
  }

  function srgbToLinear(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  // sRGB (D65) -> CIELAB
  function labFromRgb(rgb) {
    var r = srgbToLinear(rgb[0]), g = srgbToLinear(rgb[1]), b = srgbToLinear(rgb[2]);
    var X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
    var Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
    var Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
    var xr = X / 0.95047, yr = Y / 1.0, zr = Z / 1.08883;
    var e = 216 / 24389, k = 24389 / 27;
    var fx = xr > e ? Math.cbrt(xr) : (k * xr + 16) / 116;
    var fy = yr > e ? Math.cbrt(yr) : (k * yr + 16) / 116;
    var fz = zr > e ? Math.cbrt(zr) : (k * zr + 16) / 116;
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  // CIEDE2000 color difference (Sharma et al. implementation).
  function deltaE2000(lab1, lab2) {
    var L1 = lab1[0], a1 = lab1[1], b1 = lab1[2];
    var L2 = lab2[0], a2 = lab2[1], b2 = lab2[2];
    var rad = Math.PI / 180;

    var C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    var Cbar = (C1 + C2) / 2;
    var Cbar7 = Math.pow(Cbar, 7);
    var G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));
    var a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    var C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    var h1p = C1p === 0 ? 0 : (Math.atan2(b1, a1p) / rad + 360) % 360;
    var h2p = C2p === 0 ? 0 : (Math.atan2(b2, a2p) / rad + 360) % 360;

    var dLp = L2 - L1;
    var dCp = C2p - C1p;
    var dhp = 0;
    if (C1p * C2p !== 0) {
      dhp = h2p - h1p;
      if (dhp > 180) dhp -= 360;
      else if (dhp < -180) dhp += 360;
    }
    var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);

    var Lbarp = (L1 + L2) / 2;
    var Cbarp = (C1p + C2p) / 2;
    var hbarp;
    if (C1p * C2p === 0) {
      hbarp = h1p + h2p;
    } else if (Math.abs(h1p - h2p) <= 180) {
      hbarp = (h1p + h2p) / 2;
    } else {
      hbarp = (h1p + h2p) / 2 + (h1p + h2p < 360 ? 180 : -180);
    }

    var T = 1
      - 0.17 * Math.cos((hbarp - 30) * rad)
      + 0.24 * Math.cos(2 * hbarp * rad)
      + 0.32 * Math.cos((3 * hbarp + 6) * rad)
      - 0.20 * Math.cos((4 * hbarp - 63) * rad);
    var dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
    var Cbarp7 = Math.pow(Cbarp, 7);
    var RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
    var SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
    var SC = 1 + 0.045 * Cbarp;
    var SH = 1 + 0.015 * Cbarp * T;
    var RT = -Math.sin(2 * dTheta * rad) * RC;

    var vL = dLp / SL, vC = dCp / SC, vH = dHp / SH;
    return Math.sqrt(vL * vL + vC * vC + vH * vH + RT * vC * vH);
  }

  // ---------- mixture prediction ----------

  function latentOf(hex) {
    var rgb = hexToRgb(hex);
    return mixbox.rgbToLatent(rgb[0], rgb[1], rgb[2]);
  }

  function predictRgb(latents, weights) {
    var z = [0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < latents.length; i++) {
      var zi = latents[i], w = weights[i];
      for (var j = 0; j < 7; j++) z[j] += w * zi[j];
    }
    var rgb = mixbox.latentToRgb(z);
    return [rgb[0], rgb[1], rgb[2]];
  }

  // ---------- recipe search ----------

  // Enumerate positive integer compositions of `total` into `k` parts.
  function compositions(total, k) {
    var out = [];
    if (k === 2) {
      for (var i = 1; i < total; i++) out.push([i, total - i]);
    } else if (k === 3) {
      for (var a = 1; a < total - 1; a++)
        for (var b = 1; b < total - a; b++)
          out.push([a, b, total - a - b]);
    }
    return out;
  }

  function scoreOf(deltaE, realComponentCount) {
    // Small preference for simpler mixes: a 3-paint recipe must beat a
    // 2-paint one by a visible margin to outrank it.
    return deltaE + 0.55 * (realComponentCount - 1);
  }

  function evalCombo(targetLab, combo, weights) {
    var rgb = predictRgb(combo.map(function (c) { return c.latent; }), weights);
    return deltaE2000(targetLab, labFromRgb(rgb));
  }

  // Local refinement: shift weight between component pairs while it improves.
  function refine(targetLab, combo, weights) {
    var best = evalCombo(targetLab, combo, weights);
    var steps = [0.05, 0.02, 0.01];
    for (var s = 0; s < steps.length; s++) {
      var step = steps[s], improved = true, guard = 0;
      while (improved && guard++ < 60) {
        improved = false;
        for (var i = 0; i < weights.length; i++) {
          for (var j = 0; j < weights.length; j++) {
            if (i === j || weights[j] < 0.03 + step) continue;
            var w2 = weights.slice();
            w2[i] += step; w2[j] -= step;
            var d = evalCombo(targetLab, combo, w2);
            if (d < best - 1e-4) { best = d; weights = w2; improved = true; }
          }
        }
      }
    }
    return { weights: weights, deltaE: best };
  }

  // Convert weights to friendly integer parts (total <= maxParts).
  function weightsToParts(weights, maxParts) {
    maxParts = maxParts || 10;
    var best = null;
    for (var total = weights.length; total <= maxParts; total++) {
      var parts = weights.map(function (w) { return Math.max(1, Math.round(w * total)); });
      var sum = parts.reduce(function (a, b) { return a + b; }, 0);
      var err = 0;
      for (var i = 0; i < weights.length; i++) err += Math.abs(parts[i] / sum - weights[i]);
      if (!best || err < best.err - 1e-9) best = { parts: parts, err: err };
    }
    // Reduce by GCD so 2:2 reads as 1:1.
    var g = best.parts.reduce(function (a, b) {
      while (b) { var t = b; b = a % b; a = t; }
      return a;
    });
    return best.parts.map(function (p) { return p / g; });
  }

  /**
   * solve(targetHex, paints, opts) -> [{components:[{paint, weight, parts}], hex, deltaE, score}]
   *   paints: [{id, name, hex, isWater?, ...}]  (isWater marks the watercolor diluent)
   *   opts:   {maxResults: 3, pastel: false}
   * Recipes are ranked by deltaE plus a simplicity penalty; one recipe per
   * distinct set of paints; singles, pairs, and triples are searched.
   */
  function solve(targetHex, paints, opts) {
    opts = opts || {};
    var maxResults = opts.maxResults || 3;
    var pastel = !!opts.pastel;
    var targetLab = labFromRgb(hexToRgb(targetHex));

    var comps = paints.map(function (p) {
      return { paint: p, latent: latentOf(p.hex), isWater: !!p.isWater };
    });
    var real = comps.filter(function (c) { return !c.isWater; });
    if (real.length === 0) return [];

    // Best candidate per distinct paint set.
    var bySet = {};
    function consider(combo, weights, deltaE) {
      var realCount = combo.filter(function (c) { return !c.isWater; }).length;
      var key = combo.map(function (c) { return c.paint.id; }).sort().join('|');
      var score = scoreOf(deltaE, realCount);
      if (!bySet[key] || score < bySet[key].score) {
        bySet[key] = { combo: combo, weights: weights, deltaE: deltaE, score: score };
      }
    }

    // Singles (never plain water).
    real.forEach(function (c) {
      consider([c], [1], evalCombo(targetLab, [c], [1]));
    });

    // Pairs.
    for (var i = 0; i < comps.length; i++) {
      for (var j = i + 1; j < comps.length; j++) {
        var pair = [comps[i], comps[j]];
        if (pair.every(function (c) { return c.isWater; })) continue;
        var ts = pastel ? [0.25, 0.5, 0.75]
                        : [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5,
                           0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];
        for (var t = 0; t < ts.length; t++) {
          var w = [1 - ts[t], ts[t]];
          consider(pair, w, evalCombo(targetLab, pair, w));
        }
      }
    }

    // Triples (skipped for pastels — you don't blend three sticks by ratio).
    if (!pastel) {
      // With a big shelf, only try triples among the paints closest to the
      // target (plus water) to keep the search fast.
      var pool = comps;
      if (comps.length > 18) {
        pool = comps.slice().sort(function (a, b) {
          return evalCombo(targetLab, [a], [1]) - evalCombo(targetLab, [b], [1]);
        }).slice(0, 16);
        var water = comps.find(function (c) { return c.isWater; });
        if (water && pool.indexOf(water) < 0) pool.push(water);
      }
      var grid = compositions(8, 3);
      for (var a = 0; a < pool.length; a++) {
        for (var b = a + 1; b < pool.length; b++) {
          for (var c = b + 1; c < pool.length; c++) {
            var triple = [pool[a], pool[b], pool[c]];
            for (var gI = 0; gI < grid.length; gI++) {
              var gw = grid[gI].map(function (p) { return p / 8; });
              consider(triple, gw, evalCombo(targetLab, triple, gw));
            }
          }
        }
      }
    }

    // Refine the leading candidates, then rank.
    var candidates = Object.keys(bySet).map(function (k) { return bySet[k]; });
    candidates.sort(function (x, y) { return x.score - y.score; });
    var results = candidates.slice(0, Math.max(maxResults * 4, 12)).map(function (cand) {
      var refined = cand.combo.length > 1 && !pastel
        ? refine(targetLab, cand.combo, cand.weights.slice())
        : { weights: cand.weights, deltaE: cand.deltaE };
      var realCount = cand.combo.filter(function (c) { return !c.isWater; }).length;
      var parts = weightsToParts(refined.weights);
      var rgb = predictRgb(cand.combo.map(function (c) { return c.latent; }), refined.weights);
      return {
        components: cand.combo.map(function (c, idx) {
          return { paint: c.paint, weight: refined.weights[idx], parts: parts[idx] };
        }).sort(function (x, y) { return y.weight - x.weight; }),
        hex: rgbToHex(rgb),
        deltaE: refined.deltaE,
        score: scoreOf(refined.deltaE, realCount)
      };
    });
    results.sort(function (x, y) { return x.score - y.score; });
    return results.slice(0, maxResults);
  }

  return {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    labFromRgb: labFromRgb,
    deltaE2000: deltaE2000,
    predictRgb: predictRgb,
    latentOf: latentOf,
    weightsToParts: weightsToParts,
    solve: solve
  };
});
