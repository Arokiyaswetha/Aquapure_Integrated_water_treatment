"""Leakage-aware UCI model training and integrated decision-support workflow."""
from __future__ import annotations

import json
import argparse
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
import sklearn

from config import MODEL_DIR, RAW_DATA, RESULTS_DIR, RANDOM_SEED, TARGET_BANDS, TARGETS
from .data_loader import COLUMNS, INPUT_FEATURES, load_data
from .simulated_data import generate_simulated


def split_chronologically(frame: pd.DataFrame):
    """Split the 527 dated rows by time before any fitting or imputation."""
    n = len(frame)
    train_end, val_end = int(n * .70), int(n * .85)
    return frame.iloc[:train_end].copy(), frame.iloc[train_end:val_end].copy(), frame.iloc[val_end:].copy()


def fit_workflow(frame: pd.DataFrame, model_dir: Path = MODEL_DIR):
    train, validation, test = split_chronologically(frame)
    # Multi-output sklearn estimators require complete target vectors; input gaps are imputed in-pipeline.
    train_fit = train.dropna(subset=TARGETS)
    validation_eval = validation.dropna(subset=TARGETS)
    test_eval = test.dropna(subset=TARGETS)
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median", keep_empty_features=True)),
        ("model", RandomForestRegressor(n_estimators=400, min_samples_leaf=2,
            max_features=1.0, random_state=RANDOM_SEED, n_jobs=-1)),
    ])
    pipeline.fit(train_fit[INPUT_FEATURES], train_fit[TARGETS])
    metrics = {}
    for label, part in (("validation", validation_eval), ("test", test_eval)):
        predicted = pipeline.predict(part[INPUT_FEATURES])
        metrics[label] = {}
        for i, target in enumerate(TARGETS):
            truth, estimate = part[target].to_numpy(), predicted[:, i]
            metrics[label][target] = {
                "MAE": float(mean_absolute_error(truth, estimate)),
                "RMSE": float(mean_squared_error(truth, estimate) ** .5),
                "R2": float(r2_score(truth, estimate)),
                "records": int(len(part)),
            }
    anomaly = Pipeline([
        ("imputer", SimpleImputer(strategy="median", keep_empty_features=True)),
        ("model", IsolationForest(n_estimators=300, contamination="auto",
                                   random_state=RANDOM_SEED)),
    ]).fit(train[INPUT_FEATURES])
    bounds = {feature: [float(train_fit[feature].quantile(.02)),
                        float(train_fit[feature].quantile(.98))]
              for feature in INPUT_FEATURES}
    medians = train[INPUT_FEATURES].median()
    spreads = (train[INPUT_FEATURES].quantile(.75) - train[INPUT_FEATURES].quantile(.25)).replace(0, 1).fillna(1)
    artifacts = {"prediction_pipeline": pipeline, "anomaly_pipeline": anomaly,
                 "features": INPUT_FEATURES, "targets": TARGETS,
                 "input_bounds": bounds,
                 "input_medians": {key: float(value) for key, value in medians.items()},
                 "input_iqr": {key: float(value) for key, value in spreads.items()},
                 "training_rows": len(train_fit),
                 "train_end": train.iloc[-1]["date"].isoformat(),
                 "trained_at_utc": datetime.now(timezone.utc).isoformat(),
                 "scikit_learn_version": sklearn.__version__}
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifacts, model_dir / "aquapure_workflow.joblib")
    return artifacts, metrics, (train, validation, test)


