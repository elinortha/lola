// Validates data/projects.json against data/vocab.json so a typo'd tag
// fails the build with a friendly message instead of silently never
// matching a filter. Runs automatically as part of `npm run build`.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vocab = JSON.parse(readFileSync(`${root}data/vocab.json`, "utf8"));
const projects = JSON.parse(readFileSync(`${root}data/projects.json`, "utf8"));

const listFields = ["whoFor", "materials", "tools", "craftTypes", "safety", "occasions"];
const singleFields = ["time", "mess", "status"];
const vocabFor = {
  whoFor: "whoFor",
  materials: "materials",
  tools: "tools",
  craftTypes: "craftTypes",
  safety: "safety",
  occasions: "occasions",
  time: "time",
  mess: "mess",
  status: "status",
};

const errors = [];
const seenIds = new Set();

for (const p of projects) {
  const where = `project "${p.id ?? p.title ?? "???"}"`;

  if (!p.id) errors.push(`${where}: missing "id"`);
  else if (seenIds.has(p.id)) errors.push(`${where}: duplicate id`);
  else seenIds.add(p.id);

  if (!p.title) errors.push(`${where}: missing "title"`);

  if (p.image) {
    if (!existsSync(`${root}public${p.image}`)) {
      errors.push(`${where}: image "${p.image}" not found in public/`);
    }
  } else {
    errors.push(`${where}: missing "image"`);
  }

  for (const field of listFields) {
    for (const value of p[field] ?? []) {
      if (!vocab[vocabFor[field]].includes(value)) {
        errors.push(
          `${where}: "${value}" is not in vocab.json under "${vocabFor[field]}" — add it there or fix the spelling`
        );
      }
    }
  }

  for (const field of singleFields) {
    const value = p[field];
    if (value && !vocab[vocabFor[field]].includes(value)) {
      errors.push(
        `${where}: "${value}" is not in vocab.json under "${vocabFor[field]}" — add it there or fix the spelling`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`\n✗ Found ${errors.length} data problem(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ Data looks good: ${projects.length} projects, all tags match the vocab.`);
