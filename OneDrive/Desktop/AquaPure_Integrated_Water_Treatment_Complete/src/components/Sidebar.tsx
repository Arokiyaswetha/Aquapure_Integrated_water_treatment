import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Droplets, 
  Activity, 
  Zap, 
  TrendingUp, 
  Bell, 
  Settings, 
  LogOut, 
  Map, 
  Layers, 
  ClipboardCheck, 
  FileText, 
  Recycle,
  Boxes,
  Leaf,
  Wrench,
  Siren,
  BarChart3
} from "lucide-react";

const operationsNav = [
  { name: "Overview", icon: Activity, path: "/dashboard" },
  { name: "Digital Twin", icon: Zap, path: "/digital-twin" },
  { name: "3D Plant Twin", icon: Boxes, path: "/plant3d" },
  { name: "Distribution", icon: Map, path: "/distribution" },
  { name: "Influent Monitoring", icon: Layers, path: "/groundwater" },
  { name: "Sludge & Recovery", icon: Recycle, path: "/recovery" },
  { name: "Compliance (EPA)", icon: ClipboardCheck, path: "/compliance" },
  { name: "Analytics", icon: TrendingUp, path: "/analytics" },
  { name: "Reports", icon: FileText, path: "/reports" },
];

const mlIntelligenceNav = [
  { name: "Potability (WHO)", icon: Droplets, path: "/potability" },
  { name: "Effluent (CPCB)", icon: Leaf, path: "/effluent" },
  { name: "Maintenance (RUL)", icon: Wrench, path: "/maintenance" },
  { name: "Nutrient Recovery", icon: Recycle, path: "/nutrients" },
  { name: "Anomaly Detection", icon: Siren, path: "/anomaly" },
  { name: "Model Benchmarks", icon: BarChart3, path: "/benchmarks" },
];

const systemNav = [
  { name: "Alerts Center", icon: Bell, path: "/alerts" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  alertCount?: number;
}

const Sidebar = ({ alertCount = 3 }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const renderNav = (items: typeof operationsNav) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        const showBadge = item.name.includes("Alerts") && alertCount > 0;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
              isActive 
                ? "bg-primary/10 text-primary border border-primary/20 font-semibold" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.name}</span>
            {showBadge && (
              <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {alertCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-5 hidden lg:flex flex-col z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-6 shrink-0">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary shrink-0">
          <Droplets className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <span className="font-display text-lg font-bold text-foreground">
            Aqua<span className="text-primary">Pure</span>
          </span>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Smart Water Suite</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 mb-2">
            Operations
          </div>
          {renderNav(operationsNav)}
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary px-3 mb-2">
            AI / ML Intelligence
          </div>
          {renderNav(mlIntelligenceNav)}
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 mb-2">
            System
          </div>
          {renderNav(systemNav)}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="border-t border-border pt-3 mt-3 shrink-0">
        <button 
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
