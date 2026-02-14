
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";
import { useEffect, useState } from "react";

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
      <div className="container px-4 md:px-6 relative z-10">
        <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>

          {/* Left — Text content */}
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <h1 className={`text-4xl md:text-6xl font-bold font-heading tracking-tighter mb-4 ${isLoaded ? 'animate-slide-in-left' : 'opacity-0'}`}>
                Hi, I'm <span className="gradient-text">Jasmeet Singh</span>
              </h1>
              <h2 className={`text-2xl md:text-3xl text-muted-foreground font-heading ${isLoaded ? 'animate-slide-in-left animate-delay-100' : 'opacity-0'}`}>
                Full Stack Developer
              </h2>
            </div>

            <p className={`max-w-[600px] text-lg text-muted-foreground ${isLoaded ? 'animate-slide-in-left animate-delay-200' : 'opacity-0'}`}>
              I'm a full stack developer focused on building fast, accessible, and user-friendly web experiences. I love turning complex requirements into smooth, functional products.
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
                className="text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110">
                <Github size={24} />
                <span className="sr-only">Visit my GitHub profile</span>
              </a>
              <a href="https://www.linkedin.com/in/jasmeet-singh-wadhwa/" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110">
                <Linkedin size={24} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="mailto:jasmeetsingh5003@gmail.com"
                className="text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110">
                <Mail size={24} />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Right — Profile image */}
          <div className={`flex-shrink-0 ${isLoaded ? 'animate-zoom-in animate-delay-200' : 'opacity-0'}`}>
            <div className="relative">
              {/* Glow ring behind the image */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 rounded-full blur-2xl opacity-60"></div>

              {/* Outer decorative ring */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full p-1 bg-gradient-to-br from-primary via-accent/50 to-primary">
                {/* Inner image container */}
                <div className="w-full h-full rounded-full overflow-hidden bg-background">
                  <img
                    src="/profile.jpg"
                    alt="Jasmeet Singh"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              {/* Floating accent dots */}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
        <div className="w-8 h-12 border-2 border-accent/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-accent rounded-full mt-2"></div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Scroll down</p>
      </div>
    </section>
  );
};

export default Hero;
