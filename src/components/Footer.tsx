import { Github, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-card/50 py-10 border-t border-border/50">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-heading font-semibold mb-4">Portfolio</h3>
            <p className="text-muted-foreground">
              Thanks for visiting my portfolio website. Feel free to reach out if you have any questions.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-semibold mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="#about" className="text-muted-foreground hover:text-accent transition-colors hover-link">About</a>
              <a href="#projects" className="text-muted-foreground hover:text-accent transition-colors hover-link">Projects</a> 
              <a href="#experience" className="text-muted-foreground hover:text-accent transition-colors hover-link">Experience</a>
              <a href="#skills" className="text-muted-foreground hover:text-accent transition-colors hover-link">Skills</a>
              <a href="#contact" className="text-muted-foreground hover:text-accent transition-colors hover-link">Contact</a>
            </nav>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors hover:scale-110 transform duration-200">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors hover:scale-110 transform duration-200">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors hover:scale-110 transform duration-200">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-8 border-t border-border/30">
          <p className="text-muted-foreground text-sm">&copy; {currentYear} Developer Portfolio. All rights reserved.</p>
          <p className="text-muted-foreground text-sm mt-4 sm:mt-0">
            Designed &amp; Built with <span className="text-accent animate-pulse-slow">💙</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
