import { useMemo, useState } from "react";
import AquaLayout from "@/components/AquaLayout";
import { Recycle, DollarSign, Beaker } from "lucide-react";
import { predictNutrients, type NutrientInput } from "@/lib/aquapure";

const FIELDS: { key: keyof NutrientInput; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "nh3_n", label: "Ammonia NH₃-N", min: 0, max: 800, step: 1, unit: "mg/L" },
  { key: "po4_p", label: "Phosphate PO₄-P", min: 0, max: 300, step: 1, unit: "mg/L" },
  { key: "mg", label: "Magnesium Mg", min: 0, max: 500, step: 1, unit: "mg/L" },
  { key: "ph", label: "Reactor pH", min: 6, max: 11, step: 0.1, unit: "" },
  { key: "daily_flow", label: "Daily Flow", min: 1, max: 300, step: 1, unit: "MLD" },
];

export default function Nutrients() {
  const [x, setX] = useState<NutrientInput>({ nh3_n: 220, po4_p: 90, mg: 180, ph: 9.0, daily_flow: 60 });
  const r = useMemo(() => predictNutrients(x), [x]);

  return (
    <AquaLayout icon={<Recycle className="w-6 h-6" />} title="Bio-Nutrient Recovery & Circular Economy"
      subtitle="Struvite (MgNH₄PO₄·6H₂O) precipitation yield estimator">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-6">
        <section className="glass-card rounded-2xl p-6 space-y-6">
          <h2 className="font-display text-lg font-bold cyber-cyan">Reactor Inputs</h2>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-100/80">{f.label}</span>
                <span className="font-mono text-white">{x[f.key].toFixed(f.step < 1 ? 1 : 0)} {f.unit}</span>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={x[f.key]}
                onChange={(e) => setX({ ...x, [f.key]: +e.target.value })} className="w-full accent-cyan-400" />
            </div>
          ))}
          <div className="text-xs text-cyan-200/60 pt-3 border-t border-cyan-500/20">
            Limiting reagent: <span className="cyber-yellow font-semibold">{r.limiting}</span>
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-card-strong rounded-2xl p-6 glow-cyan">
            <div className="flex items-center gap-4">
              <Beaker className="w-14 h-14 cyber-cyan" />
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-200/60">Struvite Yield</div>
                <div className="font-mono text-4xl font-bold text-white text-glow-cyan">{r.struvite_kg_day}</div>
                <div className="text-sm text-cyan-100/70">kg / day</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-5">
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Nitrogen Recovery</div>
              <div className="font-mono text-3xl cyber-green">{r.n_recovery}%</div>
              <div className="h-1.5 mt-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-green" style={{ width: `${r.n_recovery}%`, boxShadow: "0 0 12px #00e676" }} />
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Phosphorus Recovery</div>
              <div className="font-mono text-3xl" style={{ color: "#4facfe" }}>{r.p_recovery}%</div>
              <div className="h-1.5 mt-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: `${r.p_recovery}%`, background: "#4facfe", boxShadow: "0 0 12px #4facfe" }} />
              </div>
            </div>
          </div>

          <div className="glass-card-strong rounded-2xl p-6 glow-green">
            <div className="flex items-center gap-4">
              <DollarSign className="w-14 h-14 cyber-green" />
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-200/60">Daily Fertilizer Revenue</div>
                <div className="font-mono text-4xl font-bold cyber-green">${r.revenue_usd_day}</div>
                <div className="text-sm text-cyan-100/70">USD / day · @ $0.55/kg struvite</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AquaLayout>
  );
}
