import { loadJson, loadLocalState, saveLocalState, initDB, getAllImages, pruneImages, getPresets, savePreset, deletePresetById, clearPersistedData } from './storageManager.js';
import { buildPrompt } from './promptEngine/index.js';

export const STORAGE_KEYS = {
  DUMMIES: 'xgen.dummies',
  SETTINGS: 'xgen.settings',
  ACTIVE_STATE: 'xgen.activeState',
  XGEN_HISTORY: 'xgen.xgenHistory',
  ONBOARDING: 'xgen.onboarded',
  AGE_CONFIRMED: 'xgen.ageConfirmed',
  BATCH: 'xgen.batch',
};

const listeners = new Set();

const defaultDummy = () => ({
  id: crypto.randomUUID(),
  name: 'Dummy 1',
  fields: {},
  lockedFields: [],
  referencePhotoId: null,
});

const state = {
  schema: null,
  rules: null,
  defaultDummies: [],
  activeDummyIndex: 0,
  characterType: 'female',
  dummies: [defaultDummy()],
  multiDummyInteraction: {
    interaction_type: null,
    focus: null,
    relationship_dynamic: null,
    proximity: null,
    number_of_people: null,
  },
  emphasis: {},
  settings: {
    theme: 'dark',
    addonEnabled: false,
    realismMode: 'auto',
    negativeMode: 'none',
    defaultAspectRatio: '2:3',
    selectedModel: 'chroma1-hd',
    addonStatus: { valid: 0, errors: [] },
    promptOrder: 'subject-first',
    aesthetic: null,
  },
  xgen: {
    currentJobStatus: 'idle',
    currentJobNonce: null,
    generatedImages: [],
    activeImageIndex: -1,
    errorMessage: null,
    generationStartTime: null,
  },
  app: {
    currentPage: 'home',
    currentCategory: 'identity',
    isOnline: navigator.onLine,
    bridgeDetected: false,
    onboardingComplete: false,
    ageConfirmed: false,
  },
  savedPresets: [],
  promptResult: null,
  batch: {
    promptList: [],
    repeatCount: 1,
    delay: 3,
    running: false,
    history: [],
  },
  _undoStack: [],
  _redoStack: [],
};

let saveTimer = null;

function snapshotUndo() {
  state._undoStack.push(JSON.stringify({
    dummies: state.dummies,
    activeDummyIndex: state.activeDummyIndex,
    characterType: state.characterType,
    emphasis: state.emphasis,
    multiDummyInteraction: state.multiDummyInteraction,
  }));
  if (state._undoStack.length > 20) state._undoStack.shift();
  state._redoStack = [];
}

function normalizeSettings(settings = {}) {
  return {
    ...state.settings,
    ...settings,
    theme: settings.theme === 'light' ? 'light' : 'dark',
    addonEnabled: settings.addonEnabled === true || settings.addonEnabled === 'true',
    realismMode: ['auto', 'studio', 'social', 'editorial'].includes(settings.realismMode) ? settings.realismMode : (settings.realismMode ?? state.settings.realismMode),
    negativeMode: 'none',
    defaultAspectRatio: ['2:3', '1:1', '3:2'].includes(settings.defaultAspectRatio) ? settings.defaultAspectRatio : (settings.defaultAspectRatio ?? state.settings.defaultAspectRatio),
    selectedModel: settings.selectedModel || state.settings.selectedModel,
    promptOrder: ['subject-first', 'style-first'].includes(settings.promptOrder) ? settings.promptOrder : (settings.promptOrder ?? state.settings.promptOrder),
    aesthetic: typeof settings.aesthetic === 'number' && settings.aesthetic >= 0 && settings.aesthetic <= 11
      ? settings.aesthetic
      : settings.aesthetic == null
        ? null
        : state.settings.aesthetic,
  };
}

function normalizeBatch(batch = {}) {
  return {
    ...state.batch,
    ...batch,
    repeatCount: Math.max(1, Number.parseInt(batch.repeatCount ?? state.batch.repeatCount, 10) || 1),
    delay: Math.max(1, Number.parseInt(batch.delay ?? state.batch.delay, 10) || 1),
    running: false,
    promptList: Array.isArray(batch.promptList) ? batch.promptList : state.batch.promptList,
    history: Array.isArray(batch.history) ? batch.history : state.batch.history,
  };
}

