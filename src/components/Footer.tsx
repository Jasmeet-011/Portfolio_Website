import { Github, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-card/50 py-10 border-t border-border/50">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 64 64" className="w-8 h-8" aria-hidden="true">
                <defs>
                  <linearGradient id="footer-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6"/>
                    <stop offset="100%" stopColor="#7c3aed"/>
                  </linearGradient>
                </defs>
                <rect width="64" height="64" rx="16" fill="url(#footer-logo-bg)"/>
                <text x="32" y="44" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="30" fill="white" textAnchor="middle" letterSpacing="-1">JS</text>
              </svg>
              <span className="text-lg font-heading font-semibold">Jasmeet Singh</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Full Stack Developer &amp; NYU MSCS '26. Building fast, accessible, and user-friendly web experiences.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              {["about", "projects", "experience", "skills", "contact"].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors text-left"
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="https://github.com/Jasmeet-011" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110">
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/jasmeet-singh-wadhwa/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="mailto:jasmeetsingh5003@gmail.com" className="text-muted-foreground hover:text-accent transition-all duration-300 hover:scale-110">
                <Mail size={20} />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-8 border-t border-border/30">
          <p className="text-muted-foreground text-sm">&copy; {currentYear} Jasmeet Singh. All rights reserved.</p>
          <p className="text-muted-foreground text-sm mt-4 sm:mt-0">
            Designed &amp; Built by Jasmeet Singh
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
