
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ExternalLink } from "lucide-react";
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
  }
];

const Projects = () => {
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
    <section id="projects" className="py-20 section-gradient relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full filter blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div 
          ref={ref}
          className={`flex flex-col items-center text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projectsData.map((project, index) => (
              <Card 
                key={index} 
                className={`card-hover overflow-hidden glass-card shadow-lg shadow-black/10 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ 
                  animationDelay: `${index * 0.15}s`,
                  transitionDelay: `${index * 0.1}s`
                }}
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
                      <Badge key={tech} variant="secondary" className="bg-secondary/50 text-foreground animate-pulse-slow hover:bg-accent/20 hover:text-accent transition-colors duration-300">{tech}</Badge>
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
        )}
      </div>
    </section>
  );
};

export default Projects;