function normalizeSettingValue(key, value) {
  if (key === 'addonEnabled') return value === true || value === 'true';
  if (key === 'negativeMode') return 'none';
  if (key === 'aesthetic') {
    if (value == null) return null;
    const next = Number.parseInt(value, 10);
    return Number.isFinite(next) ? Math.max(0, Math.min(11, next)) : state.settings.aesthetic;
  }
  return normalizeSettings({ [key]: value })[key];
}

export function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveLocalState(STORAGE_KEYS.ACTIVE_STATE, {
      dummies: state.dummies,
      multiDummyInteraction: state.multiDummyInteraction,
      settings: state.settings,
      activeDummyIndex: state.activeDummyIndex,
      characterType: state.characterType,
      emphasis: state.emphasis,
    });
  }, 500);
}

export function recomputePrompt() {
  if (!state.schema || !state.rules) return;
  state.promptResult = buildPrompt({
    dummies: state.dummies,
    activeDummyIndex: state.activeDummyIndex,
    multiDummyInteraction: state.multiDummyInteraction,
    emphasis: state.emphasis,
    settings: state.settings,
    characterType: state.characterType,
    schema: state.schema,
    rules: state.rules,
  });
}

function notify() {
  recomputePrompt();
  persist();
  for (const listener of listeners) listener(getState());
}

export async function initializeStore() {
  await initDB();
  const SCHEMA_FILES = [
    'xgen_schema-identity.json', 'xgen_schema-physique.json', 'xgen_schema-bust.json',
    'xgen_schema-lower_body.json', 'xgen_schema-face.json', 'xgen_schema-hair.json',
    'xgen_schema-makeup.json', 'xgen_schema-clothing.json', 'xgen_schema-location.json',
    'xgen_schema-lighting.json', 'xgen_schema-camera.json', 'xgen_schema-posing.json',
    'xgen_schema-actions.json', 'xgen_schema-quality.json', 'xgen_schema-multi_dummy.json',
    'xgen_schema-xXx.json',
  ];
  const [schemas, rules, dummyData, images, presets, savedState] = await Promise.all([
    Promise.all(SCHEMA_FILES.map((f) => loadJson(`./data/${f}`))),
    loadJson('./data/prompt_rules.json'),
    loadJson('./data/xgen_dummies.json'),
    getAllImages(),
    getPresets(),
    Promise.resolve(loadLocalState(STORAGE_KEYS.ACTIVE_STATE)),
  ]);

  state.schema = {
    version: schemas[0]?.version || '2.0.0',
    categories: schemas.flatMap((s) => s.categories || []),
  };
  state.rules = rules;
  state.defaultDummies = dummyData.dummies || [];
  state.xgen.generatedImages = images;
  state.xgen.activeImageIndex = images.length ? 0 : -1;
  state.savedPresets = presets;
  state.app.ageConfirmed = localStorage.getItem(STORAGE_KEYS.AGE_CONFIRMED) === 'true';
  state.app.onboardingComplete = localStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';

  // Load batch state
  const savedBatch = loadLocalState(STORAGE_KEYS.BATCH);
  if (savedBatch) {
    state.batch = normalizeBatch(savedBatch);
  }

  if (savedState) {
    state.dummies = savedState.dummies?.length ? savedState.dummies : [defaultDummy()];
    state.multiDummyInteraction = { ...state.multiDummyInteraction, ...savedState.multiDummyInteraction };
    state.settings = normalizeSettings(savedState.settings);
    state.activeDummyIndex = savedState.activeDummyIndex || 0;
    state.characterType = savedState.characterType || 'female';
    state.emphasis = savedState.emphasis || {};
  }

  document.documentElement.dataset.theme = state.settings.theme;
  recomputePrompt();
  return getState();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return structuredClone(state);
}

export function setPage(page) {
  state.app.currentPage = page;
  notify();
}

export function setCurrentCategory(categoryId) {
  state.app.currentCategory = categoryId;
  notify();
}

export function updateTheme(theme) {
  state.settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  notify();
}

export function updateSetting(key, value) {
  state.settings[key] = normalizeSettingValue(key, value);
  notify();
}

export function setSettingSilent(key, value) {
  state.settings[key] = normalizeSettingValue(key, value);
  recomputePrompt();
  persist();
}

