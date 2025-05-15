
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";

const Hero = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="about" className="min-h-screen flex flex-col justify-center pt-16 pb-10">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col gap-8 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 animate-slide-up">
              Hi, I'm <span className="text-primary">Developer Name</span>
            </h1>
            <h2 className="text-2xl md:text-3xl text-muted-foreground animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Full Stack Developer
            </h2>
          </div>
          
          <p className="max-w-[700px] text-lg text-muted-foreground animate-slide-up" style={{ animationDelay: '0.2s' }}>
            I build responsive web applications with modern technologies. 
            Passionate about creating elegant solutions to complex problems.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button onClick={scrollToContact} size="lg">
              Get In Touch
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                View Resume
              </a>
            </Button>
          </div>

          <div className="flex space-x-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Github size={24} />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin size={24} />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="mailto:example@example.com" className="text-muted-foreground hover:text-primary transition-colors">
              <Mail size={24} />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
