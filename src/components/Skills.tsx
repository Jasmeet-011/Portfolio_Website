
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

type SkillCategory = {
  name: string;
  skills: string[];
  icon: string;
  color: string;
};

const skillsData: SkillCategory[] = [
  {
    name: "Frontend",
    icon: "💻",
    color: "from-primary to-blue-600",
    skills: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Vue.js", "Next.js", "Tailwind CSS", "Responsive Design"]
  },
  {
    name: "Backend",
    icon: "🔧",
    color: "from-accent to-blue-400",
    skills: ["Node.js", "Express", "Python", "Django", "Ruby on Rails", "RESTful APIs", "GraphQL"]
  },
  {
    name: "Database",
    icon: "🗄️",
    color: "from-amber-400 to-orange-500",
    skills: ["MongoDB", "PostgreSQL", "MySQL", "Firebase", "Redis", "Prisma ORM"]
  },
  {
    name: "DevOps",
    icon: "🚀",
    color: "from-purple-500 to-indigo-600",
    skills: ["Git", "Docker", "CI/CD", "AWS", "Vercel", "Netlify", "Linux"]
  }
];

const Skills = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="skills" className="py-20 bg-background overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 border border-accent/20 rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 border border-primary/10 rounded-full"></div>
        <div className="absolute top-40 right-40 w-16 h-16 border-2 border-dashed border-accent/10 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div 
          ref={ref}
          className={`flex flex-col items-center text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-3xl font-heading font-bold tracking-tighter sm:text-4xl md:text-5xl gradient-text mb-2">Skills</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-accent to-primary rounded mb-4"></div>
          <p className="mt-4 text-lg text-muted-foreground max-w-[700px]">
            Technologies and tools I work with
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillsData.map((category, index) => (
              <Card 
                key={index} 
                className={`skill-item glass-card group transition-all duration-500 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                } hover:shadow-lg hover:shadow-${category.color.split(' ')[0]}/10`}
                style={{ 
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <CardHeader className="pb-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <CardTitle className="text-xl flex items-center gap-2 relative z-10 font-heading">
                    <span className="text-2xl animate-pulse-slow group-hover:animate-wave">{category.icon}</span> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r ${category.color} group-hover:opacity-100 opacity-80 transition-opacity">
                      {category.name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {category.skills.map((skill, skillIndex) => (
                      <HoverCard key={skillIndex}>
                        <HoverCardTrigger asChild>
                          <li className="flex items-center transition-all hover:translate-x-1 cursor-pointer group/skill">
                            <span className={`bg-gradient-to-r ${category.color} w-1 h-1 rounded-full mr-2 transition-all group-hover/skill:w-2`}></span>
                            <span className="group-hover/skill:text-accent transition-colors">{skill}</span>
                          </li>
                        </HoverCardTrigger>
                        <HoverCardContent className="glass-card p-2 text-sm animate-fade-in">
                          <div className="font-mono">Skilled in {skill}</div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Skills;
