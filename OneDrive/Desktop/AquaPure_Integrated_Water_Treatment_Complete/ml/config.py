"""Project settings. Targets below are demonstration bands, not permit limits."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW_DATA = ROOT / "data" / "raw" / "water-treatment.data"
SIMULATED_DATA = ROOT / "data" / "simulated" / "simulated_water_treatment.csv"
MODEL_DIR = ROOT / "models"
RESULTS_DIR = ROOT / "results"
RANDOM_SEED = 42
TRAIN_FRACTION = 0.70
VALIDATION_FRACTION = 0.15
TARGETS = ["PH-S", "DBO-S", "DQO-S", "SS-S"]
TARGET_BANDS = {"PH-S": (6.0, 9.0), "DBO-S": (0.0, 25.0),
                "DQO-S": (0.0, 125.0), "SS-S": (0.0, 35.0)}
TARGET_RANGE_METADATA = {
    "PH-S": {"units": "not specified by UCI; pH is dimensionless", "kind": "demonstration setting",
             "source": "AquaPure project configuration; not a cited permit limit"},
    "DBO-S": {"units": "not specified by UCI", "kind": "demonstration setting",
              "source": "AquaPure project configuration; not a cited permit limit"},
    "DQO-S": {"units": "not specified by UCI", "kind": "demonstration setting",
              "source": "AquaPure project configuration; not a cited permit limit"},
    "SS-S": {"units": "not specified by UCI", "kind": "demonstration setting",
             "source": "AquaPure project configuration; not a cited permit limit"},
}
