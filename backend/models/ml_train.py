"""
Track-My-Tax — RandomForest Risk Classifier Training Pipeline
------------------------------------------------------------
Place this file at:  backend/ml_train.py

Run ONCE to train the model:
    python ml_train.py

Output:
    backend/models/rf_risk_model.pkl   ← trained classifier
    backend/models/rf_label_encoder.pkl ← LabelEncoder for risk levels

After training, set USE_TRAINED_MODEL=true in backend/.env
then restart Flask (python app.py).  The /api/risk-prediction/predict
endpoint will use the real model instead of the rule-based simulation.
"""

import os
import pickle
import datetime
import math
import random

# ── Try real DB + ML stack ────────────────────────────────────────────────────
try:
    import pymysql
    pymysql.install_as_MySQLdb()
    import MySQLdb
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("[DB] pymysql not installed — will use synthetic training data")

try:
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import cross_val_score, train_test_split
    from sklearn.metrics import classification_report, confusion_matrix
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("[ML] scikit-learn not installed — cannot train model")
    exit(1)

from dotenv import load_dotenv
load_dotenv()

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── Step 1: Collect training data ─────────────────────────────────────────────

def fetch_from_mysql():
    """Pull feature rows from the predictions + projects tables."""
    DB_USER = os.getenv("DB_USER", "escrow_user")
    DB_PASS = os.getenv("DB_PASS", "1k2a3p")
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_NAME = os.getenv("DB_NAME", "escrow")

    conn = MySQLdb.connect(host=DB_HOST, port=DB_PORT, user=DB_USER,
                           passwd=DB_PASS, db=DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            p.project_id,
            p.budget,
            p.escrow,
            p.progress,
            DATEDIFF(NOW(), p.created_at)   AS age_days,
            COUNT(t.id)                     AS tx_count,
            pr.risk_level
        FROM projects p
        LEFT JOIN transactions t  ON t.project_id = p.project_id
        LEFT JOIN predictions pr  ON pr.project_id = p.project_id
        WHERE pr.risk_level IS NOT NULL
        GROUP BY p.project_id, p.budget, p.escrow, p.progress, p.created_at, pr.risk_level
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def generate_synthetic_data(n=2000):
    """
    Produce a labelled dataset using the same rule as simulate_risk().
    This seeds the model when real data is sparse.
    """
    random.seed(42)
    records = []
    for _ in range(n):
        budget      = random.uniform(1000, 20000)
        escrow      = random.uniform(0, budget)
        progress    = random.uniform(0, 100)
        age_days    = random.uniform(1, 180)
        tx_count    = random.randint(0, 30)

        fv  = min(tx_count, 20) / 20
        eu  = escrow / budget if budget > 0 else 0
        score = fv * 0.3 + (1 - eu) * 0.3 + (min(tx_count, 20) / 20 * 0.2) + (min(age_days, 90) / 90 * 0.2)

        if score >= 0.75:   label = "LOW"
        elif score >= 0.5:  label = "MEDIUM"
        elif score >= 0.25: label = "HIGH"
        else:               label = "CRITICAL"

        records.append((None, budget, escrow, progress, age_days, tx_count, label))
    return records


# ── Step 2: Build feature matrix ──────────────────────────────────────────────

def build_features(rows):
    X, y = [], []
    for row in rows:
        _pid, budget, escrow, progress, age_days, tx_count, risk_level = row
        budget    = float(budget or 0)
        escrow    = float(escrow or 0)
        progress  = float(progress or 0)
        age_days  = float(age_days or 0)
        tx_count  = int(tx_count or 0)

        funding_velocity    = min(tx_count, 20) / 20
        escrow_utilization  = escrow / budget if budget > 0 else 0
        progress_pct        = progress / 100
        age_norm            = min(age_days, 90) / 90

        X.append([funding_velocity, escrow_utilization, progress_pct, age_norm, tx_count])
        y.append(risk_level)
    return np.array(X, dtype=np.float32), y


# ── Step 3: Train ─────────────────────────────────────────────────────────────

def train():
    print("\n" + "="*60)
    print("Track-My-Tax — RandomForest Training Pipeline")
    print("="*60)

    # Gather data
    rows = []
    if DB_AVAILABLE:
        try:
            rows = fetch_from_mysql()
            print(f"[DB] Loaded {len(rows)} labelled rows from MySQL")
        except Exception as e:
            print(f"[DB] Could not fetch from MySQL ({e}) — using synthetic data")

    if len(rows) < 50:
        print(f"[Data] Only {len(rows)} real rows — padding with 2000 synthetic samples")
        rows = list(rows) + generate_synthetic_data(2000)

    print(f"[Data] Total training samples: {len(rows)}")

    X, y_raw = build_features(rows)

    le = LabelEncoder()
    y  = le.fit_transform(y_raw)
    print(f"[Encoder] Classes: {list(le.classes_)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train RandomForest
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_split=5,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # ── Evaluation ────────────────────────────────────────────────────────────
    cv_scores = cross_val_score(clf, X, y, cv=5, scoring="accuracy")
    y_pred = clf.predict(X_test)

    print("\n── Cross-Validation (5-fold) ─────────────────────────────")
    print(f"   Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    print(f"   Scores:   {[round(s,3) for s in cv_scores]}")

    print("\n── Test-Set Classification Report ────────────────────────")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    print("\n── Feature Importances ───────────────────────────────────")
    feature_names = ["funding_velocity","escrow_utilization","progress_pct","age_norm","tx_count"]
    for name, imp in sorted(zip(feature_names, clf.feature_importances_), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"   {name:<22} {imp:.3f}  {bar}")

    # ── Save ──────────────────────────────────────────────────────────────────
    model_path = os.path.join(MODELS_DIR, "rf_risk_model.pkl")
    enc_path   = os.path.join(MODELS_DIR, "rf_label_encoder.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(clf, f)
    with open(enc_path, "wb") as f:
        pickle.dump(le, f)

    print(f"\n[Saved] {model_path}")
    print(f"[Saved] {enc_path}")
    print("\n  Set USE_TRAINED_MODEL=true in backend/.env then restart app.py")
    print("="*60 + "\n")


if __name__ == "__main__":
    train()
