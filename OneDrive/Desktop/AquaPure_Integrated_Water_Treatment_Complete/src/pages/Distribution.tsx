import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Map,
  Droplets,
  Activity,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Layers
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface PipelineSegment {
  id: string;
  name: string;
  zone: string;
  pressure: number;
  flow: number;
  status: "normal" | "warning" | "critical";
  length: number;
  material: string;
}

interface PressureZone {
  id: string;
  name: string;
  minPressure: number;
  maxPressure: number;
  currentPressure: number;
  status: "optimal" | "low" | "high";
  coverage: string;
}

const pipelineData: PipelineSegment[] = [
  { id: "P001", name: "Main Supply Line A", zone: "Zone 1", pressure: 4.2, flow: 850, status: "normal", length: 2500, material: "HDPE" },
  { id: "P002", name: "Distribution Branch B1", zone: "Zone 1", pressure: 3.8, flow: 320, status: "normal", length: 1200, material: "PVC" },
  { id: "P003", name: "Industrial Feed C", zone: "Zone 2", pressure: 5.1, flow: 1200, status: "warning", length: 3000, material: "Steel" },
  { id: "P004", name: "Residential Loop D", zone: "Zone 2", pressure: 3.5, flow: 450, status: "normal", length: 1800, material: "HDPE" },
  { id: "P005", name: "Commercial Branch E", zone: "Zone 3", pressure: 2.8, flow: 280, status: "critical", length: 900, material: "PVC" },
  { id: "P006", name: "Hospital Priority Line", zone: "Zone 3", pressure: 4.5, flow: 380, status: "normal", length: 600, material: "Steel" },
];

const pressureZones: PressureZone[] = [
  { id: "Z1", name: "Zone 1 - North District", minPressure: 3.5, maxPressure: 5.0, currentPressure: 4.2, status: "optimal", coverage: "Industrial Park, North Residential" },
  { id: "Z2", name: "Zone 2 - Central", minPressure: 3.0, maxPressure: 4.5, currentPressure: 4.8, status: "high", coverage: "Commercial Center, Downtown" },
  { id: "Z3", name: "Zone 3 - South District", minPressure: 3.0, maxPressure: 4.5, currentPressure: 2.8, status: "low", coverage: "South Residential, Hospital Complex" },
];

const Distribution = () => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
      case "optimal":
        return "text-secondary bg-secondary/10 border-secondary/30";
      case "warning":
      case "high":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "critical":
      case "low":
        return "text-destructive bg-destructive/10 border-destructive/30";
      default:
        return "text-muted-foreground bg-muted/10 border-border";
    }
  };

  const filteredPipelines = selectedZone 
    ? pipelineData.filter(p => p.zone === selectedZone)
    : pipelineData;

  const totalFlow = pipelineData.reduce((acc, p) => acc + p.flow, 0);
  const avgPressure = pipelineData.reduce((acc, p) => acc + p.pressure, 0) / pipelineData.length;
  const criticalCount = pipelineData.filter(p => p.status === "critical").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Distribution Network
            </h1>
            <p className="text-muted-foreground">
              Monitor pipeline routes and pressure zones across the network
            </p>
          </div>
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">{criticalCount} Critical</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm text-secondary font-medium">Network Active</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Flow</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {totalFlow.toLocaleString()} <span className="text-base text-muted-foreground">L/min</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Avg Pressure</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {avgPressure.toFixed(1)} <span className="text-base text-muted-foreground">bar</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Pipelines</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {pipelineData.length} <span className="text-base text-muted-foreground">segments</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Pressure Zones</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {pressureZones.length} <span className="text-base text-muted-foreground">zones</span>
            </div>
          </div>
        </div>

        {/* Pressure Zones */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Pressure Zones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pressureZones.map((zone) => (
              <div 
                key={zone.id}
                className={`p-5 rounded-xl gradient-card border cursor-pointer transition-all hover:border-primary/50 ${
                  selectedZone === zone.name ? 'border-primary' : 'border-border/50'
                }`}
                onClick={() => setSelectedZone(selectedZone === zone.name ? null : zone.name)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{zone.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(zone.status)}`}>
                    {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Pressure</span>
                    <span className="font-medium text-foreground">{zone.currentPressure} bar</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Range</span>
                    <span className="text-muted-foreground">{zone.minPressure} - {zone.maxPressure} bar</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    {zone.coverage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Segments */}
        <div className="p-6 rounded-2xl gradient-card border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Pipeline Segments {selectedZone && `- ${selectedZone}`}
              </h2>
            </div>
            {selectedZone && (
              <Button variant="outline" size="sm" onClick={() => setSelectedZone(null)}>
                Clear Filter
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Zone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Pressure</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Flow Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Length</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Material</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPipelines.map((pipeline) => (
                  <tr key={pipeline.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm text-primary">{pipeline.id}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{pipeline.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{pipeline.zone}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{pipeline.pressure} bar</td>
                    <td className="py-3 px-4 text-sm text-foreground">{pipeline.flow} L/min</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{pipeline.length}m</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{pipeline.material}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pipeline.status)}`}>
                        {pipeline.status === "normal" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {pipeline.status.charAt(0).toUpperCase() + pipeline.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Distribution;
