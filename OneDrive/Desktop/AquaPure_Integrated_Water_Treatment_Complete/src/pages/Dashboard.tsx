import { Button } from "@/components/ui/button";
import { 
  Droplets, 
  Activity, 
  Thermometer, 
  Gauge, 
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react";
import SensorChart from "@/components/SensorChart";
import Sidebar from "@/components/Sidebar";

const sensorData = [
  { name: "pH Level", value: "7.2", unit: "", icon: Droplets, status: "normal", trend: "+0.1" },
  { name: "Temperature", value: "18.5", unit: "°C", icon: Thermometer, status: "normal", trend: "-0.3" },
  { name: "Turbidity", value: "0.8", unit: "NTU", icon: Activity, status: "warning", trend: "+0.2" },
  { name: "Pressure", value: "3.2", unit: "bar", icon: Gauge, status: "normal", trend: "0.0" },
];

const alerts = [
  { id: 1, type: "warning", message: "Turbidity slightly above optimal range", time: "5 min ago" },
  { id: 2, type: "success", message: "Water quality batch #2847 certified", time: "1 hour ago" },
  { id: 3, type: "info", message: "AI model updated with new predictions", time: "2 hours ago" },
];

const aiRecommendations = [
  "Increase chlorine dosage by 5% to optimize disinfection",
  "Schedule filter backwash in next 12 hours",
  "Current conditions ideal for membrane filtration efficiency"
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Plant Overview
            </h1>
            <p className="text-muted-foreground">
              Real-time monitoring of your wastewater treatment facility
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm text-secondary font-medium">System Online</span>
            </div>
            <Button variant="glow" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {sensorData.map((sensor) => {
            const IconComponent = sensor.icon;
            return (
              <div 
                key={sensor.name}
                className="p-6 rounded-2xl gradient-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    sensor.status === "warning" ? "bg-destructive/10" : "bg-primary/10"
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      sensor.status === "warning" ? "text-destructive" : "text-primary"
                    }`} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sensor.trend.startsWith("+") 
                      ? "bg-secondary/10 text-secondary" 
                      : sensor.trend.startsWith("-")
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {sensor.trend}
                  </span>
                </div>
                <div className="font-display text-3xl font-bold text-foreground mb-1">
                  {sensor.value}<span className="text-lg text-muted-foreground">{sensor.unit}</span>
                </div>
                <div className="text-sm text-muted-foreground">{sensor.name}</div>
              </div>
            );
          })}
        </div>

        {/* Live Sensor Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SensorChart
            title="pH Level"
            dataKey="ph"
            color="hsl(var(--primary))"
            unit="pH"
            minValue={6.0}
            maxValue={8.5}
            baseValue={7.2}
          />
          <SensorChart
            title="Temperature"
            dataKey="temperature"
            color="hsl(var(--secondary))"
            unit="°C"
            minValue={12}
            maxValue={25}
            baseValue={18.5}
          />
          <SensorChart
            title="Turbidity"
            dataKey="turbidity"
            color="hsl(var(--accent))"
            unit="NTU"
            minValue={0}
            maxValue={4}
            baseValue={0.8}
          />
          <SensorChart
            title="Pressure"
            dataKey="pressure"
            color="hsl(var(--chart-4))"
            unit="bar"
            minValue={2.0}
            maxValue={4.5}
            baseValue={3.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* AI Recommendations */}
          <div className="p-6 rounded-2xl gradient-card border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                AI Insights
              </h3>
            </div>
            <div className="space-y-3">
              {aiRecommendations.map((rec, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/10"
                >
                  <p className="text-sm text-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-6 p-6 rounded-2xl gradient-card border border-border/50">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  alert.type === "warning" 
                    ? "bg-destructive/10" 
                    : alert.type === "success"
                      ? "bg-secondary/10"
                      : "bg-primary/10"
                }`}>
                  {alert.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : alert.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-secondary" />
                  ) : (
                    <Zap className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;