"""Read-only inspection of the official UCI records; does not train models."""
from __future__ import annotations
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path: sys.path.insert(0,str(ROOT))
from src.data_loader import load_data,VARIABLES,COLUMNS
from config import RAW_DATA

def main():
    data=load_data(RAW_DATA)
    print("UCI WATER TREATMENT PLANT - DATA INSPECTION")
    print(f"Rows: {len(data)}; numeric process variables: {len(COLUMNS)}")
    print(f"Date range: {data.date.min().date()} to {data.date.max().date()}")
    print(f"Duplicate complete records: {data.duplicated().sum()}")
    print("Missing values: '?' is parsed as NaN")
    for name,description in VARIABLES:
        print(f"{name:10} dtype={data[name].dtype!s:8} missing={data[name].isna().sum():3} {description}")
    print("\nDescriptive statistics:")
    print(data[COLUMNS].describe().T.to_string(float_format=lambda x:f"{x:.3f}"))
    print("\nIQR outlier flags (inspection only; no deletion):")
    for name in COLUMNS:
        values=data[name].dropna(); q1,q3=values.quantile([.25,.75]); iqr=q3-q1
        count=int(((values<q1-1.5*iqr)|(values>q3+1.5*iqr)).sum())
        if count: print(f"{name:10} {count}")

if __name__=="__main__": main()
