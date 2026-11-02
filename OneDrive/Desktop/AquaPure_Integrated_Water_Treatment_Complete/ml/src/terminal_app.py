"""Clean terminal presentation and end-to-end AquaPure ML workflow."""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path: sys.path.insert(0,str(ROOT))
from config import (RAW_DATA,SIMULATED_DATA,MODEL_DIR,RESULTS_DIR,RANDOM_SEED,
                    TARGETS,TARGET_BANDS,TARGET_RANGE_METADATA)
from .data_loader import load_data,INPUT_FEATURES
from .data_simulator import generate_synthetic
from .data_validation import validate_synthetic
from .water_quality_prediction import train_models,predict_water_quality,summarize_required_algorithm_comparison
from .anomaly_detection import fit_anomaly_models,detect_anomaly,compare_anomaly_models
from .scenario_optimization import rank_scenarios,score_scenario
from .explainable_ai import explain_prediction
from .operator_recommendation import generate_operator_recommendation,generate_synthetic_recommendations
from .reporting import write_reports
from . import api

def section(number,title):
    print(f"\n{number}. {title.upper()}")
    print("-"*78)

def table(headers,rows):
    rows=[[str(x) for x in row] for row in rows]
    widths=[max(len(str(h)),*(len(row[i]) for row in rows)) if rows else len(str(h))
            for i,h in enumerate(headers)]
    print(" | ".join(str(h).ljust(widths[i]) for i,h in enumerate(headers)))
    print("-+-".join("-"*w for w in widths))
    for row in rows:
        print(" | ".join(row[i].ljust(widths[i]) for i in range(len(headers))))

def f(value,digits=3):
    try: return f"{float(value):.{digits}f}"
    except (TypeError,ValueError): return str(value)

def print_header():
    print("="*78)
    print("AQUAPURE - AI-BASED WASTEWATER TREATMENT MONITORING AND DIGITAL TWIN SYSTEM")
    print("Machine Learning | Anomaly Detection | Water Quality Prediction | Explainable AI")
    print("="*78)

def interactive_twin(record,models,importance=None):
    from .digital_twin import run_digital_twin_simulation
    supported=sorted({feature for item in models.values() for feature in item["features"]})
    current=record.to_dict(); entered=[]
    print("Original record:",record["date"].date(),"| all values use source dataset conventions/units.")
    table(["Input feature","Observed value"],[[name,f(current[name],3)] for name in supported])
    while True:
        changes={}
        while True:
            print("\nSupported parameters:",", ".join(f"{i+1}:{name}" for i,name in enumerate(supported)))
            choice=input("Choose a parameter number/name (or done to finish): ").strip()
            if choice.lower() in {"done","q",""}: break
            try:
                feature=supported[int(choice)-1] if choice.isdigit() else choice
                if feature not in supported: raise ValueError("That parameter is not used by the trained models.")
                changes[feature]=float(input(f"Enter modified {feature}: "))
                if input("Change another parameter in this scenario? [y/N] ").strip().lower()!="y": break
            except ValueError as exc:
                print(f"[WARN] {exc}")
        if not changes: break
        label=input("Scenario name: ").strip() or f"Scenario {len(entered)+1}"
        try:
            result=run_digital_twin_simulation(current,changes,models)
            metric_rows=[]
            for target in TARGETS:
                metric_rows.append([target,f(result["original_prediction"][target]),
                    f(result["modified_prediction"][target]),f(result["prediction_difference"][target]),
                    result["distance_from_target_bands"]["movement"]])
            print(f"\n{label} - prediction comparison")
            table(["Target","Original","Modified","Difference","Band movement"],metric_rows)
            objective=score_scenario(current,changes,result["modified_prediction"],models,TARGET_BANDS)
            differences=result["prediction_difference"]
            entered.append({"scenario":label,"changes":changes,
                "original_values":{key:float(current[key]) for key in changes},
                "baseline_prediction":result["original_prediction"],
                "prediction_differences":differences,
                "predictions_changed":any(abs(v)>1e-10 for v in differences.values()),
                "target_quality_distances":objective["target_quality_distances"],**objective,
                "prediction":result["modified_prediction"],"feasible":True})
        except (ValueError,KeyError) as exc:
            print(f"[WARN] Scenario rejected: {exc}")
            continue
        if input("Try another scenario? [y/N] ").strip().lower()!="y": break
    ranked=rank_scenarios(current,models,TARGET_BANDS,importance=importance)
    if entered:
        ranked=[ranked[0],*sorted(entered,key=lambda item:item["score"])]
    ranked.sort(key=lambda item:item["score"])
    print("\nScenario ranking (target distance plus 0.05 x normalized adjustment):")
    table(["Rank","Scenario","Score","Quality distance","Adjustment","In bands?"],
        [[i+1,item["scenario"],f(item["score"],4),f(item["quality_distance"],4),
          f(item["normalized_adjustment"],4),"yes" if item["acceptable"] else "no"]
         for i,item in enumerate(ranked[:8])])
    return ranked

