
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message sent successfully",
        description: "Thanks for reaching out. I'll get back to you soon!",
      });
      setFormData({ name: "", email: "", message: "" });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-float"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/5 rounded-full filter blur-2xl animate-float" style={{ animationDelay: '3s' }}></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl gradient-text mb-2">Contact Me</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-blue-600 rounded mb-4"></div>
          <p className="mt-4 text-lg text-muted-foreground max-w-[700px]">
            Have a question or want to work together? Feel free to reach out.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1 card-hover glass-effect">
            <CardHeader>
              <CardTitle className="gradient-text">Contact Information</CardTitle>
              <CardDescription>Get in touch using the following details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 group">
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail className="animate-pulse-slow" size={20} />
                </div>
                <a href="mailto:example@example.com" className="hover:text-primary transition-colors group-hover:translate-x-1 transition-transform">
                  example@example.com
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone className="animate-pulse-slow" size={20} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform">(123) 456-7890</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <MapPin className="animate-pulse-slow" size={20} />
                </div>
                <span className="group-hover:translate-x-1 transition-transform">San Francisco, CA</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2 card-hover glass-effect">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="gradient-text">Send a Message</CardTitle>
                <CardDescription>Fill out the form below and I'll respond as soon as possible</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 transition-all focus-within:scale-[1.01]">
                    <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      className="transition-all focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>
                  <div className="space-y-2 transition-all focus-within:scale-[1.01]">
                    <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="transition-all focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 transition-all focus-within:scale-[1.005]">
                  <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Enter your message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="resize-none transition-all focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-opacity group"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : (
                    <div className="flex items-center gap-2">
                      <span>Send Message</span>
                      <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
