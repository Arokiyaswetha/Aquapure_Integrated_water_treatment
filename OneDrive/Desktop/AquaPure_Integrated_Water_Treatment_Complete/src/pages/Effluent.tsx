import { useMemo, useState } from "react";
import AquaLayout from "@/components/AquaLayout";
import { Leaf, Sprout, Factory, Trees, AlertTriangle } from "lucide-react";
import { predictEffluent, type EffluentInput } from "@/lib/aquapure";
import { SHAP_IMPORTANCE, type TargetKey } from "@/lib/mlResults";


const FIELDS: { key: keyof EffluentInput; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "flow_q_e", label: "Flow Rate Q-E", min: 10, max: 300, step: 1, unit: "MLD" },
  { key: "bod_e", label: "Influent BOD (DBO-E)", min: 50, max: 1200, step: 5, unit: "mg/L" },
  { key: "cod_e", label: "Influent COD (DQO-E)", min: 100, max: 2500, step: 10, unit: "mg/L" },
  { key: "ss_e", label: "Suspended Solids SS-E", min: 20, max: 1500, step: 5, unit: "mg/L" },
];

const CAT_ICONS = { A: Sprout, B: Factory, C: Trees, D: AlertTriangle } as const;
const CAT_COLORS = { A: "#00e676", B: "#4facfe", C: "#00f2fe", D: "#ff1744" } as const;

export default function Effluent() {
  const [x, setX] = useState<EffluentInput>({ flow_q_e: 90, bod_e: 320, cod_e: 640, ss_e: 280 });
  const r = useMemo(() => predictEffluent(x), [x]);

  return (
    <AquaLayout
      icon={<Leaf className="w-6 h-6" />}
      title="Pipeline B · Treated Effluent Reuse Engine"
      subtitle="CPCB Categories A/B/C/D · UCI Water Treatment Plant Dataset (527 samples)"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-6">
        <section className="glass-card rounded-2xl p-6 space-y-6">
          <h2 className="font-display text-lg font-bold cyber-cyan">Influent Controls</h2>
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
          <div className="pt-4 border-t border-cyan-500/20 grid grid-cols-3 gap-3">
            {(["bod", "cod", "tss"] as const).map((k) => (
              <div key={k} className="text-center">
                <div className="text-[10px] uppercase tracking-widest text-cyan-200/50">Removal {k}</div>
                <div className="font-mono text-2xl cyber-green">{r.removal[k]}%</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {(["bod", "cod", "tss"] as const).map((k) => (
              <div key={k} className="glass-card-strong rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-widest cyber-cyan">Effluent {k.toUpperCase()}</div>
                <div className="font-mono text-2xl text-white mt-1">{r.effluent[k]}</div>
                <div className="text-[10px] text-cyan-200/40">mg/L</div>
              </div>
            ))}
          </div>

          <div className="glass-card-strong rounded-2xl p-6" style={{ boxShadow: `0 0 40px ${CAT_COLORS[r.category]}55` }}>
            <div className="text-xs uppercase tracking-widest text-cyan-200/60">CPCB Reuse Verdict</div>
            <div className="font-display text-2xl font-bold mt-1" style={{ color: CAT_COLORS[r.category] }}>
              Category {r.category}
            </div>
            <div className="text-sm text-cyan-100/70 mt-1">{r.reuse}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {r.cards.map((c) => {
              const Icon = CAT_ICONS[c.key];
              const color = CAT_COLORS[c.key];
              const active = c.qualifies;
              return (
                <div key={c.key} className={`glass-card rounded-xl p-4 border transition-all ${active ? "" : "opacity-40"}`}
                  style={{ borderColor: active ? color : "#1f2937", boxShadow: active ? `0 0 20px ${color}44` : undefined }}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8" style={{ color }} />
                    <div>
                      <div className="text-xs uppercase tracking-widest" style={{ color }}>Cat {c.key}</div>
                      <div className="text-sm text-white font-medium">{c.label}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px]" style={{ color: active ? color : "#64748b" }}>
                    {active ? "✔ QUALIFIES" : "— Not qualified"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">Model Explainability · Trained ML (mean |SHAP|)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(SHAP_IMPORTANCE) as TargetKey[]).map((t) => {
                const rows = SHAP_IMPORTANCE[t];
                const max = Math.max(...rows.map((s) => s.importance)) || 1;
                return (
                  <div key={t} className="glass-card rounded-xl p-4">
                    <div className="font-mono text-sm cyber-cyan font-semibold mb-2">{t}</div>
                    {rows.map((s) => (
                      <div key={s.feature} className="flex items-center gap-2 text-[11px] py-0.5">
                        <span className="w-14 font-mono text-cyan-100/70">{s.feature}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-900/80 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyber-green to-cyber-cyan" style={{ width: `${(s.importance / max) * 100}%` }} />
                        </div>
                        <span className="font-mono text-cyan-200/60 w-12 text-right">{s.importance.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-cyan-200/40 mt-3">
              D = primary clarifier, P = plant inlet, E = final effluent stages. Attribution from the trained workflow (AquaPure_ML_Complete) — it describes model behaviour, not causal root cause.
            </div>
          </div>
        </section>
      </div>
    </AquaLayout>
  );
}

