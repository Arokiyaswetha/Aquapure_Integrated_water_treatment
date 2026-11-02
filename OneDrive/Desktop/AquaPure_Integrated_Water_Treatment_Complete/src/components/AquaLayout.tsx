import { ReactNode } from "react";
import AquaSidebar from "./AquaSidebar";

interface Props { title: string; subtitle?: string; children: ReactNode; icon?: ReactNode; }

export const AquaLayout = ({ title, subtitle, children, icon }: Props) => (
  <div className="min-h-screen cyber-bg text-cyan-50 font-body relative overflow-x-hidden">
    <div className="pointer-events-none absolute inset-0 opacity-40" style={{
      backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(0,242,254,0.12), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(112,0,255,0.10), transparent 55%)",
    }} />
    <AquaSidebar />
    <main className="lg:ml-64 relative z-10 p-6 lg:p-10 max-w-[1500px]">
      <header className="mb-8 flex items-start gap-4">
        {icon && <div className="w-12 h-12 rounded-xl glass-card-strong flex items-center justify-center cyber-cyan glow-cyan">{icon}</div>}
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-white text-glow-cyan">{title}</h1>
          {subtitle && <p className="text-cyan-200/60 mt-1 text-sm">{subtitle}</p>}
        </div>
      </header>
      {children}
    </main>
  </div>
);

export default AquaLayout;
