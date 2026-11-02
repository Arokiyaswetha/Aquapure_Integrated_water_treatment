"""Explain selected models with SHAP, with explicit importance fallbacks."""
from __future__ import annotations
import os
import warnings
from pathlib import Path
import numpy as np
import pandas as pd

def _fallback_importance(estimator, model, background, prepared_bg, features):
    """Use estimator importance, or permutation importance of model predictions."""
    if hasattr(estimator,"feature_importances_"):
        values=np.asarray(estimator.feature_importances_,dtype=float)
        method="model_feature_importance"
    elif hasattr(estimator,"coef_"):
        values=np.abs(np.asarray(estimator.coef_,dtype=float)).reshape(-1)
        method="absolute_model_coefficients"
    else:
        from sklearn.inspection import permutation_importance
        surrogate=estimator.predict(prepared_bg)
        result=permutation_importance(estimator,prepared_bg,surrogate,n_repeats=5,
            random_state=42,scoring="neg_mean_absolute_error")
        values=np.maximum(result.importances_mean,0.0)
        method="permutation_importance_on_model_outputs"
    return pd.Series(values,index=features).sort_values(ascending=False),method

def explain_prediction(input_data, models, results_dir, background=None):
    """Explain every selected model; report SHAP or a labelled importance fallback."""
    row=pd.DataFrame([input_data]) if isinstance(input_data,dict) else input_data.copy()
    output=Path(results_dir)/"shap"; output.mkdir(parents=True,exist_ok=True)
    mpl_config=output/".mplconfig"; mpl_config.mkdir(parents=True,exist_ok=True)
    os.environ["MPLCONFIGDIR"]=str(mpl_config)
    try:
        import matplotlib
        matplotlib.use("Agg",force=True)
        import matplotlib.pyplot as plt
        import shap
    except Exception as exc:
        return {"available":False,"reason":f"SHAP/matplotlib import failed: {exc}",
            "contributions":{},"global_importance":{},"importance_sources":{},
            "target_status":{target:{"method":"unavailable","error":str(exc)} for target in models}}
    result={"available":True,"contributions":{},"global_importance":{},
        "importance_sources":{},"target_status":{},"errors":{},
        "note":"SHAP and model importance describe model behavior, not causal process effects."}
    for target,entry in models.items():
        model=entry["pipeline"]; features=entry["features"]
        x=model[:-1].transform(row[features])
        estimator=model.named_steps["model"]
        if background is not None:
            bg=background[features].sample(min(60,len(background)),random_state=42)
        else:
            bg=row[features]
        prepared_bg=model[:-1].transform(bg)
        shap_ok=False
        try:
            warnings.filterwarnings("ignore",message="The NumPy global RNG was seeded by calling `np.random.seed`.*",category=FutureWarning)
            if hasattr(estimator,"feature_importances_"):
                explainer=shap.TreeExplainer(estimator)
                values=explainer.shap_values(x)
                batch=explainer.shap_values(prepared_bg)
                expected=explainer.expected_value
            elif hasattr(estimator,"coef_"):
                explainer=shap.LinearExplainer(estimator,prepared_bg)
                values=explainer.shap_values(x)
                batch=explainer.shap_values(prepared_bg)
                expected=explainer.expected_value
            else:
                bg_small=prepared_bg[:min(25,len(prepared_bg))]
                explainer=shap.PermutationExplainer(estimator.predict,bg_small)
                max_evals=2*len(features)+1
                one=explainer(x,max_evals=max_evals)
                many=explainer(bg_small,max_evals=max_evals)
                values=one.values; batch=many.values; expected=one.base_values[0]
            values=np.asarray(values); batch=np.asarray(batch)
            local=values[0] if values.ndim>1 else values
            global_vals=np.abs(batch).mean(axis=0)
            result["contributions"][target]=pd.Series(local,index=features).sort_values(key=abs,ascending=False).to_dict()
            result["global_importance"][target]=pd.Series(global_vals,index=features).sort_values(ascending=False).to_dict()
            pd.Series(global_vals,index=features).sort_values(ascending=False).rename("mean_absolute_shap").to_csv(output/f"{target.lower()}_global_importance.csv")
            pd.Series(local,index=features).sort_values(key=abs,ascending=False).rename("shap_value").to_csv(output/f"{target.lower()}_contributions.csv")
            shap.summary_plot(batch,prepared_bg if len(batch)==len(prepared_bg) else prepared_bg[:len(batch)],feature_names=features,show=False)
            plt.tight_layout(); plt.savefig(output/f"{target.lower()}_summary.png",dpi=140); plt.close("all")
            try:
                expected_value=float(np.asarray(expected).reshape(-1)[0])
                single=shap.Explanation(values=local,base_values=expected_value,
                    data=np.asarray(x)[0],feature_names=features)
                shap.plots.waterfall(single,show=False,max_display=12)
                plt.tight_layout(); plt.savefig(output/f"{target.lower()}_individual.png",dpi=140); plt.close("all")
            except Exception as plot_exc:
                result.setdefault("plot_warnings",{})[target]=str(plot_exc)
            result["importance_sources"][target]="SHAP mean absolute attribution"
            result["target_status"][target]={"method":"SHAP","individual_explanation":True}
            shap_ok=True
        except Exception as exc:
            result["errors"][target]=str(exc)
            print(f"[WARN] SHAP failed for {target}; using a clearly labelled importance fallback: {exc}")
        if not shap_ok:
            importance,method=_fallback_importance(estimator,model, bg,prepared_bg,features)
            result["global_importance"][target]=importance.to_dict()
            result["importance_sources"][target]=method
            result["target_status"][target]={"method":method,"individual_explanation":False,
                "shap_error":result["errors"].get(target)}
            importance.rename(method).to_csv(output/f"{target.lower()}_importance_fallback.csv")
            fig,ax=plt.subplots(figsize=(8,5)); importance.head(15).sort_values().plot.barh(ax=ax)
            ax.set_title(f"{target}: {method}"); fig.tight_layout()
            fig.savefig(output/f"{target.lower()}_importance_fallback.png",dpi=140); plt.close(fig)
    result["all_selected_models_explained"]=len(result["target_status"])==len(models)
    result["any_shap_used"]=any(x["method"]=="SHAP" for x in result["target_status"].values())
    return result
