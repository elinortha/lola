"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  filterCategories,
  projects,
  projectValues,
  vocab,
  type FilterKey,
} from "@/lib/data";

const emptySelection = (): Record<FilterKey, string[]> => ({
  whoFor: [],
  craftTypes: [],
  materials: [],
  tools: [],
  time: [],
  mess: [],
  occasions: [],
  status: [],
});

export default function Gallery() {
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>(
    emptySelection
  );
  const [query, setQuery] = useState("");

  const anyFilterActive =
    query.trim() !== "" ||
    filterCategories.some(({ key }) => selected[key].length > 0);

  const toggle = (key: FilterKey, value: string) => {
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      for (const { key } of filterCategories) {
        const wanted = selected[key];
        if (wanted.length === 0) continue;
        const values = projectValues(p, key);
        if (!wanted.some((w) => values.includes(w))) return false;
      }
      if (q) {
        const haystack = [p.title, p.notes, ...p.subjects]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [selected, query]);

  return (
    <>
      <div className="search-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search titles and subjects — owl, rainbow, ocean…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search projects"
        />
        {anyFilterActive && (
          <button
            type="button"
            className="clear-button"
            onClick={() => {
              setSelected(emptySelection());
              setQuery("");
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="filters">
        {filterCategories.map(({ key, label }) => (
          <details
            key={key}
            className="filter-group"
            open={key === "whoFor" || selected[key].length > 0}
          >
            <summary>
              {label}
              {selected[key].length > 0 && (
                <span className="count">{selected[key].length}</span>
              )}
            </summary>
            <div className="chip-row">
              {vocab[key].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip"
                  aria-pressed={selected[key].includes(value)}
                  onClick={() => toggle(key, value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>

      <p className="result-count">
        {results.length} of {projects.length} projects
      </p>

      {results.length === 0 ? (
        <div className="empty-state">
          <p>Nothing matches that combination — yet.</p>
          <p>Try clearing a filter, or save this gap as a shopping trip.</p>
        </div>
      ) : (
        <div className="card-grid">
          {results.map((p) => (
            <Link key={p.id} href={`/project/${p.id}`} className="project-card">
              <img src={p.image} alt={p.title} />
              <div className="card-body">
                <h2>{p.title}</h2>
                <div className="tag-chips">
                  {p.whoFor.map((w) => (
                    <span key={w} className="tag who">
                      {w}
                    </span>
                  ))}
                  {p.time && <span className="tag">{p.time}</span>}
                  {p.safety.map((s) => (
                    <span key={s} className="tag warn">
                      ⚠ {s}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
