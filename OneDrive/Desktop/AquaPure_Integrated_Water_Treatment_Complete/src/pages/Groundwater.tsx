import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Layers,
  Droplets,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Gauge,
  MapPin
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Well {
  id: string;
  name: string;
  location: string;
  depth: number;
  currentLevel: number;
  maxCapacity: number;
  pumpRate: number;
  status: "active" | "standby" | "maintenance";
  waterTemp: number;
  ph: number;
  tds: number;
  trend: "rising" | "stable" | "falling";
}

interface Aquifer {
  id: string;
  name: string;
  type: string;
  rechargeRate: number;
  currentLevel: number;
  safeYield: number;
  quality: "excellent" | "good" | "fair";
  wells: number;
}

const wellsData: Well[] = [
  { id: "W001", name: "North Intake Well 1", location: "N 40.7128, W 74.0060", depth: 120, currentLevel: 85, maxCapacity: 100, pumpRate: 450, status: "active", waterTemp: 14.2, ph: 7.1, tds: 280, trend: "stable" },
  { id: "W002", name: "North Intake Well 2", location: "N 40.7135, W 74.0055", depth: 115, currentLevel: 72, maxCapacity: 100, pumpRate: 380, status: "active", waterTemp: 14.5, ph: 7.0, tds: 290, trend: "falling" },
  { id: "W003", name: "Central Deep Well", location: "N 40.7100, W 74.0080", depth: 180, currentLevel: 68, maxCapacity: 100, pumpRate: 520, status: "active", waterTemp: 15.1, ph: 7.3, tds: 310, trend: "falling" },
  { id: "W004", name: "South Backup Well", location: "N 40.7080, W 74.0100", depth: 95, currentLevel: 90, maxCapacity: 100, pumpRate: 0, status: "standby", waterTemp: 13.8, ph: 7.2, tds: 265, trend: "rising" },
  { id: "W005", name: "Industrial Zone Well", location: "N 40.7150, W 74.0040", depth: 140, currentLevel: 45, maxCapacity: 100, pumpRate: 0, status: "maintenance", waterTemp: 14.0, ph: 6.9, tds: 340, trend: "stable" },
  { id: "W006", name: "Emergency Reserve Well", location: "N 40.7090, W 74.0120", depth: 160, currentLevel: 95, maxCapacity: 100, pumpRate: 0, status: "standby", waterTemp: 13.5, ph: 7.4, tds: 250, trend: "rising" },
];

const aquiferData: Aquifer[] = [
  { id: "A1", name: "Upper Glacial Aquifer", type: "Unconfined", rechargeRate: 85, currentLevel: 78, safeYield: 2500, quality: "excellent", wells: 3 },
  { id: "A2", name: "Magothy Aquifer", type: "Confined", rechargeRate: 45, currentLevel: 65, safeYield: 4200, quality: "good", wells: 2 },
  { id: "A3", name: "Lloyd Aquifer", type: "Confined", rechargeRate: 25, currentLevel: 82, safeYield: 1800, quality: "excellent", wells: 1 },
];

const Groundwater = () => {
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);

  const activeWells = wellsData.filter(w => w.status === "active").length;
  const totalPumpRate = wellsData.reduce((acc, w) => acc + w.pumpRate, 0);
  const avgLevel = wellsData.reduce((acc, w) => acc + w.currentLevel, 0) / wellsData.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-secondary bg-secondary/10 border-secondary/30";
      case "standby":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "maintenance":
        return "text-destructive bg-destructive/10 border-destructive/30";
      default:
        return "text-muted-foreground bg-muted/10 border-border";
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-secondary";
      case "good":
        return "text-primary";
      case "fair":
        return "text-amber-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 75) return "bg-secondary";
    if (level >= 50) return "bg-primary";
    if (level >= 25) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Influent Wastewater Management
            </h1>
            <p className="text-muted-foreground">
              Track incoming wastewater streams and source basins in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm text-secondary font-medium">{activeWells} Wells Active</span>
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
              <span className="text-sm text-muted-foreground">Total Pump Rate</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {totalPumpRate.toLocaleString()} <span className="text-base text-muted-foreground">L/min</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Active Wells</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {activeWells} <span className="text-base text-muted-foreground">/ {wellsData.length}</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Avg Water Level</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {avgLevel.toFixed(0)} <span className="text-base text-muted-foreground">%</span>
            </div>
          </div>
          
          <div className="p-5 rounded-xl gradient-card border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Aquifers Monitored</span>
            </div>
            <div className="font-display text-2xl font-bold text-foreground">
              {aquiferData.length} <span className="text-base text-muted-foreground">sources</span>
            </div>
          </div>
        </div>

        {/* Aquifer Overview */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Aquifer Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aquiferData.map((aquifer) => (
              <div key={aquifer.id} className="p-5 rounded-xl gradient-card border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{aquifer.name}</h3>
                    <p className="text-xs text-muted-foreground">{aquifer.type}</p>
                  </div>
                  <span className={`text-xs font-medium ${getQualityColor(aquifer.quality)}`}>
                    {aquifer.quality.charAt(0).toUpperCase() + aquifer.quality.slice(1)} Quality
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Current Level</span>
                      <span className="font-medium text-foreground">{aquifer.currentLevel}%</span>
                    </div>
                    <Progress value={aquifer.currentLevel} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Recharge Rate</span>
                      <p className="font-medium text-foreground">{aquifer.rechargeRate}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Safe Yield</span>
                      <p className="font-medium text-foreground">{aquifer.safeYield} L/min</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    {aquifer.wells} wells connected
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wells Grid */}
        <div className="p-6 rounded-2xl gradient-card border border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Intake Wells</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wellsData.map((well) => (
              <div 
                key={well.id}
                className={`p-4 rounded-xl bg-muted/30 border transition-all cursor-pointer hover:border-primary/50 ${
                  selectedWell?.id === well.id ? 'border-primary' : 'border-border/50'
                }`}
                onClick={() => setSelectedWell(selectedWell?.id === well.id ? null : well)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{well.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{well.id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(well.status)}`}>
                    {well.status.charAt(0).toUpperCase() + well.status.slice(1)}
                  </span>
                </div>

                {/* Water Level Indicator */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Water Level</span>
                    <div className="flex items-center gap-1">
                      {well.trend === "rising" && <TrendingUp className="w-3 h-3 text-secondary" />}
                      {well.trend === "falling" && <TrendingDown className="w-3 h-3 text-destructive" />}
                      <span className="font-medium text-foreground">{well.currentLevel}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getLevelColor(well.currentLevel)}`}
                      style={{ width: `${well.currentLevel}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Pump Rate</span>
                    <p className="font-medium text-foreground">{well.pumpRate} L/min</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Depth</span>
                    <p className="font-medium text-foreground">{well.depth}m</p>
                  </div>
                </div>

                {selectedWell?.id === well.id && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{well.location}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Temp</span>
                        <p className="font-medium text-foreground">{well.waterTemp}°C</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">pH</span>
                        <p className="font-medium text-foreground">{well.ph}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">TDS</span>
                        <p className="font-medium text-foreground">{well.tds} ppm</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Groundwater;
