"""Load the documented UCI dataset and attach human-readable variable metadata."""
from __future__ import annotations
from pathlib import Path
import pandas as pd

VARIABLES = [
    ("Q-E", "Input flow to plant"), ("ZN-E", "Input zinc to plant"),
    ("PH-E", "Input pH to plant"), ("DBO-E", "Input biological oxygen demand"),
    ("DQO-E", "Input chemical oxygen demand"), ("SS-E", "Input suspended solids"),
    ("SSV-E", "Input volatile suspended solids"), ("SED-E", "Input sediments"),
    ("COND-E", "Input conductivity"), ("PH-P", "Primary settler pH"),
    ("DBO-P", "Primary settler biological oxygen demand"),
    ("SS-P", "Primary settler suspended solids"),
    ("SSV-P", "Primary settler volatile suspended solids"),
    ("SED-P", "Primary settler sediments"), ("COND-P", "Primary settler conductivity"),
    ("PH-D", "Secondary settler pH"), ("DBO-D", "Secondary settler biological oxygen demand"),
    ("DQO-D", "Secondary settler chemical oxygen demand"),
    ("SS-D", "Secondary settler suspended solids"),
    ("SSV-D", "Secondary settler volatile suspended solids"),
    ("SED-D", "Secondary settler sediments"), ("COND-D", "Secondary settler conductivity"),
    ("PH-S", "Final effluent pH"), ("DBO-S", "Final effluent biological oxygen demand"),
    ("DQO-S", "Final effluent chemical oxygen demand"),
    ("SS-S", "Final effluent suspended solids"),
    ("SSV-S", "Final effluent volatile suspended solids"),
    ("SED-S", "Final effluent sediments"), ("COND-S", "Final effluent conductivity"),
    ("RD-DBO-P", "Primary-stage BOD performance"),
    ("RD-SS-P", "Primary-stage suspended-solids performance"),
    ("RD-SED-P", "Primary-stage sediment performance"),
    ("RD-DBO-S", "Secondary-stage BOD performance"),
    ("RD-DQO-S", "Secondary-stage COD performance"),
    ("RD-DBO-G", "Global BOD performance"), ("RD-DQO-G", "Global COD performance"),
    ("RD-SS-G", "Global suspended-solids performance"),
    ("RD-SED-G", "Global sediment performance"),
]
COLUMNS = [name for name, _ in VARIABLES]
INPUT_FEATURES = COLUMNS[:22]
TARGETS = ["PH-S", "DBO-S", "DQO-S", "SS-S"]

def load_data(path: str | Path) -> pd.DataFrame:
    frame = pd.read_csv(path, header=None, names=["date", *COLUMNS],
                        na_values=["?", "", "NA"], dtype={"date": "string"})
    frame["date"] = pd.to_datetime(frame["date"].str.removeprefix("D-"),
                                   format="%d/%m/%y")
    for name in COLUMNS:
        frame[name] = pd.to_numeric(frame[name], errors="coerce")
    frame["record_source"] = "REAL"
    return frame.sort_values("date").reset_index(drop=True)
