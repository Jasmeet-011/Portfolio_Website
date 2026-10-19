import { links } from "./links";
import { todo, type Todo } from "./todo";

/** No photo and no phone number, by decision (plan.md section 10). */
export interface Profile {
  name: string;
  /** How the site frames Jasmeet. Not a job title. */
  positioning: string;
  headline: string | Todo;
  shortBio: string | Todo;
  longBio: string | Todo;
  location: string;
  availability?: string;
  email: string;
}

export const profile: Profile = {
  name: "Jasmeet Singh Wadhwa",
  positioning: "AI engineer focused on AI and agentic backend systems",
  headline: todo("TODO(jasmeet): write the one-line headline"),
  shortBio: todo("TODO(jasmeet): write the two-sentence bio"),
  longBio: todo("TODO(jasmeet): write the longer bio for about.py, or reuse the short one"),
  location: "New York, NY",
  email: links.email,
};
