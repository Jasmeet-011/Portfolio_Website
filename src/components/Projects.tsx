import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useInView } from "react-intersection-observer";

type Project = {
  title: string;
  description: string;
  image: string;
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
};

const projectsData: Project[] = [
  // Your 8+ projects here
  {
    title: "E-commerce Platform",
    description: "A full-featured online store with cart functionality, user authentication, and payment processing.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    techStack: ["React", "Node.js", "MongoDB", "Stripe"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Task Management App",
    description: "A drag-and-drop task board for organizing projects with real-time collaboration features.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    techStack: ["Vue.js", "Firebase", "Tailwind CSS"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Weather Dashboard",
    description: "Interactive weather visualization with 7-day forecasts and location-based data.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    techStack: ["React", "Chart.js", "OpenWeather API"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Social Media Analytics",
    description: "Data visualization platform for tracking engagement metrics across multiple platforms.",
    image: "https://images.unsplash.com/photo-1573152143286-0c422b4d2175",
    techStack: ["Next.js", "D3.js", "PostgreSQL", "GraphQL"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Portfolio Site",
    description: "A sleek developer portfolio built with Next.js and Tailwind CSS.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    techStack: ["Next.js", "Tailwind", "Framer Motion"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Fitness Tracker",
    description: "Track your workouts, meals, and progress over time.",
    image: "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642",
    techStack: ["React Native", "Firebase"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "Crypto Dashboard",
    description: "Real-time crypto price tracking and news updates.",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a5cb42c77",
    techStack: ["React", "Redux", "CoinGecko API"],
    demoUrl: "#",
    githubUrl: "#"
  },
  {
    title: "AI Chatbot",
    description: "Conversational AI assistant for websites.",
    image: "https://images.unsplash.com/photo-1581090700227-1e8e8f23c3f1",
    techStack: ["Python", "Flask", "OpenAI API"],
    demoUrl: "#",
    githubUrl: "#"
  }
];

const Projects = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { ref, inView } = useInView({ threshold: 0.1 });
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    if (expanded) {
      setVisibleCount(6);
      setExpanded(false);
      moreRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setVisibleCount(projectsData.length);
      setExpanded(true);
    }
  };

  const visibleProjects = projectsData.slice(0, visibleCount);

  return (
    <section id="projects" className="py-20 section-gradient relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full filter blur-2xl animate-float" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div
          ref={ref}
          className={`flex flex-col items-center text-center mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="text-3xl font-heading font-bold tracking-tighter sm:text-4xl md:text-5xl gradient-text mb-2">Projects</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-accent to-primary/50 rounded mb-4"></div>
          <p className="mt-4 text-lg text-muted-foreground max-w-[700px]">
            A selection of my recent development work
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" ref={moreRef}>
              {visibleProjects.map((project, index) => (
                <Card
                  key={index}
                  className="card-hover overflow-hidden glass-card shadow-lg shadow-black/10 transition-all duration-700"
                >
                  <div className="aspect-video w-full overflow-hidden group relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl font-heading">{project.title}</CardTitle>
                    <CardDescription className="text-base text-muted-foreground/90">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="bg-secondary/50 text-foreground animate-pulse-slow hover:bg-accent/20 hover:text-accent transition-colors duration-300">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild className="group border-muted hover:border-accent hover:text-accent">
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Github size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                        Code
                      </a>
                    </Button>
                    <Button size="sm" asChild className="bg-accent text-background hover:bg-accent/90 transition-all duration-300 shadow-md shadow-accent/10">
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <span>Live Demo</span>
                        <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Button
                onClick={handleToggle}
                className="group transition-all duration-300 hover:scale-105 hover:bg-accent hover:text-background"
                variant="outline"
              >
                {expanded ? (
                  <>
                    Show Less <ChevronUp className="ml-2 transition-transform group-hover:-translate-y-1" size={18} />
                  </>
                ) : (
                  <>
                    View More <ChevronDown className="ml-2 transition-transform group-hover:translate-y-1" size={18} />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Projects;
