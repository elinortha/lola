# The Idea Jar — Project Plan

*A personal craft-ideas browser: all your saved Pinterest projects, tagged with what they need and who they're for, filterable by what's actually in the craft cabinet.*

Working name is a placeholder — rename at will (Craft Shelf, Idea Basket, Make Today…).

> **Status (updated 2026-08-29):** Phase 0 and most of Phase 1 are built — the app
> lives in [`idea-jar/`](idea-jar/) on this branch: vocab + projects as JSON,
> 9 sample projects with placeholder images, filterable gallery, detail pages,
> data validation in the build. Remaining before Phase 2:
> 1. Lola creates the **private** GitHub repo `idea-jar` and grants Claude access
>    (claude.ai → Settings → Connectors → GitHub, or the org's Claude GitHub settings);
>    then the app moves there and real pin images become safe to commit.
> 2. Lola imports that repo at **vercel.com/new** (the Vercel connector here can
>    manage existing projects but isn't permitted to create one); then Claude
>    enables Vercel Authentication so the site is private.
> 3. Pinterest data export: requested, waiting for the email.

---

## 1. The vision

You have hundreds of saved project ideas scattered across Pinterest boards. The app turns them into a browsable, taggable library, plus a running inventory of the materials and tools you actually own. Then the core moment works:

> **The egg-carton test:** It's Sunday. There's an empty egg carton on the counter and two kids who need a project. You open the app on your phone, and in under a minute you're looking at every project you've ever saved that (a) uses an egg carton, (b) needs only stuff you have on hand, and (c) a 3-year-old can do.

Everything in this plan is in service of passing that test.

### Guiding constraints

1. **Private, for now.** The images belong to their original creators, so this is a personal reference tool — not published, not shared. The long-game escape hatch: as you re-make projects yourself, replace the Pinterest photo with your own photos (and step-by-steps), and one day the app could go public for parents everywhere.
2. **Phone-first browsing.** The egg-carton moment happens in the kitchen, not at a desk. Browsing and filtering must be great on a phone from day one.
3. **Small, complete phases.** You're building this over time in spare moments. Every phase ends with something that works end-to-end, so the project is useful even if you pause for two months.
4. **The data outlives the app.** Projects and tags live in plain, portable formats (JSON, then a simple database) so you can rebuild the UI, switch tools, or export everything without losing years of tagging work.
5. **Tagging must be nearly effortless.** The library is only as good as its tags, and you'll be tagging hundreds of pins. The tagging screen is the most important screen in the app — big tap-to-toggle chips, no typing unless you want to.

---

## 2. The data model

Two kinds of records: **Projects** and your **Inventory**.

### A project

```json
{
  "id": "egg-carton-flowers",
  "title": "Egg carton flowers",
  "image": "egg-carton-flowers.jpg",
  "source": "https://www.pinterest.com/pin/...",
  "notes": "Could glue to popsicle stems instead",
  "whoFor": ["preschooler-with-help"],
  "materials": ["egg carton", "paint", "pipe cleaners"],
  "tools": ["scissors", "hole punch"],
  "craftType": ["recycled crafts"],
  "subjects": ["flowers", "spring"],
  "time": "under-1-hour",
  "mess": "some-mess",
  "safety": ["sharp-tools"],
  "occasion": [],
  "status": "to-try"
}
```

### Tag categories

Two different kinds of tags, treated differently:

- **Controlled vocabularies** (pick from a fixed list you curate): materials, tools, craft type, who-for, time, mess, safety, occasion. These have to be controlled or inventory matching breaks — if one project says `pipecleaners` and your inventory says `pipe cleaners`, they'll never match.
- **Freeform tags**: subjects (owl, house, rainbow, dinosaur…). Infinite variety, no matching logic depends on them, so just type what fits.

| Category | Type | Examples | Why it exists |
|---|---|---|---|
| **Who's it for** | controlled | see ladder below | The core "can my kid do this?" question |
| **Materials** | controlled | egg carton, cardboard, pipe cleaners, beads, brads, yarn, felt | Matched against inventory |
| **Tools** | controlled | scissors, dremel, crochet hook, bead loom, knitting needles | Matched against inventory |
| **Craft type** | controlled | paper crafts, origami, fiber arts, crochet, amigurumi, stained glass, macrame | Browsing by mood/medium |
| **Subjects** | freeform | owl, nature, house, flowers, space | Search: "something with owls" |
| **Time** | controlled | under 15 min / under an hour / an afternoon / multi-day | Matching the project to the window you have |
| **Mess level** | controlled | clean / some mess / tarp-worthy | Glitter is a decision, not an accident |
| **Safety flags** | controlled | small parts (1yo hazard!), sharp tools, hot glue, needs full supervision | With a 1-year-old orbiting, this matters |
| **Occasion / season** | controlled | Christmas, Halloween, Easter, birthday, spring, fall | "It's December, show me the shelf" |
| **Status** | controlled | to try / done / favorite / didn't work | Turns the library into a log over time |

Other categories will occur to you as you tag — the vocab lists are just files you edit, so adding a category later is cheap. Candidates to keep in your back pocket: *gift-worthy*, *indoor/outdoor*, *uses recyclables*, *technique to learn*.

### The "who's it for" ladder

You described one scale running from 1-year-old to "even I'd have to work at it." Model it as a ladder, multi-select (many projects adapt across ages):

1. **Little hands** — a 1yo can genuinely participate (smooshing, sticking, dot markers)
2. **Preschooler with help** — a 3yo drives, an adult does the cutting/gluing
3. **Preschooler solo** — a 3yo can mostly run with it
4. **Grown-up, relaxing** — easy adult craft, do it while watching TV
5. **Grown-up, challenge** — you'd need to concentrate, maybe learn something
6. **Stretch goal** — you'd need to level up a skill first

The safety flags stay separate from this ladder on purpose: "3yo could do it" and "involves small beads a 1yo could swallow" are both things you need to know on a Sunday.

### The inventory

A simple checklist of the same controlled vocab, split into:

- **Tools** — stable, rarely changes (you own a crochet hook or you don't)
- **Materials** — mostly stable staples (glue, construction paper) plus things you toggle off when you run out (googly eyes, brads)

Keep it binary — *have / don't have*. No quantities; that's a chore you'd stop doing. Recyclables (egg cartons, toilet paper rolls, jars) live in the materials list too, but the egg-carton moment is usually better served by the "use it up" search below than by keeping their toggles current.

### The matching logic (the whole point)

- **Makeable now** — projects where every required material is on hand AND every required tool is owned.
- **Almost** — missing exactly one thing. Surprisingly useful: it generates your craft-store list, and "missing: googly eyes" is a solvable problem before Sunday.
- **Use it up** — pick one material ("egg carton") and see everything that uses it, with makeable-now ones sorted first.
- All of it combinable with the other filters: *makeable now* + *preschooler with help* + *under an hour* is the Sunday query.

---

## 3. Getting your ideas out of Pinterest

Three lanes, in order of effort:

1. **Quick-add (day one, and forever).** A form: paste the pin link, upload/paste the image, type a title. This is how new saves trickle in going forward.
2. **Bulk import (once).** Pinterest will email you an export of your account data (Settings → Privacy and data → Request your data — takes a day or two to arrive). It includes your boards and pins as links. A small import script turns each pin into an *untagged* project stub — title, link, and image fetched where possible. Whatever the export doesn't cover cleanly, you fill in with quick-add.
3. **Tag over time.** Bulk import creates a big **untagged queue**. The app should make chipping away at it pleasant: show one project, tap tag chips, hit next. A naptime activity. Board names from Pinterest are a free head start — a pin from your "Amigurumi" board can arrive pre-tagged `crochet, amigurumi`.

**Accelerator (optional, later):** the Claude API can look at a pin's image and title and *suggest* tags — "looks like: paper crafts, owl, scissors, googly eyes" — which you confirm or fix with a tap. Suggest-and-confirm keeps the tags trustworthy while cutting the tagging chore down dramatically. Worth adding when the untagged queue feels like a wall.

---

## 4. Tech approach

**Recommendation: a Next.js app, deployed privately on Vercel.**

- **Why Next.js:** starts as a nearly-static gallery site (Phase 1 needs no backend at all) and grows a backend later (Phase 3) without switching frameworks. Enormous ecosystem, and Claude Code is very fluent in it.
- **Why Vercel:** you already have it connected, deploys are `git push`, and its free **Vercel Authentication** deployment protection makes the site private — only you, logged into your Vercel account, can open it. That solves both "phone access" and "keep it private" in one stroke. (A simple passcode screen is a fallback option.)
- **Where the data lives, in two stages:**
  - *Phases 1–2:* JSON files + images in the repo. No database, nothing to administer, every change is version-controlled, and editing data is as easy as asking Claude Code. The site rebuilds on push.
  - *Phase 3:* move to a real database (Neon Postgres via Vercel, or Turso) with images in Vercel Blob storage — the moment you want to add and tag projects **from your phone**, you need a backend. The Phase-1 JSON imports in cleanly.

**⚠️ One prerequisite: a new, private repo.** This repo (`lola`) is public, so Pinterest images must not be committed here. Create a fresh **private** repo for the app (e.g. `idea-jar`). This plan can live in both.

---

## 5. Phases

Each phase is a complete, usable thing. Rough sizes assume evenings-and-naptimes pace with Claude Code doing the heavy lifting.

### Phase 0 — Foundations *(one sitting)*
- Create the private repo; scaffold the Next.js app.
- Write the starter vocabulary files (seed lists in §6) as JSON.
- Request your Pinterest data export so it's waiting for you by Phase 1.
- **Done when:** the repo exists, vocab files are in it, `npm run dev` shows a hello page.

### Phase 1 — The browsable library *(2–3 sittings)*
- Project gallery: card grid of images + titles, tap for detail (big image, all tags, notes, link to the original pin).
- Filters: every controlled category as tap-chips, plus text search over titles/subjects.
- Tagging screen with the tap-chip design, and the untagged queue.
- Seed it by hand-adding **15–20 favorite projects** (don't wait for bulk import — real data proves the design).
- Deploy to Vercel with Vercel Authentication on.
- **Done when:** you can browse and filter your real saved ideas on your phone.

### Phase 2 — Inventory & matching *(1–2 sittings)*
- Inventory screen: tools and materials checklists.
- **Makeable now**, **Almost** (with its missing-items shopping list), and **Use it up** views.
- **Done when:** the egg-carton test passes.

### Phase 3 — Full app *(3–4 sittings)*
- Move data to a database + image blob storage; add/edit projects entirely from the phone.
- Run the Pinterest bulk import into it; start working the untagged queue.
- Make it installable as a PWA (icon on the home screen, feels like a real app).
- **Done when:** you save a pin, add it to the app, and tag it — all from the couch.

### Phase 4 — Delight *(pick-and-choose, forever)*
- AI tag suggestions for the untagged queue.
- "Surprise me" button — one random makeable-now project for today.
- Done log: attach photos of what the kids actually made; "didn't work" notes.
- Seasonal shelf: October surfaces Halloween automatically.
- Multiple photos per project → your own step-by-step photo sequences.

### Someday — The public version
As your own projects (with your own photos and step-by-steps) accumulate, the library gradually becomes yours. A public, shareable version for parents everywhere is then a licensing decision, not a rebuild — the app is already built.

---

## 6. Starter vocabularies

Seed lists to copy into Phase 0 — edit freely; they're yours to curate.

**Materials:** egg carton · cardboard · toilet paper rolls · construction paper · cardstock · tissue paper · paper plates · popsicle sticks · pipe cleaners · googly eyes · pom poms · beads · brads · buttons · felt · fabric scraps · yarn · embroidery floss · string/twine · glue · hot glue sticks · tape · paint · watercolors · dot markers · crayons · markers · clay/playdough · glitter · sequins · stickers · foam sheets · mason jars · rocks · pinecones/nature bits · glass/stained-glass supplies · macrame cord

**Tools:** scissors · kid scissors · hot glue gun · hole punch · stapler · paintbrushes · crochet hook · knitting needles · bead loom · embroidery hoop · sewing needle · sewing machine · dremel · craft knife · ruler · iron (for perler beads etc.)

**Craft types:** paper crafts · origami · recycled crafts · fiber arts · crochet · amigurumi · knitting · sewing · embroidery · macrame · stained glass · painting · drawing · clay/sculpting · jewelry · nature crafts · perler/fuse beads

**Time:** under 15 min · under an hour · an afternoon · multi-day

**Mess:** clean · some mess · tarp-worthy

**Safety flags:** small parts · sharp tools · hot glue/heat · needs full supervision

**Occasions:** Christmas · Halloween · Easter · Valentine's · Mother's/Father's Day · birthdays · spring · summer · fall · winter

---

## 7. Decisions for you (none block Phase 0)

- [ ] **Name** the app (repo name follows).
- [ ] **Vercel Authentication vs. a passcode screen** for privacy — Vercel Auth is free and zero-code; a passcode is friendlier if you ever want a babysitter or partner browsing it.
- [ ] **The who-for ladder** — do the six rungs in §2 match how you actually think about it?
- [ ] Skim the **starter vocabularies** and add/cut to taste.

## 8. Your very next session

Say something like: *"Let's do Phase 0 of PLAN.md — create the private repo and scaffold the app."* One sitting, and the foundation exists. And request that Pinterest export today — it takes a couple of days to arrive, and it costs you nothing to have it waiting.
