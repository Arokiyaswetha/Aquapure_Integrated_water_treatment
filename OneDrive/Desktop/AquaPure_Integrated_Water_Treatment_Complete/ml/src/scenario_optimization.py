"""Search a small, bounded set of one-variable perturbations for comparison."""
from __future__ import annotations
import numpy as np
from .digital_twin import run_digital_twin_simulation
from .water_quality_prediction import predict_water_quality

def target_distance(prediction, target_bands):
    distances={}
    for name,(lo,hi) in target_bands.items():
        value=prediction[name]
        distances[name]=float(max(lo-value,0,value-hi)/(hi-lo if hi>lo else 1))
    return distances

def score_scenario(input_data, changes, prediction, models, target_bands):
    spans={}
    for entry in models.values():
        spans.update({feature:max(bounds[1]-bounds[0],1e-12)
                      for feature,bounds in entry["training_range"].items()})
    per_target=target_distance(prediction,target_bands)
    quality=float(np.mean(list(per_target.values()))) if per_target else 0.0
    adjustment=float(np.mean([abs(float(value)-float(input_data[key]))/spans[key]
                              for key,value in changes.items()])) if changes else 0.0
    return {"score":quality+.05*adjustment,"quality_distance":quality,
            "target_quality_distances":per_target,
            "normalized_adjustment":adjustment,"acceptable":quality==0.0,
            "feasible":True}

def rank_scenarios(input_data, models, target_bands, candidates=None, importance=None):
    scenarios={"current":{}}
    supported=list(dict.fromkeys(f for e in models.values() for f in e["features"]))
    if candidates is None and importance:
        normalized={}
        for target,scores in importance.items():
            total=sum(max(0.0,float(value)) for value in scores.values())
            normalized[target]={feature:(max(0.0,float(value))/total if total else 0.0)
                                for feature,value in scores.items()}
        candidates=sorted((feature for feature in supported if any(feature in scores for scores in normalized.values())),
            key=lambda feature:np.mean([scores.get(feature,0.0) for scores in normalized.values()]),reverse=True)[:8]
    candidates=candidates or supported[:8]
    for feature in candidates:
        entry=next(e for e in models.values() if feature in e["features"])
        lo,hi=entry["training_range"][feature]
        center=float(input_data[feature]); span=(hi-lo)*.10
        for suffix,value in [("lower",max(lo,center-span)),("higher",min(hi,center+span))]:
            if value!=center: scenarios[f"{feature} {suffix}"]={feature:value}
    ranked=[]
    for label,changes in scenarios.items():
        simulation=run_digital_twin_simulation(input_data,changes,models)
        # Quality-band distance is primary. The 0.05 tie-breaker favors feasible,
        # smaller changes and makes an acceptable current condition preferable to
        # unnecessary parameter movement.
        score=score_scenario(input_data,changes,simulation["modified_prediction"],models,target_bands)
        baseline=predict_water_quality(input_data,models)
        differences={target:simulation["modified_prediction"][target]-baseline[target] for target in baseline}
        ranked.append({"scenario":label,"changes":changes,
                       "original_values":{key:float(input_data[key]) for key in changes},
                       "baseline_prediction":baseline,"prediction_differences":differences,
                       "predictions_changed":any(abs(v)>1e-10 for v in differences.values()),**score,
                       "prediction":simulation["modified_prediction"],
                       "interpretation":"Model-based comparison requiring operator review."})
    return sorted(ranked,key=lambda item:item["score"])
