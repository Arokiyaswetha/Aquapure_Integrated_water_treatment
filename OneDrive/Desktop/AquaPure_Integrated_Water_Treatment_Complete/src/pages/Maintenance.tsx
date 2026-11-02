import { useMemo, useState } from "react";
import AquaLayout from "@/components/AquaLayout";
import { Wrench, AlertOctagon, Activity, Clock } from "lucide-react";
import { predictMaintenance, type MaintenanceInput } from "@/lib/aquapure";

const FIELDS: { key: keyof MaintenanceInput; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "tmp", label: "Transmembrane Pressure (TMP)", min: 0.1, max: 2.0, step: 0.01, unit: "bar" },
  { key: "vibration", label: "Pump Vibration Velocity", min: 0, max: 15, step: 0.1, unit: "mm/s" },
  { key: "motor_temp", label: "Blower Motor Temp", min: 30, max: 130, step: 1, unit: "°C" },
  { key: "flow_drop", label: "Flow Rate Drop", min: 0, max: 60, step: 1, unit: "%" },
  { key: "operating_hours", label: "Operating Hours", min: 0, max: 60000, step: 100, unit: "h" },
];
const STATUS_COLOR = { HEALTHY: "#00e676", MONITOR: "#4facfe", WARNING: "#ffd600", CRITICAL: "#ff1744" };

export default function Maintenance() {
  const [x, setX] = useState<MaintenanceInput>({ tmp: 0.5, vibration: 3.2, motor_temp: 68, flow_drop: 6, operating_hours: 12000 });
  const r = useMemo(() => predictMaintenance(x), [x]);
  const color = STATUS_COLOR[r.status];

  return (
    <AquaLayout icon={<Wrench className="w-6 h-6" />} title="Predictive Maintenance & Failure Model"
      subtitle="Telemetry-driven equipment health scoring · RUL estimation">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-6">
        <section className="glass-card rounded-2xl p-6 space-y-6">
          <h2 className="font-display text-lg font-bold cyber-cyan">Telemetry Inputs</h2>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-100/80">{f.label}</span>
                <span className="font-mono text-white">{x[f.key]} {f.unit}</span>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={x[f.key]}
                onChange={(e) => setX({ ...x, [f.key]: +e.target.value })} className="w-full accent-cyan-400" />
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card-strong rounded-xl p-5" style={{ boxShadow: `0 0 30px ${color}55` }}>
              <AlertOctagon className="w-6 h-6 mb-2" style={{ color }} />
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Failure Risk</div>
              <div className="font-mono text-3xl font-bold" style={{ color }}>{r.failure_risk}%</div>
            </div>
            <div className="glass-card-strong rounded-xl p-5">
              <Activity className="w-6 h-6 mb-2" style={{ color }} />
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Health Status</div>
              <div className="font-display text-xl font-bold" style={{ color }}>{r.status}</div>
            </div>
            <div className="glass-card-strong rounded-xl p-5">
              <Clock className="w-6 h-6 mb-2 cyber-cyan" />
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Remaining Useful Life</div>
              <div className="font-mono text-2xl text-white">{r.rul_hours.toLocaleString()}<span className="text-sm text-cyan-200/60"> h</span></div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">Component Risk Isolation</h3>
            <div className="space-y-3">
              {r.components.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{c.name}</span>
                    <span className="font-mono" style={{ color: c.risk > 70 ? "#ff1744" : c.risk > 40 ? "#ffd600" : "#00e676" }}>
                      {c.risk}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{
                      width: `${c.risk}%`,
                      background: c.risk > 70 ? "#ff1744" : c.risk > 40 ? "#ffd600" : "#00e676",
                    }} />
                  </div>
                  <div className="text-[10px] text-cyan-200/50 mt-0.5">{c.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AquaLayout>
  );
}
