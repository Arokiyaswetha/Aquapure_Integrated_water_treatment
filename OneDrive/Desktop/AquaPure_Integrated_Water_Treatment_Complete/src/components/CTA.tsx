import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-muted/30 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Start Your Journey</span>
          </div>

          {/* Headline */}
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            Ready to Optimize Your{' '}
            <span className="gradient-text">Wastewater Plant?</span>
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join leading utilities using AquaPure to run cleaner, more compliant wastewater treatment plants. 
            Schedule a demo to see how AI and digital twin technology can transform your operations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Schedule Demo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="glow" size="xl">
                Contact Sales
              </Button>
            </Link>
          </div>

          {/* Search Query */}
          <p className="mt-12 text-sm text-muted-foreground">
            Search:{' '}
            <span className="text-primary font-medium">
              "AI-powered wastewater treatment plant digital twin IoT platform"
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;