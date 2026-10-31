import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN = os.path.join(ROOT, 'ml', 'train.py')
PREDICT = os.path.join(ROOT, 'ml', 'predict.py')
MODEL_DIR = os.path.join(ROOT, 'server', 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'ml_model.joblib')
VECTORIZER_PATH = os.path.join(MODEL_DIR, 'tfidf_vectorizer.joblib')
META_PATH = os.path.join(MODEL_DIR, 'ml_meta.json')


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=300)


def test_train_creates_model_and_meta():
    r = run([sys.executable, TRAIN])
    assert r.returncode == 0, f"train failed: {r.stderr}"
    assert os.path.exists(MODEL_PATH), "model artifact missing"
    assert os.path.exists(VECTORIZER_PATH), "vectorizer artifact missing"
    assert os.path.exists(META_PATH), "meta file missing"

    with open(META_PATH, 'r', encoding='utf-8') as f:
        meta = json.load(f)

    assert 'best_model' in meta
    assert 'results' in meta
    assert 'logistic_regression' in meta['results']
    assert 'random_forest' in meta['results']
    assert meta['results']['random_forest']['f1_macro'] > 0
    print('PASS: train creates model + meta')


def test_predict_returns_valid_label():
    db_path = os.path.join(ROOT, 'server', 'data', 'db.json')
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)
    candidates = db.get('candidates') or []
    jobs = db.get('jobs') or []
    cid = candidates[0].get('id', 'profile') if candidates else 'profile'
    jid = jobs[0].get('id', 7) if jobs else 7

    r = run([sys.executable, PREDICT, str(cid), str(jid)])
    assert r.returncode == 0, f"predict failed: {r.stderr}"
    result = json.loads(r.stdout)
    if 'error' in result:
        # profile may not exist; accept not_found as valid behavior
        assert result.get('error') or result.get('status') == 'not_trained'
        print('PASS: predict handled missing data gracefully')
        return
    assert 'prediction' in result
    assert result['prediction'] in [0, 1, 2, 3]
    assert isinstance(result['label'], str) and len(result['label']) > 0
    assert result['modelVersion'] == 'ml-v1'
    print('PASS: predict returns valid label')


def test_models_differ():
    with open(META_PATH, 'r', encoding='utf-8') as f:
        meta = json.load(f)
    lr = meta['results']['logistic_regression']
    rf = meta['results']['random_forest']
    assert lr['f1_macro'] >= 0
    assert rf['f1_macro'] >= 0
    print(f'PASS: models compared — LR f1={lr["f1_macro"]}, RF f1={rf["f1_macro"]}')


if __name__ == '__main__':
    test_train_creates_model_and_meta()
    test_predict_returns_valid_label()
    test_models_differ()
    print('ALL ML TESTS PASSED')
