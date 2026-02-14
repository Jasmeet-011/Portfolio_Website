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
    role: "Graduate Teaching Assistant",
    company: "NYU Courant Institute of Mathematical Sciences",
    duration: "Sep 2025 - Present",
    description:
      "Supporting coursework delivery and student learning as a Graduate TA for the Computer Science department at NYU Courant.",
    techStack: ["Teaching", "Computer Science", "NYU"],
  },
  {
    role: "Software Engineer",
    company: "Qualitest",
    duration: "Jun 2025 - Aug 2025",
    description:
      "Contributed to GenAI-powered QA workflows by refactoring a legacy test case validation pipeline into a MongoDB + FastAPI prompt store, improving modularity and enabling dynamic updates across agents. Diagnosed and documented defects in the CoCo automated test case generator, accelerating fixes and strengthening overall QA coverage and release reliability.",
    techStack: ["Python", "FastAPI", "MongoDB", "GenAI"],
  },
  {
    role: "Software Development Intern",
    company: "Unified Mentor",
    duration: "Jul 2024 - Sep 2024",
    description:
      "Worked on software development projects, building and shipping features in a collaborative team environment.",
    techStack: ["JavaScript", "React", "Node.js"],
  },
  {
    role: "Web Development Intern",
    company: "The Sparks Foundation",
    duration: "Jun 2023 - Aug 2023",
    description:
      "Developed and deployed web applications as part of the Graduate Rotational Internship Program.",
    techStack: ["HTML", "CSS", "JavaScript", "Bootstrap"],
  },
  {
    role: "Data Analytics Intern",
    company: "AICTE",
    duration: "May 2023 - Jul 2023",
    description:
      "Worked on data analytics and AI/ML projects, applying machine learning techniques to real-world datasets.",
    techStack: ["Python", "Pandas", "Machine Learning", "Data Analytics"],
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
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
