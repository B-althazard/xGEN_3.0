export const SUBJECT_GROUPS = ['Female', 'Futa', 'Unknown'];
export const ORDER_GROUPS = ['Subject First', 'Style First', 'Unknown'];

export function deriveSubjectGroup(image) {
  if (image?.meta?.characterType === 'futa') return 'Futa';
  if (image?.meta?.characterType === 'female') return 'Female';
  if (image?.fields?.futa_enabled === 'on') return 'Futa';
  if (image?.fields && typeof image.fields === 'object') return 'Female';
  return 'Unknown';
}

export function deriveOrderGroup(image) {
  if (image?.meta?.promptOrder === 'subject-first') return 'Subject First';
  if (image?.meta?.promptOrder === 'style-first') return 'Style First';
  return 'Unknown';
}

export function groupImages(images) {
  const groups = new Map();
  for (const subject of SUBJECT_GROUPS) {
    groups.set(subject, new Map(ORDER_GROUPS.map((order) => [order, []])));
  }

  for (const image of images || []) {
    const subject = deriveSubjectGroup(image);
    const order = deriveOrderGroup(image);
    groups.get(subject).get(order).push(image);
  }

  return SUBJECT_GROUPS.map((subject) => ({
    subject,
    orders: ORDER_GROUPS.map((order) => ({
      order,
      images: groups.get(subject).get(order),
    })).filter((entry) => entry.images.length),
  })).filter((entry) => entry.orders.length);
}
