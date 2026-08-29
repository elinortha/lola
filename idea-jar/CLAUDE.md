# The Idea Jar — project notes for Claude

A private, personal craft-ideas browser for one family (Lola + a 3yo and a
1yo). Next.js App Router, TypeScript, no Tailwind — styling is hand-written
CSS custom properties in `src/app/globals.css` (light + dark via
`prefers-color-scheme`). The roadmap is PLAN.md; currently at Phase 0/1.

## Data model — the important invariant

All content is JSON, no database yet:

- `data/vocab.json` — controlled vocabularies (whoFor, materials, tools,
  craftTypes, time, mess, safety, occasions, status).
- `data/projects.json` — the projects. Every controlled-field value MUST
  exactly match a term in vocab.json; `subjects` is the one freeform field.
  `scripts/check-data.mjs` enforces this and runs before every build.

When renaming a vocab term, update every project that uses it. When adding a
project with a tag that isn't in the vocab yet, add the vocab term too.
Exact string matching is what makes filtering (and the future Phase 2
inventory matching) work — never fuzzy-match.

## Conventions

- Project ids are kebab-case and double as URL slugs (`/project/[id]`).
- Images live in `public/images/`, referenced root-relative. Plain `<img>`
  is used deliberately (the `@next/next/no-img-element` rule is off).
- Current sample projects use generated SVG placeholders; they'll be
  replaced by real pin images over time.
- Keep the app phone-first: check layouts at ~400px width.

## Privacy

Saved pin images belong to their original creators. The deployed app must
stay behind Vercel Authentication, and real pin images must only be
committed to a private repo — as long as this code sits in the public
`lola` repo, only placeholder images may be committed.

## Validation before pushing

`npm run check && npm run lint && npm run build`
