import { Link, useLocation } from "react-router-dom";
import { 
  Boxes, 
  Droplets, 
  Leaf, 
  Wrench, 
  Recycle, 
  Siren, 
  BarChart3, 
  Home, 
  Zap, 
  ClipboardCheck, 
  Map, 
  Layers, 
  FileText, 
  Bell 
} from "lucide-react";

const mlItems = [
  { name: "3D Plant Twin", icon: Boxes, path: "/plant3d" },
  { name: "Potability (WHO)", icon: Droplets, path: "/potability" },
  { name: "Effluent (CPCB)", icon: Leaf, path: "/effluent" },
  { name: "Maintenance (RUL)", icon: Wrench, path: "/maintenance" },
  { name: "Nutrient Recovery", icon: Recycle, path: "/nutrients" },
  { name: "Anomaly Detection", icon: Siren, path: "/anomaly" },
  { name: "Model Benchmarks", icon: BarChart3, path: "/benchmarks" },
];

const operationsItems = [
  { name: "Plant Overview", icon: Home, path: "/dashboard" },
  { name: "Digital Twin", icon: Zap, path: "/digital-twin" },
  { name: "Distribution Map", icon: Map, path: "/distribution" },
  { name: "Influent / Well", icon: Layers, path: "/groundwater" },
  { name: "Sludge Recovery", icon: Recycle, path: "/recovery" },
  { name: "Compliance", icon: ClipboardCheck, path: "/compliance" },
  { name: "Reports", icon: FileText, path: "/reports" },
  { name: "Alerts Center", icon: Bell, path: "/alerts" },
];

export const AquaSidebar = () => {
  const loc = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 p-5 hidden lg:flex flex-col z-40 cyber-bg border-r border-cyan-500/20">
      <Link to="/" className="flex items-center gap-3 mb-6 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-cyber-cyan flex items-center justify-center glow-cyan shrink-0">
          <Droplets className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="font-display text-lg font-bold text-white">Aqua<span className="cyber-cyan text-glow-cyan">Pure</span></div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-300/70">AI ML Suite</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest cyber-cyan mb-2 px-3">
            AI & ML Modules
          </div>
          <div className="space-y-1">
            {mlItems.map((it) => {
              const active = loc.pathname === it.path;
              return (
                <Link
                  key={it.path}
                  to={it.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? "glass-card-strong text-white border-cyber-cyan font-semibold"
                      : "text-cyan-100/70 hover:text-white hover:bg-cyan-500/10"
                  }`}
                >
                  <it.icon className={`w-4 h-4 shrink-0 ${active ? "cyber-cyan" : ""}`} />
                  <span className="truncate">{it.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-cyan-200/50 mb-2 px-3">
            Plant Operations
          </div>
          <div className="space-y-1">
            {operationsItems.map((it) => {
              const active = loc.pathname === it.path;
              return (
                <Link
                  key={it.path}
                  to={it.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? "glass-card-strong text-white border-cyber-cyan font-semibold"
                      : "text-cyan-100/60 hover:text-white hover:bg-cyan-500/10"
                  }`}
                >
                  <it.icon className={`w-4 h-4 shrink-0 ${active ? "cyber-cyan" : ""}`} />
                  <span className="truncate">{it.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <a
        href="/AquaPure_ML_Complete.zip"
        download
        className="mt-3 text-xs text-center py-2 px-3 rounded-lg glass-card cyber-cyan hover:glow-cyan transition-all shrink-0"
      >
        ⬇ Download Full ML Pipeline (ZIP)
      </a>
    </aside>
  );
};

export default AquaSidebar;
