import { Link, useLocation } from "react-router-dom";
import { skills } from "@/content/skills";
import { ExtensionIcon } from "@/files/Extensions";
import { skillGroups, usedInCount } from "@/lib/skills";

/** The Extensions sidebar view: skills as installed extensions, grouped by category. */
export function ExtensionsView() {
  const { pathname, hash } = useLocation();
  return (
    <nav aria-label="Extensions" className="pb-3">
      <p className="px-4 pb-1 text-xs text-muted">Installed, {skills.length}</p>
      {skillGroups.map((group) => (
        <section key={group.category} className="mt-2">
          <h3 className="px-4 pb-1 text-xs font-medium text-muted">{group.category}</h3>
          <ul>
            {group.skills.map((skill) => (
              <li key={skill.slug}>
                <Link
                  to={`/skills#${skill.slug}`}
                  aria-current={pathname === "/skills" && hash === `#${skill.slug}`}
                  className="flex items-center gap-3 py-1.5 pr-3 pl-4 hover:bg-hover aria-[current=true]:bg-selection"
                >
                  <ExtensionIcon name={skill.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate">{skill.name}</span>
                      <span className="shrink-0 text-[11px] text-muted">{usedInCount(skill)}</span>
                    </span>
                    {skill.description && (
                      <span className="block truncate text-xs text-muted">{skill.description}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
