import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Radio, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { 
  Droplets, 
  Activity, 
  Thermometer, 
  Gauge, 
  Beaker,
  RefreshCw,
  Play,
  Sparkles,
  Box,
  Waves,
  Filter,
  Factory
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

const DigitalTwin = () => {
  // Fallback baseline used until the first SCADA reading arrives
  const FALLBACK_PARAMS = { flowRate: 140, chlorineDosing: 2.2, filterPressure: 3.0, temperature: 23.5 };

  // Live plant baseline streamed from the SCADA/PLC feed
  const [currentParams, setCurrentParams] = useState(FALLBACK_PARAMS);
  const [feedStatus, setFeedStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Simulation Parameters (initialized to fallback, re-synced once SCADA arrives)
  const [flowRate, setFlowRate] = useState(FALLBACK_PARAMS.flowRate);
  const [chlorineDosing, setChlorineDosing] = useState(FALLBACK_PARAMS.chlorineDosing);
  const [filterPressure, setFilterPressure] = useState(FALLBACK_PARAMS.filterPressure);
  const [temperature, setTemperature] = useState(FALLBACK_PARAMS.temperature);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Compute plant output from input parameters (deterministic model)
  const computeState = (params: { flowRate: number; chlorineDosing: number; filterPressure: number; temperature: number }) => {
    const { flowRate: f, chlorineDosing: c, filterPressure: p, temperature: t } = params;
    const efficiency = Math.max(75, Math.min(99, 95 - (f - 125) * 0.04 + (c - 2.5) * 1.2 + (p - 3.2) * 0.8 - Math.abs(t - 25) * 0.15));
    const turbidity = Math.max(0.1, Math.min(3, 1.0 - (p - 3.2) * 0.18 + (f - 125) * 0.006 - (c - 2.5) * 0.05));
    const phOutput = 7.0 + (c - 2.5) * 0.08 - (p - 3.2) * 0.02;
    const energyCost = Math.max(80, Math.round(110 + (f - 125) * 0.6 + (p - 3.2) * 12 + Math.abs(t - 25) * 1.5));
    const qualityScore = Math.round(Math.max(0, Math.min(100, efficiency * 0.7 + (3 - turbidity) * 10)));
    return {
      phOutput: parseFloat(phOutput.toFixed(2)),
      turbidity: parseFloat(turbidity.toFixed(2)),
      efficiency: parseFloat(efficiency.toFixed(1)),
      energyCost,
      qualityScore,
    };
  };

  const currentState = computeState(currentParams);
  const [simulatedState, setSimulatedState] = useState(computeState(FALLBACK_PARAMS));
  const [isSimulating, setIsSimulating] = useState(false);

  // Poll SCADA/PLC edge feed every 5s
  useEffect(() => {
    let active = true;
    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("scada-feed");
        if (!active) return;
        if (error || !data?.params) {
          setFeedStatus("error");
          return;
        }
        const p = data.params;
        setCurrentParams(p);
        setFeedStatus("live");
        setLastSync(new Date());
        // Keep sliders pinned to the live baseline until the operator edits them
        if (!hasUserEdited) {
          setFlowRate(p.flowRate);
          setChlorineDosing(p.chlorineDosing);
          setFilterPressure(p.filterPressure);
          setTemperature(p.temperature);
          setSimulatedState(computeState(p));
        }
      } catch {
        if (active) setFeedStatus("error");
      }
    };
    fetchFeed();
    const id = setInterval(fetchFeed, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [hasUserEdited]);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulatedState(computeState({ flowRate, chlorineDosing, filterPressure, temperature }));
      setIsSimulating(false);
    }, 1000);
  };

  const resetSimulation = () => {
    setFlowRate(currentParams.flowRate);
    setChlorineDosing(currentParams.chlorineDosing);
    setFilterPressure(currentParams.filterPressure);
    setTemperature(currentParams.temperature);
    setSimulatedState(computeState(currentParams));
    setHasUserEdited(false);
  };

  // Calculate differences
  const efficiencyDiff = simulatedState.efficiency - currentState.efficiency;
  const energyDiff = simulatedState.energyCost - currentState.energyCost;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Box className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Plant Alpha - Virtual Model
              </h1>
              <p className="text-muted-foreground">
                Test optimizations without affecting production
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={feedStatus === "live" ? "default" : feedStatus === "error" ? "destructive" : "secondary"}
              className="gap-1.5"
            >
              {feedStatus === "error" ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Radio className={`w-3 h-3 ${feedStatus === "live" ? "animate-pulse" : ""}`} />
              )}
              SCADA/PLC {feedStatus === "live" ? "Live" : feedStatus === "error" ? "Offline" : "Connecting"}
              {lastSync && feedStatus === "live" && (
                <span className="opacity-70 ml-1">· {lastSync.toLocaleTimeString()}</span>
              )}
            </Badge>
            <Button variant="outline" onClick={resetSimulation}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="glow" onClick={runSimulation} disabled={isSimulating}>
              <Play className="w-4 h-4 mr-2" />
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Parameters */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <Box className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Simulation Parameters
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Adjust parameters to test different scenarios
            </p>

            <div className="space-y-6">
              {/* Flow Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Flow Rate</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{flowRate} L/min</span>
                </div>
                <Slider
                  value={[flowRate]}
                  onValueChange={(value) => { setFlowRate(value[0]); setHasUserEdited(true); }}
                  min={50}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Current: {flowRate} L/min</p>
              </div>

              {/* Chlorine Dosing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Chlorine Dosing</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{chlorineDosing.toFixed(1)} mg/L</span>
                </div>
                <Slider
                  value={[chlorineDosing]}
                  onValueChange={(value) => { setChlorineDosing(value[0]); setHasUserEdited(true); }}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Current: {chlorineDosing.toFixed(1)} mg/L</p>
              </div>

              {/* Filter Pressure */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Filter Pressure</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{filterPressure.toFixed(1)} bar</span>
                </div>
                <Slider
                  value={[filterPressure]}
                  onValueChange={(value) => { setFilterPressure(value[0]); setHasUserEdited(true); }}
                  min={1}
                  max={6}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Current: {filterPressure.toFixed(1)} bar</p>
              </div>

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Temperature</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{temperature.toFixed(1)} °C</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={(value) => { setTemperature(value[0]); setHasUserEdited(true); }}
                  min={10}
                  max={40}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Current: {temperature.toFixed(1)} °C</p>
              </div>
            </div>
          </div>

          {/* Simulation Results */}
          <div className="lg:col-span-2 p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Simulation Results
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Compare current state vs simulated output
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Current State */}
              <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-foreground">Current State</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">pH Output</span>
                    <span className="text-sm font-semibold text-foreground">{currentState.phOutput.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Turbidity</span>
                    <span className="text-sm font-semibold text-foreground">{currentState.turbidity.toFixed(1)} NTU</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Efficiency</span>
                    <span className="text-sm font-semibold text-foreground">{currentState.efficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Energy Cost</span>
                    <span className="text-sm font-semibold text-foreground">${currentState.energyCost}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quality Score</span>
                    <span className="text-sm font-semibold text-foreground">{currentState.qualityScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Simulated State */}
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-primary">Simulated State</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">pH Output</span>
                    <span className="text-sm font-semibold text-foreground">{simulatedState.phOutput.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Turbidity</span>
                    <span className="text-sm font-semibold text-foreground">{simulatedState.turbidity.toFixed(2)} NTU</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Efficiency</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{simulatedState.efficiency}%</span>
                      {efficiencyDiff !== 0 && (
                        <span className={`text-xs ${efficiencyDiff > 0 ? 'text-secondary' : 'text-destructive'}`}>
                          {efficiencyDiff > 0 ? '+' : ''}{efficiencyDiff.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Energy Cost</span>
                    <span className="text-sm font-semibold text-foreground">${simulatedState.energyCost}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quality Score</span>
                    <span className="text-sm font-semibold text-foreground">{simulatedState.qualityScore}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Summary */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Simulation Summary</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {efficiencyDiff === 0 && energyDiff === 0 ? (
                  "Adjust parameters and run simulation to see projected changes"
                ) : (
                  <>
                    Efficiency {efficiencyDiff >= 0 ? 'increased' : 'decreased'} by {Math.abs(efficiencyDiff).toFixed(1)}% 
                    {' • '}
                    Costs ${Math.abs(energyDiff)}/day {energyDiff > 0 ? 'more' : energyDiff < 0 ? 'less' : 'same'}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Plant Schematic with Animated Flow */}
        <div className="mt-6 p-6 rounded-2xl gradient-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Treatment Process Overview
            </h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm text-primary font-medium">Live Flow</span>
            </div>
          </div>
          
          {/* Flow Pipeline */}
          <div className="relative">
            {/* Animated Flow Line - speed based on flow rate */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-muted/30 -translate-y-1/2 z-0 overflow-hidden rounded-full">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                style={{ 
                  backgroundSize: '200% 100%',
                  animation: `flow ${Math.max(0.5, 4 - (flowRate / 50))}s linear infinite`
                }} 
              />
            </div>
            
            {/* Flow Particles - speed synced to flow rate */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 -translate-y-1/2 z-0 pointer-events-none">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const particleDuration = Math.max(1, 5 - (flowRate / 50));
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                    style={{
                      animation: `flowParticle ${particleDuration}s linear infinite`,
                      animationDelay: `${i * (particleDuration / 6)}s`,
                      left: '-8px',
                    }}
                  />
                );
              })}
            </div>

            {/* Stage positions for splash effects */}
            {[0, 1, 2, 3, 4, 5].map((stageIndex) => {
              const particleDuration = Math.max(1, 5 - (flowRate / 50));
              const stagePosition = `${(stageIndex * 100 / 6) + (100 / 12)}%`;
              return (
                <div
                  key={`splash-${stageIndex}`}
                  className="hidden md:block absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                  style={{ left: stagePosition }}
                >
                  {/* Splash droplets */}
                  {[0, 1, 2].map((droplet) => (
                    <div
                      key={droplet}
                      className="absolute w-1 h-1 rounded-full bg-primary/80"
                      style={{
                        animation: `splash${droplet} ${particleDuration}s ease-out infinite`,
                        animationDelay: `${(stageIndex * particleDuration / 6)}s`,
                      }}
                    />
                  ))}
                  {/* Ripple effect */}
                  <div
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40"
                    style={{
                      animation: `ripple ${particleDuration}s ease-out infinite`,
                      animationDelay: `${(stageIndex * particleDuration / 6)}s`,
                    }}
                  />
                </div>
              );
            })}

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
              {[
                { icon: Waves, label: "Intake", value: `${flowRate} L/min`, status: "active" },
                { icon: Filter, label: "Pre-Filter", value: "Stage 1", status: "normal" },
                { icon: Beaker, label: "Coagulation", value: `pH ${currentState.phOutput}`, status: "normal" },
                { icon: Factory, label: "Filtration", value: `${filterPressure} bar`, status: "active" },
                { icon: Gauge, label: "Disinfection", value: `${chlorineDosing} mg/L`, status: "normal" },
                { icon: Droplets, label: "Output", value: `${currentState.qualityScore}% Pure`, status: "active" },
              ].map((step, index) => (
                <div key={step.label} className="relative">
                  {/* Connector arrows between stages (mobile) */}
                  {index < 5 && index % 2 === 0 && (
                    <div className="md:hidden absolute -right-2 top-1/2 -translate-y-1/2 text-primary animate-pulse">
                      →
                    </div>
                  )}
                  
                  <div className={`p-4 rounded-xl border text-center transition-all duration-300 relative overflow-hidden ${
                    step.status === 'active' 
                      ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_hsl(var(--primary)/0.2)]' 
                      : 'bg-muted/30 border-border/50'
                  }`}>
                    {/* Stage splash effect overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        animation: `stagePulse ${Math.max(1, 5 - (flowRate / 50))}s ease-out infinite`,
                        animationDelay: `${index * (Math.max(1, 5 - (flowRate / 50)) / 6)}s`,
                      }}
                    />
                    
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 relative ${
                      step.status === 'active' ? 'bg-primary/20' : 'bg-muted/50'
                    }`}>
                      {step.status === 'active' && (
                        <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                      )}
                      {/* Droplet splash on icon */}
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          animation: `iconSplash ${Math.max(1, 5 - (flowRate / 50))}s ease-out infinite`,
                          animationDelay: `${index * (Math.max(1, 5 - (flowRate / 50)) / 6)}s`,
                        }}
                      />
                      <step.icon className={`w-6 h-6 relative z-10 ${
                        step.status === 'active' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.value}</p>
                    
                    {/* Active indicator dot */}
                    {step.status === 'active' && (
                      <div className="mt-2 flex justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Flow Rate Indicator */}
          <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Current Flow Rate</span>
              <span className="text-sm font-bold text-primary">{flowRate} L/min</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${(flowRate / 200) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_linear_infinite]" />
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>0 L/min</span>
              <span>200 L/min</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DigitalTwin;
