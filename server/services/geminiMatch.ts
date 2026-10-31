import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const PROMPT_VERSION = 'v1';
const RUBRIC_VERSION = 'v1';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '..', 'data', 'gemini_match_cache.json');

const RUBRIC = [
  { name: 'Kỹ năng chuyên môn', weight: 40 },
  { name: 'Kinh nghiệm liên quan', weight: 25 },
  { name: 'Mức độ liên quan của dự án', weight: 20 },
  { name: 'Học vấn và chứng chỉ', weight: 10 },
  { name: 'Kỹ năng bổ trợ', weight: 5 },
];

interface CriterionScore {
  name: string;
  weight: number;
  score: number;
  evidenceCV: string[];
  evidenceJD: string[];
}

interface GeminiMatchResult {
  match: number;
  band: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  explanation: string;
  criteria: CriterionScore[];
  confidence: number;
  matchingMethod: 'gemini_semantic';
  rubricVersion: string;
  promptVersion: string;
}

interface RuleBasedResult {
  match: number;
  band: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  explanation: string;
  criteria: CriterionScore[];
  confidence: number;
  matchingMethod: 'rule_based_fallback';
  rubricVersion: string;
  promptVersion: string;
}

type MatchResult = GeminiMatchResult | RuleBasedResult;

function loadCache(): Record<string, MatchResult> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function saveCache(cache: Record<string, MatchResult>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch { /* ignore */ }
}

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text || '').digest('hex').slice(0, 16);
}

function buildCacheKey(cvText: string, jobTitle: string, jobDescription: string, jobRequirements: string): string {
  return `${hashContent(cvText)}|${hashContent(jobTitle)}|${hashContent(jobDescription)}|${hashContent(jobRequirements)}|${GEMINI_MODEL}|${PROMPT_VERSION}|${RUBRIC_VERSION}`;
}

function classifyBand(score: number): string {
  if (score >= 90) return 'Rất khớp';
  if (score >= 80) return 'Khớp tốt';
  if (score >= 70) return 'Khớp tiềm năng';
  return 'Cần bổ sung';
}

function stripPII(text: string): string {
  return (text || '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/(0\d{9,10}|\+84\d{9})/g, '[PHONE]')
    .replace(/\d{3}\s?\d{3}\s?\d{4}/g, '[PHONE]');
}

function ruleBasedFallback(
  skillScore: number | null,
  keywordScore: number | null,
  skills: string[],
  jobTags: string[],
  cvText: string,
  jdText: string,
): RuleBasedResult {
  const s = skillScore ?? 0;
  const k = keywordScore ?? 0;
  const match = Math.round(s * 0.6 + k * 0.4);
  const band = classifyBand(match);

  const cSet = new Set(skills.map(s2 => s2.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '')));
  const seen = new Set<string>();
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  for (const tag of jobTags) {
    const n = tag.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '');
    if (!n || seen.has(n)) continue;
    seen.add(n);
    if (cSet.has(n)) matchedSkills.push(tag);
    else missingSkills.push(tag);
  }

  return {
    match,
    band,
    matchedSkills,
    missingSkills,
    strengths: [],
    weaknesses: [],
    recommendations: [],
    explanation: 'Fallback rule-based (skill 60% + keyword 40%).',
    criteria: [
      { name: 'Kỹ năng chuyên môn', weight: 40, score: s, evidenceCV: [], evidenceJD: [] },
      { name: 'Kinh nghiệm liên quan', weight: 25, score: 0, evidenceCV: [], evidenceJD: [] },
      { name: 'Mức độ liên quan của dự án', weight: 20, score: 0, evidenceCV: [], evidenceJD: [] },
      { name: 'Học vấn và chứng chỉ', weight: 10, score: 0, evidenceCV: [], evidenceJD: [] },
      { name: 'Kỹ năng bổ trợ', weight: 5, score: 0, evidenceCV: [], evidenceJD: [] },
    ],
    confidence: 0.5,
    matchingMethod: 'rule_based_fallback',
    rubricVersion: RUBRIC_VERSION,
    promptVersion: PROMPT_VERSION,
  };
}

