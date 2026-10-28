import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSkill,
  computeSkillScore,
  computeKeywordScore,
  computeMatch,
  classifyBand,
} from '../src/lib/matching';

test('normalizeSkill maps aliases', () => {
  assert.equal(normalizeSkill('JS'), 'javascript');
  assert.equal(normalizeSkill('PostgreSQL'), normalizeSkill('Postgres'));
  assert.notEqual(normalizeSkill('React'), normalizeSkill('React Native'));
});

test('skillScore returns overlap ratio and null on empty tags', () => {
  assert.equal(computeSkillScore(['javascript', 'react'], ['javascript', 'react', 'nodejs']), 67);
  assert.equal(computeSkillScore([], ['javascript']), 0);
  assert.equal(computeSkillScore(['javascript'], []), null);
});

test('keywordScore bounded 0-100 and null on empty input', () => {
  const s = computeKeywordScore('I know JavaScript and React', 'We need JavaScript React developer');
  assert.ok(s !== null && s >= 0 && s <= 100);
  assert.equal(computeKeywordScore('', 'anything'), null);
  assert.equal(computeKeywordScore('   ', 'anything'), null);
});

test('matchScore combines 60/40, single component normalized, null when both missing', () => {
  assert.equal(computeMatch(80, 70), 76);
  assert.equal(computeMatch(null, 70), 70);
  assert.equal(computeMatch(80, null), 80);
  assert.equal(computeMatch(null, null), null);
});

test('classifyBand thresholds', () => {
  assert.equal(classifyBand(90), 'Rất khớp');
  assert.equal(classifyBand(80), 'Khớp tốt');
  assert.equal(classifyBand(70), 'Khớp tiềm năng');
  assert.equal(classifyBand(69), 'Cần bổ sung');
  assert.equal(classifyBand(null), null);
});
