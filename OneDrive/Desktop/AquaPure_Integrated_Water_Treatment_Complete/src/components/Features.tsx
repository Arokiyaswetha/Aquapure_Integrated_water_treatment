import { 
  Zap, 
  LineChart, 
  ShieldCheck, 
  Gauge, 
  BrainCircuit,
  Recycle
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Process Optimization",
    description: "Machine learning models that predict equipment failures, optimize aeration and chemical dosing, and reduce energy and operating costs."
  },
  {
    icon: Gauge,
    title: "Real-Time Monitoring",
    description: "Live sensor data for BOD, COD, TSS, pH, and dissolved oxygen with customizable alerts and discharge thresholds."
  },
  {
    icon: LineChart,
    title: "Predictive Insights",
    description: "Forecast influent loads and effluent quality before excursions occur, so operators can act ahead of regulatory limits."
  },
  {
    icon: ShieldCheck,
    title: "Regulatory Compliance",
    description: "Automated effluent reporting and audit-ready logs aligned with EPA, NPDES, and local discharge permit requirements."
  },
  {
    icon: Recycle,
    title: "Sludge & Resource Recovery",
    description: "Track sludge generation, biogas yield, and reclaimed water reuse to turn waste streams into recoverable resources."
  },
  {
    icon: Zap,
    title: "Digital Twin Simulation",
    description: "Test process changes and load scenarios in a virtual replica of your treatment plant before deploying in the field."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Intelligent <span className="gradient-text">Capabilities</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed to maximize wastewater treatment efficiency 
            and ensure compliant, sustainable plant operations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            
            return (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 shadow-card"
              >
                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 glow-primary">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-2xl bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