export function updateField(fieldId, value, dummyIndex = state.activeDummyIndex) {
  snapshotUndo();
  const dummy = state.dummies[dummyIndex];
  dummy.fields[fieldId] = value;
  const clears = enforceFieldRules(dummy.fields, fieldId);
  notify();
  return clears;
}

export function updateMultiDummyField(fieldId, value) {
  snapshotUndo();
  state.multiDummyInteraction[fieldId] = value;
  notify();
}

export function updateFieldSilent(fieldId, value, dummyIndex = state.activeDummyIndex) {
  snapshotUndo();
  const dummy = state.dummies[dummyIndex];
  dummy.fields[fieldId] = value;
  const clears = enforceFieldRules(dummy.fields, fieldId);
  recomputePrompt();
  persist();
  return clears;
}

export function updateMultiDummyFieldSilent(fieldId, value) {
  snapshotUndo();
  state.multiDummyInteraction[fieldId] = value;
  recomputePrompt();
  persist();
}

function enforceFieldRules(fields, fieldId) {
  const clears = [];

  // Foundation → clear all makeup
  if (fieldId === 'foundation' && fields.foundation === 'none') {
    const removed = [];
    if (fields.eye_makeup?.length) removed.push('eye makeup');
    if (fields.eyeshadow_color?.length) removed.push('eyeshadow');
    if (fields.lashes) removed.push('lashes');
    if (fields.lip_makeup) removed.push('lip makeup');
    if (fields.lip_color) removed.push('lip color');
    if (fields.blush_effects?.length) removed.push('blush effects');
    if (removed.length) clears.push({ fieldId: 'makeup', reason: `Foundation set to None — cleared ${removed.join(', ')}` });
    fields.eye_makeup = [];
    fields.eyeshadow_color = [];
    fields.lashes = null;
    fields.lip_makeup = null;
    fields.lip_color = null;
    fields.blush_effects = [];
  }

  // Lip makeup → clear lip color
  if (fieldId === 'lip_makeup' && fields.lip_makeup === 'none') {
    if (fields.lip_color) clears.push({ fieldId: 'lip_color', reason: 'Lip makeup set to None — cleared lip color' });
    fields.lip_color = null;
  }

  // Complete outfit → clear individual clothing
  if (fieldId === 'complete_outfit') {
    if (fields.complete_outfit) {
      const removed = [];
      if (fields.upper_type) removed.push('upper');
      if (fields.lower_type) removed.push('lower');
      if (fields.legwear?.length) removed.push('legwear');
      if (fields.footwear) removed.push('footwear');
      if (removed.length) clears.push({ fieldId: 'clothing', reason: `Complete outfit set — cleared ${removed.join(', ')}` });
      fields.upper_type = null;
      fields.upper_style = [];
      fields.upper_color = null;
      fields.lower_type = null;
      fields.lower_style = [];
      fields.lower_color = null;
      fields.legwear = [];
      fields.footwear = null;
      if (fields.complete_outfit === 'nude') {
        if (fields.accessories?.length) clears.push({ fieldId: 'accessories', reason: 'Nude outfit — cleared accessories' });
        fields.accessories = [];
      }
    }
  }

  // Individual clothing → clear complete outfit
  if (['upper_type', 'upper_style', 'upper_color', 'lower_type', 'lower_style', 'lower_color', 'legwear', 'footwear'].includes(fieldId)) {
    if (fields[fieldId]) fields.complete_outfit = null;
  }

  // Option-level conflicts
  const optionConflicts = state.rules?.optionConflicts || [];
  for (const conflict of optionConflicts) {
    const { fieldId: condField, anyOf } = conflict.condition;
    const fieldVal = fields[condField];

    if (!fieldVal) continue;

    const matches = Array.isArray(fieldVal)
      ? fieldVal.some((v) => anyOf.includes(v))
      : anyOf.includes(fieldVal);

    if (!matches) continue;

    for (const [targetField, targetOptions] of Object.entries(conflict.clear)) {
      const current = fields[targetField];
      if (!current) continue;

      if (Array.isArray(current)) {
        const removed = current.filter((v) => targetOptions.includes(v));
        if (removed.length) {
          clears.push({ fieldId: targetField, reason: `${conflict.reason}: cleared ${removed.join(', ')}` });
          fields[targetField] = current.filter((v) => !targetOptions.includes(v));
        }
      } else if (targetOptions.includes(current)) {
        clears.push({ fieldId: targetField, reason: `${conflict.reason}: cleared ${current}` });
        fields[targetField] = null;
      }
    }
  }

  return clears;
}

