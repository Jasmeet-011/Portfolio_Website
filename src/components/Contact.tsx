
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useInView } from "react-intersection-observer";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mzdarpdv";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (res.ok) {
        toast({
          title: "Message sent successfully",
          description: "Thanks for reaching out. I'll get back to you soon!",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        throw new Error("Failed to send");
      }
    } catch {
      // Fallback: open mailto
      const subject = encodeURIComponent(`Portfolio Contact from ${formData.name}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      );
      window.open(`mailto:jasmeetsingh5003@gmail.com?subject=${subject}&body=${body}`, "_self");
      toast({
        title: "Opening your email client",
        description: "If nothing opened, please email me directly at jasmeetsingh5003@gmail.com",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gradient-modern text-white relative overflow-hidden">
      {/* Static background elements — no animations to avoid GPU jank with backdrop-blur */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/5 rounded-full filter blur-2xl"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div
          ref={ref}
          className={`flex flex-col items-center text-center mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-3xl font-heading font-bold tracking-tighter sm:text-4xl md:text-5xl text-white mb-2">Contact Me</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-accent to-accent/40 rounded mb-4"></div>
          <p className="mt-4 text-lg text-white/80 max-w-[700px] font-light">
            Have a question or want to work together? Feel free to reach out.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card
              className={`col-span-1 glassmorphism text-white transition-all duration-500 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-white font-heading">Contact Information</CardTitle>
                <CardDescription className="text-white/70">Get in touch using the following details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 group">
                  <div className="p-3 rounded-full bg-white/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <Mail size={20} />
                  </div>
                  <a href="mailto:jasmeetsingh5003@gmail.com" className="text-white/80 hover:text-white hover:translate-x-1 transition-all duration-300">
                    jasmeetsingh5003@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="p-3 rounded-full bg-white/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <Phone size={20} />
                  </div>
                  <span className="text-white/80 group-hover:text-white hover:translate-x-1 transition-all duration-300">(929) 461-8279</span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="p-3 rounded-full bg-white/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <MapPin size={20} />
                  </div>
                  <span className="text-white/80 group-hover:text-white hover:translate-x-1 transition-all duration-300">New York City, NY</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`col-span-1 lg:col-span-2 glassmorphism text-white transition-all duration-500 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '0.1s' }}
            >
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-white font-heading">Send a Message</CardTitle>
                  <CardDescription className="text-white/70">Fill out the form below and I'll respond as soon as possible</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium leading-none text-white/70">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium leading-none text-white/70">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium leading-none text-white/70">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Enter your message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-colors"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-accent text-background hover:bg-accent/90 transition-colors group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full"></span>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Send Message</span>
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

export default Contact;
