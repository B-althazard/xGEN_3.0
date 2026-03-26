import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

async function readRepoFile(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), 'utf8');
}

function extractRegexLiteral(source, variableName) {
  const match = source.match(new RegExp(`const\\s+${variableName}\\s*=\\s*(\/.*?\/[a-z]*);`));
  assert.ok(match, `Expected regex literal for ${variableName}`);
  return match[1];
}

function extractArrayLiteral(source, variableName) {
  const match = source.match(new RegExp(`const\\s+${variableName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
  assert.ok(match, `Expected array literal for ${variableName}`);
  return Function(`return (${match[1]});`)();
}

test('userscript runtime URL detection accepts deployed xGEN paths', async () => {
  const source = await readRepoFile('userscript/xgen-venice-bridge.user.js');
  const regexLiteral = extractRegexLiteral(source, 'XGEN_URL_RE');
  const urlRegex = Function(`return ${regexLiteral};`)();

  assert.equal(urlRegex.test('https://b-althazard.github.io/xGEN_3.0/'), true);
  assert.equal(urlRegex.test('https://b-althazard.github.io/xGEN/'), true);
  assert.equal(urlRegex.test('https://b-althazard.github.io/xgen/'), true);
  assert.equal(urlRegex.test('https://b-althazard.github.io/other/'), false);
});

test('service worker precache includes critical app shell assets', async () => {
  const source = await readRepoFile('sw.js');
  const precache = extractArrayLiteral(source, 'PRECACHE');

  for (const requiredPath of [
    './js/pages/gallery.js',
    './js/pages/galleryGrouping.js',
    './js/appConfig.js',
    './js/utils/dom.js',
    './js/utils/dummyNames.js',
    './js/utils/optionDetails.js',
    './data/dummyNames.md',
    './userscript/xgen-venice-bridge.user.js',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/icon-192.png',
    './assets/icons/maskable-512.png',
  ]) {
    assert.ok(precache.includes(requiredPath), `Missing precache asset: ${requiredPath}`);
  }
});

test('schema modal assets do not reference missing files', async () => {
  const dataDir = path.join(ROOT, 'data');
  const files = (await fs.readdir(dataDir)).filter((name) => name.endsWith('.json'));
  const missing = [];

  for (const file of files) {
    const json = JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8'));
    for (const category of json.categories || []) {
      for (const field of category.fields || []) {
        if (!field.modalImage) continue;
        const assetPath = path.join(ROOT, field.modalImage);
        try {
          await fs.access(assetPath);
        } catch {
          missing.push(`${file}:${field.id}:${field.modalImage}`);
        }
      }
    }
  }

  assert.deepEqual(missing, []);
});

test('xBatcher UI no longer exposes unsupported mode selector', async () => {
  const source = await readRepoFile('js/pages/xgen.js');
  assert.equal(source.includes('data-batch-mode'), false);
  assert.match(source, /New-chat mode remains deferred/);
});

test('userscript heartbeat does not dispatch bridge-ready every interval', async () => {
  const source = await readRepoFile('userscript/xgen-venice-bridge.user.js');
  const heartbeatStart = source.indexOf('function startHeartbeat()');
  const heartbeatEnd = source.indexOf('function setNativeValue', heartbeatStart);
  const heartbeatBlock = source.slice(heartbeatStart, heartbeatEnd);

  assert.ok(heartbeatBlock.includes('GM_setValue(ownHeartbeatKey(), Date.now())'));
  assert.equal(heartbeatBlock.includes("dispatchPageEvent('xgen:bridge-ready'"), false);
});

test('bridge freshness is driven by heartbeat events without full ready spam', async () => {
  const userscript = await readRepoFile('userscript/xgen-venice-bridge.user.js');
  const bridgeManager = await readRepoFile('js/bridgeManager.js');

  assert.match(userscript, /dispatchPageEvent\('xgen:bridge-heartbeat'/);
  assert.match(bridgeManager, /window\.addEventListener\('xgen:bridge-heartbeat', refreshBridgeDetection\)/);
});

test('xGEN metrics omit model ratio and cost cards', async () => {
  const source = await readRepoFile('js/pages/xgen.js');
  const metricsStart = source.indexOf('function renderMetrics(state)');
  const metricsEnd = source.indexOf('function renderActionGrid()', metricsStart);
  const metricsBlock = source.slice(metricsStart, metricsEnd);

  assert.match(metricsBlock, /Words/);
  assert.match(metricsBlock, /Tokens/);
  assert.match(metricsBlock, /Items/);
  assert.equal(metricsBlock.includes('Model'), false);
  assert.equal(metricsBlock.includes('Ratio'), false);
  assert.equal(metricsBlock.includes('Cost'), false);
});

test('top bar renders a commit-count app version next to the brand', async () => {
  const source = await readRepoFile('js/components/topBar.js');
  const versionSource = await readRepoFile('js/appConfig.js');
  assert.match(source, /top-bar__version/);
  assert.match(versionSource, /v3\.0\.\d+/);
});

test('store seeds fresh dummy names from the dummy name pool', async () => {
  const source = await readRepoFile('js/store.js');
  assert.match(source, /nextDummyName\(/);
  assert.equal(source.includes("replaceWithFreshDummy() {\n  snapshotUndo();\n  state.dummies = \[{ ...defaultDummy\(\), name: 'Dummy 1' }\];"), false);
});

test('preset cards can render saved preview images', async () => {
  const source = await readRepoFile('js/modules/presets.js');
  assert.match(source, /preset\.previewImageDataUrl/);
  assert.match(source, /preset-card__preview/);
});

test('userscript reports visible-tab waiting when Venice is hidden', async () => {
  const source = await readRepoFile('userscript/xgen-venice-bridge.user.js');
  assert.match(source, /waiting for visible Venice tab/);
  assert.match(source, /Keep Venice visible, split-screen, or not minimized/);
});
