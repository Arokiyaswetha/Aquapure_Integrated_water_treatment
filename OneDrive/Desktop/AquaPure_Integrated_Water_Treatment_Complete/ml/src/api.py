"""Structured, reusable Python functions for later dashboard integration."""
from __future__ import annotations
import pandas as pd

_workflow_artifacts=None
_prediction_models=None; _anomaly_models=None; _anomaly_features=None
_target_bands=None; _background=None; _results_dir=None

def load_runtime():
    """Load saved models and initialize these structured helpers in a fresh process."""
    import joblib
    from config import MODEL_DIR
    global _workflow_artifacts
    path=MODEL_DIR/"aquapure_workflow.joblib"
    if not path.exists():
        raise FileNotFoundError("Train the workflow first with `python main.py`.")
    _workflow_artifacts=joblib.load(path)

def initialize_runtime(prediction_models, anomaly_models, anomaly_features,
                       target_bands, background, results_dir):
    global _prediction_models,_anomaly_models,_anomaly_features,_target_bands,_background,_results_dir
    _prediction_models=prediction_models; _anomaly_models=anomaly_models
    _anomaly_features=anomaly_features; _target_bands=target_bands
    _background=background; _results_dir=results_dir

def _ready():
    if _workflow_artifacts is None and _prediction_models is None:
        raise RuntimeError("Call load_runtime() after running `python main.py`.")

def detect_anomaly(input_data):
    if _workflow_artifacts is not None:
        from .ml_workflow import detect
        return detect(input_data,_workflow_artifacts)
    _ready()
    from .anomaly_detection import detect_anomaly as impl
    return impl(input_data,_anomaly_models,_anomaly_features)

def predict_water_quality(input_data):
    if _workflow_artifacts is not None:
        from .ml_workflow import predict
        return predict(input_data,_workflow_artifacts)
    _ready()
    from .water_quality_prediction import predict_water_quality as impl
    return impl(input_data,_prediction_models)

def run_digital_twin_simulation(input_data, modified_parameters):
    if _workflow_artifacts is not None:
        from .ml_workflow import simulate
        if len(modified_parameters)!=1:
            raise ValueError("A Digital Twin comparison changes one supported input at a time.")
        feature,value=next(iter(modified_parameters.items()))
        current=float(input_data[feature])
        return simulate(input_data,feature,abs(float(value)-current),_workflow_artifacts)
    _ready()
    from .digital_twin import run_digital_twin_simulation as impl
    return impl(input_data,modified_parameters,_prediction_models)

def compare_scenarios(input_data, scenarios):
    if _workflow_artifacts is not None:
        from .ml_workflow import simulate
        results=[]
        for name,changes in scenarios.items():
            if len(changes)!=1:
                raise ValueError("Each what-if scenario must modify exactly one supported input.")
            feature,value=next(iter(changes.items()))
            current=float(input_data[feature])
            result=simulate(input_data,feature,abs(float(value)-current),_workflow_artifacts)
            candidates=[row for row in result["scenarios"] if row["scenario"]!="Current Condition"]
            requested="Lower Parameter" if float(value)<current else "Higher Parameter"
            selected=next((row for row in candidates if row["scenario"]==requested),result["scenarios"][0])
            results.append({"scenario":name,**selected})
        return results
    _ready()
    from .digital_twin import compare_scenarios as impl
    return impl(input_data,scenarios,_prediction_models)

def explain_prediction(input_data):
    if _workflow_artifacts is not None:
        from .ml_workflow import validate_input
        row=validate_input(input_data,_workflow_artifacts["features"])
        importance=_workflow_artifacts["prediction_pipeline"].named_steps["model"].feature_importances_
        ranked=sorted(zip(_workflow_artifacts["features"],map(float,importance)),
                      key=lambda pair:pair[1],reverse=True)
        return {"method":"shared multi-output Random Forest feature importance",
                "top_input_features":[{"feature":name,"importance":value} for name,value in ranked[:10]],
                "note":"Global model importance describes model behavior; it does not establish causality or root cause."}
    _ready()
    from .explainable_ai import explain_prediction as impl
    return impl(input_data,_prediction_models,_results_dir,_background)

def generate_operator_recommendation(input_data):
    _ready()
    if _workflow_artifacts is not None:
        from .ml_workflow import detect,predict,recommend
        return {"anomaly":detect(input_data,_workflow_artifacts),
                "predictions_are_model_predictions":predict(input_data,_workflow_artifacts),
                "recommendations":recommend(predict(input_data,_workflow_artifacts),
                                            detect(input_data,_workflow_artifacts),_target_bands or __import__("config").TARGET_BANDS)}
    from .operator_recommendation import generate_operator_recommendation as impl
    return impl(input_data,_prediction_models,_anomaly_models,_anomaly_features,
                _target_bands,explain_prediction(input_data))
