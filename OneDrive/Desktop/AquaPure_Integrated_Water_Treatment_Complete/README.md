# AquaPure Smart Flow — Integrated Water Treatment & AI/ML Platform

An integrated, end-to-end wastewater treatment decision-support platform and real-time digital twin. This unified repository merges the **AquaPure ML Complete Pipeline** (trained multi-output regression models, Isolation Forest anomaly detection, SHAP explainability, and digital twin what-if simulation) with the **AquaPure Smart Flow Web Dashboard** (interactive 3D plant twin, WHO potability scoring, CPCB effluent categorization, predictive maintenance, and struvite bio-nutrient recovery).

All legacy blockchain ledger code (Solidity smart contracts, ethers.js dependencies, transaction hashes, gas tracking, and audit anchors) has been completely removed in favor of clean, performant, enterprise-standard data logging and analytics.

---

## System Architecture

```
aquapure-water-treatment/
├── src/                               # React + Vite TypeScript Dashboard
│   ├── components/                    # UI cards, sidebars, charts, layout
│   │   ├── AquaLayout.tsx             # Cyberpunk/Neon UI wrapper for ML modules
│   │   ├── AquaSidebar.tsx            # Unified navigation for ML & Operations
│   │   ├── Sidebar.tsx                # Enterprise dark sidebar for plant operations
│   │   └── ...
│   ├── pages/                         # 16 Interactive Application Modules
│   │   ├── Dashboard.tsx              # Facility overview & live sensor telemetry
│   │   ├── Plant3D.tsx                # Interactive 3D plant twin (Three.js/Canvas)
│   │   ├── DigitalTwin.tsx            # What-if process parameter simulation & SCADA feed
│   │   ├── Potability.tsx             # WHO drinking water potability classifier & SHAP
│   │   ├── Effluent.tsx               # CPCB industrial & municipal reuse grading (Cat A–D)
│   │   ├── Maintenance.tsx            # Predictive equipment maintenance & RUL estimation
│   │   ├── Nutrients.tsx              # Struvite (MgNH₄PO₄·6H₂O) bio-recovery & revenue
│   │   ├── Recovery.tsx               # Sludge generation, biogas yield & methane tracking
│   │   ├── Anomaly.tsx                # Real-time anomaly & shock-load streaming detector
│   │   ├── Benchmarks.tsx             # Multi-algorithm benchmark matrix & UCI test metrics
│   │   ├── Compliance.tsx             # EPA & WHO water quality regulatory tracker
│   │   ├── Distribution.tsx           # Distribution network monitoring & pressure maps
│   │   ├── Groundwater.tsx            # Influent wells & raw groundwater telemetry
│   │   ├── Analytics.tsx              # Historical parameter trends & performance charts
│   │   ├── Reports.tsx                # Treatment batch logs & automated compliance exports
│   │   ├── Alerts.tsx                 # Centralized warning & critical alarm management
│   │   └── Settings.tsx               # System thresholds, alarms & plant configuration
│   ├── lib/
│   │   ├── aquapure.ts                # Client-side heuristic & deterministic ML engine
│   │   └── mlResults.ts               # Pre-calculated benchmarks from the UCI trained models
│   └── ...
├── ml/                                # AquaPure ML Complete (Python Pipeline)
│   ├── data/
│   │   ├── raw/                       # UCI Water Treatment Plant dataset (ID 106, 527 records)
│   │   └── simulated/                 # Perturbed process simulation records
│   ├── models/                        # Pre-trained scikit-learn & joblib model weights
│   │   ├── aquapure_workflow.joblib   # Multi-output Random Forest regressor (PH-S, DBO-S, DQO-S, SS-S)
│   │   └── anomaly_models.joblib      # Isolation Forest unsupervised anomaly detector
│   ├── results/                       # SHAP plots, validation reports, evaluation CSVs
│   ├── src/                           # 16 Python ML source modules
│   │   ├── api.py                     # High-level programmatic API for runtime integration
│   │   ├── ml_workflow.py             # Model training, split, evaluation & serialization
│   │   ├── water_quality_prediction.py# Multi-target regression estimators
│   │   ├── anomaly_detection.py       # Isolation Forest & outlier detectors
│   │   ├── digital_twin.py            # Digital twin scenario adjustment & optimization
│   │   └── explainable_ai.py          # SHAP global & local feature importance
│   ├── config.py                      # Feature names, bands, and hyperparameters
│   ├── main.py                        # CLI training & benchmark runner
│   └── requirements.txt               # Python ML dependencies
├── server/                            # Python REST API Server
│   ├── app.py                         # Flask REST API exposing ML models to the dashboard
│   └── requirements.txt               # Flask & Flask-CORS dependencies
└── public/                            # Static assets, icons, and downloadable pipelines
```

---

## Quick Start

### 1. Web Dashboard (React + Vite)

```bash
# Navigate to project root
cd aquapure-water-treatment

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

The application runs at `http://localhost:8080` (or `http://localhost:5173`).

---

### 2. Python ML Pipeline (AquaPure_ML_Complete)

```bash
# Navigate to the ml directory
cd ml

# Install Python requirements
pip install -r requirements.txt

# Run the complete UCI training & simulation workflow
python main.py --simulated-count 50 --seed 42
```

Outputs:
- Saved pipeline artifacts: `ml/models/aquapure_workflow.joblib`
- Validation & test metrics: `ml/results/reports/workflow_metrics.json`
- Feature importance plots: `ml/results/plots/shap/`

---

### 3. Python REST API Server (Optional)

```bash
# Start the Flask API server
python server/app.py
```

Endpoints available on `http://localhost:5000`:
- `GET  /api/health` — Status and model runtime readiness
- `POST /api/predict-potability` — WHO drinking water potability & SHAP
- `POST /api/predict-effluent` — CPCB discharge category evaluation
- `POST /api/predict-maintenance` — Equipment failure risk & RUL
- `POST /api/predict-nutrients` — Struvite precipitation yield
- `GET  /api/benchmarks` — Multi-model comparison matrix
- `POST /api/ml/predict-water-quality` — Raw UCI multi-output prediction
- `POST /api/ml/detect-anomaly` — Isolation Forest anomaly scoring

---

## Key Features & Pipelines

1. **Pipeline A: WHO Drinking Water Potability**  
   Evaluates 9 critical water quality parameters against WHO international limits, computing a weighted Water Quality Index (WQI) and feature-level SHAP impact values.

2. **Pipeline B: CPCB Wastewater Effluent & Reuse**  
   Predicts treated effluent concentrations for BOD, COD, and TSS using activated sludge load factors, categorizing reuse potential into CPCB Categories A, B, C, or D.

3. **Predictive Maintenance & Remaining Useful Life (RUL)**  
   Monitors Transmembrane Pressure (TMP), bearing vibration (ISO 10816), motor windings temperature, and hydraulic flow degradation to calculate component failure risk.

4. **Circular Economy: Bio-Nutrient Recovery**  
   Estimates daily struvite ($MgNH_4PO_4 \cdot 6H_2O$) crystallization yield based on $NH_3\text{-}N$, $PO_4\text{-}P$, and $Mg^{2+}$ stoichiometry, computing nutrient recovery percentages and commercial fertilizer revenue.

5. **Streaming Anomaly Detection**  
   Real-time Isolation Forest scoring detecting hydraulic shock loads, toxic chemical spikes, and stormwater surges.

6. **Interactive 3D Digital Twin**  
   Three.js/Canvas-based digital representation of clarifiers, aeration basins, MBR modules, and disinfection chambers with what-if parameter simulation.

---

## License

MIT License. Open-source for academic, municipal, and industrial research.
