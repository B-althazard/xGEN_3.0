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
  const positivePrompt = formatPositivePrompt(blocks, rules, settings);
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
  const ordinals = ['first', 'second', 'third'];
  const summarizeDummy = (result) => {
    const descriptive = result.blocks.filter((block) =>
      ['identity', 'body', 'face', 'hair', 'makeup', 'clothing', 'pose'].includes(block.id)
    );
    return descriptive.map((block) => block.text).filter(Boolean).join(', ');
  };

  const parts = state.dummies.map((dummy, index) => {
    const result = buildSinglePrompt(dummy.fields, schema, rules, state);
    const compact = summarizeDummy(result);
    return `The ${ordinals[index] || `${index + 1}th`} woman is ${compact}`;
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
