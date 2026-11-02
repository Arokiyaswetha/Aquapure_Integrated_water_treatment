import { useMemo, useState } from "react";
import AquaLayout from "@/components/AquaLayout";
import { Droplets, CheckCircle2, XCircle } from "lucide-react";
import { predictPotability, POTABILITY_PRESETS, WHO_LIMITS, type PotabilityInput } from "@/lib/aquapure";

const FIELDS: { key: keyof PotabilityInput; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "ph", label: "pH", min: 0, max: 14, step: 0.1, unit: "" },
  { key: "hardness", label: "Hardness", min: 0, max: 500, step: 1, unit: "mg/L" },
  { key: "solids", label: "Solids (TDS)", min: 0, max: 3000, step: 10, unit: "ppm" },
  { key: "chloramines", label: "Chloramines", min: 0, max: 15, step: 0.1, unit: "ppm" },
  { key: "sulfate", label: "Sulfate", min: 0, max: 500, step: 1, unit: "mg/L" },
  { key: "conductivity", label: "Conductivity", min: 0, max: 2000, step: 10, unit: "μS/cm" },
  { key: "organic_carbon", label: "Organic Carbon", min: 0, max: 20, step: 0.1, unit: "ppm" },
  { key: "trihalomethanes", label: "Trihalomethanes", min: 0, max: 200, step: 1, unit: "μg/L" },
  { key: "turbidity", label: "Turbidity", min: 0, max: 15, step: 0.1, unit: "NTU" },
];

export default function Potability() {
  const [x, setX] = useState<PotabilityInput>(POTABILITY_PRESETS["Pure Water"]);
  const result = useMemo(() => predictPotability(x), [x]);

  return (
    <AquaLayout
      icon={<Droplets className="w-6 h-6" />}
      title="Pipeline A · Drinking Water Purity Classifier"
      subtitle="WHO Drinking Water Guidelines · Kaggle Water Quality Dataset (3,276 samples)"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(POTABILITY_PRESETS).map((p) => (
          <button key={p} onClick={() => setX(POTABILITY_PRESETS[p])}
            className="px-4 py-2 rounded-lg glass-card text-xs uppercase tracking-wider cyber-cyan hover:glow-cyan transition-all">
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold cyber-cyan mb-2">Feature Sliders (Kaggle 9)</h2>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-100/80">{f.label} <span className="text-cyan-200/40">({f.unit})</span></span>
                <span className="font-mono text-white">{x[f.key].toFixed(f.step < 1 ? 1 : 0)}</span>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={x[f.key]}
                onChange={(e) => setX({ ...x, [f.key]: +e.target.value })}
                className="w-full accent-cyan-400" />
              <div className="text-[10px] text-cyan-200/40 mt-0.5">
                WHO: {WHO_LIMITS[f.key].min}–{WHO_LIMITS[f.key].max} {WHO_LIMITS[f.key].unit}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <div className={`glass-card-strong rounded-2xl p-6 ${result.potable ? "glow-green" : "glow-red"}`}>
            <div className="flex items-center gap-4">
              {result.potable
                ? <CheckCircle2 className="w-14 h-14 cyber-green" />
                : <XCircle className="w-14 h-14 cyber-red" />}
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-200/60">Verdict</div>
                <div className={`font-display text-3xl font-bold ${result.potable ? "cyber-green" : "cyber-red"}`}>
                  {result.verdict}
                </div>
                <div className="text-sm text-cyan-100/70 mt-1">WQI Score · <span className="font-mono text-white text-lg">{result.wqi}</span> / 100</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full transition-all" style={{
                width: `${result.wqi}%`,
                background: result.wqi > 70 ? "#00e676" : result.wqi > 40 ? "#ffd600" : "#ff1744",
                boxShadow: `0 0 16px ${result.wqi > 70 ? "#00e676" : result.wqi > 40 ? "#ffd600" : "#ff1744"}`,
              }} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">SHAP Explainability (XAI)</h3>
            <div className="space-y-2">
              {result.shap.map((s) => (
                <div key={s.feature} className="flex items-center gap-3 text-xs">
                  <div className="w-28 text-cyan-100/70">{s.feature}</div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                    <div className={`absolute top-0 h-full ${s.direction === "positive" ? "left-1/2 bg-cyber-green" : "right-1/2 bg-cyber-red"}`}
                      style={{ width: `${Math.min(50, Math.abs(s.impact) * 6)}%` }} />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
                  </div>
                  <div className="w-12 text-right font-mono text-white">{s.impact >= 0 ? "+" : ""}{s.impact}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">WHO Limit Compliance Grid</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {result.compliance.map((c) => (
                <div key={c.feature} className={`p-2 rounded-lg border text-xs ${c.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-100/80">{c.feature}</span>
                    {c.ok ? <CheckCircle2 className="w-3 h-3 cyber-green" /> : <XCircle className="w-3 h-3 cyber-red" />}
                  </div>
                  <div className="font-mono text-white text-sm">{c.value}</div>
                  <div className="text-[10px] text-cyan-200/40">{c.limit}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AquaLayout>
  );
}
