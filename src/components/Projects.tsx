import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github } from "lucide-react";
import { useInView } from "react-intersection-observer";

type Project = {
  title: string;
  description: string;
  image: string;
  techStack: string[];
  githubUrl: string;
};

const projectsData: Project[] = [
  {
    title: "Chain Lens",
    description: "A blockchain explorer and analytics tool for visualizing on-chain data and transactions.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
    techStack: ["React", "Node.js", "Blockchain", "Web3"],
    githubUrl: "https://github.com/Jasmeet-011/On-Chain-Portfolio"
  },
  {
    title: "WalkWise",
    description: "A smart pedestrian safety and navigation app that helps users walk safer with real-time alerts and route suggestions.",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8",
    techStack: ["React", "Node.js", "Maps API"],
    githubUrl: "https://github.com/Jasmeet-011/Walkwise"
  },
  {
    title: "RepoScope",
    description: "A GitHub repository analytics and visualization tool for exploring repo stats, contributors, and activity trends.",
    image: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb",
    techStack: ["React", "GitHub API", "Node.js", "Chart.js"],
    githubUrl: "https://github.com/Jasmeet-011/RepoScope"
  },
  {
    title: "CodeMate",
    description: "An AI-powered coding assistant that helps developers write, debug, and understand code with real-time suggestions powered by Gemini API.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    techStack: ["React", "Node.js", "MongoDB", "Gemini API"],
    githubUrl: "https://github.com/Jasmeet-011/codemate-chat"
  },
  {
    title: "CloudMart",
    description: "A cloud-native e-commerce platform with scalable microservices architecture and modern deployment pipelines.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
    techStack: ["React", "Node.js", "AWS", "Docker"],
    githubUrl: "https://github.com/Jasmeet-011/cloudmart"
  },
];

const Projects = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsData.map((project, index) => (
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
                        <Badge key={tech} variant="secondary" className="bg-secondary/50 text-foreground hover:bg-accent/20 hover:text-accent transition-colors duration-300">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" asChild className="group border-muted hover:border-accent hover:text-accent">
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Github size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                        Code
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

          </>
        )}
      </div>
    </section>
  );
};

export default Projects;
