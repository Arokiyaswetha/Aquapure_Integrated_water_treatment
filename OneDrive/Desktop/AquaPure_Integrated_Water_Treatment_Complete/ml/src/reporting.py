"""Write the phase reports without changing source measurements or model results."""
from __future__ import annotations
import json
from pathlib import Path
import pandas as pd
from .data_loader import COLUMNS,VARIABLES,INPUT_FEATURES
from .preprocessing import chronological_split

def _metric(row, key):
    value=row.get(key)
    return "" if value is None else float(value)

def write_reports(real, synthetic, reports, anomaly, prediction, row, scenarios,
                  explanation, recommendation, root, target_bands, range_metadata):
    root=Path(root); root.mkdir(parents=True,exist_ok=True)
    desc=dict(VARIABLES)
    dataset_lines=["AQUAPURE DATASET SUMMARY",f"Source: UCI Water Treatment Plant, dataset ID 106",
        f"Real records: {len(real)}",f"Numeric measurements: {len(COLUMNS)}",
        f"Date range: {real.date.min().date()} to {real.date.max().date()}",
        f"Duplicate full records: {int(real.duplicated().sum())}",
        f"Missing numeric cells: {int(real[COLUMNS].isna().sum().sum())}","","Column details:"]
    dataset_lines.extend(f"{col}: {desc[col]}; dtype={real[col].dtype}; missing={real[col].isna().sum()}"
                         for col in COLUMNS)
    (root/"dataset_summary.txt").write_text("\n".join(dataset_lines),encoding="utf-8")

    prep_lines=["AQUAPURE PREPROCESSING REPORT","Split: chronological per target; 70% train, 15% validation, 15% held-out test.",
        "Missing predictor values: median imputation fitted inside each training pipeline.",
        "Scaling: StandardScaler used for linear estimators and anomaly detectors; fit on training rows.",
        "Outliers: IQR flags are reported for review; no rows are deleted or clipped because valid excursions cannot be distinguished from measurement errors here.",
        f"Synthetic records: {len(synthetic)}; saved separately and excluded from model training.","","Target split counts:"]
    for target in reports:
        Xtr,ytr,Xv,yv,Xte,yte=chronological_split(real,target,INPUT_FEATURES)
        prep_lines.append(f"{target}: train={len(ytr)}, validation={len(yv)}, test={len(yte)}")
    prep_lines.extend(["","IQR screening counts across raw REAL values:"])
    for col in [*INPUT_FEATURES,*reports.keys()]:
        v=real[col].dropna(); q1,q3=v.quantile([.25,.75]); iqr=q3-q1
        count=int(((v<q1-1.5*iqr)|(v>q3+1.5*iqr)).sum())
        prep_lines.append(f"{col}: {count}")
    (root/"preprocessing_report.txt").write_text("\n".join(prep_lines),encoding="utf-8")

    feature_rows=[]; comparison_rows=[]
    for target,report in reports.items():
        selected=set(report["selected_features"])
        for feature,scores in report["feature_ranking"].items():
            feature_rows.append({"target":target,"feature":feature,
                "selected_by_kbest":bool(scores.get("selected_kbest",False)),
                "selected_for_final_model":feature in selected,
                "selection_rank_MI":scores.get("mutual_information"),
                "absolute_correlation":scores.get("correlation_abs"),
                "random_forest_importance":scores.get("random_forest_importance")})
        for candidate in report["candidate_metrics"]:
            metrics=candidate["metrics"]
            train=candidate.get("train_metrics",{})
            selected_model=(candidate["model"]==report["selected_model"] and
                            candidate["features"]==report["feature_set"])
            test=report["test_metrics"] if selected_model else {}
            comparison_rows.append({"target":target,"algorithm":candidate["model"],
                "feature_set":candidate["features"],"selected":selected_model,
                "training_MAE":_metric(train,"MAE"),"training_RMSE":_metric(train,"RMSE"),
                "training_R2":_metric(train,"R2"),
                "validation_MAE":metrics["MAE"],"validation_RMSE":metrics["RMSE"],
                "validation_R2":metrics["R2"],"heldout_test_MAE":_metric(test,"MAE"),
                "MAE_validation_minus_train":(metrics["MAE"]-train["MAE"] if train else ""),
                "R2_train_minus_validation":(train["R2"]-metrics["R2"] if train else ""),
                "heldout_test_RMSE":_metric(test,"RMSE"),"heldout_test_R2":_metric(test,"R2"),
                "mean_baseline_validation_MAE":report["mean_baseline_validation_metrics"]["MAE"] if selected_model else "",
                "mean_baseline_validation_RMSE":report["mean_baseline_validation_metrics"]["RMSE"] if selected_model else "",
                "mean_baseline_validation_R2":report["mean_baseline_validation_metrics"]["R2"] if selected_model else "",
                "mean_baseline_test_MAE":report["mean_baseline_test_metrics"]["MAE"] if selected_model else "",
                "mean_baseline_test_RMSE":report["mean_baseline_test_metrics"]["RMSE"] if selected_model else "",
                "mean_baseline_test_R2":report["mean_baseline_test_metrics"]["R2"] if selected_model else ""})
    pd.DataFrame(feature_rows).to_csv(root/"feature_selection_report.csv",index=False)
    pd.DataFrame(comparison_rows).to_csv(root/"model_comparison.csv",index=False)

    an_lines=["ANOMALY DETECTION REPORT","All models are unsupervised. The dataset labels are not reconstructed or treated as verified fault ground truth.",
              "A model flag identifies a pattern unlike the training distribution; it does not prove a plant fault.","","Latest selected record:"]
    for name,details in anomaly["models"].items():
        an_lines.append(f"{name}: {details['label']}; anomaly_score={details['anomaly_score']:.6f}")
    an_lines.append("Largest standardized deviations:")
    an_lines.extend(f"{item['parameter']}: {item['absolute_standardized_deviation_from_training_median']:.3f} training standard deviations"
                    for item in anomaly["unusual_parameter_deviations"])
    (root/"anomaly_detection_report.txt").write_text("\n".join(an_lines),encoding="utf-8")
    pred_rows=[{"date":row["date"],"record_source":"REAL","target":t,
                "prediction":value,"demonstration_band_low":target_bands[t][0],
                "demonstration_band_high":target_bands[t][1],**range_metadata[t]}
               for t,value in prediction.items()]
    pd.DataFrame(pred_rows).to_csv(root/"water_quality_predictions.csv",index=False)

    scenario_rows=[]
    for item in scenarios:
        flat={"scenario":item["scenario"],"changes":json.dumps(item["changes"]),
              "original_values":json.dumps(item.get("original_values",{})),
              "objective_score":item["score"],"quality_distance":item["quality_distance"],
              "normalized_adjustment":item["normalized_adjustment"],
              "acceptable":item["acceptable"],"feasible":item["feasible"]}
        flat.update({f"baseline_{k}":v for k,v in item.get("baseline_prediction",{}).items()})
        flat.update({f"prediction_delta_{k}":v for k,v in item.get("prediction_differences",{}).items()})
        flat["predictions_changed"]=item.get("predictions_changed",False)
        flat.update({f"normalized_distance_{k}":v for k,v in item.get("target_quality_distances",{}).items()})
        flat.update({f"predicted_{k}":v for k,v in item["prediction"].items()})
        scenario_rows.append(flat)
    pd.DataFrame(scenario_rows).to_csv(root/"digital_twin_scenarios.csv",index=False)
    shap_rows=[]
    for target,contributions in explanation.get("contributions",{}).items():
        ordered=sorted(contributions.items(),key=lambda pair:abs(pair[1]),reverse=True)
        global_values=explanation.get("global_importance",{}).get(target,{})
        importance_source=explanation.get("importance_sources",{}).get(target,"unknown")
        for rank,(feature,value) in enumerate(ordered,1):
            shap_rows.append({"target":target,"feature":feature,"contribution":value,
                              "global_mean_absolute_shap":(global_values.get(feature) if importance_source.startswith("SHAP") else None),
                              "global_importance_value":global_values.get(feature),
                              "global_importance_source":importance_source,
                              "direction":"positive" if value>0 else "negative" if value<0 else "zero",
                              "absolute_rank":rank,"top_five":rank<=5})
    pd.DataFrame(shap_rows).to_csv(root/"shap_explanations.csv",index=False)

    rec_lines=["OPERATOR RECOMMENDATION",f"DETECTED CONDITION: {recommendation['detected_condition']}",
        "PREDICTED WATER QUALITY:"]
    rec_lines.extend(f"  {k}: {v:.3f}" for k,v in recommendation["predicted_final_quality"].items())
    rec_lines.append("IMPORTANT PARAMETERS:")
    rec_lines.extend(f"  {item['parameter']}: {item['absolute_standardized_deviation_from_training_median']:.2f} SD from training median"
                     for item in anomaly["unusual_parameter_deviations"])
    rec_lines.append("SHAP EXPLANATION:")
    for target,features in recommendation["important_SHAP_contributors"].items():
        rec_lines.append(f"  {target}: "+", ".join(f"{f} {v:+.3f}" for f,v in features.items()))
    rec_lines.extend(["DIGITAL TWIN FINDING:",
        f"  Top-ranked scenario: {scenarios[0]['scenario']} (score {scenarios[0]['score']:.4f}); acceptable={scenarios[0]['acceptable']}.",
        "POSSIBLE OPERATOR ACTION:",f"  {recommendation['possible_operator_action']}",
        "VALIDATION NOTE:",f"  {recommendation['limitations']}"])
    (root/"operator_recommendations.txt").write_text("\n".join(rec_lines),encoding="utf-8")
    summary=["AQUAPURE FINAL EXECUTION SUMMARY",f"REAL records: {len(real)}",
        f"SYNTHETIC records: {len(synthetic)} (separate; not used to train models)",
        "Real held-out test metrics:"]
    for target,report in reports.items():
        m=report["test_metrics"]
        summary.append(f"{target}: {report['selected_model']} | MAE={m['MAE']:.4f} RMSE={m['RMSE']:.4f} R2={m['R2']:.4f}")
    summary.extend(["No verified supervised anomaly labels were used.",
        "Digital Twin scores are exploratory observational model comparisons, not causal intervention estimates.",
        "Demonstration target ranges are not regulatory or plant-approved limits."])
    (root/"final_execution_summary.txt").write_text("\n".join(summary),encoding="utf-8")
