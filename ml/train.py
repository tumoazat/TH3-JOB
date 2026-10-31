import json
import os
import re
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from sklearn.feature_extraction.text import TfidfVectorizer

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
    base = re.sub(r'[^\w\s]', '', s or '').lower().strip().replace(' ', '')
    return SKILL_ALIASES.get(base, base)

def tokenize(text):
    return re.findall(r'[a-z0-9]+', (text or '').lower())

STOPWORDS = {'and','the','a','an','we','i','to','of','for','with','is','are','you','our','in','on','at','be','as','by','or'}

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_features(candidate, job):
    cv_text = candidate.get('cvText') or candidate.get('bio') or ''
    jd_text = ' '.join([job.get('title',''), job.get('description',''), job.get('requirements','')])
    job_tags = job.get('tags', []) or []
    cand_skills = candidate.get('skills', []) or []

    c_skills = set(normalize_skill(s) for s in cand_skills) - {''}
    j_tags = set(normalize_skill(t) for t in job_tags) - {''}

    skill_overlap = len(c_skills & j_tags) / len(j_tags) if j_tags else 0.0
    required_coverage = skill_overlap
    preferred_coverage = skill_overlap

    cv_tokens = [t for t in tokenize(cv_text) if t not in STOPWORDS]
    jd_tokens = [t for t in tokenize(jd_text) if t not in STOPWORDS]
    cv_set = set(cv_tokens)
    jd_set = set(jd_tokens)
    text_overlap = len(cv_set & jd_set) / len(jd_set) if jd_set else 0.0

    experience_relevance = 0.5
    education_relevance = 0.5
    project_relevance = 0.5

    return {
        'skill_overlap_ratio': skill_overlap,
        'required_skill_coverage': required_coverage,
        'preferred_skill_coverage': preferred_coverage,
        'text_overlap': text_overlap,
        'experience_relevance': experience_relevance,
        'education_relevance': education_relevance,
        'project_relevance': project_relevance,
        'cv_text': cv_text,
        'jd_text': jd_text,
    }

def score_to_label(score):
    if score is None: return 0
    if score >= 90: return 3
    if score >= 80: return 2
    if score >= 70: return 1
    return 0

def generate_synthetic_data(n_per_class=40):
    """Sinh dữ liệu CV-JD mẫu đa clase để verify pipeline ML.
    KHÔNG phải dữ liệu human-labeled thực nghiệm — chỉ dùng để verify pipeline hoạt động.
    """
    import random
    random.seed(42)
    np.random.seed(42)

    tech_skills = ['React', 'Node.js', 'Python', 'Java', 'SQL', 'AWS', 'Docker', 'TypeScript',
                   'Go', 'Kubernetes', 'PostgreSQL', 'Redis', 'GraphQL', 'Next.js', 'Vue.js']
    junior_cv_tpl = "Sinh viên CNTT, kỹ năng {skills}. Dự án: {projects}. Tiếng Anh cơ bản."
    senior_cv_tpl = "Kỹ sư {exp} năm kinh nghiệm, chuyên môn {skills}. Dự án {projects}. Tiếng Anh {eng}."
    junior_jd_tpl = "Tìm nhân viên {role}, yêu cầu {req}. Tiếng Anh cơ bản, làm việc nhóm."
    senior_jd_tpl = "Tuyển {role} {exp} năm, yêu cầu thành thạo {req}, kinh nghiệm {exp_req}."

    rows = []
    for label in range(4):
        for _ in range(n_per_class):
            # Mức độ khớp quyết bởi label
            skill_overlap = {0: 0.1, 1: 0.45, 2: 0.75, 3: 0.95}[label] + np.random.uniform(-0.08, 0.08)
            skill_overlap = max(0, min(1, skill_overlap))
            text_overlap = {0: 0.1, 1: 0.4, 2: 0.7, 3: 0.9}[label] + np.random.uniform(-0.08, 0.08)
            text_overlap = max(0, min(1, text_overlap))

            n_skills = int(skill_overlap * 8) + 1
            cand_skills = random.sample(tech_skills, min(n_skills, len(tech_skills)))
            req_skills = random.sample(tech_skills, 5)

            cv_text = junior_cv_tpl.format(skills=', '.join(cand_skills), projects='xây dựng web')
            jd_text = junior_jd_tpl.format(role='developer', req=', '.join(req_skills))

            rows.append(({
                'skill_overlap_ratio': round(skill_overlap, 3),
                'required_skill_coverage': round(skill_overlap, 3),
                'preferred_skill_coverage': round(skill_overlap * 0.9, 3),
                'text_overlap': round(text_overlap, 3),
                'experience_relevance': round(skill_overlap, 3),
                'education_relevance': round(0.6, 3),
                'project_relevance': round(skill_overlap * 0.9, 3),
                'cv_text': cv_text,
                'jd_text': jd_text,
            }, label))
    return rows

