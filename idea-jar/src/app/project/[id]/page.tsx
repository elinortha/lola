import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/lib/data";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  return { title: project ? `${project.title} · The Idea Jar` : "The Idea Jar" };
}

const tagSections = [
  { label: "Who's it for", field: "whoFor" },
  { label: "Craft type", field: "craftTypes" },
  { label: "Materials", field: "materials" },
  { label: "Tools", field: "tools" },
  { label: "Subjects", field: "subjects" },
  { label: "Occasion", field: "occasions" },
] as const;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  return (
    <main>
      <Link href="/" className="back-link">
        ← All projects
      </Link>
      <div className="detail">
        <div>
          <img src={project.image} alt={project.title} className="detail-image" />
        </div>
        <div>
          <h1>{project.title}</h1>
          <p className="status-line">
            {[project.status, project.time, project.mess]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {project.safety.length > 0 && (
            <div className="tag-section">
              <div className="tag-chips">
                {project.safety.map((s) => (
                  <span key={s} className="tag warn">
                    ⚠ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.notes && <p className="notes">{project.notes}</p>}

          {project.source && (
            <p>
              <a
                href={project.source}
                className="source-link"
                target="_blank"
                rel="noreferrer"
              >
                Open the original pin ↗
              </a>
            </p>
          )}

          {tagSections.map(({ label, field }) => {
            const values = project[field];
            if (values.length === 0) return null;
            return (
              <div key={field} className="tag-section">
                <div className="label">{label}</div>
                <div className="tag-chips">
                  {values.map((v) => (
                    <span key={v} className="tag">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
