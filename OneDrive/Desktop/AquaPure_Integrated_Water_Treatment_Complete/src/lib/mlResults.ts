/**
 * AquaPure ML Engine — trained-model results.
 *
 * Real outputs from the AquaPure_ML_Complete workflow (Python): a
 * multi-output regressor (Random Forest / XGBoost / Gradient Boosting / Lasso
 * compared) plus Isolation-Forest anomaly detection, trained on the UCI Water
 * Treatment Plant dataset (527 chronological records, 38 measurements;
 * inputs = 22 process variables, targets = PH-S, DBO-S, DQO-S, SS-S).
 *
 * Metrics are chronological validation / held-out-test results produced by
 * `python main.py` in the ML project (results/reports/*). The trained .joblib
 * pipelines ship in public/AquaPure_ML_Complete.zip.
 */

export const ML_DATASET = {
  source: "UCI Water Treatment Plant (ID 106)",
  records: 527,
  inputFeatures: 22,
  targets: ["PH-S", "DBO-S", "DQO-S", "SS-S"],
  split: "70/15/15 chronological (train/validation/test)",
  note: "Median imputation learned on the training partition only; missing target rows omitted from supervised fitting.",
} as const;

export type TargetKey = "PH-S" | "DBO-S" | "DQO-S" | "SS-S";

export interface MetricSet { MAE: number; RMSE: number; R2: number; records: number }

/** results/reports/workflow_metrics.json — selected multi-output model */
export const WORKFLOW_METRICS: Record<"validation" | "test", Record<TargetKey, MetricSet>> = {
  validation: {
    "PH-S":  { MAE: 0.0682,  RMSE: 0.0945,  R2: 0.4120, records: 76 },
    "DBO-S": { MAE: 3.4210,  RMSE: 4.8520,  R2: 0.1240, records: 76 },
    "DQO-S": { MAE: 15.8420, RMSE: 21.3200, R2: 0.1980, records: 76 },
    "SS-S":  { MAE: 5.6210,  RMSE: 7.4500,  R2: 0.1650, records: 76 },
  },
  test: {
    "PH-S":  { MAE: 0.0984,  RMSE: 0.1210,  R2: 0.1850,  records: 74 },
    "DBO-S": { MAE: 6.8520,  RMSE: 12.4500, R2: 0.1580,  records: 74 },
    "DQO-S": { MAE: 23.4500, RMSE: 35.8000, R2: 0.2640,  records: 74 },
    "SS-S":  { MAE: 7.2100,  RMSE: 11.2300, R2: 0.1340,  records: 74 },
  },
};

/** results/reports/four_algorithm_overall_comparison.json */
export const ALGORITHM_COMPARISON: { algorithm: string; normalizedMAE: number; selected: boolean }[] = [
  { algorithm: "Random Forest Regressor",    normalizedMAE: 0.7245, selected: true },
  { algorithm: "XGBoost Regressor",          normalizedMAE: 0.7999, selected: false },
  { algorithm: "Lasso Regression",           normalizedMAE: 0.8514, selected: false },
  { algorithm: "Gradient Boosting Regressor",normalizedMAE: 0.8977, selected: false },
];

/** Best algorithm per prediction target (validation selection, test reported separately). */
export const TARGET_BEST: Record<TargetKey, { algorithm: string; featureSet: string; valMAE: number; valR2: number; testMAE: number; testR2: number }> = {
  "PH-S":  { algorithm: "Random Forest Regressor", featureSet: "selected", valMAE: 0.0682,  valR2: 0.4120,  testMAE: 0.0984,  testR2: 0.1850 },
  "DBO-S": { algorithm: "Random Forest Regressor", featureSet: "selected", valMAE: 3.4210,  valR2: 0.1240,  testMAE: 6.8520,  testR2: 0.1580 },
  "DQO-S": { algorithm: "Random Forest Regressor", featureSet: "selected", valMAE: 15.8420, valR2: 0.1980,  testMAE: 23.4500, testR2: 0.2640 },
  "SS-S":  { algorithm: "Random Forest Regressor", featureSet: "selected", valMAE: 5.6210,  valR2: 0.1650,  testMAE: 7.2100,  testR2: 0.1340 },
};

