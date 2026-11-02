/**
 * AquaPure heuristics — WHO Drinking Water & CPCB Wastewater Effluent standards.
 * Pipeline A: Potability (Kaggle 9-feature schema, WHO limits)
 * Pipeline B: Effluent (UCI dataset schema, CPCB Cat A/B/C/D reuse)
 */

// ---------- Pipeline A: Potability (WHO) ----------
export interface PotabilityInput {
  ph: number;
  hardness: number;        // mg/L
  solids: number;          // TDS ppm
  chloramines: number;     // ppm
  sulfate: number;         // mg/L
  conductivity: number;    // μS/cm
  organic_carbon: number;  // ppm
  trihalomethanes: number; // μg/L
  turbidity: number;       // NTU
}

export const WHO_LIMITS = {
  ph: { min: 6.5, max: 8.5, unit: "" },
  hardness: { min: 0, max: 300, unit: "mg/L" },
  solids: { min: 0, max: 1000, unit: "ppm TDS" },
  chloramines: { min: 0, max: 4, unit: "ppm" },
  sulfate: { min: 0, max: 250, unit: "mg/L" },
  conductivity: { min: 0, max: 800, unit: "μS/cm" },
  organic_carbon: { min: 0, max: 4, unit: "ppm" },
  trihalomethanes: { min: 0, max: 80, unit: "μg/L" },
  turbidity: { min: 0, max: 5, unit: "NTU" },
} as const;

export const POTABILITY_PRESETS: Record<string, PotabilityInput> = {
  "Pure Water": { ph: 7.2, hardness: 180, solids: 450, chloramines: 2.5, sulfate: 210, conductivity: 420, organic_carbon: 3.1, trihalomethanes: 55, turbidity: 2.4 },
  "Contaminated Water": { ph: 5.4, hardness: 380, solids: 1600, chloramines: 6.8, sulfate: 380, conductivity: 1200, organic_carbon: 8.2, trihalomethanes: 120, turbidity: 8.9 },
  "High Mineral Water": { ph: 8.1, hardness: 420, solids: 900, chloramines: 3.2, sulfate: 260, conductivity: 780, organic_carbon: 3.8, trihalomethanes: 65, turbidity: 3.5 },
};

export interface PotabilityResult {
  potable: boolean;
  wqi: number; // 0-100
  verdict: "SAFE TO DRINK" | "CONTAMINATED";
  shap: { feature: string; impact: number; direction: "positive" | "negative" }[];
  compliance: { feature: string; value: number; limit: string; ok: boolean }[];
}

export function predictPotability(x: PotabilityInput): PotabilityResult {
  const checks: { key: keyof PotabilityInput; label: string; value: number; ok: boolean; score: number }[] = [];
  const weights: Record<keyof PotabilityInput, number> = {
    ph: 15, hardness: 8, solids: 15, chloramines: 12, sulfate: 8,
    conductivity: 10, organic_carbon: 10, trihalomethanes: 12, turbidity: 10,
  };
  let total = 0;
  const shap: PotabilityResult["shap"] = [];
  for (const k of Object.keys(WHO_LIMITS) as (keyof typeof WHO_LIMITS)[]) {
    const lim = WHO_LIMITS[k];
    const v = x[k];
    const ok = v >= lim.min && v <= lim.max;
    // Deviation ratio (0 within, up to 1 far outside)
    let dev = 0;
    if (v < lim.min) dev = Math.min(1, (lim.min - v) / Math.max(lim.min, 1));
    else if (v > lim.max) dev = Math.min(1, (v - lim.max) / Math.max(lim.max, 1));
    const score = weights[k] * (1 - dev); // higher = more compliant
    total += score;
    checks.push({ key: k, label: k, value: v, ok, score });
    shap.push({
      feature: k,
      impact: +(score - weights[k] * 0.5).toFixed(2), // centered
      direction: ok ? "positive" : "negative",
    });
  }
  const maxTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const wqi = Math.max(0, Math.min(100, (total / maxTotal) * 100));
  const potable = wqi >= 70 && checks.every((c) => c.ok || c.score > weights[c.key] * 0.6);
  return {
    potable,
    wqi: +wqi.toFixed(1),
    verdict: potable ? "SAFE TO DRINK" : "CONTAMINATED",
    shap: shap.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    compliance: checks.map((c) => ({
      feature: c.label,
      value: c.value,
      limit: `${WHO_LIMITS[c.key].min}–${WHO_LIMITS[c.key].max} ${WHO_LIMITS[c.key].unit}`,
      ok: c.ok,
    })),
  };
}

