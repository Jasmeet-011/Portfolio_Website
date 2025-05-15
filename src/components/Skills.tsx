
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SkillCategory = {
  name: string;
  skills: string[];
  icon: string;
};

const skillsData: SkillCategory[] = [
  {
    name: "Frontend",
    icon: "💻",
    skills: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Vue.js", "Next.js", "Tailwind CSS", "Responsive Design"]
  },
  {
    name: "Backend",
    icon: "🔧",
    skills: ["Node.js", "Express", "Python", "Django", "Ruby on Rails", "RESTful APIs", "GraphQL"]
  },
  {
    name: "Database",
    icon: "🗄️",
    skills: ["MongoDB", "PostgreSQL", "MySQL", "Firebase", "Redis", "Prisma ORM"]
  },
  {
    name: "DevOps",
    icon: "🚀",
    skills: ["Git", "Docker", "CI/CD", "AWS", "Vercel", "Netlify", "Linux"]
  }
];

const Skills = () => {
  return (
    <section id="skills" className="py-20 section-gradient">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl gradient-text mb-2">Skills</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-blue-600 rounded mb-4"></div>
          <p className="mt-4 text-lg text-muted-foreground max-w-[700px]">
            Technologies and tools I work with
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillsData.map((category, index) => (
            <Card 
              key={index} 
              className="skill-item card-hover glass-effect"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-2xl animate-pulse-slow">{category.icon}</span> {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {category.skills.map((skill, skillIndex) => (
                    <li key={skillIndex} className="flex items-center transition-all hover:translate-x-1">
                      <span className="bg-primary/10 w-1 h-1 rounded-full mr-2"></span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
