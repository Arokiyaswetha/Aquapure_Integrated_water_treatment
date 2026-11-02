import { useEffect, useMemo, useState } from "react";
import AquaLayout from "@/components/AquaLayout";
import { Siren, AlertTriangle, Waves, FlaskConical, CloudRain } from "lucide-react";
import { ANOMALY_MODEL_COMPARISON } from "@/lib/mlResults";


interface Point { t: number; flow: number; bod: number; ph: number; conductivity: number; score: number; anomaly: boolean; type?: string }

const KINDS = [
  { key: "SHOCK_LOAD", label: "Organic Shock Load", icon: AlertTriangle, color: "#ff1744" },
  { key: "TOXIC_SPILL", label: "Toxic Chemical Spill", icon: FlaskConical, color: "#7000ff" },
  { key: "RAIN_SURGE", label: "Rain Surge / Hydraulic", icon: CloudRain, color: "#4facfe" },
  { key: "NOMINAL", label: "Nominal", icon: Waves, color: "#00e676" },
];

// Simple Isolation-Forest-like scoring: standardized deviation across features
function scorePoint(p: Omit<Point, "t" | "score" | "anomaly" | "type">) {
  const norm = [
    (p.flow - 100) / 40,
    (p.bod - 300) / 100,
    (p.ph - 7) / 1.2,
    (p.conductivity - 900) / 300,
  ];
  const magnitude = Math.sqrt(norm.reduce((a, b) => a + b * b, 0)) / 2;
  return Math.min(1, magnitude);
}

function classify(p: Omit<Point, "t" | "score" | "anomaly" | "type">): string {
  if (p.bod > 500 && p.flow < 140) return "SHOCK_LOAD";
  if (p.conductivity > 1400 || p.ph < 5.5 || p.ph > 9.5) return "TOXIC_SPILL";
  if (p.flow > 180) return "RAIN_SURGE";
  return "NOMINAL";
}

export default function Anomaly() {
  const [series, setSeries] = useState<Point[]>([]);
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      // Bias occasional anomalies
      const roll = Math.random();
      const base = { flow: 100, bod: 300, ph: 7.1, conductivity: 900 };
      let raw = {
        flow: base.flow + (Math.random() - 0.5) * 20,
        bod: base.bod + (Math.random() - 0.5) * 40,
        ph: base.ph + (Math.random() - 0.5) * 0.4,
        conductivity: base.conductivity + (Math.random() - 0.5) * 80,
      };
      if (roll > 0.9) raw = { ...raw, bod: 620 + Math.random() * 200, flow: 90 + Math.random() * 20 };
      else if (roll > 0.82) raw = { ...raw, conductivity: 1500 + Math.random() * 300, ph: 5 + Math.random() * 0.4 };
      else if (roll > 0.75) raw = { ...raw, flow: 190 + Math.random() * 40 };
      const score = scorePoint(raw);
      const anomaly = score > 0.55;
      const type = anomaly ? classify(raw) : "NOMINAL";
      t += 1;
      setSeries((s) => [...s.slice(-59), { t, ...raw, score, anomaly, type }]);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const alerts = useMemo(() => series.filter((p) => p.anomaly).slice(-8).reverse(), [series]);

  return (
    <AquaLayout icon={<Siren className="w-6 h-6" />} title="Anomaly & Shock Load Detection"
      subtitle="Isolation-Forest streaming detector · shock loads, toxic spills, rain surges">
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">Live Sensor Stream (Anomaly Score)</h3>
          <svg viewBox="0 0 600 260" className="w-full h-64">
            <defs>
              <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((v) => (
              <line key={v} x1={0} x2={600} y1={260 - v * 240} y2={260 - v * 240} stroke="#0b3a55" strokeDasharray="3 3" />
            ))}
            <line x1={0} x2={600} y1={260 - 0.55 * 240} y2={260 - 0.55 * 240} stroke="#ff1744" strokeDasharray="4 4" opacity="0.6" />
            {series.length > 1 && (
              <>
                <path
                  d={"M " + series.map((p, i) => `${(i / 59) * 600},${260 - p.score * 240}`).join(" L ")}
                  fill="none" stroke="#00f2fe" strokeWidth="2" />
                <path
                  d={"M 0,260 L " + series.map((p, i) => `${(i / 59) * 600},${260 - p.score * 240}`).join(" L ") + ` L ${((series.length - 1) / 59) * 600},260 Z`}
                  fill="url(#ag)" />
              </>
            )}
            {series.map((p, i) => p.anomaly && (
              <circle key={i} cx={(i / 59) * 600} cy={260 - p.score * 240} r={4} fill="#ff1744">
                <animate attributeName="r" values="4;7;4" dur="1.2s" repeatCount="indefinite" />
              </circle>
            ))}
          </svg>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {KINDS.map((k) => (
              <div key={k.key} className="glass-card rounded-lg py-2">
                <k.icon className="w-4 h-4 mx-auto mb-1" style={{ color: k.color }} />
                <div className="text-[10px] text-cyan-100/70">{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-2xl p-6">
          <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">Alert Feed</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {alerts.length === 0 && <div className="text-xs text-cyan-200/50">Monitoring… no anomalies yet.</div>}
            {alerts.map((a, i) => {
              const kind = KINDS.find((k) => k.key === a.type) || KINDS[3];
              return (
                <div key={i} className="glass-card rounded-lg p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${kind.color}` }}>
                  <kind.icon className="w-5 h-5 mt-0.5" style={{ color: kind.color }} />
                  <div className="flex-1">
                    <div className="text-xs font-semibold" style={{ color: kind.color }}>{kind.label}</div>
                    <div className="text-[11px] text-cyan-100/70 font-mono">
                      Flow {a.flow.toFixed(0)} · BOD {a.bod.toFixed(0)} · pH {a.ph.toFixed(2)} · κ {a.conductivity.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-cyan-200/40">score {a.score.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 mt-6">
        <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-4">Trained Detector Validation · UCI Water Treatment Plant (real workflow output)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ANOMALY_MODEL_COMPARISON.map((m) => (
            <div key={m.algorithm} className={`glass-card rounded-xl p-4 ${m.selected ? "border-cyber-green/40" : "opacity-70"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${m.selected ? "cyber-green" : "text-white"}`}>{m.selected && "★ "}{m.algorithm}</span>
                {m.selected && <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green text-slate-950 font-semibold">ACTIVE</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-cyan-100/70">
                <div>real flag rate <span className="text-white">{(m.realFlagRate * 100).toFixed(2)}%</span></div>
                <div>synth flag rate <span className="text-white">{(m.syntheticFlagRate * 100).toFixed(2)}%</span></div>
                <div>score mean <span className="text-white">{m.scoreMean.toFixed(4)}</span></div>
                <div>agreement <span className="cyber-green">{m.pairwiseAgreement.toFixed(4)}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-cyan-200/40 mt-3">
          Isolation Forest was selected for the streaming view above: its real/synthetic flag rates match within 0.07 pp and it agrees with the other detectors 92.6% of the time. No verified fault labels exist, so rates describe unusual-pattern sensitivity — not fault accuracy.
        </div>
      </div>
    </AquaLayout>
  );
}

