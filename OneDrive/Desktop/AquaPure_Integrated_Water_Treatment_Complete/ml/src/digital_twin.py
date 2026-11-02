"""Constrained model-based what-if tools. Outputs are exploratory, not causal."""
from __future__ import annotations
import pandas as pd
from config import TARGET_BANDS,TARGET_RANGE_METADATA
from .water_quality_prediction import predict_water_quality

def run_digital_twin_simulation(input_data, modified_parameters, models):
    original=dict(input_data); changed={**original}; bounds={}
    for target,entry in models.items(): bounds.update(entry.get("training_range",{}))
    for feature,value in modified_parameters.items():
        if feature not in bounds: raise ValueError(f"'{feature}' is not a validated model input.")
        lo,hi=bounds[feature]
        if not lo <= float(value) <= hi:
            raise ValueError(f"{feature}={value} is outside the observed training range [{lo:.3g}, {hi:.3g}].")
        changed[feature]=float(value)
    before=predict_water_quality(original,models); after=predict_water_quality(changed,models)
    def distance(prediction):
        total=0.0
        for target,(lo,hi) in TARGET_BANDS.items():
            total += max(lo-prediction[target],0,prediction[target]-hi)/(hi-lo if hi>lo else 1)
        return float(total)
    before_distance=distance(before); after_distance=distance(after)
    movement=("closer" if after_distance<before_distance else
              "farther" if after_distance>before_distance else "unchanged")
    used=sorted({feature for entry in models.values() for feature in entry["features"]})
    return {"original_inputs":{k:original[k] for k in used},
            "modified_inputs":{k:changed[k] for k in used},
            "changed_parameters":dict(modified_parameters),
            "original_prediction":before,"modified_prediction":after,
            "prediction_difference":{k:after[k]-before[k] for k in before},
            "configured_target_bands":TARGET_BANDS,
            "target_band_metadata":TARGET_RANGE_METADATA,
            "distance_from_target_bands":{"original":before_distance,"modified":after_distance,
                                           "movement":movement},
            "interpretation":"Exploratory model-based what-if; not evidence of a causal treatment effect."}

def compare_scenarios(input_data, scenarios, models):
    results=[]
    for name,changes in scenarios.items():
        results.append({"scenario":name,**run_digital_twin_simulation(input_data,changes,models)})
    return results