def compare_existing_target_models(test: pd.DataFrame, report_dir: Path):
    """Score legacy per-target artifacts on the same held-out rows when loadable."""
    comparison = {"current_sklearn_version": sklearn.__version__, "legacy_models": {},
                  "interpretation": "Reference comparison only; legacy artifacts are not used by the new workflow."}
    for target in TARGETS:
        path = MODEL_DIR / f"{target.lower().replace('-', '_')}.joblib"
        if not path.exists():
            comparison["legacy_models"][target] = {"status": "no saved legacy artifact"}
            continue
        try:
            with warnings.catch_warnings(record=True) as captured:
                warnings.simplefilter("always")
                saved = joblib.load(path)
            valid = test.dropna(subset=[target])
            features = saved["features"]
            estimate = saved["pipeline"].predict(valid[features])
            comparison["legacy_models"][target] = {
                "status": "scored on same chronological held-out records",
                "metrics": {"MAE": float(mean_absolute_error(valid[target], estimate)),
                    "RMSE": float(mean_squared_error(valid[target], estimate) ** .5),
                    "R2": float(r2_score(valid[target], estimate)), "records": int(len(valid))},
                "feature_count": len(features),
                "load_warnings": sorted({str(item.message) for item in captured}),
            }
        except Exception as exc:
            comparison["legacy_models"][target] = {"status": "comparison unavailable",
                                                   "reason": str(exc)}
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "existing_model_comparison.json").write_text(
        json.dumps(comparison, indent=2), encoding="utf-8")
    return comparison


def validate_input(record, features=INPUT_FEATURES):
    missing = [name for name in features if name not in record]
    extra = [name for name in record if name not in features]
    if missing or extra:
        raise ValueError(f"Input fields must be exactly the 22 supported inputs; missing={missing}, extra={extra}")
    row = pd.DataFrame([{name: record[name] for name in features}], columns=features)
    row = row.apply(pd.to_numeric, errors="coerce")
    if row.isna().any().any():
        raise ValueError("All 22 process inputs must be numeric and non-missing.")
    if not np.isfinite(row.to_numpy()).all():
        raise ValueError("Process inputs must be finite numeric values.")
    return row


def predict(record, artifacts):
    row = validate_input(record, artifacts["features"])
    values = artifacts["prediction_pipeline"].predict(row)[0]
    return dict(zip(artifacts["targets"], map(float, values)))


def detect(record, artifacts):
    row = validate_input(record, artifacts["features"])
    model = artifacts["anomaly_pipeline"]
    label = "Potential Anomaly" if model.predict(row)[0] < 0 else "Normal"
    score = float(-model.decision_function(row)[0])
    med = np.array([artifacts["input_medians"][name] for name in artifacts["features"]])
    raw_deviations = np.abs(row.iloc[0].to_numpy() - med)
    scales = np.array([artifacts["input_iqr"][name] for name in artifacts["features"]])
    deviations = raw_deviations / scales
    # Compare deviations on a common IQR scale; this is context, not attribution.
    order = np.argsort(deviations)[::-1][:5]
    return {"label": label, "anomaly_score": score,
            "interpretation": "Unusual learned input pattern, not a verified plant fault.",
            "deviating_inputs": [{"feature": artifacts["features"][i],
                                  "value": float(row.iloc[0, i]),
                                  "distance_from_training_median_iqr": float(deviations[i]),
                                  "absolute_distance_from_training_median": float(raw_deviations[i])}
                                 for i in order]}


def recommend(prediction, anomaly, bands=TARGET_BANDS):
    guidance = {
        "DBO-S": "Check biological treatment performance and relevant aeration measurements.",
        "DQO-S": "Check the organic pollutant removal process.",
        "SS-S": "Inspect filtration and suspended-solids removal.",
        "PH-S": "Check pH measurements and the relevant treatment stage.",
    }
    items = []
    for target, value in prediction.items():
        low, high = bands[target]
        if not low <= value <= high:
            problem = "PH-S outside configured range" if target == "PH-S" else f"{target} high" if value > high else f"{target} below configured range"
            items.append({"problem": problem, "predicted_value": value,
                          "configured_demo_range": [low, high], "operator_check": guidance[target]})
    if anomaly["label"] == "Potential Anomaly":
        items.append({"problem": "Potential anomaly", "operator_check":
                      "Inspect unusual process parameters and verify measurements.",
                      "deviating_inputs": anomaly["deviating_inputs"]})
    return items or [{"status": "No configured demo issue identified; continue routine operator review."}]


