const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  reactjs: 'react',
  react: 'react',
  node: 'nodejs',
  nodejs: 'nodejs',
};

export function normalizeSkill(s: string): string {
  const base = (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, '');
  return ALIASES[base] ?? base;
}

export function computeSkillScore(candidateSkills: string[], jobTags: string[]): number | null {
  if (!jobTags || jobTags.length === 0) return null;
  const jSet = new Set(jobTags.map(normalizeSkill).filter(Boolean));
  if (jSet.size === 0) return null;
  const cSet = new Set((candidateSkills || []).map(normalizeSkill).filter(Boolean));
  let matched = 0;
  for (const t of jSet) if (cSet.has(t)) matched++;
  const score = Math.round((matched / jSet.size) * 100);
  return Math.max(0, Math.min(100, score));
}

const STOPWORDS = new Set([
  'and', 'the', 'a', 'an', 'we', 'i', 'to', 'of', 'for', 'with',
  'is', 'are', 'you', 'our', 'in', 'on', 'at', 'be', 'as', 'by', 'or',
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));
}

export function computeKeywordScore(cvText: string, jdText: string): number | null {
  if (!cvText || !cvText.trim() || !jdText || !jdText.trim()) return null;
  const jdTokens = [...new Set(tokenize(jdText))];
  if (jdTokens.length === 0) return null;
  const cvSet = new Set(tokenize(cvText));
  let matched = 0;
  for (const t of jdTokens) if (cvSet.has(t)) matched++;
  const score = Math.round((matched / jdTokens.length) * 100);
  return Math.max(0, Math.min(100, score));
}

export function computeMatch(skillScore: number | null, keywordScore: number | null): number | null {
  const skillValid = typeof skillScore === 'number' && !Number.isNaN(skillScore);
  const kwValid = typeof keywordScore === 'number' && !Number.isNaN(keywordScore);
  if (!skillValid && !kwValid) return null;
  if (skillValid && kwValid) return Math.round((skillScore as number) * 0.6 + (keywordScore as number) * 0.4);
  return Math.round((skillValid ? (skillScore as number) : (keywordScore as number)));
}

export function classifyBand(match: number | null): string | null {
  if (match == null) return null;
  if (match >= 90) return 'Rất khớp';
  if (match >= 80) return 'Khớp tốt';
  if (match >= 70) return 'Khớp tiềm năng';
  return 'Cần bổ sung';
}
