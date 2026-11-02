"""Compare simulated records against real measurements; do not score them as truth."""
from __future__ import annotations
import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from sklearn.neighbors import NearestNeighbors
from .data_loader import COLUMNS

def validate_synthetic(real: pd.DataFrame, synthetic: pd.DataFrame, results_dir: Path):
    results_dir=Path(results_dir); results_dir.mkdir(parents=True,exist_ok=True)
    plots=results_dir.parent/"plots"; plots.mkdir(parents=True,exist_ok=True)
    real_x=real[COLUMNS].apply(pd.to_numeric,errors="coerce")
    syn_x=synthetic[COLUMNS].apply(pd.to_numeric,errors="coerce")
    rows=[]
    for col in COLUMNS:
        r=real_x[col].dropna(); s=syn_x[col].dropna()
        ks=ks_2samp(r,s)
        rows.append({"feature":col,"real_count":len(r),"synthetic_count":len(s),
            "real_mean":r.mean(),"synthetic_mean":s.mean(),"real_std":r.std(),
            "synthetic_std":s.std(),"real_median":r.median(),"synthetic_median":s.median(),
            "real_p05":r.quantile(.05),"synthetic_p05":s.quantile(.05),
            "real_p95":r.quantile(.95),"synthetic_p95":s.quantile(.95),
            "ks_statistic":ks.statistic,"ks_pvalue":ks.pvalue,
            "synthetic_outside_real_minmax":int(((s<r.min())|(s>r.max())).sum())})
    pd.DataFrame(rows).to_csv(results_dir/"real_synthetic_distribution_comparison.csv",index=False)
    rfilled=real_x.fillna(real_x.median()); sfilled=syn_x.fillna(rfilled.median())
    r_corr=rfilled.corr(); s_corr=sfilled.corr(); delta=(s_corr-r_corr)
    corr_rows=[]
    for i,a in enumerate(COLUMNS):
        for b in COLUMNS[i+1:]:
            corr_rows.append({"feature_a":a,"feature_b":b,"real_correlation":r_corr.loc[a,b],
                              "synthetic_correlation":s_corr.loc[a,b],
                              "absolute_difference":abs(delta.loc[a,b])})
    corr_frame=pd.DataFrame(corr_rows)
    corr_frame.to_csv(results_dir/"real_synthetic_correlation_comparison.csv",index=False)
    scale=rfilled.std().replace(0,1)
    nn=NearestNeighbors(n_neighbors=1).fit((rfilled-rfilled.mean())/scale)
    distances=nn.kneighbors((sfilled-rfilled.mean())/scale)[0].ravel()/np.sqrt(len(COLUMNS))
    stage_pairs=[("DBO-E","DBO-P"),("DBO-P","DBO-D"),("DBO-D","DBO-S"),
                 ("SS-E","SS-P"),("SS-P","SS-D"),("SS-D","SS-S"),
                 ("DQO-E","DQO-D"),("DQO-D","DQO-S")]
    stage_order={f"{a} to {b}":{
        "real_fraction_second_greater":float((rfilled[b]>rfilled[a]).mean()),
        "synthetic_fraction_second_greater":float((sfilled[b]>sfilled[a]).mean())}
        for a,b in stage_pairs}
    summary={"real_records":int(len(real)),"synthetic_records":int(len(synthetic)),
        "all_synthetic_marked_synthetic":bool((synthetic["record_source"]=="SYNTHETIC").all()),
        "synthetic_missing_measurements":int(syn_x.isna().sum().sum()),
        "synthetic_exact_duplicate_measurement_rows":int(syn_x.duplicated().sum()),
        "normalized_nearest_real_record_distance":{"minimum":float(np.min(distances)),
            "median":float(np.median(distances)),"p90":float(np.quantile(distances,.9)),
            "fraction_below_0.05":float((distances<.05).mean()),
            "distance_definition":"Euclidean distance after real-feature standardization, divided by sqrt(38)."},
        "correlation_comparison":{"mean_absolute_pair_difference":float(corr_frame.absolute_difference.mean()),
            "maximum_absolute_pair_difference":float(corr_frame.absolute_difference.max())},
        "synthetic_predictive_metrics":None,
        "synthetic_metric_limitation":"Synthetic outcomes are generated and have no verified ground truth; no accuracy metric is reported against them.",
        "stage_ordering_proxies":stage_order,
        "interpretation":"Stage ordering is a descriptive comparison with observed records, not a universal physical law. Distribution and correlation similarity do not validate the synthetic observations as ground truth."}
    (results_dir/"data_evaluation.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")
    os.environ.setdefault("MPLCONFIGDIR",str(plots/".mplconfig"))
    import matplotlib
    matplotlib.use("Agg",force=True)
    import matplotlib.pyplot as plt
    fig,axes=plt.subplots(10,4,figsize=(18,32))
    for ax,col in zip(axes.flat,COLUMNS):
        ax.hist(real_x[col].dropna(),bins=18,density=True,alpha=.5,label="REAL")
        ax.hist(syn_x[col].dropna(),bins=18,density=True,alpha=.5,label="SYNTHETIC")
        ax.set_title(col); ax.tick_params(labelsize=7)
    for ax in axes.flat[len(COLUMNS):]: ax.axis("off")
    axes.flat[0].legend(fontsize=8); fig.suptitle("UCI Real vs Simulated Feature Distributions")
    fig.tight_layout(); fig.savefig(plots/"real_vs_synthetic_distributions.png",dpi=130); plt.close(fig)
    fig,ax=plt.subplots(figsize=(12,10)); im=ax.imshow(delta.to_numpy(),vmin=-1,vmax=1,cmap="coolwarm")
    ax.set_xticks(range(len(COLUMNS)),COLUMNS,rotation=90,fontsize=6)
    ax.set_yticks(range(len(COLUMNS)),COLUMNS,fontsize=6)
    ax.set_title("Synthetic minus real feature correlations"); fig.colorbar(im,ax=ax)
    fig.tight_layout(); fig.savefig(plots/"real_vs_synthetic_correlation_difference.png",dpi=150); plt.close(fig)
    return summary
