export function extractTokens(fields, schema, rules, emphasis = {}) {
  const tokens = [];
  const fieldDefs = new Map();
  schema.categories.forEach((category, categoryIndex) => {
    category.fields.forEach((field, fieldIndex) => {
      fieldDefs.set(field.id, { field, categoryIndex, fieldIndex });
    });
  });

  for (const [fieldId, rawValue] of Object.entries(fields || {})) {
    const entry = fieldDefs.get(fieldId);
    if (!entry) continue;
    const { field, categoryIndex, fieldIndex } = entry;
    if (fieldId.startsWith('futa_') && fields.futa_enabled !== 'on') continue;
      const options = field.options || field.colors || [];
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      values.forEach((value) => {
        if (value == null || value === '') return;
      const schemaOptionIndex = options.findIndex((item) => item.id === value);
      const option = options[schemaOptionIndex];
      if (!option || !option.promptValue) return;
      tokens.push({
        fieldId,
        fieldType: field.type,
        optionId: value,
        rawPromptValue: option.promptValue,
        finalPromptValue: option.promptValue,
        domain: rules.domains[fieldId] || fieldId,
        sourceOrder: { categoryIndex, fieldIndex, optionIndex: schemaOptionIndex },
        emphasisLevel: emphasis[option.promptValue] || null,
        status: 'kept',
      });
    });
  }
  return tokens;
}