export async function geminiMatch(
  cvText: string,
  jobTitle: string,
  jobDescription: string,
  jobRequirements: string,
  fallbackScore: number | null,
  fallbackSkills: string[],
  fallbackJobTags: string[],
): Promise<MatchResult> {
  const cacheKey = buildCacheKey(cvText, jobTitle, jobDescription, jobRequirements);
  const cache = loadCache();
  if (cache[cacheKey]) return cache[cacheKey];

  const cleanCv = stripPII(cvText);
  const jdText = [jobTitle, jobDescription, jobRequirements].filter(Boolean).join(' ');

  if (!GEMINI_API_KEY) {
    const result = ruleBasedFallback(
      fallbackScore ?? 0,
      null,
      fallbackSkills,
      fallbackJobTags,
      cleanCv,
      jdText,
    );
    cache[cacheKey] = result;
    saveCache(cache);
    return result;
  }

  const rubricText = RUBRIC.map(r => `- ${r.name}: ${r.weight}%`).join('\n');

  const prompt = `
Bạn là chuyên gia tuyển dụng IT Việt Nam. Đánh giá mức độ phù hợp giữa CV và JD theo rubric cố định sau:

${rubricText}

CV (đã lọc thông tin cá nhân):
${cleanCv}

JD:
Tiêu đề: ${jobTitle}
Mô tả: ${jobDescription}
Yêu cầu: ${jobRequirements}

YÊU CẦU:
1. Điểm cho từng tiêu chí (0-100) dựa trên bằng chứng thực tế trong CV và JD.
2. Không suy diễn kỹ năng không có trong CV.
3. Không tạo kinh nghiệm, chứng chỉ giả.
4. Trả về JSON duy nhất, không kèm text khác.
5. Nếu thiếu dữ liệu, match = 0, band = "Cần bổ sung".

Cấu trúc JSON:
{
  "match": <số 0-100>,
  "band": "<Rất khớp | Khớp tốt | Khớp tiềm năng | Cần bổ sung>,
  "matchedSkills": ["kỹ năng phù hợp có bằng chứng"],
  "missingSkills": ["kỹ năng yêu cầu trong JD nhưng không có trong CV"],
  "strengths": ["điểm mạnh"],
  "weaknesses": ["điểm yếu"],
  "recommendations": ["đề xuất cải thiện CV"],
  "explanation": "giải thích ngắn gọn bằng tiếng Việt",
  "criteria": [
    {"name": "Kỹ năng chuyên môn", "score": <0-100>, "evidenceCV": ["trích dẫn CV"], "evidenceJD": ["trích dẫn JD"]},
    {"name": "Kinh nghiệm liên quan", "score": <0-100>, "evidenceCV": ["..."], "evidenceJD": ["..."]},
    {"name": "Mức độ liên quan của dự án", "score": <0-100>, "evidenceCV": ["..."], "evidenceJD": ["..."]},
    {"name": "Học vấn và chứng chỉ", "score": <0-100>, "evidenceCV": ["..."], "evidenceJD": ["..."]},
    {"name": "Kỹ năng bổ trợ", "score": <0-100>, "evidenceCV": ["..."], "evidenceJD": ["..."]}
  ],
  "confidence": <0-1 mức độ chắc chắn>
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error('Không tìm thấy JSON');

    const parsed: any = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    const match = Math.max(0, Math.min(100, Number(parsed.match) || 0));
    const band = classifyBand(match);

    const result: GeminiMatchResult = {
      match,
      band,
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      explanation: parsed.explanation || '',
      criteria: Array.isArray(parsed.criteria) ? parsed.criteria.map((c: any) => ({
        name: c.name || '',
        weight: c.weight || 0,
        score: Math.max(0, Math.min(100, Number(c.score) || 0)),
        evidenceCV: Array.isArray(c.evidenceCV) ? c.evidenceCV : [],
        evidenceJD: Array.isArray(c.evidenceJD) ? c.evidenceJD : [],
      })) : RUBRIC.map(r => ({ name: r.name, weight: r.weight, score: 0, evidenceCV: [], evidenceJD: [] })),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      matchingMethod: 'gemini_semantic',
      rubricVersion: RUBRIC_VERSION,
      promptVersion: PROMPT_VERSION,
    };

    cache[cacheKey] = result;
    saveCache(cache);
    return result;
  } catch {
    const result = ruleBasedFallback(
      fallbackScore ?? 0,
      null,
      fallbackSkills,
      fallbackJobTags,
      cleanCv,
      jdText,
    );
    cache[cacheKey] = result;
    saveCache(cache);
    return result;
  }
}

export { ruleBasedFallback, RUBRIC, PROMPT_VERSION, RUBRIC_VERSION };
