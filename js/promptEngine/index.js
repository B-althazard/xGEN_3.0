import { extractTokens } from './extract.js';
import { normalizeTokens } from './normalize.js';
import { resolveTokens } from './resolve.js';
import { buildBlocks } from './blocks.js';
import { formatPositivePrompt } from './format.js';
import { buildNegativePrompt } from './negative.js';
import { collectMetadata } from './diagnostics.js';

function resolveRealismMode(state) {
  if (state.settings.realismMode !== 'auto') return state.settings.realismMode;
  const fields = state.dummies[state.activeDummyIndex].fields || {};
  if (fields.location === 'bedroom' && ['pov', 'selfie', 'mirror_selfie'].includes(fields.framing)) return 'social';
  if (fields.location === 'studio' && fields.lens === '85mm' && ['studio', 'soft', 'soft_studio'].includes(fields.lighting_style)) return 'studio';
  if (['formal', 'business', 'vintage'].includes(fields.complete_outfit)) return 'editorial';
  return 'auto';
}

function buildSinglePrompt(fields, schema, rules, state) {
  const tokens = extractTokens(fields, schema, rules, state.emphasis);
  const normalized = normalizeTokens(tokens, rules);
  const resolved = resolveTokens(normalized, rules, fields);
  const settings = { ...state.settings, realismMode: resolveRealismMode(state) };
  const blocks = buildBlocks(resolved, rules, settings);
  const positivePrompt = formatPositivePrompt(blocks, rules);
  const negativePrompt = buildNegativePrompt(state.settings.negativeMode);
  const keptTokens = resolved.filter((token) => token.status !== 'dropped');
  const droppedTokens = resolved.filter((token) => token.status === 'dropped');
  return {
    positivePrompt,
    negativePrompt,
    blocks,
    keptTokens,
    droppedTokens,
    diagnostics: collectMetadata(positivePrompt, blocks, keptTokens, droppedTokens, settings),
  };
}

function buildMultiPrompt(state, schema, rules) {
  const summarizeDummy = (result) => {
    const identity = result.blocks.find((block) => block.id === 'identity')?.items || [];
    const body = (result.blocks.find((block) => block.id === 'body')?.items || []).slice(0, 2);
    const face = (result.blocks.find((block) => block.id === 'face')?.items || []).slice(0, 2);
    const hair = (result.blocks.find((block) => block.id === 'hair')?.items || []).slice(0, 1);
    const clothing = (result.blocks.find((block) => block.id === 'clothing')?.items || []).slice(0, 1);
    return [...identity, ...body, ...face, ...hair, ...clothing].map((item) => item.text).join(', ').split(/\s+/).slice(0, 40).join(' ');
  };

  const parts = state.dummies.map((dummy, index) => {
    const result = buildSinglePrompt(dummy.fields, schema, rules, state);
    const compact = summarizeDummy(result);
    return `Dummy ${index + 1} is ${compact}`;
  });
  const shared = buildSinglePrompt(state.dummies[0].fields, schema, rules, state);
  const interaction = [state.multiDummyInteraction.interaction_type, state.multiDummyInteraction.focus, state.multiDummyInteraction.relationship_dynamic, state.multiDummyInteraction.proximity].filter(Boolean).join(', ');
  const sharedTail = shared.blocks.filter((block) => ['scene', 'lighting', 'camera'].includes(block.id)).map((block) => block.text).join(', ');
  const positivePrompt = `photorealistic photography, RAW photo, ${state.dummies.length}girls. ${parts.join('. ')}. They are ${interaction || 'together'}. ${sharedTail}`;
  const negativePrompt = buildNegativePrompt(state.settings.negativeMode);
  const blocks = [{ id: 'style', text: positivePrompt }];
  const diagnostics = collectMetadata(positivePrompt, blocks, [], [], state.settings);
  return { positivePrompt, negativePrompt, blocks, keptTokens: [], droppedTokens: [], diagnostics };
}

export function buildPrompt(state) {
  if (state.dummies.length > 1) {
    return buildMultiPrompt(state, state.schema, state.rules);
  }
  return buildSinglePrompt(state.dummies[state.activeDummyIndex].fields || {}, state.schema, state.rules, state);
}
