"""Cautious operator-facing summary without unvalidated treatment prescriptions."""
from __future__ import annotations
from .water_quality_prediction import predict_water_quality
from .scenario_optimization import rank_scenarios
import json
import pandas as pd

def generate_operator_recommendation(input_data, models, anomaly_models, anomaly_features,
                                     target_bands, explanation=None):
    anomaly=__import__("src.anomaly_detection",fromlist=["detect_anomaly"]).detect_anomaly(
        input_data,anomaly_models,anomaly_features)
    prediction=predict_water_quality(input_data,models)
    outside={k:v for k,v in prediction.items() if not target_bands[k][0]<=v<=target_bands[k][1]}
    scenarios=rank_scenarios(input_data,models,target_bands)
    best=scenarios[0]
    potentially_unusual=any(v["label"]=="potentially unusual" for v in anomaly["models"].values())
    shap_top={target:dict(sorted(values.items(),key=lambda kv:abs(kv[1]),reverse=True)[:3])
              for target,values in (explanation or {}).get("contributions",{}).items()}
    return {"detected_condition":"Potentially unusual input pattern" if potentially_unusual else "No model flag for unusual input pattern",
        "anomaly_results":anomaly,"predicted_final_quality":prediction,
        "outside_configured_target_bands":outside,"important_SHAP_contributors":shap_top,
        "digital_twin_comparison":{"scenario":best["scenario"],"predictions":best["prediction"],
                                    "distance_score":best["score"],
                                    "best_vs_current":"no tested scenario improves on the current prediction"
                                        if best["scenario"]=="current" else "ranked scenario scores better than current"},
        "possible_operator_action":"Review the displayed process measurements and relevant treatment stage against plant procedures; confirm any action with an authorized operator.",
        "limitations":"Predictions and scenario rankings are exploratory. SHAP describes model attribution; anomaly scores and contributions do not establish faults or root causes. Configured bands are demonstration settings, not regulatory limits."}

def generate_synthetic_recommendations(synthetic, predictions, anomaly_models,
                                       features, target_bands):
    """Create one evidence-linked, cautious review note per synthetic row."""
    from .anomaly_detection import detect_anomaly
    rows=[]; vote_counts=[]; outside_counts={target:0 for target in target_bands}
    for index,(_,record) in enumerate(synthetic.iterrows()):
        anomaly=detect_anomaly(record.to_dict(),anomaly_models,features)
        model_flags={name:(item["label"]=="potentially unusual")
                     for name,item in anomaly["models"].items()}
        votes=sum(model_flags.values()); vote_counts.append(votes)
        prediction=predictions[index]
        outside={target:value for target,value in prediction.items()
                 if not target_bands[target][0]<=value<=target_bands[target][1]}
        for target in outside: outside_counts[target]+=1
        top=anomaly["unusual_parameter_deviations"][:3]
        top_text="; ".join(f"{p['parameter']}={float(record[p['parameter']]):.4g} ({p['absolute_standardized_deviation_from_training_median']:.2f} SD from train median)" for p in top)
        outside_text="; ".join(f"predicted {t}={v:.4g} outside configured demo band" for t,v in outside.items())
        reasons=[]
        if votes: reasons.append(f"{votes}/{len(model_flags)} unsupervised input-pattern detectors flagged the record")
        if outside_text: reasons.append(outside_text)
        review=bool(reasons)
        if review:
            recommendation="Review this synthetic case against plant procedures; confirm measurements and prediction before any action. Trigger: " + "; ".join(reasons) + (f". Largest input deviations for context: {top_text}" if top_text else "")
        else:
            recommendation="No configured demonstration-rule review trigger; maintain routine operator oversight. This is not a safety clearance."
        rows.append({"record_id":f"SYN-{index+1:04d}","record_source":"SYNTHETIC",
            "scenario":record.get("scenario","unknown"),"anomaly_flag_count":votes,
            "anomaly_flags_json":json.dumps(model_flags),"top_input_deviations":top_text,
            "outside_demo_band_predictions":outside_text,
            **{f"input_{name}":record[name] for name in features},
            **{f"predicted_{target}":value for target,value in prediction.items()},
            "review_triggered":review,"recommendation":recommendation})
    summary={"records":len(rows),"review_triggered":int(sum(row["review_triggered"] for row in rows)),
        "no_trigger":int(sum(not row["review_triggered"] for row in rows)),
        "anomaly_vote_count_distribution":{str(v):int(vote_counts.count(v)) for v in range(4)},
        "outside_demo_band_record_counts":outside_counts,
        "interpretation":"Counts describe the synthetic simulation and configured review rules only. They are not fault accuracy, verified diagnoses, or treatment instructions."}
    return pd.DataFrame(rows),summary
