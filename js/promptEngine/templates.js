const TEMPLATES = {
  portrait: {
    label: 'Portrait',
    description: 'Character-focused with emphasis on subject details',
    blockOrder: ['style', 'identity', 'body', 'face', 'hair', 'makeup', 'clothing', 'pose', 'scene', 'lighting', 'camera'],
    mandatoryBlocks: ['identity', 'face'],
    opener: {
      studio: 'professional studio photograph, photorealistic photography, RAW photo',
      social: 'candid amateur photograph, posted on social media, photorealistic photography, RAW photo',
      editorial: 'editorial fashion photograph, photorealistic photography, RAW photo',
      auto: 'photorealistic photography, RAW photo',
    },
  },
  landscape: {
    label: 'Landscape',
    description: 'Location and atmosphere-focused',
    blockOrder: ['style', 'scene', 'lighting', 'camera'],
    mandatoryBlocks: ['scene'],
    opener: {
      studio: 'professional landscape photography, photorealistic photography, RAW photo',
      social: 'travel photography, photorealistic photography, RAW photo',
      editorial: 'fine art landscape photography, photorealistic photography, RAW photo',
      auto: 'landscape photography, photorealistic photography, RAW photo',
    },
  },
  product: {
    label: 'Product',
    description: 'Object-focused with clean presentation',
    blockOrder: ['style', 'scene', 'lighting', 'camera'],
    mandatoryBlocks: ['scene', 'lighting'],
    opener: {
      studio: 'professional product photography, photorealistic photography, RAW photo',
      social: 'lifestyle product photography, photorealistic photography, RAW photo',
      editorial: 'editorial product photography, photorealistic photography, RAW photo',
      auto: 'product photography, photorealistic photography, RAW photo',
    },
  },
  architecture: {
    label: 'Architecture',
    description: 'Building and space-focused with perspective emphasis',
    blockOrder: ['style', 'scene', 'lighting', 'camera'],
    mandatoryBlocks: ['scene', 'camera'],
    opener: {
      studio: 'architectural photography, photorealistic photography, RAW photo',
      social: 'street photography, photorealistic photography, RAW photo',
      editorial: 'editorial architectural photography, photorealistic photography, RAW photo',
      auto: 'architectural photography, photorealistic photography, RAW photo',
    },
  },
};

export function getTemplate(imageType) {
  return TEMPLATES[imageType] || TEMPLATES.portrait;
}

export function getTemplateNames() {
  return Object.keys(TEMPLATES);
}

export function getOpener(realismMode, imageType = 'portrait') {
  const template = TEMPLATES[imageType] || TEMPLATES.portrait;
  return template.opener[realismMode] || template.opener.auto;
}
