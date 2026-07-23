# FinTwin v2 — auth, real data, trained ML model

## 1. Chosen Kaggle dataset & why

**Dataset:** [CFPB Financial Well-Being Survey (Public Use File)](https://www.kaggle.com/datasets/utkarshx27/cfpb-financial-well-being-survey) — the U.S. Consumer Financial Protection Bureau's national survey (~6,400 respondents).

**Why this one (over "Give Me Some Credit", "Loan Default", generic budget CSVs):**
- It is a **personal-finance** dataset, not a lending/credit-risk dataset — matches FinTwin's use case.
- It ships a **validated 0–100 Financial Well-Being Score (FWBscore)** — a real regression target for our "Financial Health Score", not a synthetic label we'd have to invent.
- Rich feature set that maps to what users enter: income bracket, savings, emergency fund adequacy, debt stress, housing cost, spending vs. income, retirement savings, plus demographics (age band, household size, employment).
- Large enough for tree ensembles, small enough to ship a compact trained model to the browser.
- Public domain (CFPB) — safe to redistribute derived artifacts.

Secondary use of the same dataset: derive **benchmark percentile tables** (savings rate, DTI, emergency months) bucketed by age & income bracket → powers "you're in the top X% for your cohort" on the dashboard.

## 2. ML pipeline (offline, committed to repo)

A `ml/` folder with a reproducible Python notebook + script:

- **Preprocessing:** missing-value imputation (median/mode), drop survey-refusal codes (-1/-4), duplicate removal, IQR outlier capping on continuous vars, feature engineering (savings_rate, dti, emergency_months, net_worth_proxy, expense_ratio), one-hot for categoricals, label-encode ordinals, StandardScaler for continuous.
- **Split:** 70/15/15 train/val/test, stratified by FWBscore quintile.
- **Models trained & compared:** Random Forest, XGBoost, LightGBM, CatBoost.
- **Tuning:** 5-fold CV + Optuna hyperparameter search (50 trials each).
- **Selection:** best test-set R² / MAE wins; metrics table saved to `ml/results.md`.
- **Feature importance:** SHAP + gain-based, chart saved to `ml/importance.png`.
- **Export for browser:** best model → **ONNX** (`ml/artifacts/fwb_model.onnx`) + preprocessing params (`ml/artifacts/preprocess.json`: means, scales, category maps). Benchmark percentiles → `ml/artifacts/benchmarks.json`.

**Runtime inference in-app:** `onnxruntime-web` loads the ONNX model in the browser (WASM), no server round-trip needed. Same preprocessing re-implemented in TS against `preprocess.json`. Produces:
- Financial Health Score (0–100, model prediction)
- Cohort percentile lookups
- Feature-attribution "what's dragging your score" (top SHAP contributors)

Deterministic math (net worth, cash-flow forecast, goal probability via Monte Carlo, savings trajectory, emergency-fund adequacy) stays in `finance-calc.ts` — the ML model handles the *score* and *behavior classification*, formulas handle projections.

> Note: full XGB/LGBM/CatBoost training runs offline on your machine (or a Colab notebook I'll provide) — I can't run multi-minute training in this sandbox. I will commit the notebook, the training script, and a pre-trained artifact set so the app works out of the box; you re-run `python ml/train.py` any time to regenerate.

## 3. Backend & auth (Lovable Cloud)

Enable Lovable Cloud. Email + password only (per your choice), with email verification and password reset.

**Tables (all RLS-protected, `auth.uid()` scoped):**
- `profiles` — name, age, currency, inflation_rate
- `expenses`, `investments`, `loans`, `goals` — user_id FK, one row per item
- `financials` — savings, emergency_fund, monthly_income, other_income, monthly_contribution
- `chat_threads`, `chat_messages` — moved off localStorage into DB
- `simulations` — saved custom scenarios

Every write goes through `createServerFn` with `requireSupabaseAuth`. The AI assistant server route reads the user's real profile from DB and passes it as context to the model.

## 4. UI changes

- **`/auth`** — sign in / sign up / forgot password (email+password only). Managed `_authenticated` layout gates `/app/*`.
- **Landing `/`** — public, sign-in CTA.
- **Default profile** — all zeros / empty arrays. No fake ₹80,000 salary, no fake expenses, no fake loans.
- **Onboarding wizard** at `/app/onboarding` (auto-redirect on first login): 5 steps — income → expenses → savings/investments → loans → goals → dashboard. Skippable per step.
- **Simulator** — replace fixed presets with a "build your own scenario" form: any combination of {salary Δ, expense Δ, new loan, new SIP, one-time expense, inflation Δ, sell investment, retirement age, marriage, child education}. Save scenarios to DB, compare side-by-side.
- **Dashboard** — surfaces ML score, cohort percentile, top score drivers (SHAP), plus existing charts. Empty-state cards link to onboarding when data missing.

## 5. Delivery order

1. Enable Cloud + auth + `/auth` page + gated layout.
2. Migrate profile/expenses/investments/loans/goals to Supabase; strip default fake data.
3. Onboarding wizard.
4. Ship `ml/` folder with dataset loader, preprocessing, training script (RF/XGB/LGBM/CatBoost + Optuna), evaluation, ONNX export. Commit pre-trained artifacts.
5. Wire `onnxruntime-web` inference into dashboard; add cohort percentiles + SHAP drivers card.
6. Rebuild simulator as custom-scenario builder; persist scenarios.
7. Move chat threads/messages to DB; feed real user data into assistant prompt.
8. `README.md` section documenting dataset choice, metrics, how to retrain.

## Technical notes

- ONNX Runtime Web (~1MB WASM) loaded lazily on the dashboard route only.
- Kaggle dataset itself is NOT bundled in the app — only the trained model artifacts (~a few hundred KB) and derived benchmark JSON.
- Training script uses `kagglehub` so anyone can re-run with one command after `kaggle` CLI auth.
- Model versioning: `preprocess.json` carries a `version` field; app refuses to score if versions mismatch.

Approve and I'll execute steps 1–8 in order.