def print_operator_summary(record, anomaly, prediction, recommendations, twin,
                           preferred_recommendations, feature, adjustment):
    """Render the user's requested operator-facing terminal format."""
    names = {"DBO-S": "BOD", "DQO-S": "COD", "SS-S": "suspended-solids", "PH-S": "pH"}
    print("\nAquaPure - Operator Decision Support")
    print("Data label: SIMULATED TEST DATA | Predictions are model predictions, not laboratory measurements.")
    issues = [item for item in recommendations if "problem" in item]
    print("\nPotential issue identified")
    print(f"Anomaly Detection (Isolation Forest): {anomaly['label']} | score: {anomaly['anomaly_score']:.4f}")
    if issues:
        for item in issues:
            label = item["problem"]
            target = next((key for key in TARGETS if key in label), None)
            if target and target != "PH-S":
                print(f"Problem: Predicted {names[target]} level is high.")
                print(f"Predicted {target}: {item['predicted_value']:.3f} | configured demo range: {item['configured_demo_range']}")
            elif target == "PH-S":
                print(f"Problem: Predicted pH is outside the configured range ({item['predicted_value']:.3f}; range {item['configured_demo_range']}).")
            else:
                print("Problem: An unusual process pattern was detected by Isolation Forest.")
                print("Anomaly score:", f"{anomaly['anomaly_score']:.4f}")
    else:
        print("No configured demo issue identified.")

    print("\nRecommendation module - Rule-Based System")
    if issues:
        for item in issues:
            print(f"- Problem: {item['problem']}")
            print(f"  Operator check: {item['operator_check']}")
            for deviation in item.get("deviating_inputs", []):
                print(f"  Deviating parameter: {deviation['feature']} = {deviation['value']:.4g} "
                      f"({deviation['distance_from_training_median_iqr']:.2f} training IQR from median)")
    else:
        print("- No rule triggered. Continue routine operator review.")
    print("Configured bands are demonstration thresholds, not official regulatory limits.")

    print("\nDigital Twin simulation")
    print(f"Selected supported input: {feature} | virtual adjustment step: {adjustment:.4g} "
          "(one training-data IQR by default; constrained to training-derived bounds).")
    print("Only the selected input is changed; all scenarios use the same saved Multi-Output Random Forest pipeline.")
    print("\nSimulation result")
    print(f"{'Scenario':<20} {'PH-S':>10} {'DBO-S':>10} {'DQO-S':>10} {'SS-S':>10}  Comparison")
    for scenario in twin["scenarios"]:
        p = scenario["predictions"]
        comp = "Baseline" if scenario["scenario"] == "Current Condition" else "; ".join(
            f"diff {target}={scenario['differences_from_baseline'][target]:+.3f}" for target in TARGETS)
        print(f"{scenario['scenario']:<20} {p['PH-S']:>10.3f} {p['DBO-S']:>10.3f} "
              f"{p['DQO-S']:>10.3f} {p['SS-S']:>10.3f}  {comp}")
    print("\nFinal operator suggestion")
    print(f"Compare the scenarios and review '{twin['preferred_scenario']}' as the preferred model scenario.")
    print(twin["explanation"])
    for item in preferred_recommendations:
        if "problem" in item:
            print(f"- {item['problem']}: {item['operator_check']}")
    print("Actual plant changes require operator approval and validation; virtual predictions do not prove real improvement.")
    print("Anomaly detection reports unusual learned patterns, not verified plant faults.")