export function getConflictingOptions(fields) {
  const disabled = {};
  const optionConflicts = state.rules?.optionConflicts || [];

  for (const conflict of optionConflicts) {
    const { fieldId: condField, anyOf } = conflict.condition;
    const fieldVal = fields[condField];
    if (!fieldVal) continue;

    const matches = Array.isArray(fieldVal)
      ? fieldVal.some((v) => anyOf.includes(v))
      : anyOf.includes(fieldVal);

    if (!matches) continue;

    for (const [targetField, targetOptions] of Object.entries(conflict.clear)) {
      if (!disabled[targetField]) disabled[targetField] = new Set();
      targetOptions.forEach((opt) => disabled[targetField].add(opt));
    }
  }

  // Convert Sets to arrays for easier use
  const result = {};
  for (const [fieldId, optSet] of Object.entries(disabled)) {
    result[fieldId] = [...optSet];
  }
  return result;
}

export function setActiveDummy(index) {
  state.activeDummyIndex = index;
  notify();
}

export function addDummy() {
  if (state.dummies.length >= 3) return;
  snapshotUndo();
  state.dummies.push({ ...defaultDummy(), name: `Dummy ${state.dummies.length + 1}` });
  state.activeDummyIndex = state.dummies.length - 1;
  notify();
}

export function removeDummy(index) {
  if (state.dummies.length <= 1) return;
  snapshotUndo();
  state.dummies.splice(index, 1);
  state.activeDummyIndex = Math.max(0, Math.min(state.activeDummyIndex, state.dummies.length - 1));
  notify();
}

export function duplicateDummy(index = state.activeDummyIndex) {
  if (state.dummies.length >= 3) return;
  snapshotUndo();
  const source = state.dummies[index];
  const clone = {
    id: crypto.randomUUID(),
    name: `${source.name} Copy`.slice(0, 32),
    fields: structuredClone(source.fields),
    lockedFields: structuredClone(source.lockedFields),
    referencePhotoId: source.referencePhotoId,
  };
  state.dummies.splice(index + 1, 0, clone);
  state.activeDummyIndex = index + 1;
  notify();
}

export function replaceWithFreshDummy() {
  snapshotUndo();
  state.dummies = [{ ...defaultDummy(), name: 'Dummy 1' }];
  state.activeDummyIndex = 0;
  state.multiDummyInteraction = {
    interaction_type: null,
    focus: null,
    relationship_dynamic: null,
    proximity: null,
    number_of_people: null,
  };
  notify();
}

export function setActiveImageIndex(index) {
  state.xgen.activeImageIndex = index;
  notify();
}

export async function savePresetPayload(payload) {
  await savePreset({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...payload,
  });
  await refreshPresets();
}

export function renameDummy(index, name) {
  state.dummies[index].name = name.slice(0, 32) || `Dummy ${index + 1}`;
  notify();
}

export function toggleLockField(fieldId) {
  snapshotUndo();
  const dummy = state.dummies[state.activeDummyIndex];
  const index = dummy.lockedFields.indexOf(fieldId);
  if (index >= 0) dummy.lockedFields.splice(index, 1);
  else dummy.lockedFields.push(fieldId);
  notify();
}

export function setCharacterType(type) {
  state.characterType = type;
  if (type === 'futa') {
    if (!state.dummies[state.activeDummyIndex].fields.futa_enabled) {
      state.dummies[state.activeDummyIndex].fields.futa_enabled = 'on';
    }
  } else {
    state.dummies[state.activeDummyIndex].fields.futa_enabled = 'off';
  }
  notify();
}

export function setEmphasis(promptValue, level) {
  if (!level) delete state.emphasis[promptValue];
  else state.emphasis[promptValue] = level;
  notify();
}

export function resetActiveDummy() {
  snapshotUndo();
  state.dummies[state.activeDummyIndex].fields = {};
  notify();
}

export function resetActiveDummySilent() {
  snapshotUndo();
  state.dummies[state.activeDummyIndex].fields = {};
  recomputePrompt();
  persist();
}

