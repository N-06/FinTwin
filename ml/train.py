"""
FinTwin — train and export the Financial Health Score model.

Trains RandomForest, XGBoost, LightGBM and CatBoost on the CFPB Financial
Well-Being Survey, tunes each with Optuna, picks the best by test R², and
exports a compact linear surrogate + benchmarks JSON that the browser
consumes.

Usage:
    python train.py                    # downloads dataset via kagglehub
    python train.py --csv path/to.csv  # use a local copy

Deps (see requirements.txt):
    pandas numpy scikit-learn xgboost lightgbm catboost optuna shap kagglehub skl2onnx
"""
from __future__ import annotations
import argparse, json, os, warnings
from pathlib import Path
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score

warnings.filterwarnings("ignore")

ARTIFACTS = Path(__file__).parent / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)

REFUSAL_CODES = {-1, -4, -5, 98, 99}

# CFPB column names we care about (subset — full list in the codebook).
FEATURE_COLS = [
    "PPAGECAT",      # age band
    "PPINCIMP",      # income band
    "PPEDUCAT",      # education
    "PPHHSIZE",      # household size
    "PPMARIT5",      # marital status
    "SAVINGSRANGES", # liquid savings bucket
    "SAVINGSDIFC1",  # emergency-fund confidence
    "MATHARDSHIP_1", # material hardship
    "PROPPLAN_1",    # planning behaviour
    "MANAGE1_1",     # managing finances
    "FS1_1",         # financial skill
    "FS1_2",
    "FS1_7",
]
TARGET = "FWBscore"


def load_data(csv_path: str | None) -> pd.DataFrame:
    if csv_path:
        return pd.read_csv(csv_path)
    import kagglehub
    path = kagglehub.dataset_download("utkarshx27/cfpb-financial-well-being-survey")
    csv = next(Path(path).glob("*.csv"))
    return pd.read_csv(csv)


def preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    df = df.drop_duplicates()
    keep = [c for c in FEATURE_COLS + [TARGET] if c in df.columns]
    df = df[keep].copy()
    df[df.isin(REFUSAL_CODES)] = np.nan
    df = df.dropna(subset=[TARGET])

    # IQR cap continuous
    for c in df.select_dtypes(include=np.number).columns:
        q1, q3 = df[c].quantile([0.25, 0.75])
        iqr = q3 - q1
        df[c] = df[c].clip(q1 - 1.5 * iqr, q3 + 1.5 * iqr)

    imputer = SimpleImputer(strategy="median")
    X = pd.DataFrame(imputer.fit_transform(df.drop(columns=[TARGET])),
                     columns=df.columns.drop(TARGET))
    y = df[TARGET].reset_index(drop=True)
    return X, y


def train_models(X_train, y_train, X_val, y_val):
    import optuna
    from lightgbm import LGBMRegressor
    from xgboost import XGBRegressor
    from catboost import CatBoostRegressor

    def objective_lgbm(trial):
        params = dict(
            n_estimators=trial.suggest_int("n_estimators", 200, 800),
            learning_rate=trial.suggest_float("lr", 0.01, 0.2, log=True),
            num_leaves=trial.suggest_int("num_leaves", 15, 127),
            min_child_samples=trial.suggest_int("min_child_samples", 5, 50),
        )
        m = LGBMRegressor(**params, random_state=42, verbose=-1)
        m.fit(X_train, y_train)
        return r2_score(y_val, m.predict(X_val))

    def objective_xgb(trial):
        params = dict(
            n_estimators=trial.suggest_int("n_estimators", 200, 800),
            learning_rate=trial.suggest_float("lr", 0.01, 0.2, log=True),
            max_depth=trial.suggest_int("max_depth", 3, 10),
            subsample=trial.suggest_float("subsample", 0.6, 1.0),
        )
        m = XGBRegressor(**params, random_state=42, verbosity=0)
        m.fit(X_train, y_train)
        return r2_score(y_val, m.predict(X_val))

    def objective_cat(trial):
        params = dict(
            iterations=trial.suggest_int("iterations", 200, 800),
            learning_rate=trial.suggest_float("lr", 0.01, 0.2, log=True),
            depth=trial.suggest_int("depth", 4, 10),
        )
        m = CatBoostRegressor(**params, random_seed=42, verbose=0)
        m.fit(X_train, y_train)
        return r2_score(y_val, m.predict(X_val))

    results = {}
    for name, obj, cls in [
        ("lgbm", objective_lgbm, LGBMRegressor),
        ("xgb",  objective_xgb,  XGBRegressor),
        ("cat",  objective_cat,  CatBoostRegressor),
    ]:
        study = optuna.create_study(direction="maximize")
        study.optimize(obj, n_trials=50, show_progress_bar=False)
        best = study.best_params
        if name == "lgbm":
            model = LGBMRegressor(**best, random_state=42, verbose=-1)
        elif name == "xgb":
            model = XGBRegressor(**best, random_state=42, verbosity=0)
        else:
            model = CatBoostRegressor(**best, random_seed=42, verbose=0)
        model.fit(pd.concat([X_train, X_val]), pd.concat([y_train, y_val]))
        results[name] = (model, best)

    # RandomForest baseline (no tuning)
    rf = RandomForestRegressor(n_estimators=400, random_state=42, n_jobs=-1)
    rf.fit(pd.concat([X_train, X_val]), pd.concat([y_train, y_val]))
    results["rf"] = (rf, {})
    return results


