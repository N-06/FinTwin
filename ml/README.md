# FinTwin ML pipeline

The FinTwin dashboard's Financial Health Score is produced by a machine-learning
model trained on a real personal-finance survey and served in the browser.

## Dataset

**[CFPB Financial Well-Being Survey — Public Use File](https://www.consumerfinance.gov/data-research/financial-well-being-survey-data/)**
(also mirrored on Kaggle: [`utkarshx27/cfpb-financial-well-being-survey`](https://www.kaggle.com/datasets/utkarshx27/cfpb-financial-well-being-survey)).

~6,394 U.S. adults; ~200 columns covering income, savings, emergency-fund
adequacy, debt stress, housing costs, retirement savings, spending patterns,
plus demographics (age band, household size, employment).

### Why this dataset (and not a credit-default dataset)

| Candidate | Why we rejected it |
|---|---|
| "Give Me Some Credit" | Predicts delinquency for lenders. Wrong target — FinTwin is a *personal* finance twin, not a credit-risk scorer. |
| "Loan Default Prediction" (any variant) | Same problem — lender's perspective, binary default target. |
| Generic Kaggle "personal budget" CSVs | Small, unlabeled, no validated well-being outcome to train against. |
| **CFPB FWB Survey** ✅ | Personal-finance framing. Ships a **validated 0–100 Financial Well-Being Score** (published methodology, ~200 hours of psychometric development) as a real supervised target. Features map 1:1 to what users enter in FinTwin. Public domain. |

## Pipeline (`train.py`)

Reproducible, one command: `python ml/train.py`.

1. **Load** the CFPB public-use CSV via `kagglehub` (or a local path).
2. **Preprocessing**
   - Drop refusal codes (`-1`, `-4`) → NaN.
   - Median imputation for continuous, mode for categoricals.
   - Duplicate removal.
   - IQR outlier capping on continuous vars (1.5 × IQR).
3. **Feature engineering** — mirrors the features the app computes at runtime:
   - `savingsRate`, `dti`, `emergencyMonths`, `netWorthToIncome`,
     `expenseToIncome`, `investmentRate`, plus `age`.
4. **Encoding & scaling**
   - One-hot for nominal categoricals.
   - Label-encode ordinals (education, income band).
   - `StandardScaler` on continuous features.
5. **Split** — 70 / 15 / 15 train / val / test, stratified by `FWBscore` quintile.
6. **Models trained & compared**
   - RandomForest
   - XGBoost
   - LightGBM
   - CatBoost
7. **Hyperparameter tuning** — Optuna, 50 trials each, 5-fold CV.
8. **Selection** — best test-set R² wins. Full metrics table written to `ml/results.md`.
9. **Feature importance** — SHAP + gain-based. Chart saved to `ml/importance.png`.
10. **Export** for browser inference:
    - `ml/artifacts/model.json` — linear surrogate distilled from the winning
      tree ensemble (coefficients + per-feature mean/std). Kept tiny so it
      ships in the bundle and runs synchronously.
    - `ml/artifacts/preprocess.json` — imputation/scaler params.
    - `ml/artifacts/benchmarks.json` — percentile lookup tables by
      age × income cohort (savings rate, DTI, emergency months, health score).
    - Optional: `ml/artifacts/model.onnx` for full-fidelity `onnxruntime-web`
      inference. The app falls back to the linear surrogate when ONNX isn't
      loaded, keeping first-paint fast.

## Runtime inference

`src/lib/ml-scorer.ts` loads `model.json` + `benchmarks.json` and produces:

- **Financial Health Score** — 0–100, model prediction.
- **Top score drivers** — signed contribution of each engineered feature
  (feature-attribution style, derived from the linear surrogate weights).
- **Cohort percentiles** — where the user sits vs. their age × income cohort
  for savings rate, DTI, emergency months, and health score.

No PII ever leaves the browser for scoring.

## Regenerating artifacts

```bash
cd ml
pip install -r requirements.txt   # scikit-learn, xgboost, lightgbm, catboost, optuna, shap, kagglehub, skl2onnx
python train.py                    # writes artifacts/*.json (+ optional model.onnx)
```

The app immediately picks up the new artifacts on next reload — versioning
carried through `model.json.version` and `benchmarks.json.version`.
