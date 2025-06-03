
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";
import { useEffect, useState } from "react";

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading delay for entrance animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="about" className="min-h-screen flex flex-col justify-center pt-16 pb-10 relative overflow-hidden">
      {/* Animated background elements */}
      {/* <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-float"></div>
      <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-accent/5 rounded-full filter blur-2xl animate-float" style={{ animationDelay: '2s' }}></div> */}
      
      {/* Parallax elements */}
      {/* <div className="absolute top-20 left-10 w-4 h-4 bg-accent/30 rounded-full animate-pulse-slow"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-primary/10 rounded-full animate-float" style={{ animationDelay: '3s' }}></div> */}
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className={`flex flex-col gap-8 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
          <div>
            <h1 className={`text-4xl md:text-6xl font-bold font-heading tracking-tighter mb-4 ${isLoaded ? 'animate-slide-in-left' : 'opacity-0'}`}>
              Hi, I'm <span className="gradient-text">Jasmeet Singh</span>
            </h1>
            <h2 className={`text-2xl md:text-3xl text-muted-foreground font-heading ${isLoaded ? 'animate-slide-in-left animate-delay-100' : 'opacity-0'}`}>
              Full Stack Developer
            </h2>
          </div>
          
          <p className={`max-w-[700px] text-lg text-muted-foreground ${isLoaded ? 'animate-slide-in-left animate-delay-200' : 'opacity-0'}`}>
           I’m a full stack developer focused on building fast, accessible, and user-friendly web experiences. I love turning complex requirements into smooth, functional products.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 ${isLoaded ? 'animate-slide-in-left animate-delay-300' : 'opacity-0'}`}>
            <Button onClick={scrollToContact} size="lg" className="btn-glow shadow-lg shadow-primary/20 group relative overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/50 to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative z-10">Get In Touch</span>
            </Button>
            <Button variant="outline" size="lg" asChild className="group transition-all duration-300 hover:border-accent hover:text-accent-foreground">
              <a href="https://drive.google.com/file/d/1eIJLhv8g05yvbTedBdMeCTYNSYyS3IHr/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <span>View Resume</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </Button>
          </div>

          <div className={`flex space-x-4 ${isLoaded ? 'animate-slide-in-left animate-delay-400' : 'opacity-0'}`}>
            <a href="https://github.com/Jasmeet-011" target="_blank" rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-accent transition-colors animate-bounce-slow hover:scale-110"
              style={{ animationDelay: '0s' }}>
              <Github size={24} className="hover:animate-spin-once" />
              <span className="sr-only">Visit my GitHub profile</span>
            </a>
            <a href="https://www.linkedin.com/in/jasmeet-singh-wadhwa/" target="_blank" rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-accent transition-colors animate-bounce-slow hover:scale-110" 
              style={{ animationDelay: '0.2s' }}>
              <Linkedin size={24} className="hover:animate-spin-once" />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="mailto:jasmeetsingh5003@gmail.com" 
              className="text-muted-foreground hover:text-accent transition-colors animate-bounce-slow hover:scale-110" 
              style={{ animationDelay: '0.4s' }}>
              <Mail size={24} className="hover:animate-spin-once" />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce-slow hidden md:block">
        <div className="w-8 h-12 border-2 border-accent/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-accent rounded-full mt-2 animate-bounce-slow"></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Scroll down</p>
      </div>
    </section>
  );
};

export default Hero;