def main(argv=None):
    parser=argparse.ArgumentParser(description="AquaPure ML terminal workflow")
    parser.add_argument("--interactive",action="store_true",help="test Digital Twin scenarios in the terminal")
    parser.add_argument("--synthetic-count",type=int,default=600)
    args=parser.parse_args(argv)
    for folder in [MODEL_DIR,RESULTS_DIR,RESULTS_DIR/"reports",RESULTS_DIR/"plots",
                   RESULTS_DIR/"predictions",SIMULATED_DATA.parent]: Path(folder).mkdir(parents=True,exist_ok=True)
    print_header()

    real=load_data(RAW_DATA)
    section(1,"Dataset Information")
    print(f"Source: UCI Water Treatment Plant (ID 106); records: {len(real)}; process variables: {len(INPUT_FEATURES)} inputs / {len(real.columns)-2} total numeric columns.")
    print(f"Dates: {real.date.min().date()} to {real.date.max().date()} | duplicate records: {real.duplicated().sum()} | missing numeric cells: {real[real.select_dtypes('number').columns].isna().sum().sum()}")
    print("[WARN] Dataset descriptions list conceptual date classes, not a verified explicit fault-label column.")

    synthetic=generate_synthetic(real,args.synthetic_count,RANDOM_SEED)
    synthetic.to_csv(SIMULATED_DATA,index=False)
    synthetic_audit=validate_synthetic(real,synthetic,RESULTS_DIR/"reports")
    section(2,"Data Preprocessing")
    print("REAL rows retained; per-target chronological 70/15/15 split; median imputation and scaling fitted on training folds only.")
    split_rows=[]
    for target in TARGETS:
        n=int(real[target].notna().sum()); train=int(n*.70); boundary=int(n*.85)
        split_rows.append([target,train,boundary-train,n-boundary])
    table(["Target","Train rows","Validation rows","Held-out real test rows"],split_rows)
    outliers={}
    for name in [*INPUT_FEATURES,*TARGETS]:
        values=real[name].dropna(); q1,q3=values.quantile([.25,.75]); spread=q3-q1
        outliers[name]=int(((values<q1-1.5*spread)|(values>q3+1.5*spread)).sum())
    print("Largest IQR outlier flags (inspection only):",", ".join(
        f"{name}={count}" for name,count in sorted(outliers.items(),key=lambda item:item[1],reverse=True)[:5]))
    print("Outliers are not clipped/dropped; valid excursions cannot be distinguished from errors here.")
    print(f"Synthetic rows: {len(synthetic)} (all source-marked SYNTHETIC); exact duplicates: {synthetic_audit['synthetic_exact_duplicate_measurement_rows']}.")
    print(f"Real/synthetic mean absolute correlation difference: {synthetic_audit['correlation_comparison']['mean_absolute_pair_difference']:.4f}; near-real fraction under 0.05 standardized RMS distance: {synthetic_audit['normalized_nearest_real_record_distance']['fraction_below_0.05']:.1%}.")
    print("Synthetic data is excluded from training and not scored as verified ground truth.")

    reports,models=train_models(real,INPUT_FEATURES,TARGETS,MODEL_DIR,
                                RESULTS_DIR/"reports"/"model_comparison.json")
    algorithm_comparison=summarize_required_algorithm_comparison(reports)
    section(3,"Feature Selection")
    feature_rows=[]
    for target,report in reports.items():
        selector_features=[name for name,scores in report["feature_ranking"].items()
                           if scores.get("selected_kbest",False)]
        print(f"{target}: SelectKBest candidate set ({len(selector_features)} inputs); final model used {report['feature_set']} features.")
        print("  SelectKBest candidates:",", ".join(selector_features))
        print("  Final model inputs:",", ".join(report["selected_features"]))
        top=sorted(report["feature_ranking"].items(),key=lambda pair:pair[1]["mutual_information"],reverse=True)[:5]
        for feature,scores in top:
            print(f"  {feature:10} MI={scores['mutual_information']:.3f} |r|={scores['correlation_abs']:.3f} RF={scores['random_forest_importance']:.3f}")
    section(4,"Model Training and Comparison")
    algorithm_rows=algorithm_comparison["rows"]
    table(["Target","Algorithm","Features","Val MAE","Val RMSE","Val R2","NMAE","Selected","Test MAE","Test RMSE","Test R2"],
        [[r["target"],r["algorithm"],r["feature_set"],f(r["validation_MAE"]),f(r["validation_RMSE"]),
          f(r["validation_R2"]),f(r["normalized_validation_MAE"],4),"yes" if r["selected_for_target"] else "no",
          f(r["heldout_test_MAE"]) if r["heldout_test_MAE"] is not None else "-",
          f(r["heldout_test_RMSE"]) if r["heldout_test_RMSE"] is not None else "-",
          f(r["heldout_test_R2"]) if r["heldout_test_R2"] is not None else "-"] for r in algorithm_rows])
    overall_rows=[[name,f(item["mean_normalized_validation_MAE"],4),item["targets_compared"]]
                  for name,item in algorithm_comparison["overall"].items()]
    table(["Overall algorithm validation comparison","Mean normalized MAE (lower is better)","Targets"],overall_rows)
    print("Overall score: validation MAE divided by that target's chronological validation standard deviation, then averaged across four targets.")
    print("Lowest observed mean normalized validation MAE:",algorithm_comparison["overall_best_algorithm"],"(descriptive single split; no claim of universal or statistically significant superiority)")
    table(["Target","Chosen algorithm","Feature set","Val MAE: all","Val MAE: selected",
           "Test MAE","Test RMSE","Test R2","Mean baseline R2"],
        [[t,r["selected_model"],r["feature_set"],
          f(min(x["metrics"]["MAE"] for x in r["candidate_metrics"] if x["features"]=="all")),
          f(min(x["metrics"]["MAE"] for x in r["candidate_metrics"] if x["features"]=="selected")),
          f(r["test_metrics"]["MAE"]),f(r["test_metrics"]["RMSE"]),f(r["test_metrics"]["R2"]),
          f(r["mean_baseline_test_metrics"]["R2"])] for t,r in reports.items()])
    print("Compared Lasso, Random Forest, Gradient Boosting, and XGBoost on every target; both all-feature and training-fitted SelectKBest variants are visible above.")
    print("Model selection used validation MAE; the final chronological real test segment was evaluated once after selection.")
    diagnostic_rows=[]
    for target,r in reports.items():
        d=r["chronological_target_distribution"]; baseline=r["mean_baseline_validation_metrics"]
        diagnostic_rows.append([target,f(r["train_metrics"]["MAE"]),f(r["validation_metrics"]["MAE"]),
            f(baseline["MAE"]),f(r["validation_metrics"]["R2"]),
            f((d["validation"]["mean"]-d["train"]["mean"])/max(d["train"]["std"],1e-12),3)])
    print("Fit/baseline/chronological shift diagnostic (selection uses validation only):")
    table(["Target","Train MAE","Validation MAE","Mean-baseline Val MAE","Validation R2","Val mean shift / train SD"],diagnostic_rows)
    evaluation_path=RESULTS_DIR/"reports"/"data_evaluation.json"
    evaluation=json.loads(evaluation_path.read_text(encoding="utf-8"))
    evaluation["real_heldout_regression_metrics"]={t:r["test_metrics"] for t,r in reports.items()}
    evaluation["real_evaluation_method"]="Chronological 70% train / 15% validation / 15% held-out test; synthetic records excluded from fitting."
    evaluation_path.write_text(json.dumps(evaluation,indent=2),encoding="utf-8")

    import joblib
    train_end=int(len(real)*.70)
    anomaly_models=fit_anomaly_models(real.iloc[:train_end],INPUT_FEATURES)
    val_end=int(len(real)*.85)
    anomaly_comparison=compare_anomaly_models(real.iloc[train_end:val_end],synthetic,
                                               anomaly_models,INPUT_FEATURES)
    joblib.dump(anomaly_models,MODEL_DIR/"anomaly_models.joblib")
    from sklearn.impute import SimpleImputer
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    prep=Pipeline([("imputer",SimpleImputer(strategy="median")),("scaler",StandardScaler())])
    prep.fit(real.iloc[:train_end][INPUT_FEATURES])
    joblib.dump({"pipeline":prep,"features":INPUT_FEATURES},MODEL_DIR/"preprocessing.joblib")
    joblib.dump({key:value["pipeline"] for key,value in models.items()},MODEL_DIR/"prediction_models.joblib")
    (RESULTS_DIR/"reports"/"selected_features.json").write_text(
        json.dumps({t:r["selected_features"] for t,r in reports.items()},indent=2),encoding="utf-8")

    row=real.dropna(subset=INPUT_FEATURES).iloc[-1]
    anomaly=detect_anomaly(row.to_dict(),anomaly_models,INPUT_FEATURES)
    section(5,"Anomaly Detection")
    table(["Model","Result","Anomaly score"],
        [[name,item["label"],f(item["anomaly_score"],4)] for name,item in anomaly["models"].items()])
    table(["Algorithm","Real validation flag rate","Synthetic flag rate","Rate shift","Mean flag agreement"],
        [[item["algorithm"],f(item["real_validation_flag_rate"]*100,1)+"%",
          f(item["synthetic_flag_rate"]*100,1)+"%",
          f(item["validation_synthetic_flag_rate_difference"]*100,2)+" pp",
          f(item["mean_pairwise_agreement"]*100,1)+"%"] for item in anomaly_comparison["rows"]])
    print("All-model synthetic consensus:",anomaly_comparison["agreement"]["all_models_consensus_count"],
          "| any-model union:",anomaly_comparison["agreement"]["all_models_union_count"])
    print("Selected detector:",anomaly_comparison["selected_model"] or "none",
          "|",anomaly_comparison["selection"])
    print("Agreement is consistency between model flags, not verified anomaly accuracy.")
    print("Unusual input deviations (standard deviations from training medians):")
    print(", ".join(f"{item['parameter']} {item['absolute_standardized_deviation_from_training_median']:.2f} SD"
                    for item in anomaly["unusual_parameter_deviations"]))
    print("Anomaly outputs are unsupervised pattern scores, not verified fault diagnoses.")

    prediction=predict_water_quality(row.to_dict(),models)
    synthetic_predictions=[]; synthetic_prediction_values=[]
    for _,synthetic_row in synthetic.iterrows():
        predicted=predict_water_quality(synthetic_row.to_dict(),models)
        synthetic_prediction_values.append(predicted)
        synthetic_predictions.append({**{feature:synthetic_row[feature] for feature in INPUT_FEATURES},
            "scenario":synthetic_row.get("scenario","unknown"),"record_source":"SYNTHETIC",
            **{f"predicted_{target}":value for target,value in predicted.items()},
            **{f"{target}_status":("within demonstration band" if TARGET_BANDS[target][0]<=predicted[target]<=TARGET_BANDS[target][1] else "outside demonstration band") for target in TARGETS}})
    section(6,"Water Quality Prediction")
    table(["Effluent target","Prediction","Configured demonstration range","Status"],
        [[t,f(v),f(TARGET_BANDS[t][0])+" to "+f(TARGET_BANDS[t][1]),
          "within band" if TARGET_BANDS[t][0]<=v<=TARGET_BANDS[t][1] else "outside band"]
         for t,v in prediction.items()])
    print("UCI does not provide units for these measurements; configured bands are not permit limits.")

    explanation=explain_prediction(row.to_dict(),models,RESULTS_DIR/"plots",real.iloc[:train_end])

    section(7,"Digital Twin What-if Simulation")
    scenarios=rank_scenarios(row.to_dict(),models,TARGET_BANDS,
                             importance=explanation.get("global_importance",{}))
    used_sources=explanation.get("importance_sources",{})
    source_labels=sorted(set(used_sources.values()))
    print("Scenario parameters are supported model inputs ranked by per-target normalized importance; source(s):",", ".join(source_labels) or "unavailable")
    print("Importance source by target:"," | ".join(f"{target}={source}" for target,source in used_sources.items()))
    print("Normalized quality distance is the mean per-target distance outside configured demonstration bands.")
    if args.interactive:
        scenarios=interactive_twin(row,models,importance=explanation.get("global_importance",{}))
    else:
        table(["Rank","Scenario","Score","Quality distance","Input adjustment","Status"],
            [[i+1,item["scenario"],f(item["score"],4),f(item["quality_distance"],4),
              f(item["normalized_adjustment"],4),"acceptable" if item["acceptable"] else "outside band"]
             for i,item in enumerate(scenarios[:8])])
        table(["Scenario","Changed feature","Input before -> after","PH-S delta","DBO-S delta","DQO-S delta","SS-S delta","Any prediction changed"],
            [[item["scenario"],next(iter(item["changes"]),"-"),
              (f(item["original_values"][next(iter(item["changes"]))])+" -> "+f(item["changes"][next(iter(item["changes"]))])) if item["changes"] else "-",
              *[f(item["prediction_differences"][target],5) for target in TARGETS],
              "yes" if item["predictions_changed"] else "no"] for item in scenarios])
        best=scenarios[0]
        print("BEST DIGITAL TWIN SCENARIO:",best["scenario"])
        if best["changes"]:
            feature,value=next(iter(best["changes"].items()))
            print(f"  {feature}: {best['original_values'][feature]:.4f} -> {value:.4f}")
        else:
            print("  No parameter change is preferred over the current condition.")
        table(["Target","Baseline prediction","Scenario prediction","Normalized band distance"],
            [[target,f(best["baseline_prediction"][target]),f(best["prediction"][target]),
              f(best["target_quality_distances"][target],5)] for target in TARGETS])
        baseline_score=score_scenario(row.to_dict(),{},best["baseline_prediction"],models,TARGET_BANDS)["score"]
        print(f"  Quality score: {baseline_score:.4f} -> {best['score']:.4f}")
        if scenarios[0]["scenario"]=="current":
            print("[OK] Current prediction satisfies configured bands; no tested change improves the quality score, so smaller adjustment is preferred.")
    print("Virtual changes are bounded to training input ranges; predictions are exploratory, not causal effects.")

    section(8,"SHAP Explainable AI")
    if not explanation.get("available"):
        print("[WARN] SHAP unavailable:",explanation.get("reason","unspecified error"))
    else:
        status_rows=[[target,info["method"],"yes" if info.get("individual_explanation") else "importance only"]
                     for target,info in explanation.get("target_status",{}).items()]
        table(["Target","Explanation method","Individual SHAP explanation"],status_rows)
        shap_rows=[]
        for target,contrib in explanation["contributions"].items():
            top=sorted(contrib.items(),key=lambda pair:abs(pair[1]),reverse=True)[:5]
            shap_rows.extend([[target,name,f(value,4),"positive" if value>0 else "negative" if value<0 else "zero"]
                              for name,value in top])
        table(["Target","Top input feature","Contribution","Direction"],shap_rows)
        global_rows=[]
        for target,importance in explanation.get("global_importance",{}).items():
            ordered=sorted(importance.items(),key=lambda item:abs(item[1]),reverse=True)[:5]
            global_rows.extend([[target,feature,f(value,4)] for feature,value in ordered])
        print("Global model importance (method is target-specific):")
        table(["Target","Input feature","Importance","Source"],
            [[*row,used_sources.get(row[0],"unknown")] for row in global_rows])
        pngs=list((RESULTS_DIR/"plots"/"shap").glob("*.png"))
        print(f"[OK] {sum(info['method']=='SHAP' for info in explanation.get('target_status',{}).values())}/{len(models)} targets explained with SHAP; saved {len(pngs)} plot(s) or labelled fallback importance charts under results/plots/shap.")
    print("SHAP explains model behavior; it does not prove causation or a plant fault.")

    recommendation=generate_operator_recommendation(row.to_dict(),models,anomaly_models,
        INPUT_FEATURES,TARGET_BANDS,explanation)
    section(9,"Operator Recommendation")
    print("DETECTED CONDITION:",recommendation["detected_condition"])
    print("PREDICTED WATER QUALITY:"," | ".join(f"{k}={v:.3f}" for k,v in prediction.items()))
    print("IMPORTANT PARAMETERS:",", ".join(x["parameter"] for x in anomaly["unusual_parameter_deviations"]))
    print("SHAP EXPLANATION:","; ".join(
        f"{target}: "+", ".join(f"{feature} {value:+.3f}" for feature,value in
            sorted(values.items(),key=lambda item:abs(item[1]),reverse=True)[:3])
        for target,values in explanation.get("contributions",{}).items()))
    if scenarios[0]["scenario"]=="current":
        print("DIGITAL TWIN FINDING: No tested scenario improved the configured quality score; current condition is acceptable within demo bands.")
    else:
        print(f"DIGITAL TWIN FINDING: Best-ranked scenario is {scenarios[0]['scenario']} (score {scenarios[0]['score']:.4f}).")
    print("POSSIBLE OPERATOR ACTION:",recommendation["possible_operator_action"])
    print("VALIDATION NOTE: Demonstration target bands and historical single-plant models require plant-specific expert review.")

    synthetic_recs,synthetic_rec_summary=generate_synthetic_recommendations(
        synthetic,synthetic_prediction_values,anomaly_models,INPUT_FEATURES,TARGET_BANDS)
    section(10,"Per-record and aggregate synthetic operator review")
    print(f"Review triggers: {synthetic_rec_summary['review_triggered']}/{synthetic_rec_summary['records']}; no configured trigger: {synthetic_rec_summary['no_trigger']}.")
    print("Trigger counts are rule/anomaly flags, not verified faults or accuracy.")
    print("Outside configured demonstration bands:",", ".join(f"{target}={count}/{synthetic_rec_summary['records']}" for target,count in synthetic_rec_summary["outside_demo_band_record_counts"].items()))
    samples=pd.concat([synthetic_recs[synthetic_recs.review_triggered].head(4),
                       synthetic_recs[~synthetic_recs.review_triggered].head(1)])
    if len(samples):
        table(["Record","Scenario","Anomaly votes","Input evidence","Prediction trigger","Recommendation"],
            [[r.record_id,r.scenario,r.anomaly_flag_count,r.top_input_deviations or "-",
              r.outside_demo_band_predictions or "none",
              (r.recommendation[:190]+"…") if len(r.recommendation)>190 else r.recommendation]
             for r in samples.itertuples()])

    write_reports(real,synthetic,reports,anomaly,prediction,row,scenarios,
                  explanation,recommendation,RESULTS_DIR/"reports",TARGET_BANDS,TARGET_RANGE_METADATA)
    import shutil
    report_dir=RESULTS_DIR/"reports"
    # Keep the legacy report name while also emitting the requested explicit filename.
    shutil.copyfile(report_dir/"model_comparison.csv",report_dir/"regression_model_comparison.csv")
    pd.DataFrame(anomaly_comparison["rows"]).to_csv(report_dir/"anomaly_model_comparison.csv",index=False)
    pd.DataFrame(algorithm_comparison["rows"]).to_csv(report_dir/"four_algorithm_comparison.csv",index=False)
    (report_dir/"four_algorithm_overall_comparison.json").write_text(
        json.dumps({"overall":algorithm_comparison["overall"],
                    "overall_best_algorithm":algorithm_comparison["overall_best_algorithm"],
                    "target_best":algorithm_comparison["target_best"],
                    "interpretation":algorithm_comparison["overall_interpretation"]},indent=2),encoding="utf-8")
    pd.DataFrame(synthetic_predictions).to_csv(report_dir/"water_quality_predictions.csv",index=False)
    synthetic_recs.to_csv(report_dir/"synthetic_operator_recommendations.csv",index=False)
    (report_dir/"synthetic_operator_recommendations_aggregate.json").write_text(
        json.dumps(synthetic_rec_summary,indent=2),encoding="utf-8")
    with (report_dir/"operator_recommendations.txt").open("a",encoding="utf-8") as rec_file:
        rec_file.write("\n\nSYNTHETIC AGGREGATE REVIEW (600 rows; simulation only):\n")
        rec_file.write(f"Review triggers: {synthetic_rec_summary['review_triggered']}; no configured trigger: {synthetic_rec_summary['no_trigger']}.\n")
        rec_file.write("Anomaly-vote record distribution: "+json.dumps(synthetic_rec_summary["anomaly_vote_count_distribution"])+"\n")
        rec_file.write("Predictions outside demonstration bands: "+json.dumps(synthetic_rec_summary["outside_demo_band_record_counts"])+"\n")
        rec_file.write("Per-record triggering flags, top input deviations, predictions and suggestions are in synthetic_operator_recommendations.csv. Counts are not verified fault accuracy.\n")
    (report_dir/"anomaly_detection_report.txt").write_text(
        (report_dir/"anomaly_detection_report.txt").read_text(encoding="utf-8")+
        "\n\nSYNTHETIC COMPARISON (not verified fault accuracy):\n"+
        "\n".join(f"{r['algorithm']}: {r['synthetic_flagged']}/{r['synthetic_rows']} flagged ({r['synthetic_flag_rate']:.1%}); validation rate={r['real_validation_flag_rate']:.1%}; pairwise agreement={r['mean_pairwise_agreement']:.1%}" for r in anomaly_comparison["rows"])+
        f"\nAll-model consensus={anomaly_comparison['agreement']['all_models_consensus_count']}; union={anomaly_comparison['agreement']['all_models_union_count']}.\n"+
        anomaly_comparison["selection"]+"\n",encoding="utf-8")
    comparison_rows=[[t,r["selected_model"],r["feature_set"],
        f(r["validation_metrics"]["MAE"]),f(r["validation_metrics"]["RMSE"]),f(r["validation_metrics"]["R2"]),
        f(r["test_metrics"]["MAE"]),f(r["test_metrics"]["RMSE"]),f(r["test_metrics"]["R2"]),
        "Validation MAE; test evaluated once after selection"] for t,r in reports.items()]
    comparison_rows.extend([
        ["Anomaly Detection",anomaly_comparison["selected_model"] or "No model selected","unsupervised", "-","-","-","-","-","-",anomaly_comparison["selection"]],
        ["Operator Recommendation","Rule-based operator review","rules","-","-","-","-","-","-","No verified action labels; no supervised classifier"]])
    table(["Module","Best selected algorithm","Feature set","Val MAE","Val RMSE","Val R2","Test MAE","Test RMSE","Test R2","Selection criteria"],comparison_rows)
    lines=["AQUAPURE BEST MODEL SUMMARY", "Regression candidates selected independently per target by validation MAE."]
    for t,r in reports.items():
        m=r["test_metrics"]; vm=r["validation_metrics"]; tm=r["train_metrics"]
        gap=r["generalization_gap"]
        lines.append(f"{t}: {r['selected_model']} ({r['feature_set']} features) | train MAE={tm['MAE']:.4f}, R2={tm['R2']:.4f} | validation MAE={vm['MAE']:.4f}, RMSE={vm['RMSE']:.4f}, R2={vm['R2']:.4f} | train-to-validation MAE gap={gap['MAE_validation_minus_train']:.4f}, R2 gap={gap['R2_train_minus_validation']:.4f} | held-out real test MAE={m['MAE']:.4f}, RMSE={m['RMSE']:.4f}, R2={m['R2']:.4f}")
    lines.extend([f"Lowest observed overall normalized validation MAE: {algorithm_comparison['overall_best_algorithm']} (descriptive single split; not a claim of universal/statistical superiority).",
        f"Anomaly selection: {anomaly_comparison['selected_model'] or 'none'}; no verified fault labels; agreement is not accuracy.",
        "Recommendation selection: cautious rule-based operator review; no verified operator-action labels.",
        f"Digital Twin best scenario: {scenarios[0]['scenario']} | score={scenarios[0]['score']:.4f} | quality distance={scenarios[0]['quality_distance']:.4f}",
        "Digital Twin predictions changed in "+str(sum(bool(s['predictions_changed']) for s in scenarios if s['changes']))+" of "+str(sum(bool(s['changes']) for s in scenarios))+" perturbed scenarios; see per-target deltas in digital_twin_scenarios.csv.",
        "SHAP target methods: "+"; ".join(f"{t}={v['method']}" for t,v in explanation.get('target_status',{}).items()),
        "Metrics may be weak or negative; chronological held-out results are reported as observed, without accuracy guarantees."])
    lines.append("Fit diagnostic: compare training and validation metrics; a large train/validation gap suggests possible overfit, while weak training and validation scores suggest low signal or underfit. These diagnostics are not proof of cause.")
    (report_dir/"best_model_summary.txt").write_text("\n".join(lines)+"\n",encoding="utf-8")
    diagnostic_lines=["REAL-DATA REGRESSION DIAGNOSTICS","Chronological split only; selected models chosen by validation MAE; test metrics evaluated after selection.",
        "Predictors contain input, primary-settler, and secondary-settler fields only. Final effluent targets and downstream final-effluent/performance columns are excluded from X."]
    for target,r in reports.items():
        d=r["chronological_target_distribution"]; valb=r["mean_baseline_validation_metrics"]
        testb=r["mean_baseline_test_metrics"]
        diagnostic_lines.append(f"{target}: train mean/std={d['train']['mean']:.4f}/{d['train']['std']:.4f}; validation={d['validation']['mean']:.4f}/{d['validation']['std']:.4f}; test={d['test']['mean']:.4f}/{d['test']['std']:.4f}; validation mean shift in train SD={(d['validation']['mean']-d['train']['mean'])/max(d['train']['std'],1e-12):.3f}; selected validation MAE/R2={r['validation_metrics']['MAE']:.4f}/{r['validation_metrics']['R2']:.4f}; training-mean baseline validation MAE/R2={valb['MAE']:.4f}/{valb['R2']:.4f}; selected test MAE/R2={r['test_metrics']['MAE']:.4f}/{r['test_metrics']['R2']:.4f}; train/validation R2 gap={r['generalization_gap']['R2_train_minus_validation']:.4f}; train+validation mean baseline test MAE/R2={testb['MAE']:.4f}/{testb['R2']:.4f}")
    diagnostic_lines.append("Low or negative R2 and weak gain against the training-mean baseline indicate limited predictive signal and/or temporal distribution shift; the held-out test segment was not used for tuning. Synthetic records were excluded.")
    (report_dir/"regression_diagnostics.txt").write_text("\n".join(diagnostic_lines)+"\n",encoding="utf-8")
    with (report_dir/"final_execution_summary.txt").open("a",encoding="utf-8") as summary_file:
        summary_file.write("\nSynthetic prediction rows saved: "+str(len(synthetic_predictions))+" (synthetic only; no ground-truth test metrics).\n")
        summary_file.write(f"Selected anomaly detector: {anomaly_comparison['selected_model'] or 'none'}; flags/agreement are not accuracy.\n")
        summary_file.write("Best recommendation approach: cautious rule-based operator review; no verified action labels.\n")
        summary_file.write("See best_model_summary.txt for the final model selection table.\n")
        summary_file.write(f"SHAP availability and selected model methods: {json.dumps(explanation.get('target_status',{}))}\n")
        summary_file.write("Individual synthetic recommendations for all records are in synthetic_operator_recommendations.csv; aggregate counts are in synthetic_operator_recommendations_aggregate.json.\n")
    section(11,"Final algorithm and module summary")
    final_rows=[]
    for target in TARGETS:
        winner=algorithm_comparison["target_best"][target]
        final_rows.append([target,winner["algorithm"],f(winner["validation_MAE"]),
            f(winner["validation_RMSE"]),f(winner["validation_R2"]),
            f(winner["heldout_test_MAE"]) if winner["heldout_test_MAE"] is not None else "-",
            f(winner["heldout_test_RMSE"]) if winner["heldout_test_RMSE"] is not None else "-",
            f(winner["heldout_test_R2"]) if winner["heldout_test_R2"] is not None else "-"])
    table(["Target","Best algorithm","Val MAE","Val RMSE","Val R2","Test MAE","Test RMSE","Test R2"],final_rows)
    print("Lowest observed overall mean normalized validation MAE:",algorithm_comparison["overall_best_algorithm"],"| descriptive single split; statistical superiority not established")
    print("Anomaly model:",anomaly_comparison["selected_model"] or "none selected", "| agreement is not accuracy")
    print("Recommendation module: cautious per-record rule review + aggregate synthetic summary")
    print("SHAP methods:","; ".join(f"{t}={v['method']}" for t,v in explanation.get("target_status",{}).items()))
    print("Digital Twin: best scenario",scenarios[0]["scenario"],"| changed prediction scenarios:",sum(bool(s["predictions_changed"]) for s in scenarios if s["changes"]),"/",sum(bool(s["changes"]) for s in scenarios))
    print("Limitations: 527 historical records, missing values, single-plant chronological shift; no verified fault/action labels; synthetic outcomes have no ground truth; demonstration bands are not regulatory limits.")
    print("\nReports saved under results/reports/; models saved under models/; comparison plots under results/plots/.")
    api.initialize_runtime(models,anomaly_models,INPUT_FEATURES,TARGET_BANDS,
                           real.iloc[:train_end],RESULTS_DIR/"plots")

if __name__=="__main__": main()
