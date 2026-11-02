import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Cpu, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">Smart Wastewater Treatment Platform</span>
          </div>

          {/* Headline */}
          <h1 
            className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            Cleaner Effluent for a{' '}
            <span className="gradient-text">Sustainable Future</span>
          </h1>

          {/* Subheadline */}
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            AI-powered platform that optimizes wastewater treatment plants end-to-end. 
            Monitor influent loads, control processes, and ensure compliant discharge with digital twin technology.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="glow" size="xl">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold font-display text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold font-display text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">BOD Removal</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold font-display text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">Discharge Compliance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;