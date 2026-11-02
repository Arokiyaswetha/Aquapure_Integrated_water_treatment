"""Chronological, leakage-aware splits and training-only imputation/scaling."""
from __future__ import annotations
import pandas as pd
from functools import partial
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import SelectKBest, mutual_info_regression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def chronological_split(frame: pd.DataFrame, target: str, xcols: list[str],
                        train_fraction: float = .70, validation_fraction: float = .15):
    data = frame.dropna(subset=[target]).sort_values("date").reset_index(drop=True)
    X, y = data[xcols], data[target]
    n = len(data); a = int(n * train_fraction); b = int(n * (train_fraction + validation_fraction))
    return (X.iloc[:a], y.iloc[:a], X.iloc[a:b], y.iloc[a:b], X.iloc[b:], y.iloc[b:])

def feature_ranking(X: pd.DataFrame, y: pd.Series, seed: int = 42):
    prep = SimpleImputer(strategy="median").fit(X)
    xi = pd.DataFrame(prep.transform(X), columns=X.columns)
    mi_score=partial(mutual_info_regression,random_state=seed)
    mi = mi_score(xi, y)
    selected=SelectKBest(score_func=mi_score,k=min(10,len(X.columns))).fit(xi,y).get_support()
    rf = RandomForestRegressor(n_estimators=300, min_samples_leaf=2,
                               random_state=seed, n_jobs=-1).fit(xi, y)
    corr = xi.corrwith(y).abs().fillna(0)
    return pd.DataFrame({"correlation_abs":corr, "mutual_information":mi,
                         "selected_kbest":selected,
                         "random_forest_importance":rf.feature_importances_},
                        index=X.columns).sort_values("random_forest_importance", ascending=False)

def pipeline(model, scale: bool = False, k: int | None = None):
    steps = [("imputer", SimpleImputer(strategy="median", add_indicator=False))]
    if scale: steps.append(("scaler", StandardScaler()))
    if k is not None: steps.append(("select", SelectKBest(score_func=mutual_info_regression, k=k)))
    steps.append(("model", model))
    return Pipeline(steps)

def regression_metrics(y_true, y_pred):
    return {"MAE":float(mean_absolute_error(y_true,y_pred)),
            "RMSE":float(mean_squared_error(y_true,y_pred)**.5),
            "R2":float(r2_score(y_true,y_pred))}
