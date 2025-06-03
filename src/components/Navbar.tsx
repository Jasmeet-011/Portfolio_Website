import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('about');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const handleScroll = () => {
      // Handle navbar background change
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Track active section
      const sections = ['about', 'projects', 'experience', 'skills', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSectionId(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
      setActiveSectionId(sectionId);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass-effect shadow-lg shadow-black/5 backdrop-blur-lg py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className={`text-2xl font-bold transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <a 
              href="#" 
              className="gradient-text relative"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
            >
              <span className="relative z-10">Portfolio</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-blue-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </a>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            {['about', 'projects', 'experience', 'skills', 'contact'].map((section, index) => (
              <button 
                key={section}
                onClick={() => scrollToSection(section)} 
                className={`relative group text-foreground transition-all duration-300 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                } ${
                  activeSectionId === section 
                    ? 'text-primary font-medium'
                    : 'hover:text-primary/80'
                }`}
                style={{ transitionDelay: `${index * 0.1 + 0.3}s` }}
              >
                <span className="block">
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </span>
                <span 
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300 ${
                    activeSectionId === section 
                      ? 'scale-x-100'
                      : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                ></span>
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className={`md:hidden transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-foreground hover:text-primary transition-colors p-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X size={24} className="animate-spin-once" />
              ) : (
                <Menu size={24} className="animate-pulse-slow" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden mt-4 py-4 px-2 glass-effect rounded-lg shadow-lg absolute left-4 right-4 transition-all duration-300 transform origin-top ${
            isMenuOpen 
              ? 'opacity-100 scale-y-100'
              : 'opacity-0 scale-y-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col space-y-1">
            {['about', 'projects', 'experience', 'skills', 'contact'].map((section, index) => (
              <button 
                key={section}
                onClick={() => scrollToSection(section)} 
                className={`text-foreground py-3 px-4 rounded-md transition-all ${
                  activeSectionId === section 
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-primary/5 hover:text-primary'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