def simulate(record, feature, adjustment, artifacts):
    if feature not in artifacts["features"]:
        raise ValueError(f"Unsupported process input: {feature}")
    base = validate_input(record, artifacts["features"]).iloc[0].to_dict()
    if not np.isfinite(float(adjustment)) or float(adjustment) <= 0:
        raise ValueError("Scenario adjustment must be a positive finite number.")
    lo, hi = artifacts["input_bounds"][feature]
    current = float(base[feature])
    scenarios = [("Current Condition", current)]
    scenarios.extend([(name, float(np.clip(current + delta, lo, hi)))
                      for name, delta in (("Lower Parameter", -abs(adjustment)),
                                          ("Higher Parameter", abs(adjustment)))])
    baseline = predict(base, artifacts)
    rows = []
    for name, value in scenarios:
        scenario = dict(base)
        if name != "Current Condition":
            scenario[feature] = value
        out = predict(scenario, artifacts)
        dist = sum(max(low - out[target], 0, out[target] - high) / max(high-low, 1e-12)
                   for target, (low, high) in TARGET_BANDS.items())
        rows.append({"scenario": name, "changed_feature": feature if name != "Current Condition" else None,
                     "input_value": value, "predictions": out,
                     "effective_parameter_change": value-current,
                     "valid_training_input_range": [lo, hi],
                     "bound_limited": name != "Current Condition" and value == current,
                     "differences_from_baseline": {t: out[t]-baseline[t] for t in TARGETS},
                     "quality_distance": dist})
    preferred = min(rows, key=lambda row: (row["quality_distance"],
                                            row["scenario"] != "Current Condition"))
    return {"scenarios": rows, "preferred_scenario": preferred["scenario"],
            "explanation": "Lowest distance to configured demonstration bands; ties retain current condition.",
            "warning": "Virtual predictions do not establish real-world improvement. Plant changes require operator approval and validation."}