def build_dataset(db):
    jobs = db.get('jobs', [])
    candidates = db.get('candidates', []) or []
    profile = db.get('profile')

    rows = []
    for job in jobs:
        pool = candidates[:] if candidates else ([profile] if profile else [])
        for cand in pool:
            feat = extract_features(cand, job)
            label = score_to_label(feat.get('rule_score'))
            rows.append((feat, label))
    return rows

def main():
    db = load_db()
    jobs = db.get('jobs', [])
    candidates = db.get('candidates', []) or []
    profile = db.get('profile')

    # Build dataset with rule-based pseudo-labels
    rows = []
    for job in jobs:
        pool = candidates[:] if candidates else ([profile] if profile else [])
        for cand in pool:
            feat = extract_features(cand, job)
            # pseudo-label from rule-based heuristic
            skill_overlap = feat['skill_overlap_ratio']
            text_overlap = feat['text_overlap']
            rule_score = round(skill_overlap * 60 + text_overlap * 40)
            feat['rule_score'] = rule_score
            label = score_to_label(rule_score)
            rows.append((feat, label))

    if not rows:
        print('No training data')
        return

    unique_labels = {r[1] for r in rows}
    if len(unique_labels) < 2:
        print('Only one class in db data. Adding synthetic labeled data to verify pipeline...')
        synthetic = generate_synthetic_data(n_per_class=60)
        rows.extend(synthetic)
        print(f'Added {len(synthetic)} synthetic samples. Total classes: {len({r[1] for r in rows})}')

    X_struct = np.array([[r[0][k] for k in [
        'skill_overlap_ratio','required_skill_coverage','preferred_skill_coverage',
        'text_overlap','experience_relevance','education_relevance','project_relevance'
    ]] for r in rows], dtype=float)

    cv_texts = [r[0]['cv_text'] for r in rows]
    jd_texts = [r[0]['jd_text'] for r in rows]
    combined_texts = [c + ' ' + j for c, j in zip(cv_texts, jd_texts)]

    vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
    X_text = vectorizer.fit_transform(combined_texts).toarray()

    X = np.hstack([X_struct, X_text])
    y = np.array([r[1] for r in rows])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
    )

    unique_classes = np.unique(y)
    if len(unique_classes) < 2:
        print('WARNING: Only one class in data (', unique_classes[0], '). Cannot train classifier.')
        print('Need human-labeled CV-JD pairs with varied match levels.')
        os.makedirs(MODEL_DIR, exist_ok=True)
        meta = {
            'model_version': 'ml-v1',
            'best_model': None,
            'training_date': __import__('datetime').datetime.now().isoformat(),
            'n_samples': len(rows),
            'features': ['skill_overlap_ratio','required_skill_coverage','preferred_skill_coverage','text_overlap','experience_relevance','education_relevance','project_relevance','tfidf_text'],
            'labels': {0: 'Không phù hợp', 1: 'Phù hợp một phần', 2: 'Phù hợp', 3: 'Rất phù hợp'},
            'results': {},
            'status': 'insufficient_data',
            'note': 'Only one pseudo-label class present. Need human-labeled CV-JD pairs to train ML model.',
        }
        with open(META_PATH, 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
        print('Saved meta (no model):', META_PATH)
        return

    models = {
        'logistic_regression': LogisticRegression(max_iter=1000, class_weight='balanced'),
        'random_forest': RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42),
    }

    results = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro', zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        results[name] = {
            'accuracy': round(acc, 4),
            'precision_macro': round(prec, 4),
            'recall_macro': round(rec, 4),
            'f1_macro': round(f1, 4),
            'confusion_matrix': cm,
        }
        print(f'{name}: acc={acc:.4f} f1={f1:.4f}')

    best_name = max(results, key=lambda n: results[n]['f1_macro'])
    best_model = models[best_name]
    print(f'Best model: {best_name}')

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)

    meta = {
        'model_version': 'ml-v1',
        'best_model': best_name,
        'training_date': __import__('datetime').datetime.now().isoformat(),
        'n_samples': len(rows),
        'features': ['skill_overlap_ratio','required_skill_coverage','preferred_skill_coverage','text_overlap','experience_relevance','education_relevance','project_relevance','tfidf_text'],
        'labels': {0: 'Không phù hợp', 1: 'Phù hợp một phần', 2: 'Phù hợp', 3: 'Rất phù hợp'},
        'results': results,
        'note': 'Pseudo-labels derived from rule-based heuristic (skill 60% + keyword 40%). Not human-labeled.',
    }
    with open(META_PATH, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print('Saved:', MODEL_PATH, VECTORIZER_PATH, META_PATH)

if __name__ == '__main__':
    main()
