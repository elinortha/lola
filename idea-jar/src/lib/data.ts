import vocabJson from "../../data/vocab.json";
import projectsJson from "../../data/projects.json";

export type Vocab = {
  whoFor: string[];
  materials: string[];
  tools: string[];
  craftTypes: string[];
  time: string[];
  mess: string[];
  safety: string[];
  occasions: string[];
  status: string[];
};

export type Project = {
  id: string;
  title: string;
  image: string;
  source: string;
  notes: string;
  whoFor: string[];
  materials: string[];
  tools: string[];
  craftTypes: string[];
  subjects: string[];
  time: string;
  mess: string;
  safety: string[];
  occasions: string[];
  status: string;
};

export const vocab = vocabJson as Vocab;
export const projects = projectsJson as Project[];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

// Categories the gallery can filter by, in display order.
// Safety is shown on cards as a warning, not offered as a filter.
export const filterCategories = [
  { key: "whoFor", label: "Who's it for" },
  { key: "craftTypes", label: "Craft type" },
  { key: "materials", label: "Materials" },
  { key: "tools", label: "Tools" },
  { key: "time", label: "Time" },
  { key: "mess", label: "Mess" },
  { key: "occasions", label: "Occasion" },
  { key: "status", label: "Status" },
] as const;

export type FilterKey = (typeof filterCategories)[number]["key"];

// A project's values for a category, whether the field is a list
// (materials) or a single value (time).
export function projectValues(p: Project, key: FilterKey): string[] {
  const raw = p[key];
  if (Array.isArray(raw)) return raw;
  return raw ? [raw] : [];
}