export function loadDummyFields(payload) {
  snapshotUndo();
  state.dummies[state.activeDummyIndex] = {
    id: crypto.randomUUID(),
    name: payload.name || state.dummies[state.activeDummyIndex].name,
    fields: structuredClone(payload.fields || {}),
    lockedFields: structuredClone(payload.lockedFields || []),
    referencePhotoId: payload.referencePhotoId || null,
  };
  state.emphasis = structuredClone(payload.emphasis || {});
  notify();
}

export async function refreshPresets() {
  state.savedPresets = await getPresets();
  notify();
}

export async function saveCurrentPreset({ type, name }) {
  const active = state.dummies[state.activeDummyIndex];
  await savePreset({
    id: crypto.randomUUID(),
    type,
    name,
    characterType: state.characterType,
    fields: structuredClone(active.fields),
    lockedFields: structuredClone(active.lockedFields),
    referencePhotoId: active.referencePhotoId,
    emphasis: structuredClone(state.emphasis),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await refreshPresets();
}

export async function deletePreset(id) {
  await deletePresetById(id);
  await refreshPresets();
}

export async function addGeneratedImage(image) {
  state.xgen.generatedImages.unshift(image);
  state.xgen.generatedImages = await pruneImages(state.xgen.generatedImages);
  state.xgen.activeImageIndex = 0;
  notify();
}

export function setBridgeDetected(value) {
  state.app.bridgeDetected = value;
  notify();
}

export function setJobState(partial) {
  state.xgen = { ...state.xgen, ...partial };
  notify();
}

export function setOnlineStatus(value) {
  state.app.isOnline = value;
  notify();
}

export function undo() {
  const prev = state._undoStack.pop();
  if (!prev) return;
  state._redoStack.push(JSON.stringify({
    dummies: state.dummies,
    activeDummyIndex: state.activeDummyIndex,
    characterType: state.characterType,
    emphasis: state.emphasis,
    multiDummyInteraction: state.multiDummyInteraction,
  }));
  Object.assign(state, JSON.parse(prev));
  notify();
}

export function redo() {
  const next = state._redoStack.pop();
  if (!next) return;
  state._undoStack.push(JSON.stringify({
    dummies: state.dummies,
    activeDummyIndex: state.activeDummyIndex,
    characterType: state.characterType,
    emphasis: state.emphasis,
    multiDummyInteraction: state.multiDummyInteraction,
  }));
  Object.assign(state, JSON.parse(next));
  notify();
}

export function markAgeConfirmed() {
  state.app.ageConfirmed = true;
  localStorage.setItem(STORAGE_KEYS.AGE_CONFIRMED, 'true');
  notify();
}

export function markOnboardingComplete() {
  state.app.onboardingComplete = true;
  localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
  notify();
}

// ─── xBatcher ──────────────────────────────────────────────────────────────

export function persistBatch() {
  saveLocalState(STORAGE_KEYS.BATCH, {
    promptList: state.batch.promptList,
    repeatCount: state.batch.repeatCount,
    delay: state.batch.delay,
    history: state.batch.history.slice(0, 200),
  });
}

export function updateBatchSetting(key, value) {
  if (key === 'repeatCount' || key === 'delay') {
    state.batch[key] = Math.max(1, Number.parseInt(value, 10) || 1);
  } else {
    state.batch[key] = value;
  }
  persistBatch();
  notify();
}

export function addPromptToList(text) {
  state.batch.promptList.push({ id: crypto.randomUUID(), text, status: 'pending', timestamp: null, filename: null });
  persistBatch();
  notify();
}

export function removePromptFromList(id) {
  state.batch.promptList = state.batch.promptList.filter(p => p.id !== id);
  persistBatch();
  notify();
}

export function clearPromptList() {
  state.batch.promptList = [];
  persistBatch();
  notify();
}

export function addBatchHistoryEntry(entry) {
  state.batch.history.unshift(entry);
  if (state.batch.history.length > 200) state.batch.history.length = 200;
  persistBatch();
  notify();
}

export function clearBatchHistory() {
  state.batch.history = [];
  persistBatch();
  notify();
}

export function setBatchRunning(running) {
  state.batch.running = running;
  notify();
}

export async function resetLocalData() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_STATE);
  localStorage.removeItem(STORAGE_KEYS.BATCH);
  localStorage.removeItem(STORAGE_KEYS.AGE_CONFIRMED);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING);
  await clearPersistedData();
}
