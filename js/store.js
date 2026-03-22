import { loadJson, loadLocalState, saveLocalState, initDB, getAllImages, pruneImages, getPresets, savePreset, deletePresetById } from './storageManager.js';
import { buildPrompt } from './promptEngine/index.js';

export const STORAGE_KEYS = {
  DUMMIES: 'xgen.dummies',
  SETTINGS: 'xgen.settings',
  ACTIVE_STATE: 'xgen.activeState',
  XGEN_HISTORY: 'xgen.xgenHistory',
  ONBOARDING: 'xgen.onboarded',
  AGE_CONFIRMED: 'xgen.ageConfirmed',
  BRIDGE_SEEN: 'xgen.bridgeSeen',
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

function persist() {
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

function recomputePrompt() {
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
  const [schema, rules, dummyData, images, presets, savedState] = await Promise.all([
    loadJson('./data/xgen-master_schema_v2.0.json'),
    loadJson('./data/prompt_rules.json'),
    loadJson('./data/xgen_dummies.json'),
    getAllImages(),
    getPresets(),
    Promise.resolve(loadLocalState(STORAGE_KEYS.ACTIVE_STATE)),
  ]);

  state.schema = schema;
  state.rules = rules;
  state.defaultDummies = dummyData.dummies || [];
  state.xgen.generatedImages = images;
  state.xgen.activeImageIndex = images.length ? 0 : -1;
  state.savedPresets = presets;
  state.app.ageConfirmed = localStorage.getItem(STORAGE_KEYS.AGE_CONFIRMED) === 'true';
  state.app.onboardingComplete = localStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';

  if (savedState) {
    state.dummies = savedState.dummies?.length ? savedState.dummies : [defaultDummy()];
    state.multiDummyInteraction = { ...state.multiDummyInteraction, ...savedState.multiDummyInteraction };
    state.settings = { ...state.settings, ...savedState.settings };
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
  state.settings[key] = value;
  notify();
}

export function updateField(fieldId, value, dummyIndex = state.activeDummyIndex) {
  snapshotUndo();
  const dummy = state.dummies[dummyIndex];
  dummy.fields[fieldId] = value;
  enforceFieldRules(dummy.fields, fieldId);
  notify();
}

export function updateMultiDummyField(fieldId, value) {
  snapshotUndo();
  state.multiDummyInteraction[fieldId] = value;
  notify();
}

function enforceFieldRules(fields, fieldId) {
  if (fieldId === 'foundation' && fields.foundation === 'none') {
    fields.eye_makeup = [];
    fields.eyeshadow_color = [];
    fields.lashes = null;
    fields.lip_makeup = null;
    fields.lip_color = null;
    fields.blush_effects = [];
  }
  if (fieldId === 'lip_makeup' && fields.lip_makeup === 'none') {
    fields.lip_color = null;
  }
  if (fieldId === 'complete_outfit') {
    if (fields.complete_outfit) {
      fields.upper_type = null;
      fields.upper_style = [];
      fields.upper_color = null;
      fields.lower_type = null;
      fields.lower_style = [];
      fields.lower_color = null;
      fields.legwear = [];
      fields.footwear = null;
      if (fields.complete_outfit === 'nude') {
        fields.accessories = [];
      }
    }
  }
  if (['upper_type', 'upper_style', 'upper_color', 'lower_type', 'lower_style', 'lower_color', 'legwear', 'footwear'].includes(fieldId)) {
    if (fields[fieldId]) fields.complete_outfit = null;
  }
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
  if (type === 'futa' && !state.dummies[state.activeDummyIndex].fields.futa_enabled) {
    state.dummies[state.activeDummyIndex].fields.futa_enabled = 'on';
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

export function loadDummyFields(payload) {
  snapshotUndo();
  state.dummies[state.activeDummyIndex] = {
    id: crypto.randomUUID(),
    name: payload.name || state.dummies[state.activeDummyIndex].name,
    fields: structuredClone(payload.fields || {}),
    lockedFields: structuredClone(payload.lockedFields || []),
    referencePhotoId: payload.referencePhotoId || null,
  };
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
