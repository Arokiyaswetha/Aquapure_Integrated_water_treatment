import { useState } from "react";
import AquaLayout from "@/components/AquaLayout";
import { BarChart3, Database, Award, ShieldAlert } from "lucide-react";
import { BENCHMARK_MATRIX } from "@/lib/aquapure";
import {
  ML_DATASET, WORKFLOW_METRICS, ALGORITHM_COMPARISON, TARGET_BEST,
  ANOMALY_MODEL_COMPARISON, type TargetKey,
} from "@/lib/mlResults";

type SortKey = "accuracy" | "auc" | "f1" | "precision" | "recall";

const TARGETS: TargetKey[] = ["PH-S", "DBO-S", "DQO-S", "SS-S"];

function PipelineA() {
  const [sort, setSort] = useState<SortKey>("accuracy");
  const rows = [...BENCHMARK_MATRIX].sort((a, b) => b[sort] - a[sort]);
  const best = rows[0];
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["accuracy", "auc", "f1", "precision", "recall"] as SortKey[]).map((k) => (
          <button key={k} onClick={() => setSort(k)}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all ${
              sort === k ? "glass-card-strong cyber-cyan glow-cyan" : "glass-card text-cyan-200/60 hover:text-white"
            }`}>Sort by {k}</button>
        ))}
      </div>

      <div className="glass-card-strong rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-[10px] uppercase tracking-widest text-cyan-200/70">
            <tr>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-right px-4 py-3">Accuracy</th>
              <th className="text-right px-4 py-3">AUC</th>
              <th className="text-right px-4 py-3">F1</th>
              <th className="text-right px-4 py-3">Precision</th>
              <th className="text-right px-4 py-3">Recall</th>
              <th className="text-center px-4 py-3">Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isBest = r.model === best.model;
              return (
                <tr key={r.model} className={`border-t border-cyan-500/10 ${isBest ? "bg-cyan-500/5" : ""}`}>
                  <td className="px-4 py-3 text-white font-medium">
                    {isBest && <span className="mr-2 cyber-cyan">★</span>}
                    {r.model}
                  </td>
                  <td className="px-4 py-3 text-right font-mono cyber-cyan">{r.accuracy.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{r.auc.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{r.f1.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{r.precision.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{r.recall.toFixed(4)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-cyan text-slate-950 font-semibold">A</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Top Model</div>
          <div className="font-display text-xl font-bold text-white">{best.model}</div>
          <div className="font-mono cyber-green mt-1">{best.accuracy.toFixed(2)}% acc · {best.auc.toFixed(4)} AUC</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Dataset</div>
          <div className="text-white text-sm">Kaggle Water Quality</div>
          <div className="text-cyan-200/50 text-xs">3,276 samples · 9 features · binary potability</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Validation</div>
          <div className="text-white text-sm">Stratified 5-fold CV</div>
          <div className="text-cyan-200/50 text-xs">80/20 hold-out · seed=42</div>
        </div>
      </div>
    </>
  );
}

function PipelineB() {
  return (
    <>
      <div className="glass-card rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 cyber-cyan" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-cyan-200/60">Training Data</div>
            <div className="text-white text-sm">{ML_DATASET.source}</div>
          </div>
        </div>
        <div className="font-mono text-xs text-cyan-100/70">{ML_DATASET.records} records · {ML_DATASET.inputFeatures} inputs · {ML_DATASET.targets.length} targets</div>
        <div className="font-mono text-xs text-cyan-200/50">{ML_DATASET.split}</div>
      </div>

      <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-3">Selected Multi-Output Model · Chronological Validation vs Held-Out Test</h3>
      <div className="glass-card-strong rounded-2xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-[10px] uppercase tracking-widest text-cyan-200/70">
            <tr>
              <th className="text-left px-4 py-3">Target</th>
              <th className="text-right px-4 py-3">Val MAE</th>
              <th className="text-right px-4 py-3">Val RMSE</th>
              <th className="text-right px-4 py-3">Val R²</th>
              <th className="text-right px-4 py-3">Test MAE</th>
              <th className="text-right px-4 py-3">Test RMSE</th>
              <th className="text-right px-4 py-3">Test R²</th>
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((t) => {
              const v = WORKFLOW_METRICS.validation[t], s = WORKFLOW_METRICS.test[t];
              return (
                <tr key={t} className="border-t border-cyan-500/10">
                  <td className="px-4 py-3 font-mono cyber-cyan font-semibold">{t}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{v.MAE.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{v.RMSE.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{v.R2.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right font-mono cyber-green">{s.MAE.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{s.RMSE.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white">{s.R2.toFixed(4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-3">Four-Algorithm Comparison · Mean Normalized Validation MAE (lower is better)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card-strong rounded-2xl p-5 space-y-3">
          {ALGORITHM_COMPARISON.map((a) => (
            <div key={a.algorithm}>
              <div className="flex justify-between text-xs mb-1">
                <span className={a.selected ? "cyber-cyan font-semibold" : "text-cyan-100/70"}>
                  {a.selected && "★ "}{a.algorithm}
                </span>
                <span className="font-mono text-white">{a.normalizedMAE.toFixed(4)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900/80 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(1 - a.normalizedMAE) * 100}%`, background: a.selected ? "linear-gradient(90deg,#00e676,#00f2fe)" : "#134e6f" }} />
              </div>
            </div>
          ))}
          <div className="text-[10px] text-cyan-200/40 pt-1">MAE normalized by each target's validation std · no test metrics used for selection</div>
        </div>
        <div className="glass-card-strong rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest cyber-cyan"><Award className="w-4 h-4" /> Best per target</div>
          {TARGETS.map((t) => (
            <div key={t} className="flex items-center justify-between glass-card rounded-lg px-3 py-2">
              <span className="font-mono cyber-cyan text-sm">{t}</span>
              <span className="text-xs text-white">{TARGET_BEST[t].algorithm}</span>
              <span className="font-mono text-[10px] text-cyan-200/60">val MAE {TARGET_BEST[t].valMAE.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="font-display text-sm uppercase tracking-widest cyber-cyan mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Anomaly Detector Comparison (unsupervised · training partition)</h3>
      <div className="glass-card-strong rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-[10px] uppercase tracking-widest text-cyan-200/70">
            <tr>
              <th className="text-left px-4 py-3">Detector</th>
              <th className="text-right px-4 py-3">Real Flag Rate</th>
              <th className="text-right px-4 py-3">Synthetic Flag Rate</th>
              <th className="text-right px-4 py-3">Score Mean</th>
              <th className="text-right px-4 py-3">Pairwise Agreement</th>
              <th className="text-center px-4 py-3">Selected</th>
            </tr>
          </thead>
          <tbody>
            {ANOMALY_MODEL_COMPARISON.map((a) => (
              <tr key={a.algorithm} className={`border-t border-cyan-500/10 ${a.selected ? "bg-cyan-500/5" : ""}`}>
                <td className="px-4 py-3 text-white font-medium">{a.selected && <span className="mr-2 cyber-cyan">★</span>}{a.algorithm}</td>
                <td className="px-4 py-3 text-right font-mono text-white">{(a.realFlagRate * 100).toFixed(2)}%</td>
                <td className="px-4 py-3 text-right font-mono text-white">{(a.syntheticFlagRate * 100).toFixed(2)}%</td>
                <td className="px-4 py-3 text-right font-mono text-white">{a.scoreMean.toFixed(4)}</td>
                <td className="px-4 py-3 text-right font-mono cyber-green">{a.pairwiseAgreement.toFixed(4)}</td>
                <td className="px-4 py-3 text-center">
                  {a.selected
                    ? <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green text-slate-950 font-semibold">IF</span>
                    : <span className="text-cyan-200/30 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-cyan-200/40 mt-3">
        No verified fault labels exist — flag rates describe unusual-pattern sensitivity, not fault accuracy. Trained pipelines (.joblib) ship in the downloadable ML project ZIP.
      </div>
    </>
  );
}

export default function Benchmarks() {
  const [tab, setTab] = useState<"A" | "B">("A");
  return (
    <AquaLayout icon={<BarChart3 className="w-6 h-6" />} title="Empirical Model Benchmark Matrix"
      subtitle="Pipeline A: Kaggle Potability (3,276 samples) · Pipeline B: Trained Effluent ML (UCI, 527 samples)">
      <div className="mb-6 flex gap-3">
        <button onClick={() => setTab("A")}
          className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all ${
            tab === "A" ? "glass-card-strong cyber-cyan glow-cyan" : "glass-card text-cyan-200/60 hover:text-white"
          }`}>Pipeline A · Potability</button>
        <button onClick={() => setTab("B")}
          className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all ${
            tab === "B" ? "glass-card-strong cyber-cyan glow-cyan" : "glass-card text-cyan-200/60 hover:text-white"
          }`}>Pipeline B · Effluent ML (Trained)</button>
      </div>
      {tab === "A" ? <PipelineA /> : <PipelineB />}
    </AquaLayout>
  );
}
