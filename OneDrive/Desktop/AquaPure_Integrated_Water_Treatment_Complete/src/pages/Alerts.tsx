import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  Search,
  Check,
  X,
  Clock,
  ChevronDown
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

type AlertType = "critical" | "warning" | "info" | "success";
type AlertStatus = "active" | "acknowledged" | "resolved";

interface Alert {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  source: string;
  time: string;
  status: AlertStatus;
}

const alertsData: Alert[] = [
  { id: 1, type: "critical", title: "High Turbidity Alert", message: "Turbidity in filter output exceeds 1.0 NTU threshold", source: "Filter Unit A", time: "2 min ago", status: "active" },
  { id: 2, type: "warning", title: "Chlorine Level Low", message: "Chlorine concentration below optimal range in distribution", source: "Disinfection Unit", time: "5 min ago", status: "active" },
  { id: 3, type: "warning", title: "pH Deviation", message: "pH trending outside 6.5-8.5 range in coagulation tank", source: "Coagulation Tank", time: "12 min ago", status: "acknowledged" },
  { id: 4, type: "info", title: "Filter Backwash Due", message: "Scheduled backwash for Filter B in 6 hours", source: "Filter B", time: "1 hour ago", status: "active" },
  { id: 5, type: "success", title: "Water Quality Certified", message: "Daily water quality batch #2847 passed all tests", source: "Quality Lab", time: "1 hour ago", status: "resolved" },
  { id: 6, type: "info", title: "AI Model Update", message: "Predictive model retrained with latest water quality data", source: "AI System", time: "2 hours ago", status: "resolved" },
  { id: 7, type: "warning", title: "Sensor Calibration", message: "TDS sensor requires recalibration", source: "Sensor Hub", time: "3 hours ago", status: "acknowledged" },
  { id: 8, type: "success", title: "System Recovery", message: "Backup power system test completed successfully", source: "Power Grid", time: "4 hours ago", status: "resolved" },
];

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case "critical": return AlertTriangle;
    case "warning": return AlertTriangle;
    case "info": return Info;
    case "success": return CheckCircle;
  }
};

const getAlertColors = (type: AlertType) => {
  switch (type) {
    case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warning": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "info": return "bg-primary/10 text-primary border-primary/20";
    case "success": return "bg-secondary/10 text-secondary border-secondary/20";
  }
};

const getStatusColors = (status: AlertStatus) => {
  switch (status) {
    case "active": return "bg-destructive/10 text-destructive";
    case "acknowledged": return "bg-amber-500/10 text-amber-500";
    case "resolved": return "bg-secondary/10 text-secondary";
  }
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>(alertsData);
  const [filter, setFilter] = useState<"all" | AlertType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AlertStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filter === "all" || alert.type === filter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          alert.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const acknowledgeAlert = (id: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: "acknowledged" as AlertStatus } : alert
    ));
  };

  const resolveAlert = (id: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: "resolved" as AlertStatus } : alert
    ));
  };

  const activeCount = alerts.filter(a => a.status === "active").length;
  const criticalCount = alerts.filter(a => a.type === "critical" && a.status !== "resolved").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar alertCount={activeCount} />

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Alerts Center
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage wastewater treatment alerts
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
              <span className="text-sm text-secondary font-medium">Monitoring Active</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Alerts", value: activeCount, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Critical", value: criticalCount, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Acknowledged", value: alerts.filter(a => a.status === "acknowledged").length, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Resolved Today", value: alerts.filter(a => a.status === "resolved").length, color: "text-secondary", bg: "bg-secondary/10" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl gradient-card border border-border/50">
              <div className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | AlertType)}
                className="appearance-none px-4 py-3 pr-10 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | AlertStatus)}
                className="appearance-none px-4 py-3 pr-10 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div 
                key={alert.id}
                className={`p-5 rounded-2xl gradient-card border ${getAlertColors(alert.type).split(" ")[2]} transition-all hover:border-primary/30`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAlertColors(alert.type).split(" ").slice(0, 2).join(" ")}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-foreground">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColors(alert.status)}`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        {alert.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </span>
                    </div>
                  </div>
                  {alert.status !== "resolved" && (
                    <div className="flex items-center gap-2">
                      {alert.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="gap-1"
                      >
                        <X className="w-4 h-4" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No alerts found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Alerts;