function articleFor(text) {
  return /^[aeiou]/i.test(text) ? 'an' : 'a';
}

function humanizePrompt(promptValue) {
  if (!promptValue) return 'this visual direction';
  return `the model toward "${promptValue}"`;
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function generalExplanation(field, option) {
  const fieldLabel = field.label.toLowerCase();
  const optionLabel = option.label.toLowerCase();
  return {
    summary: `${option.label} changes how the ${fieldLabel} reads in the final image.`,
    details: [
      `In the finished image, the ${fieldLabel} should look more ${optionLabel} instead of staying visually neutral.`,
      `This usually affects what a viewer notices first about that area, even if the pose and outfit stay the same.`,
      `Pick this when you want the ${fieldLabel} to read clearly at a glance rather than being left to chance.`
    ]
  };
}

function explainLens(option) {
  const map = {
    '14mm': ['This creates an ultra-wide perspective with dramatic stretch near the edges of the frame.', 'It makes the scene feel larger and more exaggerated, but it can distort faces and body proportions if the subject is close to camera.', 'Use it when you want an aggressive wide-angle look, environmental emphasis, or a stylized cinematic distortion.'],
    '24mm': ['This gives a wide-angle look that keeps more of the environment in frame.', 'It adds energy and space around the subject, while still introducing some perspective stretch when the camera feels close.', 'Use it when the background matters and you want the image to feel more immersive than a standard portrait.'],
    '35mm': ['This is a mild wide-angle look that feels natural but still slightly spacious.', 'It keeps more scene context than portrait lenses and gives the image a documentary or editorial feel.', 'Use it when you want the subject plus some environment without the stronger distortion of very wide lenses.'],
    '50mm': ['This is the classic balanced lens look: natural perspective, moderate subject separation, and very little distortion.', 'It usually feels neutral and believable, so it works well for general portraits and full-body images.', 'Use it when you want a clean, versatile image without pushing the camera style too hard.'],
    '85mm': ['This is a classic portrait-lens look with flattering facial compression and strong subject separation.', 'Faces usually appear more elegant and less distorted, while the background feels softer and more compressed behind the subject.', 'Use it when you want a polished portrait look that emphasizes beauty, shape, and separation from the background.'],
    '105mm': ['This tightens the portrait look even more than 85mm and adds stronger compression.', 'Features feel flatter, cleaner, and more isolated from the background, which can create a more expensive studio-portrait vibe.', 'Use it when you want a close, refined portrait with strong background blur and minimal perspective distortion.'],
    '135mm': ['This gives a telephoto portrait look with pronounced compression and a more distant camera feel.', 'The subject feels visually pulled forward from the background, and depth looks flatter and more compressed.', 'Use it when you want an elegant, cinematic long-lens portrait look with strong isolation.'],
    '200mm': ['This creates an even stronger telephoto effect and makes the camera feel physically far from the subject.', 'Background elements appear larger and closer to the subject, while perspective becomes very compressed and flat.', 'Use it when you want a distant voyeuristic look, runway-style compression, or heavy background squeeze.'],
    macro: ['This tells the model to treat the shot like an extreme close study of detail.', 'It tends to enlarge fine textures and small features, making things like lips, eyes, jewelry, skin texture, or accessories feel very prominent.', 'Use it when the image should focus on a tiny area rather than the whole subject.'],
    fisheye: ['This creates a deliberately distorted wide-angle look with curved perspective.', 'The image can feel playful, surreal, invasive, or chaotic because straight lines and body proportions may warp strongly toward the edges.', 'Use it when you want a stylized, exaggerated, non-natural camera look.'],
    tilt_shift: ['This creates a miniature or selective-focus look with unusual focus falloff.', 'It can make the scene feel toy-like, dreamy, or architecturally precise depending on the framing.', 'Use it when you want a stylized photography effect rather than a normal lens rendering.'],
    anamorphic: ['This pushes the image toward a cinematic widescreen-lens look.', 'You can expect stronger horizontal flare tendencies, stretched bokeh, and a more filmic sense of space.', 'Use it when you want the shot to feel cinematic rather than photographic or neutral.']
  };

  const details = map[option.id] || generalExplanation({ label: 'lens' }, option).details;
  return {
    summary: `${option.label} changes the perspective and how compressed or wide the scene feels.`,
    details,
  };
}

function explainFraming(option) {
  return {
    summary: `${option.label} controls how much of the subject and scene fit inside the frame.`,
    details: [
      `This makes the camera frame the subject as ${articleFor(option.label.toLowerCase())} ${option.label.toLowerCase()} instead of leaving the crop ambiguous.`,
      'You will mainly see changes in how close the camera feels, how much of the body is visible, and how much background remains in view.',
      'Use it when the composition itself should feel deliberate and readable.'
    ]
  };
}

function explainCameraAngle(option) {
  return {
    summary: `${option.label} changes the viewer's camera position relative to the subject.`,
    details: [
      `In practice this changes how powerful, intimate, flattering, or voyeuristic the shot feels.`,
      'A low angle usually makes the subject feel taller and more dominant, while a high angle often feels softer, smaller, or more observed.',
      'Use it when you want the same subject to give off a different emotional impression without changing her styling.'
    ]
  };
}

function explainDepthOfField(option) {
  return {
    summary: `${option.label} controls how much of the image feels sharp versus blurred.`,
    details: [
      'This changes how strongly the subject separates from the background through focus and blur.',
      'Shallow focus makes the subject pop while the background melts away, while deep focus keeps more of the room or landscape readable.',
      'Use it when you want to decide whether the viewer should notice the person first or the full setting around her.'
    ]
  };
}

function explainBodyOrFace(field, option) {
  return {
    summary: `${option.label} changes the perceived ${field.label.toLowerCase()} of the subject.`,
    details: [
      `In the image, this usually changes shape, contour, proportion, or how strongly that feature stands out.`,
      'Even when the pose stays the same, the overall silhouette or facial read can become noticeably different.',
      `Use it when you want the ${field.label.toLowerCase()} to look specific instead of generic.`
    ]
  };
}

function explainStyling(field, option) {
  return {
    summary: `${option.label} changes the styling direction for ${field.label.toLowerCase()}.`,
    details: [
      `This changes the visible style language of the image rather than the subject's anatomy.`,
      'You will usually notice it in polish, attitude, texture, silhouette, or how dressed-up the final image feels.',
      `Use it when you want the ${field.label.toLowerCase()} to read as a deliberate style choice instead of background dressing.`
    ]
  };
}

function explainEnvironment(field, option) {
  return {
    summary: `${option.label} changes the environmental mood around the subject.`,
    details: [
      'This changes what the space feels like around the subject, not just how she looks.',
      'You will usually see it affect mood, background read, atmosphere, time-of-day feeling, or how cinematic the shot appears.',
      'Use it when the environment should help tell the story of the image.'
    ]
  };
}

export function getOptionDetail(field, option) {
  if (!field || !option) return null;
  if (field.colors) return null;

  if (field.id === 'lens') return explainLens(option);
  if (field.id === 'framing') return explainFraming(option);
  if (field.id === 'camera_angle') return explainCameraAngle(option);
  if (field.id === 'depth_of_field') return explainDepthOfField(option);

  const label = `${field.label} ${option.label}`.toLowerCase();
  const fieldLabel = field.label.toLowerCase();
  const bodyish = /waist|hips|ass|legs|face|eye|eyebrow|nose|lip|mouth|jaw|chin|cheek|bust|breast|nipple|physique|hairline|hair|skin|body/i.test(fieldLabel);
  const styling = /makeup|outfit|clothing|accessor|fabric|material|style|hair/i.test(fieldLabel);
  const environment = /location|lighting|camera|pose|action|interaction|scene|background/i.test(fieldLabel) || /camera|lighting|location|pose|angle/.test(label);

  if (bodyish) return explainBodyOrFace(field, option);
  if (styling) return explainStyling(field, option);
  if (environment) return explainEnvironment(field, option);

  const fallback = generalExplanation(field, option);
  return {
    summary: fallback.summary,
    details: fallback.details.map((line) => capitalize(line)),
  };
}
