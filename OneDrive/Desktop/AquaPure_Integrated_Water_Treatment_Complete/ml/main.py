"""Train and demonstrate the AquaPure decision-support workflow."""
import argparse

from config import RANDOM_SEED
from src.data_loader import INPUT_FEATURES
from src.ml_workflow import main

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and run the AquaPure UCI ML workflow.")
    parser.add_argument("--simulated-count", type=int, default=12,
                        help="number of simulated test records to generate")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED,
                        help="reproducible simulated-data seed")
    parser.add_argument("--twin-feature", choices=INPUT_FEATURES, default=INPUT_FEATURES[0],
                        help="supported UCI process input to vary in Digital Twin")
    parser.add_argument("--twin-adjustment", type=float, default=None,
                        help="optional input adjustment; default is one training-data IQR")
    args = parser.parse_args()
    main(simulated_count=args.simulated_count, simulated_seed=args.seed,
         twin_feature=args.twin_feature, twin_adjustment=args.twin_adjustment)