def main(simulated_count: int = 12, simulated_seed: int = RANDOM_SEED,
         twin_feature: str = INPUT_FEATURES[0], twin_adjustment: float | None = None):
    frame = load_data(RAW_DATA)
    artifacts, metrics, (train, validation, test) = fit_workflow(frame)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    report_dir = RESULTS_DIR / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "workflow_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    inspection = {"rows": len(frame), "measured_variables": len(COLUMNS),
        "process_input_features": len(INPUT_FEATURES), "prediction_targets": len(TARGETS),
        "source_columns": list(frame.columns),
        "column_data_types": {name: str(dtype) for name,dtype in frame.dtypes.items()},
        "duplicate_records": int(frame.drop(columns=["date", "record_source"]).duplicated().sum()),
        "missing_by_column": frame[INPUT_FEATURES + TARGETS].isna().sum().to_dict(),
        "chronological_split_rows": {"train": len(train), "validation": len(validation), "test": len(test)},
        "chronological_date_ranges": {"train": [train.date.min().isoformat(), train.date.max().isoformat()],
            "validation": [validation.date.min().isoformat(), validation.date.max().isoformat()],
            "test": [test.date.min().isoformat(), test.date.max().isoformat()]},
        "complete_target_rows": {"train": int(train[TARGETS].notna().all(axis=1).sum()),
                                 "validation": int(validation[TARGETS].notna().all(axis=1).sum()),
                                 "test": int(test[TARGETS].notna().all(axis=1).sum())}}
    (report_dir / "dataset_inspection.json").write_text(json.dumps(inspection, indent=2, default=int), encoding="utf-8")
    existing_comparison = compare_existing_target_models(test.dropna(subset=TARGETS), report_dir)
    simulated = generate_simulated(train, artifacts, count=simulated_count, seed=simulated_seed)
    simulated.insert(0, "record_source", "SIMULATED TEST DATA")
    simulated.to_csv(RESULTS_DIR / "simulated_workflow_records.csv", index=False)
    functional_rows = []
    for index, sim_record in simulated.iterrows():
        sim_input = sim_record[INPUT_FEATURES].to_dict()
        sim_anomaly = detect(sim_input, artifacts)
        sim_prediction = predict(sim_input, artifacts)
        sim_recommendations = recommend(sim_prediction, sim_anomaly)
        functional_rows.append({"record_id": f"SIM-{index + 1:03d}",
            "record_source": "SIMULATED TEST DATA", "anomaly_label": sim_anomaly["label"],
            "simulation_case": "DELIBERATELY PERTURBED TEST CASE" if (index+1)%4==0 else "NORMAL-LIKE SIMULATED CASE",
            "anomaly_score": sim_anomaly["anomaly_score"],
            **{f"predicted_{target}": value for target, value in sim_prediction.items()},
            "recommendation_count": sum("problem" in item for item in sim_recommendations),
            "recommendations_json": json.dumps(sim_recommendations)})
    pd.DataFrame(functional_rows).to_csv(RESULTS_DIR / "reports" / "simulated_functional_results.csv", index=False)
    first = simulated.iloc[0][INPUT_FEATURES].to_dict()
    anomaly, prediction = detect(first, artifacts), predict(first, artifacts)
    recommendation = recommend(prediction, anomaly)
    adjustment = twin_adjustment if twin_adjustment is not None else artifacts["input_iqr"][twin_feature]
    twin = simulate(first, twin_feature, adjustment, artifacts)
    preferred_input = dict(first)
    preferred_row = next(row for row in twin["scenarios"] if row["scenario"] == twin["preferred_scenario"])
    if preferred_row["changed_feature"]:
        preferred_input[preferred_row["changed_feature"]] = preferred_row["input_value"]
    preferred_prediction = predict(preferred_input, artifacts)
    preferred_anomaly = detect(preferred_input, artifacts)
    preferred_recommendations = recommend(preferred_prediction, preferred_anomaly)
    simultaneous_rules = recommend(
        {"PH-S": 10.0, "DBO-S": 30.0, "DQO-S": 150.0, "SS-S": 40.0},
        {"label": "Potential Anomaly", "deviating_inputs": []})
    summary = {"data_classification": "SIMULATED TEST DATA", "anomaly": anomaly,
        "predictions_are_model_predictions": prediction, "recommendations": recommendation,
        "digital_twin": twin,
        "preferred_scenario_recommendations": preferred_recommendations,
        "functional_test_records": len(simulated),
        "deliberately_perturbed_records": sum(row["simulation_case"] == "DELIBERATELY PERTURBED TEST CASE" for row in functional_rows),
        "checks": {"simulated_inputs_validated": True,
            "prediction_and_twin_share_saved_pipeline": True,
            "digital_twin_scenarios": [row["scenario"] for row in twin["scenarios"]],
            "simultaneous_recommendation_rule_check_count": len(simultaneous_rules),
            "simultaneous_recommendation_rule_check": simultaneous_rules},
        "simulated_anomaly_flags": sum(row["anomaly_label"] == "Potential Anomaly" for row in functional_rows),
        "simulated_records_with_recommendation": sum(row["recommendation_count"] > 0 for row in functional_rows),
        "synthetic_records_used_for_training_or_metrics": False}
    (report_dir / "workflow_demo.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print_operator_summary(first, anomaly, prediction, recommendation, twin,
                           preferred_recommendations, twin_feature, adjustment)
    print(f"UCI records: {len(frame)} | inputs: {len(INPUT_FEATURES)} | targets: {len(TARGETS)}")
    print(f"Split rows: {len(train)}/{len(validation)}/{len(test)}; complete target rows: "
          f"{inspection['complete_target_rows']}")
    print("Validation/test metrics are in results/reports/workflow_metrics.json")
    print("Legacy artifact comparison:", report_dir / "existing_model_comparison.json")
    for split in ("validation", "test"):
        print(f"{split.upper()}:")
        for target in TARGETS:
            print(f"  {target}: {metrics[split][target]}")
    print("Simulated workflow records:", len(simulated), "(not used for model fitting or performance metrics)")
    print("Saved reusable artifacts to models/aquapure_workflow.joblib")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and run the AquaPure UCI ML workflow.")
    parser.add_argument("--simulated-count", type=int, default=12,
                        help="number of SIMULATED TEST DATA records to generate (default: 12)")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED,
                        help="reproducible random seed for simulated record generation")
    parser.add_argument("--twin-feature", choices=INPUT_FEATURES, default=INPUT_FEATURES[0],
                        help="supported UCI process input to vary in the Digital Twin")
    parser.add_argument("--twin-adjustment", type=float, default=None,
                        help="optional adjustment in the dataset's recorded measurement units; default is one training IQR")
    args = parser.parse_args()
    main(simulated_count=args.simulated_count, simulated_seed=args.seed,
         twin_feature=args.twin_feature, twin_adjustment=args.twin_adjustment)
