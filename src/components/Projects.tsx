
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ExternalLink } from "lucide-react";

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
  return (
    <section id="projects" className="py-20 bg-gradient-to-br from-white to-blue-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl gradient-text mb-2">Projects</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-blue-600 rounded mb-4"></div>
          <p className="mt-4 text-lg text-muted-foreground max-w-[700px]">
            A selection of my recent development work
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {projectsData.map((project, index) => (
            <Card 
              key={index} 
              className="card-hover overflow-hidden border-none shadow-lg"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">{project.title}</CardTitle>
                <CardDescription className="text-base">{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="animate-pulse-slow">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild className="group">
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Github size={16} className="group-hover:rotate-12 transition-transform" />
                    Code
                  </a>
                </Button>
                <Button size="sm" asChild className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-opacity">
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                    Live Demo
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