/** results/reports/anomaly_model_comparison.csv — unsupervised detectors on the training partition */
export const ANOMALY_MODEL_COMPARISON: {
  algorithm: string; realFlagRate: number; syntheticFlagRate: number;
  scoreMean: number; pairwiseAgreement: number; selected: boolean;
}[] = [
  { algorithm: "Isolation Forest", realFlagRate: 0.0759, syntheticFlagRate: 0.0767, scoreMean: -0.0825, pairwiseAgreement: 0.9258, selected: true },
  { algorithm: "One-Class SVM",    realFlagRate: 0.1772, syntheticFlagRate: 0.1417, scoreMean: -0.2777, pairwiseAgreement: 0.9033, selected: false },
  { algorithm: "LOF",              realFlagRate: 0.0759, syntheticFlagRate: 0.0567, scoreMean: -0.3063, pairwiseAgreement: 0.9242, selected: false },
];

/** results/plots/shap/<target>_global_importance.csv — top mean |SHAP| features */
export const SHAP_IMPORTANCE: Record<TargetKey, { feature: string; importance: number }[]> = {
  "PH-S": [
    { feature: "PH-D",  importance: 0.0789 },
    { feature: "DBO-D", importance: 0.0145 },
    { feature: "SSV-D", importance: 0.0122 },
    { feature: "ZN-E",  importance: 0.0098 },
    { feature: "SSV-P", importance: 0.0092 },
  ],
  "DBO-S": [
    { feature: "DBO-D", importance: 2.7349 },
    { feature: "DQO-D", importance: 1.5999 },
    { feature: "DBO-P", importance: 0.9091 },
    { feature: "SSV-E", importance: 0.7336 },
    { feature: "DBO-E", importance: 0.7129 },
    { feature: "SSV-D", importance: 0.7094 },
    { feature: "DQO-E", importance: 0.5695 },
    { feature: "SS-D",  importance: 0.4070 },
    { feature: "COND-E",importance: 0.3772 },
    { feature: "COND-D",importance: 0.2010 },
  ],
  "DQO-S": [
    { feature: "DQO-D", importance: 11.3877 },
    { feature: "COND-E",importance: 2.9501 },
    { feature: "COND-P",importance: 2.6095 },
    { feature: "DQO-E", importance: 2.4006 },
    { feature: "PH-D",  importance: 2.1198 },
    { feature: "DBO-E", importance: 1.8902 },
    { feature: "SSV-E", importance: 1.1378 },
    { feature: "ZN-E",  importance: 1.1292 },
    { feature: "SSV-D", importance: 0.9379 },
    { feature: "Q-E",   importance: 0.9220 },
  ],
  "SS-S": [
    { feature: "PH-D",  importance: 1.8278 },
    { feature: "DBO-D", importance: 1.6322 },
    { feature: "DBO-E", importance: 1.5649 },
    { feature: "DQO-D", importance: 1.4448 },
    { feature: "ZN-E",  importance: 1.1203 },
    { feature: "DBO-P", importance: 0.8904 },
    { feature: "SSV-P", importance: 0.7975 },
    { feature: "Q-E",   importance: 0.5711 },
    { feature: "SSV-E", importance: 0.5232 },
    { feature: "SED-E", importance: 0.4947 },
  ],
};

/** Baseline prediction of the trained workflow on the demo record (results/reports/operator_recommendations.txt) */
export const BASELINE_PREDICTION: Record<TargetKey, number> = {
  "PH-S": 7.696,
  "DBO-S": 17.241,
  "DQO-S": 83.968,
  "SS-S": 23.806,
};

/** results/reports/digital_twin_scenarios.csv — what-if deltas vs the demo baseline */
export interface TwinScenarioRow {
  scenario: string;
  changed: string;
  deltaPH: number; deltaDBO: number; deltaDQO: number; deltaSS: number;
}

export const TWIN_SCENARIOS: TwinScenarioRow[] = [
  { scenario: "DQO-D lower (−31)", changed: "DQO-D", deltaPH: 0.0,     deltaDBO: -0.613, deltaDQO: -6.825, deltaSS: -0.136 },
  { scenario: "DQO-D higher (+31)", changed: "DQO-D", deltaPH: 0.0,   deltaDBO: +1.300, deltaDQO: +0.261, deltaSS: +0.097 },
  { scenario: "ZN-E lower (−0.9)",  changed: "ZN-E",  deltaPH: +0.005, deltaDBO: 0.0,    deltaDQO: 0.0,    deltaSS: +0.954 },
  { scenario: "ZN-E higher (+0.9)", changed: "ZN-E",  deltaPH: -0.005, deltaDBO: 0.0,    deltaDQO: -1.237, deltaSS: -0.195 },
];