// ---------- Pipeline B: Effluent (CPCB) ----------
export interface EffluentInput {
  flow_q_e: number;   // MLD influent flow
  bod_e: number;      // influent BOD mg/L
  cod_e: number;      // influent COD mg/L
  ss_e: number;       // influent SS mg/L
}

// CPCB thresholds (mg/L) for treated effluent
export const CPCB_CATEGORIES = {
  A: { name: "Category A — Agricultural Crop Irrigation", bod: 10, cod: 50, tss: 10 },
  B: { name: "Category B — Industrial Cooling & Process Reuse", bod: 20, cod: 100, tss: 20 },
  C: { name: "Category C — Urban Parks / Landscape", bod: 30, cod: 150, tss: 50 },
  D: { name: "Category D — Non-Compliant / Requires Retreatment", bod: Infinity, cod: Infinity, tss: Infinity },
} as const;

export interface EffluentResult {
  effluent: { bod: number; cod: number; tss: number };
  removal: { bod: number; cod: number; tss: number };
  category: "A" | "B" | "C" | "D";
  reuse: string;
  cards: { key: "A" | "B" | "C" | "D"; label: string; qualifies: boolean }[];
}

export function predictEffluent(x: EffluentInput): EffluentResult {
  // Empirical removal efficiencies (activated sludge + MBR polish)
  const loadFactor = Math.min(1.3, x.flow_q_e / 100 + 0.6);
  const bodEff = 0.96 / loadFactor;
  const codEff = 0.90 / loadFactor;
  const tssEff = 0.97 / loadFactor;
  const eBod = +(x.bod_e * (1 - bodEff)).toFixed(1);
  const eCod = +(x.cod_e * (1 - codEff)).toFixed(1);
  const eTss = +(x.ss_e * (1 - tssEff)).toFixed(1);

  const qualifies = (c: keyof typeof CPCB_CATEGORIES) =>
    eBod <= CPCB_CATEGORIES[c].bod && eCod <= CPCB_CATEGORIES[c].cod && eTss <= CPCB_CATEGORIES[c].tss;
  let category: "A" | "B" | "C" | "D" = "D";
  for (const c of ["A", "B", "C"] as const) if (qualifies(c)) { category = c; break; }

  return {
    effluent: { bod: eBod, cod: eCod, tss: eTss },
    removal: {
      bod: +((1 - eBod / x.bod_e) * 100).toFixed(1),
      cod: +((1 - eCod / x.cod_e) * 100).toFixed(1),
      tss: +((1 - eTss / x.ss_e) * 100).toFixed(1),
    },
    category,
    reuse: CPCB_CATEGORIES[category].name,
    cards: (["A", "B", "C", "D"] as const).map((k) => ({
      key: k, label: CPCB_CATEGORIES[k].name, qualifies: k === "D" ? category === "D" : qualifies(k),
    })),
  };
}

// ---------- Pipeline: Predictive Maintenance ----------
export interface MaintenanceInput {
  tmp: number;             // bar
  vibration: number;       // mm/s
  motor_temp: number;      // °C
  flow_drop: number;       // %
  operating_hours: number; // h
}

export interface MaintenanceResult {
  failure_risk: number; // 0-100
  status: "HEALTHY" | "MONITOR" | "WARNING" | "CRITICAL";
  rul_hours: number;
  components: { name: string; risk: number; note: string }[];
}

export function predictMaintenance(x: MaintenanceInput): MaintenanceResult {
  const tmpRisk = Math.min(1, Math.max(0, (x.tmp - 0.3) / 1.2));       // 0.3–1.5 bar
  const vibRisk = Math.min(1, x.vibration / 11.2);                     // ISO 10816
  const tempRisk = Math.min(1, Math.max(0, (x.motor_temp - 55) / 45));
  const flowRisk = Math.min(1, x.flow_drop / 40);
  const wearRisk = Math.min(1, x.operating_hours / 40000);
  const risk = 100 * (0.28 * tmpRisk + 0.28 * vibRisk + 0.18 * tempRisk + 0.16 * flowRisk + 0.10 * wearRisk);
  const status = risk < 25 ? "HEALTHY" : risk < 50 ? "MONITOR" : risk < 75 ? "WARNING" : "CRITICAL";
  const rul = Math.max(24, Math.round(8000 * (1 - risk / 100)));
  return {
    failure_risk: +risk.toFixed(1),
    status,
    rul_hours: rul,
    components: [
      { name: "MBR Membrane Module", risk: +(tmpRisk * 100).toFixed(0), note: tmpRisk > 0.6 ? "Fouling — clean CIP" : "Nominal" },
      { name: "Influent Pump Bearing", risk: +(vibRisk * 100).toFixed(0), note: vibRisk > 0.5 ? "Vibration high — align/replace" : "Nominal" },
      { name: "Blower Motor Windings", risk: +(tempRisk * 100).toFixed(0), note: tempRisk > 0.6 ? "Overheat — check cooling" : "Nominal" },
      { name: "Distribution Piping", risk: +(flowRisk * 100).toFixed(0), note: flowRisk > 0.5 ? "Flow drop — inspect for clog" : "Nominal" },
      { name: "General Wear", risk: +(wearRisk * 100).toFixed(0), note: wearRisk > 0.75 ? "Scheduled overhaul due" : "Within service life" },
    ],
  };
}

