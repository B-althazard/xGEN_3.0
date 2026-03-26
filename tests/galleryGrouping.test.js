import test from 'node:test';
import assert from 'node:assert/strict';

const { groupImages, deriveOrderGroup, deriveSubjectGroup } = await import('../js/pages/galleryGrouping.js');

test('gallery grouping derives subject and prompt order from image metadata', () => {
  const groups = groupImages([
    { nonce: '1', meta: { characterType: 'female', promptOrder: 'subject-first' }, fields: {} },
    { nonce: '2', meta: { characterType: 'futa', promptOrder: 'style-first' }, fields: { futa_enabled: 'on' } },
  ]);

  assert.equal(groups[0].subject, 'Female');
  assert.equal(groups[0].orders[0].order, 'Subject First');
  assert.equal(groups[0].orders[0].images[0].nonce, '1');
  assert.equal(groups[1].subject, 'Futa');
  assert.equal(groups[1].orders[0].order, 'Style First');
  assert.equal(groups[1].orders[0].images[0].nonce, '2');
});

test('legacy gallery images fall back to Unknown order without heuristics', () => {
  assert.equal(deriveSubjectGroup({ fields: { futa_enabled: 'off' } }), 'Female');
  assert.equal(deriveOrderGroup({ fields: { futa_enabled: 'off' } }), 'Unknown');

  const groups = groupImages([{ nonce: 'legacy', fields: { futa_enabled: 'off' } }]);
  assert.equal(groups[0].subject, 'Female');
  assert.equal(groups[0].orders[0].order, 'Unknown');
  assert.equal(groups[0].orders[0].images[0].nonce, 'legacy');
});
