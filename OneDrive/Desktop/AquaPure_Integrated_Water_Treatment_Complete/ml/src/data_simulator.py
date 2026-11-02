"""Generate correlated, range-constrained synthetic records for experiments only."""
from __future__ import annotations
import numpy as np
import pandas as pd
from .data_loader import COLUMNS

def generate_synthetic(real: pd.DataFrame, n: int = 600, seed: int = 42) -> pd.DataFrame:
    """Resample complete observed rows and add small correlated/scenario perturbations.

    Rows remain explicitly SYNTHETIC. Values are bounded by observed variable limits;
    perturbation scenarios are controlled stress tests, not treatment prescriptions.
    """
    rng = np.random.default_rng(seed)
    complete = real[COLUMNS].dropna(axis=0, how="all")
    med = complete.median()
    complete = complete.fillna(med)
    picked = complete.iloc[rng.integers(0, len(complete), size=n)].reset_index(drop=True)
    synthetic = picked.astype(float).copy()
    # Resample standardized multivariate residuals to retain empirical correlations.
    scale = complete.std().replace(0, 1).fillna(1)
    z = (complete.fillna(med) - med) / scale
    residuals = z.sample(n=n, replace=True, random_state=seed).to_numpy()
    # Add modest joint noise so generated records vary beyond near-copies while retaining
    # broad empirical relationships.
    jitter = pd.DataFrame(residuals, columns=COLUMNS).to_numpy() * 0.12
    synthetic.loc[:, COLUMNS] = synthetic.to_numpy(dtype=float) + jitter * scale.to_numpy()
    scenario_names = np.array(["normal", "high_organic", "high_solids", "pH_shift",
                               "flow_shift", "reduced_efficiency", "mixed_stress"])
    scenarios = rng.choice(scenario_names, size=n, p=[.50,.10,.10,.07,.08,.10,.05])
    multipliers = {"high_organic": ( ["DBO-E","DQO-E","DBO-P","DQO-D"], 1.12),
                   "high_solids": (["SS-E","SS-P","SS-D"], 1.12),
                   "pH_shift": (["PH-E","PH-P","PH-D","PH-S"], 0.25),
                   "flow_shift": (["Q-E"], 1.08),
                   "reduced_efficiency": (["DBO-D","DQO-D","SS-D","DBO-S","DQO-S","SS-S"], 1.10),
                   "mixed_stress": (["DBO-E","SS-E","Q-E"], 1.06)}
    for i, scenario in enumerate(scenarios):
        if scenario in multipliers:
            variables, factor = multipliers[scenario]
            if scenario == "pH_shift":
                direction = -1 if rng.random() < .5 else 1
                synthetic.loc[i, variables] = synthetic.loc[i, variables] + direction * factor
            else:
                synthetic.loc[i, variables] = synthetic.loc[i, variables] * factor
    for name in COLUMNS:
        lo, hi = complete[name].quantile([.005, .995]) if complete[name].notna().any() else (0, 0)
        synthetic[name] = synthetic[name].clip(lower=lo, upper=hi)
    synthetic["scenario"] = scenarios
    synthetic = synthetic.drop_duplicates(subset=COLUMNS).reset_index(drop=True)
    attempts = 0
    while len(synthetic) < n and attempts < 8:
        extra = generate_synthetic(real, n - len(synthetic), seed + attempts + 1)
        extra = extra.drop(columns=["date", "record_source"])
        synthetic = pd.concat([synthetic, extra], ignore_index=True)
        synthetic = synthetic.drop_duplicates(subset=COLUMNS).reset_index(drop=True)
        attempts += 1
    if len(synthetic) < n:
        raise RuntimeError(f"Could only generate {len(synthetic)} unique synthetic rows; requested {n}.")
    synthetic = synthetic.iloc[:n].copy()
    synthetic.insert(0, "scenario", synthetic.pop("scenario"))
    synthetic.insert(0, "date", pd.NaT)
    synthetic["record_source"] = "SYNTHETIC"
    return synthetic
