"""Unsupervised process anomaly scoring; these scores are not fault diagnoses."""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor

def fit_anomaly_models(training: pd.DataFrame, features: list[str]):
    x=training[features]
    models={"Isolation Forest":Pipeline([("imputer",SimpleImputer(strategy="median")),
        ("scaler",StandardScaler()),("model",IsolationForest(contamination="auto",
            random_state=42,n_estimators=250))]),
        "One-Class SVM":Pipeline([("imputer",SimpleImputer(strategy="median")),
        ("scaler",StandardScaler()),("model",OneClassSVM(nu=.05,kernel="rbf",gamma="scale"))]),
        "LOF":Pipeline([("imputer",SimpleImputer(strategy="median")),
        ("scaler",StandardScaler()),("model",LocalOutlierFactor(n_neighbors=25,
            novelty=True,contamination="auto"))])}
    for model in models.values(): model.fit(x)
    return models

def detect_anomaly(input_data, models, features):
    row=pd.DataFrame([input_data]) if isinstance(input_data,dict) else input_data.copy()
    result={}
    for name,model in models.items():
        score=float(-model.decision_function(row[features])[0])
        result[name]={"label":"potentially unusual" if model.predict(row[features])[0]<0 else "within learned pattern",
                      "anomaly_score":score}
    # Provide transparent value-level context, explicitly not root-cause attribution.
    imputer=models["Isolation Forest"].named_steps["imputer"]
    scaler=models["Isolation Forest"].named_steps["scaler"]
    medians=imputer.statistics_
    deviations=np.abs(row[features].iloc[0].to_numpy(dtype=float)-medians)/scaler.scale_
    idx=np.argsort(np.nan_to_num(deviations,nan=-1))[::-1][:5]
    return {"models":result,"unusual_parameter_deviations":
            [{"parameter":features[i],"absolute_standardized_deviation_from_training_median":float(deviations[i])}
             for i in idx if np.isfinite(deviations[i])],
            "explanation_note":"Large deviations are context only; they do not establish a cause."}

def compare_anomaly_models(validation: pd.DataFrame, synthetic: pd.DataFrame,
                           models: dict, features: list[str]):
    """Compare unsupervised flag rates and cross-model agreement without fault labels."""
    val=validation[features]; syn=synthetic[features]
    flags={}; rows=[]
    for name,model in models.items():
        val_labels=(model.predict(val)<0)
        syn_labels=(model.predict(syn)<0)
        val_scores=-model.decision_function(val)
        syn_scores=-model.decision_function(syn)
        flags[name]=syn_labels
        rows.append({"algorithm":name,"real_validation_rows":len(val),
            "real_validation_flagged":int(val_labels.sum()),
            "real_validation_flag_rate":float(val_labels.mean()),
            "synthetic_rows":len(syn),"synthetic_flagged":int(syn_labels.sum()),
            "synthetic_flag_rate":float(syn_labels.mean()),
            "validation_synthetic_flag_rate_difference":float(abs(val_labels.mean()-syn_labels.mean())),
            "validation_score_mean":float(np.mean(val_scores)),
            "synthetic_score_mean":float(np.mean(syn_scores)),
            "selection_note":"Unsupervised comparison; no verified fault labels."})
    names=list(flags)
    for row in rows:
        peers=[n for n in names if n!=row["algorithm"]]
        pairwise=[float(np.mean(flags[row["algorithm"]]==flags[n])) for n in peers]
        row["mean_pairwise_agreement"]=float(np.mean(pairwise)) if pairwise else 1.0
    flagged_union=np.logical_or.reduce(list(flags.values()))
    flagged_intersection=np.logical_and.reduce(list(flags.values()))
    iso=next((r for r in rows if r["algorithm"]=="Isolation Forest"),None)
    iso_supported=bool(iso and .01<=iso["real_validation_flag_rate"]<=.20 and
        iso["synthetic_flag_rate"]<=.20 and iso["validation_synthetic_flag_rate_difference"]<=.15 and
        iso["mean_pairwise_agreement"]>=.70)
    for row in rows: row["selected"]=(row["algorithm"]=="Isolation Forest" and iso_supported)
    selected="Isolation Forest" if iso_supported else None
    report={"rows":rows,"selected_model":selected,
        "agreement":{"all_models_union_count":int(flagged_union.sum()),
        "all_models_consensus_count":int(flagged_intersection.sum()),
        "all_models_union_rate":float(flagged_union.mean()),
        "all_models_consensus_rate":float(flagged_intersection.mean())},
        "selection":("Isolation Forest retained: validation and synthetic flag rates are not extreme, the rate shift is within 15 percentage points, and mean pairwise agreement is at least 70%. This supports only provisional stability/suitability, not fault accuracy." if iso_supported else "No single anomaly detector selected: Isolation Forest did not meet predeclared stability and suitability checks. No verified fault labels exist to validate any model. Review anomaly rates and agreement, not anomaly volume alone.")}
    return report
