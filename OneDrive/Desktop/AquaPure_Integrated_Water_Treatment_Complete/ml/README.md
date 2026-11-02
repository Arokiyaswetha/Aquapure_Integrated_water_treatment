# AquaPure ML workflow

This Python workflow uses the [UCI Water Treatment Plant dataset, ID 106](https://archive.ics.uci.edu/dataset/106/water+treatment+plant). It supports operator review and does not control treatment equipment.

## Run

Install dependencies with `python -m pip install -r requirements.txt`, then run `python main.py`. The console prints the operator summary in the Potential Issue, Rule-Based Recommendation, Digital Twin scenario comparison, and Final Operator Suggestion format. Use `python main.py --simulated-count 50 --seed 17` to choose a reproducible simulated batch size and seed. Use `--twin-feature DBO-D` to vary a different supported input, or `--twin-adjustment 10` to supply an adjustment in that field's recorded measurement units. By default, the scenario step is one training-data IQR and remains bounded by training-derived ranges. The project includes the original UCI files in `data/raw/`; missing values are encoded as `?` in the source file.

The workflow saves `models/aquapure_workflow.joblib`, chronological validation and test metrics in `results/reports/workflow_metrics.json`, dataset inspection in `results/reports/dataset_inspection.json`, existing-model comparison (when compatible) in `results/reports/existing_model_comparison.json`, and a separate simulated batch in `results/simulated_workflow_records.csv`. Functional outputs for each simulated row are in `results/reports/simulated_functional_results.csv`.

## Implementation

- The raw data has 527 dated records and 38 numeric measurements. The first 22 documented process variables are inputs. `PH-S`, `DBO-S`, `DQO-S`, and `SS-S` are the four prediction targets.
- The date plus all measured fields are loaded and sorted chronologically. The 70/15/15 split occurs before fitting; median imputation is learned on the 70% training partition only. Missing target rows are omitted from supervised fitting and scoring; missing input fields are imputed inside the saved pipeline.
- One `RandomForestRegressor` is fit to all four targets. Validation metrics are reported separately from held-out test metrics. Models are trained using historical training data only.
- Isolation Forest learns input patterns from the historical training partition. It has no verified fault labels, so its output is an unusual-pattern flag and score, not fault accuracy or diagnosis.
- Recommendations apply configurable demo target bands in `config.py`. These are examples, not permit limits or regulatory guidance.
- Digital Twin scenarios adjust one supported input, bounded by its training-data 2nd–98th percentile range. All predictions use the same saved preprocessing and multi-output model as ordinary prediction. Scenarios are exploratory and not causal evidence.
- Simulated rows are generated separately by resampling training inputs and applying bounded perturbations. They are marked `SIMULATED TEST DATA`, used for functional demonstrations only, and excluded from training and historical performance metrics.

## Reuse the trained pipeline

```python
from src.api import load_runtime, detect_anomaly, predict_water_quality

load_runtime()  # run python main.py once to create the saved artifact
record = {"Q-E": 1.0}  # supply all 22 supported feature names and numeric values
```

`src.ml_workflow.validate_input` lists and validates the exact required inputs. Example calls are `predict_water_quality(record)` and `detect_anomaly(record)` after loading the runtime. For a Digital Twin comparison, use `src.api.run_digital_twin_simulation(record, {"Q-E": proposed_value})`.

## Limitations

This is a small historical series from one plant. UCI documents the task as operational-state classification, while this workflow uses the four available final-effluent columns as regression targets. The four fields have missing historical observations; only complete target vectors can train or score the single multi-output estimator. Units and plant-specific operating limits are not established by this project. Predictions and demonstration bands require independent plant validation and operator review.
