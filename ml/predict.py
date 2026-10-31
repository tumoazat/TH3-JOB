import json
import os
import sys
import joblib
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'data', 'db.json')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'server', 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'ml_model.joblib')
VECTORIZER_PATH = os.path.join(MODEL_DIR, 'tfidf_vectorizer.joblib')
META_PATH = os.path.join(MODEL_DIR, 'ml_meta.json')

SKILL_ALIASES = {
    'js': 'javascript', 'ts': 'typescript', 'reactjs': 'react',
    'react.js': 'react', 'nodejs': 'node', 'node.js': 'node',
    'postgres': 'postgresql', 'postgresql': 'postgresql',
}

def normalize_skill(s):
    import re
    base = re.sub(r'[^\w\s]', '', s or '').lower().strip().replace(' ', '')
    return SKILL_ALIASES.get(base, base)

def tokenize(text):
    import re
    return re.findall(r'[a-z0-9]+', (text or '').lower())

STOPWORDS = {'and','the','a','an','we','i','to','of','for','with','is','are','you','our','in','on','at','be','as','by','or'}

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_features(candidate, job):
    import re
    cv_text = candidate.get('cvText') or candidate.get('bio') or ''
    jd_text = ' '.join([job.get('title',''), job.get('description',''), job.get('requirements','')])
    job_tags = job.get('tags', []) or []
    cand_skills = candidate.get('skills', []) or []

    c_skills = set(normalize_skill(s) for s in cand_skills) - {''}
    j_tags = set(normalize_skill(t) for t in job_tags) - {''}

    skill_overlap = len(c_skills & j_tags) / len(j_tags) if j_tags else 0.0

    cv_tokens = [t for t in tokenize(cv_text) if t not in STOPWORDS]
    jd_tokens = [t for t in tokenize(jd_text) if t not in STOPWORDS]
    cv_set = set(cv_tokens)
    jd_set = set(jd_tokens)
    text_overlap = len(cv_set & jd_set) / len(jd_set) if jd_set else 0.0

    return np.array([[
        skill_overlap,
        skill_overlap,
        skill_overlap,
        text_overlap,
        0.5,
        0.5,
        0.5,
    ]], dtype=float), cv_text + ' ' + jd_text

LABELS = {0: 'Không phù hợp', 1: 'Phù hợp một phần', 2: 'Phù hợp', 3: 'Rất phù hợp'}

def predict(candidate_id, job_id):
    db = load_db()
    candidate = None
    if candidate_id == 'profile':
        candidate = db.get('profile')
    else:
        candidate = next((c for c in (db.get('candidates') or []) if c.get('id') == candidate_id), None)
    job = next((j for j in db.get('jobs', []) if j.get('id') == job_id), None)

    if not candidate or not job:
        return {'error': 'Candidate or job not found'}, 404

    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        return {'error': 'ML model not trained. Run ml/train.py first.', 'status': 'not_trained'}, 404

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)

    X_struct, combined_text = extract_features(candidate, job)
    X_text = vectorizer.transform([combined_text]).toarray()
    X = np.hstack([X_struct, X_text])

    pred = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0].tolist() if hasattr(model, 'predict_proba') else None

    return {
        'candidateId': candidate_id,
        'jobId': job_id,
        'prediction': pred,
        'label': LABELS.get(pred, 'Không xác định'),
        'probabilities': proba,
        'modelVersion': 'ml-v1',
    }, 200

if __name__ == '__main__':
    cid = sys.argv[1] if len(sys.argv) > 1 else 'profile'
    jid = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    result, code = predict(cid, jid)
    print(json.dumps(result, ensure_ascii=False, indent=2))
