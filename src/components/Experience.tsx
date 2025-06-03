import React from "react";
import { VerticalTimelineCard } from "@/components/ui/VerticalTimelineCard";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

type ExperienceItem = {
  role: string;
  company: string;
  duration: string;
  description: string;
  techStack: string[];
};

const experiences: ExperienceItem[] = [
  {
    role: "Frontend Developer Intern",
    company: "TechNova Labs",
    duration: "Jan 2024 - Apr 2024",
    description:
      "Redesigned key UI components and boosted performance on a React SaaS platform with improved accessibility and responsiveness.",
    techStack: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
  },
  {
    role: "Web Development Intern",
    company: "DevHive",
    duration: "May 2023 - July 2023",
    description:
      "Developed and deployed fully responsive landing pages, optimized performance, and implemented RESTful APIs.",
    techStack: ["HTML", "CSS", "JavaScript", "Bootstrap"],
  },
  {
    role: "Web Development Intern",
    company: "CodeCrafts",
    duration: "Dec 2022 - Feb 2023",
    description:
      "Worked on admin dashboards, integrated API endpoints, and implemented responsive components for internal tooling.",
    techStack: ["React", "Sass", "Redux", "Figma"],
  },
  {
    role: "Software Engineering Intern",
    company: "InnoSoft",
    duration: "Jul 2022 - Sept 2022",
    description:
      "Assisted in building an internal task management tool and improved performance of key user flows.",
    techStack: ["Node.js", "Express", "MongoDB", "EJS"],
  },
];

const Experience = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section id="experience" className="py-20 section-gradient relative overflow-hidden">
      {/* Glowing background orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-20 right-10 w-36 h-36 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-24 left-10 w-44 h-44 bg-accent/10 rounded-full blur-3xl animate-float delay-1000"></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Heading */}
        <div
          ref={ref}
          className={`flex flex-col items-center text-center mb-12 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text bg-gradient-to-br from-primary via-accent to-foreground bg-clip-text text-transparent">
            Experience
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-accent to-primary/60 rounded mt-3 mb-2"></div>
          <p className="text-lg text-muted-foreground max-w-xl mt-4">
            A journey through my hands-on learning in real-world projects and internships.
          </p>
        </div>

        {/* Timeline Experience Cards */}
        <div className="flex flex-col gap-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
            >
              <VerticalTimelineCard
                date={exp.duration} // ✅ corrected from duration → date
                title={exp.role}
                company={exp.company}
                points={[exp.description]} // ✅ wrapped in array to match points: string[]
                techStack={exp.techStack} // ✅ correct prop name
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
