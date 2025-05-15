
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden relative">
      {/* Page loading animation */}
      <div 
        className={`fixed inset-0 bg-background z-50 flex items-center justify-center transition-opacity duration-500 ${
          loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 relative">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-primary border-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-lg animate-pulse gradient-text font-medium">Loading Portfolio</p>
        </div>
      </div>
      
      {/* Scroll progress indicator */}
      <div className="fixed top-0 left-0 w-full h-1 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-500" 
          style={{ 
            width: `${typeof window !== 'undefined' ? (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100 : 0}%`,
            transition: 'width 0.1s' 
          }}
        ></div>
      </div>
      
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <Footer />
      
      {/* Go to top button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 p-3 rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/20 hover:scale-110 z-40 ${
          typeof window !== 'undefined' && window.scrollY > 300 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}
        aria-label="Go to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
    </div>
  );
};

export default Index;
