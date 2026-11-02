"""Train and compare final-effluent regressors on real chronological splits."""
from __future__ import annotations
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from .preprocessing import chronological_split, feature_ranking, pipeline, regression_metrics

def candidate_models():
    from xgboost import XGBRegressor
    return [
        ("Lasso Regression",Lasso(alpha=.01,max_iter=10000),True),
        ("Random Forest Regressor",RandomForestRegressor(n_estimators=220,
            min_samples_leaf=2,max_features=1.0,random_state=42,n_jobs=-1),False),
        ("Gradient Boosting Regressor",GradientBoostingRegressor(n_estimators=160,
            learning_rate=.04,max_depth=2,random_state=42),False),
        ("XGBoost Regressor",XGBRegressor(n_estimators=180,max_depth=3,
            learning_rate=.04,subsample=.85,colsample_bytree=.85,reg_lambda=2,
            objective="reg:squarederror",random_state=42,n_jobs=1),False),
    ]

def train_models(frame: pd.DataFrame, features: list[str], targets: list[str],
                 model_dir, report_path):
    from pathlib import Path
    import joblib
    model_dir=Path(model_dir); model_dir.mkdir(parents=True,exist_ok=True)
    reports={}; saved={}
    for target in targets:
        Xtr,ytr,Xv,yv,Xte,yte=chronological_split(frame,target,features)
        rankings=feature_ranking(Xtr,ytr)
        k=min(10,len(features))
        # SelectKBest with mutual information is fitted only on the chronological training partition.
        selected=(rankings.loc[rankings["selected_kbest"]]
                  .sort_values("mutual_information",ascending=False).head(k).index.tolist())
        target_results=[]
        for feature_set,cols in [("all",features),("selected",selected)]:
            for model_name,estimator,scale in candidate_models():
                candidate=pipeline(estimator,scale=scale)
                candidate.fit(Xtr[cols],ytr)
                train_metrics=regression_metrics(ytr,candidate.predict(Xtr[cols]))
                metrics=regression_metrics(yv,candidate.predict(Xv[cols]))
                target_results.append({"features":feature_set,"model":model_name,
                                       "columns":cols,"metrics":metrics,
                                       "train_metrics":train_metrics,"pipeline":candidate})
        best=min(target_results,key=lambda r:r["metrics"]["MAE"])
        # Refit the validation winner using train+validation, then report untouched test.
        Xfit=pd.concat([Xtr,Xv]); yfit=pd.concat([ytr,yv])
        chosen_config=next(item for item in candidate_models() if item[0]==best["model"])
        chosen=pipeline(chosen_config[1],scale=chosen_config[2])
        chosen.fit(Xfit[best["columns"]],yfit)
        test_metrics=regression_metrics(yte,chosen.predict(Xte[best["columns"]]))
        mean_baseline=regression_metrics(yte,[float(yfit.mean())]*len(yte))
        validation_baseline=regression_metrics(yv,[float(ytr.mean())]*len(yv))
        train_baseline=regression_metrics(ytr,[float(ytr.mean())]*len(ytr))
        model_path=model_dir/f"{target.lower().replace('-','_')}.joblib"
        joblib.dump({"pipeline":chosen,"features":best["columns"],"target":target,
                     "training_range":{c:[float(Xtr[c].quantile(.02)),float(Xtr[c].quantile(.98))]
                                       for c in best["columns"]}},model_path)
        ranking_export={}
        for feature,scores in rankings.iterrows():
            ranking_export[feature]={key:(bool(value) if key=="selected_kbest" else float(value))
                                     for key,value in scores.items()}
        reports[target]={"selected_model":best["model"],"feature_set":best["features"],
            "selection_method":"SelectKBest(mutual_info_regression)" if best["features"]=="selected" else "all input features",
            "selected_features":best["columns"],"feature_ranking":ranking_export,
            "validation_metrics":best["metrics"],"test_metrics":test_metrics,
            "train_metrics":best["train_metrics"],
            "generalization_gap":{"MAE_validation_minus_train":best["metrics"]["MAE"]-best["train_metrics"]["MAE"],
                "R2_train_minus_validation":best["train_metrics"]["R2"]-best["metrics"]["R2"]},
            "mean_baseline_test_metrics":mean_baseline,
            "mean_baseline_validation_metrics":validation_baseline,
            "mean_baseline_training_metrics":train_baseline,
            "validation_target_std":float(yv.std()),
            "chronological_target_distribution":{"train":{"mean":float(ytr.mean()),"std":float(ytr.std())},
                "validation":{"mean":float(yv.mean()),"std":float(yv.std())},
                "test":{"mean":float(yte.mean()),"std":float(yte.std())}},
            "candidate_metrics":[{k:v for k,v in row.items() if k!="pipeline"}
                                 for row in target_results],"model_path":str(model_path)}
        saved[target]={"pipeline":chosen,"features":best["columns"],"path":model_path,
            "training_range":{c:[float(Xtr[c].quantile(.02)),float(Xtr[c].quantile(.98))]
                              for c in best["columns"]}}
    Path(report_path).parent.mkdir(parents=True,exist_ok=True)
    Path(report_path).write_text(json.dumps(reports,indent=2),encoding="utf-8")
    return reports,saved

