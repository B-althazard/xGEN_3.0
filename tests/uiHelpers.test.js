import test from 'node:test';
import assert from 'node:assert/strict';

const { parseDummyNames, pickRandomDummyName } = await import('../js/utils/dummyNames.js');
const { getOptionDetail } = await import('../js/utils/optionDetails.js');

test('dummy name parser reads numbered names from markdown lists', () => {
  const names = parseDummyNames('### Names\n1. Roxy\n2. Velvet\nnot a name');
  assert.deepEqual(names, ['Roxy', 'Velvet']);
});

test('dummy name picker prefers unused names when available', () => {
  const picked = pickRandomDummyName(['Roxy', 'Velvet'], ['Roxy']);
  assert.equal(picked, 'Velvet');
});

test('option detail generator explains portrait lenses in natural language', () => {
  const detail = getOptionDetail(
    { id: 'lens', label: 'Lens', options: [] },
    { id: '85mm', label: '85mm Portrait', promptValue: '85mm lens' }
  );

  assert.match(detail.summary, /perspective/i);
  assert.ok(detail.details.some((line) => /flattering facial compression/i.test(line)));
  assert.ok(detail.details.some((line) => /background/i.test(line)));
});

test('option detail generator skips color fields', () => {
  const detail = getOptionDetail(
    { id: 'eye_color', label: 'Eye Color', colors: [] },
    { id: 'blue', label: 'Blue', promptValue: 'blue eyes' }
  );

  assert.equal(detail, null);
});
