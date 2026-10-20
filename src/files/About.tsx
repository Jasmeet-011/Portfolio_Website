import { certifications, degrees, publications } from "@/content/education";
import { roles } from "@/content/experience";
import { links } from "@/content/links";
import { profile } from "@/content/profile";
import { isTodo } from "@/content/todo";
import { formatMonth, formatRange } from "@/lib/dates";
import type { Doc } from "@/workspace/documents";
import { FileView } from "./FileView";
import { py, pyCall } from "./source/serialize";
import { External, H1, H2, Lead, Muted, Open, Page } from "./prose";

const current = roles.filter((r) => r.end === null);
const bio = [profile.shortBio, profile.longBio].find((v): v is string => !isTodo(v));

function source(): string {
  const lines = [
    `"""About ${profile.name}."""`,
    "",
    `name = ${py(profile.name)}`,
    `focus = ${py(profile.positioning)}`,
    ...(bio ? [`bio = ${py(bio)}`] : []),
    `location = ${py(profile.location)}`,
    "",
    `now = [`,
    ...current.map(
      (r) =>
        `    ${pyCall("Role", { title: r.title, company: r.company, since: r.start, summary: r.summary }, 1)},`,
    ),
    "]",
    "",
    "education = [",
    ...degrees.map(
      (d) =>
        `    ${pyCall("Degree", { degree: d.degree, school: d.school, start: d.start, end: d.end, grade: d.grade }, 1)},`,
    ),
    "]",
    "",
    "certifications = [",
    ...certifications.map(
      (c) =>
        `    ${pyCall(
          "Certification",
          {
            name: c.name,
            issuer: c.issuer,
            earned: isTodo(c.earned) ? undefined : c.earned,
            url: c.url,
          },
          1,
        )},`,
    ),
    "]",
    "",
    "publications = [",
    ...publications.map(
      (p) => `    ${pyCall("Publication", { title: p.title, venue: p.venue, url: p.url }, 1)},`,
    ),
    "]",
    "",
    `links = ${py({ github: links.github, linkedin: links.linkedin, email: links.email })}`,
    "",
  ];
  return lines.join("\n");
}

function Preview() {
  return (
    <Page>
      <H1>{profile.name}</H1>
      <Lead>
        {profile.positioning.charAt(0).toUpperCase() + profile.positioning.slice(1)}, based in{" "}
        {profile.location}.
      </Lead>
      {bio && <p className="mt-3">{bio}</p>}

      <H2 id="now">Now</H2>
      {current.map((r) => (
        <div key={r.slug} className="mb-4">
          <p className="font-semibold">
            {r.title}, {r.company}
          </p>
          <Muted>{formatRange(r.start, r.end)}</Muted>
          <p className="mt-1">{r.summary}</p>
        </div>
      ))}
      <p>
        <Open to="/experience">Full history in the Git Graph</Open>
      </p>

      <H2 id="education">Education</H2>
      {degrees.map((d) => (
        <div key={d.slug} className="mb-4">
          <p className="font-semibold">{d.degree}</p>
          <p>{d.school}</p>
          <Muted>
            {formatRange(d.start, d.end)}, {d.grade}
          </Muted>
        </div>
      ))}

      <H2 id="certification">Certification</H2>
      {certifications.map((c) => (
        <div key={c.slug} className="mb-4">
          <p>
            <External href={c.url}>{c.name}</External>
          </p>
          <Muted>
            {c.issuer}
            {isTodo(c.earned) ? "" : `, ${formatMonth(c.earned)}`}
          </Muted>
        </div>
      ))}

      <H2 id="publication">Publication</H2>
      {publications.map((p) => (
        <div key={p.slug} className="mb-4">
          <p>
            <External href={p.url}>{p.title}</External>
          </p>
          <Muted>{p.venue}</Muted>
        </div>
      ))}

      <H2>Elsewhere</H2>
      <ul className="space-y-1">
        <li>
          <External href={links.github}>GitHub</External>
        </li>
        <li>
          <External href={links.linkedin}>LinkedIn</External>
        </li>
        <li>
          <a
            href={`mailto:${links.email}`}
            className="text-link underline-offset-2 hover:underline"
          >
            {links.email}
          </a>
        </li>
      </ul>
    </Page>
  );
}

export function About({ doc }: { doc: Doc }) {
  return <FileView doc={doc} preview={<Preview />} source={source} />;
}