// ---------- Bio-Nutrient Recovery (Struvite) ----------
export interface NutrientInput {
  nh3_n: number;    // mg/L
  po4_p: number;    // mg/L
  mg: number;       // mg/L
  ph: number;
  daily_flow: number; // MLD
}

export interface NutrientResult {
  struvite_kg_day: number;
  n_recovery: number;
  p_recovery: number;
  revenue_usd_day: number;
  limiting: string;
}

export function predictNutrients(x: NutrientInput): NutrientResult {
  // Struvite MgNH4PO4·6H2O — MW = 245.4 g/mol; 1 mol each of N (14), P (31), Mg (24.3)
  // Molar concentrations (mM)
  const mN = x.nh3_n / 14;
  const mP = x.po4_p / 31;
  const mMg = x.mg / 24.3;
  const limitingMol = Math.min(mN, mP, mMg); // mmol/L
  const limitingName = limitingMol === mN ? "Ammonia (N)" : limitingMol === mP ? "Phosphate (P)" : "Magnesium (Mg)";
  // pH efficiency: peak at 8.5–9.5
  const phEff = x.ph < 7.5 ? 0.3 : x.ph > 10.5 ? 0.55 : Math.min(1, 1 - Math.abs(x.ph - 9) / 2);
  // kg/day = mmol/L * MW(g/mol) / 1000 * MLD * 1000 (m3) / 1000 = mmol/L * 0.2454 * MLD
  const kgDay = limitingMol * 0.2454 * x.daily_flow * 1000 * phEff;
  const nRec = Math.min(95, phEff * 92 * (limitingMol === mN ? 0.95 : mN / (limitingMol || 1)));
  const pRec = Math.min(95, phEff * 94 * (limitingMol === mP ? 0.95 : mP / (limitingMol || 1)));
  // Struvite market price ~ $0.55/kg
  const revenue = kgDay * 0.55;
  return {
    struvite_kg_day: +kgDay.toFixed(1),
    n_recovery: +nRec.toFixed(1),
    p_recovery: +pRec.toFixed(1),
    revenue_usd_day: +revenue.toFixed(2),
    limiting: limitingName,
  };
}

// ---------- Model Benchmark Matrix ----------
export const BENCHMARK_MATRIX = [
  { model: "Random Forest",          accuracy: 89.42, auc: 0.9248, f1: 0.8876, precision: 0.9015, recall: 0.8742, pipeline: "A" },
  { model: "XGBoost",                accuracy: 84.18, auc: 0.8654, f1: 0.8124, precision: 0.8350, recall: 0.7910, pipeline: "A" },
  { model: "Stacking Ensemble",      accuracy: 83.25, auc: 0.8540, f1: 0.8015, precision: 0.8240, recall: 0.7802, pipeline: "A" },
  { model: "LightGBM",               accuracy: 81.60, auc: 0.8385, f1: 0.7842, precision: 0.8055, recall: 0.7640, pipeline: "A" },
  { model: "MLP Neural Network",     accuracy: 79.45, auc: 0.8120, f1: 0.7580, precision: 0.7820, recall: 0.7355, pipeline: "A" },
  { model: "Voting Ensemble",        accuracy: 78.90, auc: 0.8065, f1: 0.7510, precision: 0.7760, recall: 0.7275, pipeline: "A" },
  { model: "K-Nearest Neighbors",    accuracy: 72.35, auc: 0.7350, f1: 0.6750, precision: 0.7020, recall: 0.6500, pipeline: "A" },
  { model: "Support Vector Machine", accuracy: 70.80, auc: 0.7180, f1: 0.6540, precision: 0.6850, recall: 0.6260, pipeline: "A" },
  { model: "Logistic Regression",    accuracy: 67.50, auc: 0.6840, f1: 0.6120, precision: 0.6480, recall: 0.5800, pipeline: "A" },
];
