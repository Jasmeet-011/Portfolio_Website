import { skills } from "@/content/skills";
import { initials, skillGroups, usage } from "@/lib/skills";
import { Chip, H1, H2, Muted, Page } from "./prose";

export function ExtensionIcon({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={
        size === "sm"
          ? "grid size-8 shrink-0 place-items-center rounded border border-border bg-surface font-mono text-[11px] font-semibold text-muted"
          : "grid size-11 shrink-0 place-items-center rounded-md border border-border bg-surface font-mono text-sm font-semibold text-muted"
      }
    >
      {initials(name)}
    </span>
  );
}

/** The Extensions tab (/skills): every technology, what it is, and where it was used. */
export function Extensions() {
  return (
    <Page className="max-w-[80ch]">
      <H1>Extensions</H1>
      <Muted className="mt-1">
        {skills.length} installed. Each one is a technology I have used, with where I used it.
      </Muted>
      {skillGroups.map((group) => (
        <section key={group.category}>
          <H2>{group.category}</H2>
          <ul className="divide-y divide-border">
            {group.skills.map((skill) => (
              <li key={skill.slug} id={skill.slug} className="flex scroll-mt-4 gap-4 py-4">
                <ExtensionIcon name={skill.name} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{skill.name}</h3>
                  {skill.description && <p className="text-muted">{skill.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">Used in</span>
                    {skill.usedIn.map((use) => {
                      const target = usage(use);
                      return target ? (
                        <Chip key={`${use.kind}-${use.slug}`} to={target.to}>
                          {target.label}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}
