import { todo, type Todo } from "./todo";

export interface Link {
  label: string;
  href: string;
}

export interface Links {
  github: string;
  linkedin: string;
  /** The only public address. */
  email: string;
  /** Path under public/ once the file exists. */
  resume: string | Todo;
  formspreeId: string;
  others: Link[];
}

export const links: Links = {
  github: "https://github.com/Jasmeet-011",
  linkedin: "https://www.linkedin.com/in/jasmeet-singh-wadhwa/",
  email: "j.wadhwa.dev@gmail.com",
  resume: todo('TODO(jasmeet): add public/resume.pdf, then set this to "/resume.pdf"'),
  // TODO(jasmeet): verify form mzdarpdv still receives submissions.
  formspreeId: "mzdarpdv",
  others: [{ label: "Site source", href: "https://github.com/Jasmeet-011/Portfolio_Website" }],
};
