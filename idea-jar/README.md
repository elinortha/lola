# 🫙 The Idea Jar

A private, personal craft-ideas browser: saved project ideas tagged by who
they're for, materials, tools, craft type and more — so on a Sunday with an
empty egg carton you can find the right project in under a minute.

The full build plan lives in [PLAN.md](PLAN.md). This is the Phase 0/1 app:
a browsable, filterable gallery with data stored as plain JSON files.

## How to tweak it (the everyday stuff)

All the content lives in two JSON files — no code changes needed:

### Add a project

1. Add an entry to [`data/projects.json`](data/projects.json) — copy an
   existing one and edit it. Every tag must exactly match a term in
   `data/vocab.json` (the build tells you if one doesn't).
2. Drop its image into `public/images/` and point the `"image"` field at it,
   e.g. `"/images/my-project.jpg"`.
3. Done. Push (or redeploy) and it appears.

The 9 projects in there now are **samples with placeholder images** — replace
them with your real pins as they come in.

### Edit the tag vocabulary

Add, rename, or remove terms in [`data/vocab.json`](data/vocab.json). If you
rename a term, rename it everywhere it appears in `projects.json` too —
`npm run check` will point out any mismatches.

### Or just ask

Open this repo in Claude Code and say things like *"add this pin: [link] — egg
carton wreath, preschooler with help, needs glue and scissors"* or *"add
'air dry clay' to the materials vocab."*

## Commands

```bash
npm install      # once, after cloning
npm run dev      # local dev server at http://localhost:3000
npm run check    # validate projects.json against vocab.json
npm run build    # production build (runs the check first)
```

## Where things live

```
data/vocab.json        the controlled tag vocabularies (yours to curate)
data/projects.json     every saved project idea
public/images/         one image per project
src/components/Gallery.tsx    the filterable gallery
src/app/project/[id]/         the project detail page
src/app/globals.css    colors, fonts, all styling
```

## Privacy note

Pinned images belong to their original creators, so this app stays private:
the deployment sits behind Vercel Authentication, and real pin images should
only ever be committed to a **private** repo.

## What's next

See [PLAN.md](PLAN.md) — Phase 2 adds the on-hand inventory and the
"makeable now" / "almost" / "use it up" views; Phase 3 adds adding and
tagging projects straight from a phone.
