import { 
  Database, 
  CloudUpload, 
  Brain, 
  Monitor, 
  Server, 
  LayoutDashboard, 
  ShieldCheck, 
  Cloud 
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Influent Monitoring",
    description: "Capture incoming wastewater data — flow, pH, BOD, COD, TSS, and ammonia — via SCADA/PLC sensors at the plant inlet.",
    color: "primary"
  },
  {
    number: "02",
    icon: CloudUpload,
    title: "Data Storage",
    description: "Stream sensor data into a secure cloud database for AI processing, historical trending, and reporting.",
    color: "secondary"
  },
  {
    number: "03",
    icon: Brain,
    title: "AI Process Control",
    description: "AI models tune aeration, chemical dosing, and sludge handling to remove contaminants efficiently and cut energy use.",
    color: "primary"
  },
  {
    number: "04",
    icon: Monitor,
    title: "Digital Twin",
    description: "Virtual replica of your treatment plant for safely testing process changes before deploying to live operations.",
    color: "secondary"
  },
  {
    number: "05",
    icon: Server,
    title: "Treatment Backend",
    description: "The core engine that processes telemetry, runs AI models, and orchestrates the digital twin.",
    color: "primary"
  },
  {
    number: "06",
    icon: LayoutDashboard,
    title: "Operator Dashboard",
    description: "Intuitive interface showing effluent quality, alarms, predictions, and AI recommendations for plant operators.",
    color: "secondary"
  },
  {
    number: "07",
    icon: ShieldCheck,
    title: "Compliance Reporting",
    description: "Automated discharge reports and audit logs aligned with EPA, NPDES, and local environmental permits.",
    color: "primary"
  },
  {
    number: "08",
    icon: Cloud,
    title: "Deploy to Cloud",
    description: "Full system deployment on cloud infrastructure for multi-site visibility and remote operations.",
    color: "secondary"
  }
];

const ProcessFlow = () => {
  return (
    <section id="process" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            The AquaPure <span className="gradient-text">Process</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From influent monitoring to compliant discharge — a complete journey to transform 
            your wastewater treatment plant into an intelligent, efficient operation.
          </p>
        </div>

        {/* Process Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isPrimary = step.color === "primary";
            
            return (
              <div
                key={step.number}
                className="group relative p-6 rounded-2xl gradient-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 shadow-card hover:shadow-elevated"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step Number */}
                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-bold font-display text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                  {step.number}
                </span>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${isPrimary ? 'bg-primary/10' : 'bg-secondary/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`w-7 h-7 ${isPrimary ? 'text-primary' : 'text-secondary'}`} />
                </div>

                {/* Content */}
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connection Line (hidden on last item in row) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-border to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;
