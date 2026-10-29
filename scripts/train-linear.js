import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATASET = path.join(ROOT, 'docs', 'superpowers', 'datasets', 'golden-cv-jd.json');
const MODEL_DIR = path.join(ROOT, 'server', 'models');
const MODEL_FILE = path.join(MODEL_DIR, 'linear-match.json');

const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf-8'));
const pairs = dataset.pairs || [];

const labeled = pairs.filter((p) => typeof p.labelScore === 'number' && !Number.isNaN(p.labelScore));

if (labeled.length === 0) {
  console.log(`Không có cặp có nhãn (${labeled.length}/${pairs.length}). Bỏ qua huấn luyện ML.`);
  console.log('Trạng thái: insufficient_training_data — tiếp tục dùng baseline.');
  process.exit(0);
}

if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

// Minimal linear regression: y = w0 + w1*skillScore + w2*keywordScore
// feature schema: [skillScore, keywordScore], label normalized to 0-1
function mean(xs) { return xs.reduce((a, b) => a + b, 0) / xs.length; }

const X = labeled.map((p) => [p.skillScore ?? 0, p.keywordScore ?? 0]);
const y = labeled.map((p) => p.labelScore / 100);

const x1Mean = mean(X.map((r) => r[0]));
const x2Mean = mean(X.map((r) => r[1]));
const yMean = mean(y);

let s11 = 0, s12 = 0, s22 = 0, s1y = 0, s2y = 0;
for (let i = 0; i < X.length; i++) {
  const dx1 = X[i][0] - x1Mean;
  const dx2 = X[i][1] - x2Mean;
  const dy = y[i] - yMean;
  s11 += dx1 * dx1;
  s12 += dx1 * dx2;
  s22 += dx2 * dx2;
  s1y += dx1 * dy;
  s2y += dx2 * dy;
}

const det = s11 * s22 - s12 * s12;
let w1, w2;
if (det === 0) {
  w1 = s1y / (s11 || 1);
  w2 = s2y / (s22 || 1);
} else {
  w1 = (s1y * s22 - s2y * s12) / det;
  w2 = (s2y * s11 - s1y * s12) / det;
}
const w0 = yMean - w1 * x1Mean - w2 * x2Mean;

function predict(skillScore, keywordScore) {
  let v = w0 + w1 * skillScore + w2 * keywordScore;
  return Math.max(0, Math.min(100, Math.round(v * 100)));
}

// In-sample MAE (tham chiếu, không phải đánh giá độc lập)
const mae = labeled.reduce((acc, p) => {
  const pred = predict(p.skillScore ?? 0, p.keywordScore ?? 0) / 100;
  return acc + Math.abs(pred - p.labelScore / 100);
}, 0) / labeled.length;

const model = {
  modelVersion: `linear-${new Date().toISOString().slice(0, 10)}`,
  trainedAt: new Date().toISOString(),
  featureSchemaVersion: 1,
  trainingSampleCount: labeled.length,
  evaluationMetrics: { inSampleMAE: Math.round(mae * 10000) / 10000 },
  baselineComparison: 'not_evaluated',
  approvalStatus: 'pending',
  weights: { w0, w1, w2 },
  predict,
};

fs.writeFileSync(MODEL_FILE, JSON.stringify(
  {
    modelVersion: model.modelVersion,
    trainedAt: model.trainedAt,
    featureSchemaVersion: model.featureSchemaVersion,
    trainingSampleCount: model.trainingSampleCount,
    evaluationMetrics: model.evaluationMetrics,
    baselineComparison: model.baselineComparison,
    approvalStatus: model.approvalStatus,
    weights: model.weights,
  },
  null,
  2
));

console.log(`Đã huấn luyện linear regression trên ${labeled.length} cặp có nhãn.`);
console.log(`Trọng số: w0=${w0.toFixed(4)}, w1=${w1.toFixed(4)}, w2=${w2.toFixed(4)}`);
console.log(`In-sample MAE: ${model.evaluationMetrics.inSampleMAE}`);
console.log(`Lưu mô hình: ${MODEL_FILE}`);
console.log('Chưa phê duyệt — cần so sánh với baseline trên tập test độc lập trước khi kích hoạt.');
