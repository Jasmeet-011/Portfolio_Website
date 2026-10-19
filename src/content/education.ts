import { todo, type Todo } from "./todo";

/** Exactly as recorded from the resume (plan.md section 10). Dates are "YYYY-MM". */
export interface Degree {
  slug: string;
  degree: string;
  school: string;
  start: string;
  end: string;
  grade: string;
}

export interface Certification {
  slug: string;
  name: string;
  issuer: string;
  url: string;
  /** "YYYY-MM". Places the certification's tag on the git graph. */
  earned: string | Todo;
}

export interface Publication {
  slug: string;
  title: string;
  venue: string;
  url: string;
}

export const degrees: Degree[] = [
  {
    slug: "ms-cs-nyu",
    degree: "MS Computer Science",
    school: "NYU Tandon School of Engineering",
    start: "2024-08",
    end: "2026-05",
    grade: "GPA 3.9",
  },
  {
    slug: "be-cs-srm",
    degree: "BE Computer Science",
    school: "SRM Institute of Science and Technology",
    start: "2020-09",
    end: "2024-06",
    grade: "GPA 9.8/10",
  },
];

export const certifications: Certification[] = [
  {
    slug: "aws-saa",
    name: "AWS Certified Solutions Architect, Associate",
    issuer: "Amazon Web Services",
    url: "https://www.credly.com/badges/0f2262c3-59d5-483b-8860-7b3e987382e3/public_url",
    earned: todo("TODO(jasmeet): month the AWS certification was earned"),
  },
];

export const publications: Publication[] = [
  {
    slug: "hybrid-gradient-boosting-pricing",
    title: "A Hybrid Gradient Boosting Algorithm for Dynamic Pricing using a Custom Dataset",
    venue:
      "2024 5th International Conference on Image Processing and Capsule Networks (ICIPCN), IEEE",
    url: "https://ieeexplore.ieee.org/abstract/document/10660680",
  },
];
