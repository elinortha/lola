# Mixing Bench

Mix recipes for the palette you want, from the paints you actually own.

Put your paints on the shelf (acrylics, watercolors, gouache, oils, soft
pastels), paste a palette you like — a [Coolors](https://coolors.co) link
works directly — and get mixing recipes: which of *your* paints to combine,
in what parts, to land closest to each target color.

## How to use it

Open `index.html` in any browser — no build step, no server, no install.
Everything is saved locally in your browser.

1. **Paint shelf** — add each paint you own. Use "Quick-add common paints"
   for the usual suspects; the pigment code (like `PB29`) is printed on the
   tube label. Sample paints are loaded the first time so you can see how
   it works.
2. **Target palette** — paste a Coolors URL or hex codes, or pick colors
   by hand.
3. **Recipes** — pick which medium to mix with and read the cards: the
   target and the predicted mix sit side by side, with parts ratios and a
   CIEDE2000 match score. Watercolor recipes use water as an ingredient;
   pastel recipes suggest sticks to layer instead of ratios.

## How it works

- **Paint mixing** is predicted with [Mixbox](https://github.com/scrtwpns/mixbox)
  (Šárka Sochorová & Ondřej Jamriška, Secret Weapons — SIGGRAPH 2022),
  which models pigment mixing (Kubelka–Munk behavior) in a latent space,
  so ultramarine + cadmium yellow makes green, not gray.
- **Color matching** uses the CIEDE2000 perceptual color difference in
  CIELAB. The solver (`solver.js`) searches singles, pairs, and triples of
  your paints with a ratio grid plus local refinement, and prefers simpler
  mixes when the match is comparable.
- Recipes are predictions, not lab formulas: expect to land close and
  fine-tune by eye. Acrylics dry slightly darker; brands vary in pigment
  load.

## Tests

```
node test/solver.test.js
```

Covers the color conversions (including CIEDE2000 reference pairs from
Sharma et al. 2005), paint-like mixing behavior, recovery of a known
blend, watercolor dilution rules, and pastel constraints.

## Licensing

The app code is part of this repository. `vendor/mixbox.js` is Mixbox 2.0,
© Secret Weapons, licensed **CC BY-NC 4.0** (see `vendor/MIXBOX-LICENSE`) —
free for personal, non-commercial use like this app. If you ever want to
ship this commercially, Mixbox offers a commercial license at
mixbox@scrtwpns.com.
