import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(await fs.readFile(path.join(__dirname, '../data/xgen-master_schema_v2.0.json'), 'utf8'));
const rules = JSON.parse(await fs.readFile(path.join(__dirname, '../data/prompt_rules.json'), 'utf8'));
const { buildPrompt } = await import('../js/promptEngine/index.js');

function makeState(fields, settings = {}) {
  return {
    schema,
    rules,
    emphasis: {},
    characterType: 'female',
    settings: {
      realismMode: 'auto',
      negativeMode: 'none',
      selectedModel: 'chroma1-hd',
      defaultAspectRatio: '2:3',
      ...settings,
    },
    activeDummyIndex: 0,
    multiDummyInteraction: {},
    dummies: [{ fields, lockedFields: [], name: 'Dummy 1' }],
  };
}

test('identity merges correctly', () => {
  const result = buildPrompt(makeState({ ethnicity: 'caucasian', age: '20s' }));
  assert.match(result.positivePrompt, /caucasian woman in her 20s/);
});

test('futa gating removes futa tokens when disabled', () => {
  const result = buildPrompt(makeState({ futa_enabled: 'off', futa_size: 'huge' }));
  assert.doesNotMatch(result.positivePrompt, /cock/);
});

test('no makeup clears other makeup tokens in prompt resolution', () => {
  const result = buildPrompt(makeState({ foundation: 'none', eye_makeup: ['smokey'], lip_color: 'red' }));
  assert.match(result.positivePrompt, /no makeup/);
  assert.doesNotMatch(result.positivePrompt, /smokey eyes/);
  assert.doesNotMatch(result.positivePrompt, /red lips/);
});

test('nude outfit removes footwear and accessories', () => {
  const result = buildPrompt(makeState({ complete_outfit: 'nude', footwear: 'heels', accessories: ['choker'] }));
  assert.match(result.positivePrompt, /nude/);
  assert.doesNotMatch(result.positivePrompt, /heels/);
  assert.doesNotMatch(result.positivePrompt, /choker/);
});

test('wet skin suppresses dewy skin', () => {
  const result = buildPrompt(makeState({ foundation: 'dewy', bust_state: ['wet'] }));
  assert.match(result.positivePrompt, /wet skin/);
  assert.doesNotMatch(result.positivePrompt, /dewy skin/);
});

test('huge breasts suppress large breasts', () => {
  const result = buildPrompt(makeState({ cup_size: 'huge' }));
  assert.match(result.positivePrompt, /huge breasts/);
  assert.doesNotMatch(result.positivePrompt, /large breasts/);
});

test('high emphasis rewrites token', () => {
  const state = makeState({ skin_detail: ['freckles'] });
  state.emphasis = { freckles: 'high' };
  const result = buildPrompt(state);
  assert.match(result.positivePrompt, /prominent freckles/);
});

test('social realism mode prepends social opener', () => {
  const result = buildPrompt(makeState({ location: 'bedroom', framing: 'pov' }));
  assert.match(result.positivePrompt, /candid amateur photograph/);
});

test('multi-dummy assembly creates named subject blocks', () => {
  const result = buildPrompt({
    schema,
    rules,
    emphasis: {},
    characterType: 'female',
    settings: { realismMode: 'auto', negativeMode: 'none', selectedModel: 'chroma1-hd', defaultAspectRatio: '2:3' },
    activeDummyIndex: 0,
    multiDummyInteraction: { interaction_type: 'embracing' },
    dummies: [
      { fields: { ethnicity: 'caucasian', age: '20s' }, lockedFields: [], name: 'Dummy 1' },
      { fields: { ethnicity: 'asian', age: '30s' }, lockedFields: [], name: 'Dummy 2' }
    ]
  });
  assert.match(result.positivePrompt, /Dummy 1 is/);
  assert.match(result.positivePrompt, /Dummy 2 is/);
});