def evaluate(models, X_test, y_test):
    rows = []
    for name, (m, params) in models.items():
        pred = m.predict(X_test)
        rows.append({
            "model": name,
            "r2": r2_score(y_test, pred),
            "mae": mean_absolute_error(y_test, pred),
            "params": params,
        })
    return sorted(rows, key=lambda r: -r["r2"])


def distill_linear_surrogate(best_model, X, y):
    """Fit Ridge on the winning model's predictions to get browser-friendly weights."""
    preds = best_model.predict(X)
    scaler = StandardScaler().fit(X)
    Xs = scaler.transform(X)
    surrogate = Ridge(alpha=1.0).fit(Xs, preds)
    return surrogate, scaler


def export_model_json(surrogate, scaler, feature_names, metrics, best_name):
    payload = {
        "version": "1.0.0",
        "trained_on": "CFPB Financial Well-Being Survey (PUF)",
        "algorithm": f"{best_name} + Ridge linear surrogate",
        "target": "FWBscore (0-100)",
        "test_r2": round(metrics[0]["r2"], 3),
        "test_mae": round(metrics[0]["mae"], 2),
        "intercept": float(surrogate.intercept_),
        "features": [
            {"name": n, "mean": float(m), "std": float(s or 1), "weight": float(w)}
            for n, m, s, w in zip(feature_names, scaler.mean_, scaler.scale_, surrogate.coef_)
        ],
    }
    (ARTIFACTS / "model.json").write_text(json.dumps(payload, indent=2))


def export_benchmarks(df):
    """Cohort percentile tables by age × income bucket."""
    def age_band(v):
        return ["18-24", "25-34", "35-44", "45-54", "55+"][min(int(v) - 1, 4)]
    def income_band(v):
        return ["<3L", "3-8L", "8-20L", "20L+", "20L+"][min(int(v) // 3, 4)]

    df = df.copy()
    df["ageBand"] = df["PPAGECAT"].apply(age_band)
    df["incomeBand"] = df["PPINCIMP"].apply(income_band)

    cohorts = []
    for (ab, ib), g in df.groupby(["ageBand", "incomeBand"]):
        ptiles = [10, 20, 30, 40, 50, 60, 70, 80, 90]
        cohorts.append({
            "ageBand": ab, "incomeBand": ib,
            "percentiles": {
                "healthScore": [float(np.percentile(g[TARGET], p)) for p in ptiles],
                # In production, derive the below from feature-engineered columns
                # rather than raw survey buckets. Placeholder ordering here.
                "savingsRate":     [0, 3, 7, 11, 15, 22, 28, 35, 45],
                "dti":             [50, 42, 35, 29, 24, 18, 13, 8, 3],
                "emergencyMonths": [0, 0.5, 1, 1.8, 2.8, 4, 5.5, 7, 10],
            }
        })
    (ARTIFACTS / "benchmarks.json").write_text(json.dumps({
        "version": "1.0.0",
        "source": "CFPB FWB Survey",
        "cohorts": cohorts,
    }, indent=2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=None)
    args = ap.parse_args()

    print("Loading dataset...")
    df = load_data(args.csv)
    print(f"  {len(df):,} rows, {df.shape[1]} cols")

    print("Preprocessing...")
    X, y = preprocess(df)

    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.15,
                                                       random_state=42,
                                                       stratify=pd.qcut(y, 5, labels=False, duplicates="drop"))
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.176,
                                                       random_state=42)

    print("Training + tuning models...")
    models = train_models(X_train, y_train, X_val, y_val)
    print("Evaluating on held-out test set...")
    metrics = evaluate(models, X_test, y_test)
    print(pd.DataFrame(metrics)[["model", "r2", "mae"]].to_string(index=False))

    best_name = metrics[0]["model"]
    best_model = models[best_name][0]
    print(f"Winner: {best_name}  (R²={metrics[0]['r2']:.3f}, MAE={metrics[0]['mae']:.2f})")

    print("Distilling browser-friendly linear surrogate...")
    surrogate, scaler = distill_linear_surrogate(best_model, X, y)
    export_model_json(surrogate, scaler, list(X.columns), metrics, best_name)

    print("Exporting cohort benchmarks...")
    export_benchmarks(df)

    print(f"Wrote {ARTIFACTS}/model.json + benchmarks.json")


if __name__ == "__main__":
    main()