def predict_water_quality(input_data, models):
    row=pd.DataFrame([input_data]) if isinstance(input_data,dict) else input_data.copy()
    predictions={}
    for target,entry in models.items():
        predictions[target]=float(entry["pipeline"].predict(row[entry["features"]])[0])
    return predictions

def summarize_required_algorithm_comparison(reports):
    """Four requested model families, normalized across different target scales.

    Within each algorithm/target, all-vs-selected features are chosen only by
    validation MAE. The held-out test metrics are attached only to the model
    already selected for that target by validation.
    """
    rows=[]
    for target,report in reports.items():
        std=max(float(report["validation_target_std"]),1e-12)
        algorithms=list(dict.fromkeys(c["model"] for c in report["candidate_metrics"]))
        for algorithm in algorithms:
            variants=[c for c in report["candidate_metrics"] if c["model"]==algorithm]
            winner=min(variants,key=lambda c:c["metrics"]["MAE"])
            selected=(algorithm==report["selected_model"] and winner["features"]==report["feature_set"])
            test=report["test_metrics"] if selected else {}
            rows.append({"target":target,"algorithm":algorithm,"feature_set":winner["features"],
                "validation_MAE":winner["metrics"]["MAE"],"validation_RMSE":winner["metrics"]["RMSE"],
                "validation_R2":winner["metrics"]["R2"],"normalized_validation_MAE":winner["metrics"]["MAE"]/std,
                "heldout_test_MAE":test.get("MAE"),"heldout_test_RMSE":test.get("RMSE"),
                "heldout_test_R2":test.get("R2"),"selected_for_target":selected})
    by_algorithm={}
    for algorithm in dict.fromkeys(row["algorithm"] for row in rows):
        target_rows=[row for row in rows if row["algorithm"]==algorithm]
        by_algorithm[algorithm]={"mean_normalized_validation_MAE":float(np.mean([r["normalized_validation_MAE"] for r in target_rows])),
            "targets_compared":len(target_rows),"selection_basis":"Mean of each target's validation MAE divided by that target's validation standard deviation."}
    overall=min(by_algorithm,key=lambda name:by_algorithm[name]["mean_normalized_validation_MAE"])
    target_best={target:min((r for r in rows if r["target"]==target),key=lambda r:r["validation_MAE"])
                 for target in reports}
    return {"rows":rows,"overall":by_algorithm,"overall_best_algorithm":overall,
            "target_best":target_best,
            "overall_interpretation":"Descriptive validation comparison only. Target MAEs are normalized by the chronological validation target standard deviation before averaging. No test metrics were used to select algorithms."}
