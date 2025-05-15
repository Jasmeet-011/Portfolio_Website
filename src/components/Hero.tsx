
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";

const Hero = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="about" className="min-h-screen flex flex-col justify-center pt-16 pb-10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-float"></div>
      <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-blue-500/5 rounded-full filter blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col gap-8 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 animate-slide-up">
              Hi, I'm <span className="gradient-text">Developer Name</span>
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
            <Button onClick={scrollToContact} size="lg" className="relative overflow-hidden group">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/50 to-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative">Get In Touch</span>
            </Button>
            <Button variant="outline" size="lg" asChild className="group transition-all duration-300">
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <span>View Resume</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </Button>
          </div>

          <div className="flex space-x-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors animate-bounce-slow" style={{ animationDelay: '0s' }}>
              <Github size={24} />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors animate-bounce-slow" style={{ animationDelay: '0.2s' }}>
              <Linkedin size={24} />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="mailto:example@example.com" className="text-muted-foreground hover:text-primary transition-colors animate-bounce-slow" style={{ animationDelay: '0.4s' }}>
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
