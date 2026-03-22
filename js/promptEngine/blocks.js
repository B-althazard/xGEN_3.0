function moveEmphasisEarlier(items) {
  const ordered = [...items];
  for (let index = 0; index < ordered.length; index += 1) {
    if (ordered[index].emphasisLevel === 'high') {
      const [item] = ordered.splice(index, 1);
      ordered.splice(Math.max(0, index - 2), 0, item);
    }
  }
  return ordered;
}

function mergeIdentity(values) {
  const ethnicity = values.find((item) => item.domain === 'identity.ethnicity');
  const age = values.find((item) => item.domain === 'identity.age');
  if (ethnicity && age) {
    const ethText = ethnicity.finalPromptValue.replace(/ woman$/, '');
    return [`${ethText} ${age.finalPromptValue}`];
  }
  return values.map((item) => item.finalPromptValue);
}

function mergeHair(values) {
  const colors = values.filter((item) => item.domain === 'hair.color').map((item) => item.finalPromptValue.replace(/ hair$/, ''));
  const length = values.find((item) => item.domain === 'hair.length')?.finalPromptValue || '';
  const styles = values.filter((item) => item.domain === 'hair.style').map((item) => item.finalPromptValue.replace(/ hair$/, ''));
  const merged = [colors.join(' and '), length, ...styles].filter(Boolean).join(', ');
  return merged ? [merged] : [];
}

function mergeEyes(values) {
  const shape = values.find((item) => item.domain === 'face.eyes.shape')?.finalPromptValue;
  const color = values.find((item) => item.domain === 'face.eyes.color')?.finalPromptValue;
  return [shape, color].filter(Boolean).length ? [[shape, color].filter(Boolean).join(', ')] : [];
}

function mergeClothing(prefix, values) {
  const color = values.find((item) => item.domain === `${prefix}.color`)?.finalPromptValue;
  const type = values.find((item) => item.domain === `${prefix}.type`)?.finalPromptValue;
  const styles = values.filter((item) => item.domain === `${prefix}.style`).map((item) => item.finalPromptValue);
  const merged = [color, ...styles, type].filter(Boolean).join(' ');
  return merged ? [merged] : [];
}

export function buildBlocks(tokens, rules, settings) {
  const kept = tokens.filter((token) => token.status !== 'dropped');
  const groupMap = {
    style: [], identity: [], body: [], face: [], hair: [], makeup: [], clothing: [], scene: [], lighting: [], camera: [], pose: [], multi: [],
  };
  kept.forEach((token) => {
    const domain = token.domain;
    if (domain.startsWith('identity.')) groupMap.identity.push(token);
    else if (domain.startsWith('body.')) groupMap.body.push(token);
    else if (domain.startsWith('face.')) groupMap.face.push(token);
    else if (domain.startsWith('hair.')) groupMap.hair.push(token);
    else if (domain.startsWith('makeup.')) groupMap.makeup.push(token);
    else if (domain.startsWith('clothing.')) groupMap.clothing.push(token);
    else if (domain.startsWith('scene.')) groupMap.scene.push(token);
    else if (domain.startsWith('lighting.')) groupMap.lighting.push(token);
    else if (domain.startsWith('camera.')) groupMap.camera.push(token);
    else if (domain.startsWith('pose.') || domain.startsWith('actions.')) groupMap.pose.push(token);
    else if (domain.startsWith('multi.')) groupMap.multi.push(token);
  });

  const sortByDomainOrder = (items, blockId) => {
    const order = rules.ordering?.domainOrder?.[blockId] || [];
    return [...items].sort((a, b) => {
      const ai = order.indexOf(a.domain);
      const bi = order.indexOf(b.domain);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.sourceOrder.categoryIndex - b.sourceOrder.categoryIndex || a.sourceOrder.fieldIndex - b.sourceOrder.fieldIndex;
    });
  };

  const buildBlock = (id, items) => ({ id, items, text: items.map((item) => item.text).filter(Boolean).join(', ') });

  const opener = {
    studio: 'professional studio photograph, photorealistic photography, RAW photo',
    social: 'candid amateur photograph, posted on social media, photorealistic photography, RAW photo',
    editorial: 'editorial fashion photograph, photorealistic photography, RAW photo',
    auto: 'photorealistic photography, RAW photo',
  };
  const styleText = opener[settings.realismMode] || opener.auto;

  const identityItems = mergeIdentity(moveEmphasisEarlier(sortByDomainOrder(groupMap.identity, 'identity'))).map((text) => ({ domain: 'identity.ethnicity', text }));
  const bodyItems = sortByDomainOrder(groupMap.body, 'body').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const faceItems = [
    ...mergeEyes(sortByDomainOrder(groupMap.face, 'face')).map((text) => ({ domain: 'face.eyes.shape', text })),
    ...sortByDomainOrder(groupMap.face.filter((item) => !['face.eyes.shape', 'face.eyes.color'].includes(item.domain)), 'face').map((item) => ({ domain: item.domain, text: item.finalPromptValue })),
  ];
  const hairItems = mergeHair(moveEmphasisEarlier(sortByDomainOrder(groupMap.hair, 'hair'))).map((text) => ({ domain: 'hair.color', text }));
  const makeupItems = sortByDomainOrder(groupMap.makeup, 'makeup').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const clothingItems = [
    ...groupMap.clothing.filter((item) => item.domain === 'clothing.complete').map((item) => ({ domain: item.domain, text: item.finalPromptValue })),
    ...mergeClothing('clothing.upper', sortByDomainOrder(groupMap.clothing, 'clothing')).map((text) => ({ domain: 'clothing.upper.type', text })),
    ...mergeClothing('clothing.lower', sortByDomainOrder(groupMap.clothing, 'clothing')).map((text) => ({ domain: 'clothing.lower.type', text })),
    ...sortByDomainOrder(groupMap.clothing.filter((item) => ['clothing.legwear', 'clothing.footwear', 'clothing.accessories'].includes(item.domain)), 'clothing').map((item) => ({ domain: item.domain, text: item.finalPromptValue })),
  ];
  const sceneItems = sortByDomainOrder(groupMap.scene, 'scene').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const lightingItems = sortByDomainOrder(groupMap.lighting, 'lighting').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const cameraItems = sortByDomainOrder(groupMap.camera, 'camera').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const poseItems = sortByDomainOrder(groupMap.pose, 'pose').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));
  const multiItems = sortByDomainOrder(groupMap.multi, 'multi').map((item) => ({ domain: item.domain, text: item.finalPromptValue }));

  return [
    buildBlock('style', [{ domain: 'style.opener', text: styleText }]),
    buildBlock('identity', identityItems),
    buildBlock('body', bodyItems),
    buildBlock('face', faceItems),
    buildBlock('hair', hairItems),
    buildBlock('makeup', makeupItems),
    buildBlock('clothing', clothingItems),
    buildBlock('scene', sceneItems),
    buildBlock('lighting', lightingItems),
    buildBlock('camera', cameraItems),
    buildBlock('pose', poseItems),
    buildBlock('multi', multiItems),
  ].filter((block) => block.text);
}
