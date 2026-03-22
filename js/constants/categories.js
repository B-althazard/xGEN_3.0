import { categoryIcon } from '../icons.js';

export function getCreationKitCategories(state) {
  const groups = [
    { id: 'identity', label: 'Identity', schemaIds: ['identity'] },
    { id: 'physique', label: 'Physique', schemaIds: ['physique'] },
    { id: 'bust', label: 'Bust', schemaIds: ['bust'] },
    { id: 'lower-body', label: 'Lower Body', schemaIds: ['lower_body', 'nsfw_body', 'futa'] },
    { id: 'face', label: 'Face', schemaIds: ['face'] },
    { id: 'hair', label: 'Hair', schemaIds: ['hair'] },
    { id: 'makeup', label: 'Makeup', schemaIds: ['makeup'] },
    { id: 'clothing', label: 'Clothing', schemaIds: ['clothing'] },
    { id: 'location', label: 'Location', schemaIds: ['location'] },
    { id: 'lighting', label: 'Lighting', schemaIds: ['lighting'] },
    { id: 'camera', label: 'Camera', schemaIds: ['camera'] },
    { id: 'posing', label: 'Posing', schemaIds: ['posing', 'actions'] },
  ];

  if ((state.dummies || []).length > 1) {
    groups.push({ id: 'multi-dummy', label: 'Multi', schemaIds: ['multi_dummy'] });
  }

  return groups.map((g) => ({ ...g, icon: categoryIcon(g.id) }));
}

export function normalizeCategoryId(categoryId, state) {
  const categories = getCreationKitCategories(state);
  return categories.some((item) => item.id === categoryId) ? categoryId : categories[0].id;
}

export function getCategoryWindow(categoryId, state) {
  const categories = getCreationKitCategories(state);
  const index = categories.findIndex((item) => item.id === normalizeCategoryId(categoryId, state));
  const safeIndex = index >= 0 ? index : 0;
  const prev = categories[(safeIndex - 1 + categories.length) % categories.length];
  const current = categories[safeIndex];
  const next = categories[(safeIndex + 1) % categories.length];
  return { categories, index: safeIndex, prev, current, next };
}
