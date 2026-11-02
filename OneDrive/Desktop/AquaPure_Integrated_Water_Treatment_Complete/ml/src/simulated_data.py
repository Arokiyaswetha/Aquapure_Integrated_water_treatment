"""Generate input-only simulated process records for functional tests."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .data_loader import INPUT_FEATURES


def validate_simulated(frame: pd.DataFrame, bounds: dict[str, list[float]]) -> pd.DataFrame:
    """Ensure synthetic batches contain only complete, ordered, bounded inputs."""
    if list(frame.columns) != INPUT_FEATURES:
        raise ValueError("Simulated batch columns must match the 22 UCI input features in order.")
    if frame.empty or frame.isna().any().any():
        raise ValueError("Simulated batches must contain complete records.")
    values = frame.to_numpy(dtype=float)
    if not np.isfinite(values).all():
        raise ValueError("Simulated values must all be finite numeric values.")
    for feature in INPUT_FEATURES:
        low, high = bounds[feature]
        if ((frame[feature] < low) | (frame[feature] > high)).any():
            raise ValueError(f"Simulated {feature} values fall outside training-derived bounds.")
    return frame


def generate_simulated(train: pd.DataFrame, artifacts: dict, count: int = 12,
                       seed: int = 42, anomaly_every: int = 4) -> pd.DataFrame:
    """Resample training inputs; periodically stress four inputs to observed tails.

    No targets or labels are generated. Rows are simulated cases, never fault ground truth.
    """
    if count < 1:
        raise ValueError("count must be at least one.")
    if anomaly_every < 0:
        raise ValueError("anomaly_every cannot be negative.")
    rng = np.random.default_rng(seed)
    bounds = artifacts["input_bounds"]
    source = train[INPUT_FEATURES].copy().fillna(train[INPUT_FEATURES].median())
    chosen = source.iloc[rng.integers(0, len(source), size=count)].reset_index(drop=True)
    rows = []
    for i in range(count):
        row = chosen.iloc[i].copy()
        # Constrain normal-like records to the training-derived valid what-if range.
        for feature in INPUT_FEATURES:
            low, high = bounds[feature]
            row[feature] = float(np.clip(row[feature], low, high))
        if anomaly_every and (i + 1) % anomaly_every == 0:
            selected = rng.choice(len(INPUT_FEATURES), size=min(4, len(INPUT_FEATURES)), replace=False)
            for j in selected:
                feature = INPUT_FEATURES[int(j)]
                low, high = bounds[feature]
                row[feature] = high if abs(row[feature] - high) >= abs(row[feature] - low) else low
        rows.append(row.to_dict())
    result = pd.DataFrame(rows, columns=INPUT_FEATURES)
    return validate_simulated(result, bounds)
