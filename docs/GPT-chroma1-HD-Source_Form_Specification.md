chroma1-HD-Source_Form_Specification.md

# Source Form Specification & Canonical Mapping Rules

* Raw Form Output
```
photorealistic photography, RAW photo, east asian woman, woman in her 20s, petite, smooth flawless skin, small breasts, perky breasts, puffy nipples, covered, slim waist, narrow hips, small ass, slim legs, round face, round eyes, feathered eyebrows, button nose, small rounded, heart shaped lips, mid back length hair, wavy hair, side swept hair, dewy skin, wispy lashes, highlighter, blush, lingerie, necklace, in a bedroom, portrait, 85mm lens, seductive expression
```

## 9. THE FORM — ALL 13 CATEGORIES

* NSFW - Body merged with Lower Body
* Futa - Cock & Balls merged with Lower Body
* Actions merged with Posing & Expression
* Quality & Style - Will be moved to the x.GEN (image generation) Page

> **Rendering Rules:**
> - `FU` = Unlocks Futa Traits (Cock & Balls Traits)
> - `SS` = Single-select (button group or image card grid)
> - `MS` = Multi-select (checkbox grid)
> - `SW` = Color swatch picker
> - `SM` = Shape modal (opens image grid modal with 6 options acting as buttons)
> - Only one accordion section open at a time per category
> - No free-text input anywhere on the form
> - All field values come from predefined options with `promptValue` strings

### 1. Identity

| Field | Type | Options |
|---|---|---|
| Age | SS | +18, 20s, 30s, 40s, 50s, 60+ |
| Ethnicity | SM | Caucasian, Latina, Black, East Asian, SE Asian, South Asian, Middle Eastern, Mixed |

### 2. Physique

| Field | Type | Options |
|---|---|---|
| Body Type | SM | Skinny, Slim, Athletic, Toned, Average, Curvy, Voluptuous, BBW, Petite |
| Height | SS | Very Short, Short, Average, Tall, Very Tall |
| Skin Tone | SW | Fair, Light, Medium, Olive, Tan, Brown, Deep Brown, Ebony |
| Skin Detail | MS | Smooth, Natural, Freckles, Light tan lines, Tattoos, Piercings, Moles/Beauty marks |

### 3. Bust

| Field | Type | Options |
|---|---|---|
| Size | SM | Flat, Small (A), Medium (B-C), Large (D-E), Extra Large (F+), Massive |
| Shape | SM | Perky, Round, Natural, Teardrop, Wide-set, Close-set |
| Nipples | SS | Default, Small, Large, Dark, Light, Pierced |
| Bust State | MS | Natural, Lifted, Pushed up, Exposed, Partially exposed |

### 4. Lower Body

| Field | Type | Options |
|---|---|---|
| Waist | SS | Very slim, Slim, Average, Defined, Soft |
| Hips | SS | Narrow, Average, Wide, Very wide |
| Ass | SM | Flat, Small, Average, Round, Bubble, Large, Extra Large |
| Legs | SS | Slim, Toned, Average, Thick, Very thick |
| Pussy Style | SS | Bare, Landing Strip, Trimmed, Natural Bush, Pierced, Small Tight, Large Lips |
| Pussy State | SS | Closed, Wet, Spread Open, Gaping, Creampie, Fingered, Toy Inside |
| Futa - Cock & Balls | FU | Placeholder for 7 sub-categories | 

### 5. Face

| Field | Type | Options |
|---|---|---|
| Face Shape | SM | Oval, Round, Square, Heart, Diamond, Oblong |
| Eyes | SM | Almond, Round, Upturned, Downturned, Hooded, Monolid |
| Eye Color | SW | Brown, Dark Brown, Hazel, Green, Blue, Gray, Amber, Violet |
| Nose | SM | Button, Upturned, Straight, Roman, Wide, Narrow |
| Lips | SM | Thin, Medium, Full, Pouty, Heart-shaped, Wide |
| Eyebrows | SM | Thin, Arched, Straight, Bushy, Feathered, Sharp |

### 6. Hair

| Field | Type | Options |
|---|---|---|
| Color | SW | Black, Dark Brown, Brown, Light Brown, Dirty Blonde, Blonde, Platinum, Auburn, Red, Ginger, Pink, Blue, Purple, Green, White, Gray, Ombre, Highlighted |
| Length | SS | Buzzcut, Pixie, Ear-length, Chin-length, Shoulder-length, Mid-back, Long, Extra Long, Waist-length |
| Style | MS | Straight, Wavy, Curly, Coiled, Braided, Ponytail, Bun, Half-up, Bangs, Side-swept, Messy, Slicked back |

### 7. Makeup

| Field | Type | Options |
|---|---|---|
| Foundation | SS | None, Natural, Matte, Dewy, Heavy |
| Eye Makeup | MS | None, Mascara, Eyeliner, Smoky eye, Cut crease, Colored shadow, Graphic liner |
| Eye Shadow Color | SW | Neutral, Brown, Pink, Red, Purple, Blue, Green, Gold, Black, Glitter |
| Lashes | SS | None, Natural, Wispy, Full, Extra dramatic |
| Lip Makeup | SS | None, Nude, Pink, Red, Berry, Coral, Gloss, Matte dark |
| Blush / Effects | MS | None, Subtle blush, Heavy blush, Highlight, Contour, Bronzer, Shimmer, Glass skin |

### 8. Clothing

> **Mutual exclusivity rule:**
> - Selecting **Complete Outfit** → disables and clears Upper Layer, Lower Layer, Legwear, Footwear fields
> - Editing any **Upper/Lower Layer** field → clears Complete Outfit selection
> - Selecting **Nude** (a Complete Outfit option) → additionally clears Legwear, Footwear, Accessories

| Field | Type | Options |
|---|---|---|
| **Complete Outfit** | SS | Nude, Lingerie set, Bikini, Casual, Streetwear, Formal, Evening gown, Athletic, School uniform, Swimwear, Cosplay |
| **— OR — Upper Layer** | | |
| Upper Type | SS | Top, Bra, Bikini Top, Crop top, Button shirt, Jacket, Hoodie, Naked |
| Upper Style | MS | Basic, Sheer, Lace, Cut-out, Off-shoulder, Strapless, Wrap, Bodysuit |
| Upper Color | SW | White, Black, Red, Pink, Blue, Green, Yellow, Purple, Orange, Nude, Camo, Floral, Print |
| Upper Material | SS | Cotton, Silk, Lace, Leather, Latex, Sheer, Knit, Denim, Satin |
| Upper Fit | SS | Tight, Fitted, Loose, Oversized, Bandage |
| **— OR — Lower Layer** | | |
| Lower Type | SS | Pants, Jeans, Skirt, Mini skirt, Shorts, Thong, Panties, Bikini Bottom, Naked |
| Lower Style | MS | Basic, Distressed, Pleated, Wrap, Flared, Pencil, Bodycon |
| Lower Color | SW | White, Black, Red, Pink, Blue, Green, Yellow, Purple, Orange, Nude, Camo, Denim, Print |
| Lower Material | SS | Cotton, Denim, Silk, Lace, Leather, Latex, Knit, Satin |
| Lower Fit | SS | Tight, Fitted, Loose, Oversized, Flared |
| **Legwear** | MS | None, Stockings, Thigh-highs, Fishnets, Ankle socks, Knee socks, Leggings, Tights |
| **Footwear** | SS | Barefoot, Heels, Stilettos, Platform heels, Sneakers, Boots, Knee-high boots, Sandals, Mules |
| **Accessories** | MS | Necklace, Choker, Earrings, Bracelet, Ring, Anklet, Sunglasses, Hat, Cap, Belt, Bag, Watch, Body chain |

### 9. Location

| Field | Type | Options |
|---|---|---|
| Location | SS | Bedroom, Bathroom, Living room, Kitchen, Office, Hotel room, Pool, Beach, Outdoors park, Urban street, Studio, Car, Rooftop, Gym, Club |
| Scene | SS | Indoor, Outdoor, Fantasy / Dreamlike, Urban, Nature, Minimalist studio |
| Background | SS | Blurred (bokeh), Detailed, Minimal / Plain, Colorful, Dark |
| Time of Day | SS | Morning, Afternoon, Golden hour, Sunset, Blue hour, Night |

### 9.10 Lighting

| Field | Type | Options |
|---|---|---|
| Style | SS | Natural, Soft studio, Hard studio, Cinematic, Neon, Candlelight / Warm, Backlit / Silhouette, Fairy lights |
| Color | SW | White/Neutral, Warm, Cool, Pink, Blue, Purple, Red, Amber, Teal, Green, Mixed RGB |
| Effects | MS | Soft shadows, Hard shadows, Lens flare, Rim light, Catch lights, God rays, Glitter / Sparkle, Low key, High key |

### 11. Camera

| Field | Type | Options |
|---|---|---|
| Framing | SS | Close-up (face), Portrait (head-to-shoulder), Half-body, Three-quarter, Full body, Wide shot, Over-shoulder, POV |
| Lens | SS | 24mm (wide), 35mm, 50mm (natural), 85mm (portrait), 135mm (compressed), Macro, Fisheye |
| Angle | SS | Eye level, Slightly low, Low angle, Slightly high, High angle (bird's eye), Dutch tilt |
| Depth of Field | SS | Shallow (blurred background), Deep (everything sharp), Medium |

### 12. Posing & Expression

**Pose field rules:**
- Multi-select, max 2 poses
- Compatibility check: the following pose pairs are **incompatible** and must be enforced:
  - Standing + Lying → blocked
  - Standing + Kneeling (prone) → blocked
  - Sitting + Lying → blocked
  - Any other pairs: allowed

**Incompatibility enforcement:**
- When user tries to select a third pose: show inline message "Max 2 poses selected"
- When user selects an incompatible second pose: deselect the first, select the new one, show inline message "Poses adjusted for compatibility"

| Field | Type | Options |
|---|---|---|
| Pose | MS (max 2) | Standing, Sitting, Lying down, Kneeling, Kneeling (prone), Arching, Reaching up, Leaning, Lying on side, All fours |
| Expression | SS | Neutral, Smiling, Laughing, Seductive, Sultry, Playful, Pouty, Serious, Surprised, Shy, Biting lip |
| Eye Contact | SS | Direct (into camera), Looking away, Downcast, Eyes closed, Looking up |
| Actions | SS/MS | Placeholder for 4 sub-categories |

---

# Canonical Mapping Rules

## PROMPT ENGINE ALGORITHM

**File:** `js/promptEngine.js`

### Model Registry

```javascript
const MODELS = {
  'chroma': {
    id: 'chroma',
    label: 'Chroma1-HD',
    promptMode: 'natural',          // Always use natural language
    cfgScale: 7,
    steps: 20,
    sampler: 'dpm++_2m_sde',
    defaultNegative: [
      'low quality', 'worst quality', 'blurry', 'deformed', 'disfigured',
      'bad anatomy', 'extra limbs', 'missing limbs', 'watermark', 'text',
      'signature', 'ugly', 'gross', 'overexposed', 'underexposed',
    ],
    qualityPrefix: [],              // Chroma/FLUX models don't need score tags
    // Natural language: full descriptive sentences
  },
```  
### Prompt Assembly

**Positive Prompt Assembly Order:**

```
1. Quality prefix (model-specific, e.g. "score_9, score_8_up, score_7_up")
2. Photography/style framing (e.g. "photorealistic", "photography", "RAW photo")
3. Ethnicity
4. Age
5. Body type + height
6. Skin tone + skin details
7. Bust
8. Lower body
9. Face shape
10. Eyes (shape + color)
11. Nose
12. Lips
13. Eyebrows
14. Hair (color + length + style)
15. Makeup
16. Clothing (complete outfit OR upper/lower layers)
17. Accessories
18. Location + scene
19. Background
20. Time of day
21. Lighting (style + color + effects)
22. Camera (framing + lens + angle + depth of field)
23. Pose + expression + eye contact
24. Multi-dummy interaction (only if multiple dummies)
```

### Natural Language Assembly

```javascript
function assembleNaturalLanguage(fields, model) {
  const parts = [];

  if (model.qualityPrefix.length) {
    parts.push(model.qualityPrefix.join(', '));
  }

  parts.push('photorealistic photography, RAW photo');

  // Identity
  const ethnicity = getPromptValue(fields, 'ethnicity');
  const age = getPromptValue(fields, 'age');
  if (ethnicity && age) parts.push(`${ethnicity}, ${age}`);
  else if (ethnicity) parts.push(ethnicity);
  else if (age) parts.push(age);

  // Physique
  const bodyType = getPromptValue(fields, 'body_type');
  const height = getPromptValue(fields, 'height');
  const skinTone = getPromptValue(fields, 'skin_tone');
  if (bodyType || height) parts.push([height, bodyType].filter(Boolean).join(', '));
  if (skinTone) parts.push(`${skinTone} skin`);

  const skinDetails = getPromptValues(fields, 'skin_detail');
  if (skinDetails.length) parts.push(skinDetails.join(', '));

  // Bust
  const bustSize = getPromptValue(fields, 'bust_size');
  const bustShape = getPromptValue(fields, 'bust_shape');
  if (bustSize) parts.push(`${bustShape ? bustShape + ', ' : ''}${bustSize} breasts`);

  // Lower body
  const hips = getPromptValue(fields, 'hips');
  const ass = getPromptValue(fields, 'ass');
  const legs = getPromptValue(fields, 'legs');
  if (hips || ass || legs) parts.push([hips, ass, legs].filter(Boolean).join(', '));

  // Face
  const faceShape = getPromptValue(fields, 'face_shape');
  const eyeShape = getPromptValue(fields, 'eye_shape');
  const eyeColor = getPromptValue(fields, 'eye_color');
  const nose = getPromptValue(fields, 'nose');
  const lips = getPromptValue(fields, 'lips');
  if (faceShape) parts.push(`${faceShape} face`);
  if (eyeShape || eyeColor) parts.push([eyeColor, eyeShape, 'eyes'].filter(Boolean).join(' '));
  if (nose) parts.push(`${nose} nose`);
  if (lips) parts.push(`${lips} lips`);

  // Hair
  const hairColor = getPromptValue(fields, 'hair_color');
  const hairLength = getPromptValue(fields, 'hair_length');
  const hairStyles = getPromptValues(fields, 'hair_style');
  if (hairColor || hairLength || hairStyles.length) {
    parts.push([hairColor, hairLength, hairStyles.join(', '), 'hair'].filter(Boolean).join(' '));
  }

  // Makeup
  const foundation = getPromptValue(fields, 'foundation');
  const eyeMakeup = getPromptValues(fields, 'eye_makeup');
  const lipMakeup = getPromptValue(fields, 'lip_makeup');
  const blushEffects = getPromptValues(fields, 'blush_effects');
  const makeupParts = [foundation, ...eyeMakeup, lipMakeup, ...blushEffects].filter(Boolean);
  if (makeupParts.length) parts.push(`${makeupParts.join(', ')} makeup`);

  // Clothing
  const completeOutfit = getPromptValue(fields, 'complete_outfit');
  if (completeOutfit) {
    parts.push(completeOutfit === 'nude' ? 'nude, naked' : `wearing ${completeOutfit}`);
  } else {
    const upperType = getPromptValue(fields, 'upper_type');
    const upperStyle = getPromptValues(fields, 'upper_style');
    const upperColor = getPromptValue(fields, 'upper_color');
    const upperMaterial = getPromptValue(fields, 'upper_material');
    const upperFit = getPromptValue(fields, 'upper_fit');
    if (upperType && upperType !== 'naked') {
      parts.push([upperFit, upperStyle.join(', '), upperColor, upperMaterial, upperType].filter(Boolean).join(' '));
    }

    const lowerType = getPromptValue(fields, 'lower_type');
    const lowerColor = getPromptValue(fields, 'lower_color');
    const lowerFit = getPromptValue(fields, 'lower_fit');
    if (lowerType && lowerType !== 'naked') {
      parts.push([lowerFit, lowerColor, lowerType].filter(Boolean).join(' '));
    }
  }

  const legwear = getPromptValues(fields, 'legwear');
  if (legwear.length && !legwear.includes('none')) parts.push(legwear.join(', '));

  const footwear = getPromptValue(fields, 'footwear');
  if (footwear && footwear !== 'barefoot') parts.push(footwear);

  const accessories = getPromptValues(fields, 'accessories');
  if (accessories.length) parts.push(accessories.join(', '));

  // Scene
  const location = getPromptValue(fields, 'location');
  const scene = getPromptValue(fields, 'scene');
  const background = getPromptValue(fields, 'background');
  const timeOfDay = getPromptValue(fields, 'time_of_day');
  if (location) parts.push(`in a ${location}`);
  if (scene) parts.push(scene);
  if (background) parts.push(`${background} background`);
  if (timeOfDay) parts.push(timeOfDay);

  // Lighting
  const lightStyle = getPromptValue(fields, 'lighting_style');
  const lightColor = getPromptValue(fields, 'lighting_color');
  const lightEffects = getPromptValues(fields, 'lighting_effects');
  if (lightStyle || lightColor || lightEffects.length) {
    parts.push([lightColor, lightStyle, 'lighting', ...lightEffects].filter(Boolean).join(', '));
  }

  // Camera
  const framing = getPromptValue(fields, 'camera_framing');
  const lens = getPromptValue(fields, 'camera_lens');
  const angle = getPromptValue(fields, 'camera_angle');
  const dof = getPromptValue(fields, 'depth_of_field');
  if (framing) parts.push(framing);
  if (lens) parts.push(`${lens} lens`);
  if (angle) parts.push(angle);
  if (dof) parts.push(dof);

  // Pose & expression
  const poses = getPromptValues(fields, 'pose');
  const expression = getPromptValue(fields, 'expression');
  const eyeContact = getPromptValue(fields, 'eye_contact');
  if (poses.length) parts.push(poses.join(', '));
  if (expression) parts.push(expression);
  if (eyeContact) parts.push(eyeContact);

  return parts.filter(Boolean).join(', ');
}
```

### Multi-Dummy Prompt Assembly

```javascript
function assembleMultiDummyPrompt(dummies, interactionFields, model) {
  if (dummies.length === 1) {
    return assemblePromptForModel(dummies[0].fields, model);
  }

  const prefixes = ['1girl', '2girls', '3girls'];
  const parts = [];

  // Quality prefix
  if (model.qualityPrefix.length) {
    parts.push(model.qualityPrefix.join(', '));
  }

  parts.push('photorealistic photography, RAW photo');
  parts.push(`${prefixes[dummies.length - 1]}`);

  // Each dummy's full attribute block
  for (let i = 0; i < dummies.length; i++) {
    const dummyPrompt = assemblePromptForModel(dummies[i].fields, model, { skipQualityPrefix: true });
    parts.push(`(${i + 1}girl: ${dummyPrompt})`);
  }

  // Interaction block (appended after all dummies)
  const interaction = getPromptValue(interactionFields, 'interaction_type');
  const focus = getPromptValue(interactionFields, 'focus');
  const relationship = getPromptValue(interactionFields, 'relationship_dynamic');
  const proximity = getPromptValue(interactionFields, 'proximity');

  const interactionParts = [interaction, focus, relationship, proximity].filter(Boolean);
  if (interactionParts.length) parts.push(interactionParts.join(', '));

  return parts.join(', ');
}
```

### Negative Prompt Assembly

```javascript
function assembleNegativePrompt(model, userOverride = null) {
  if (userOverride) return userOverride;

  const base = model.defaultNegative;

  // Universal additions regardless of model
  const universal = [
    'multiple views', 'comic', 'cartoon', 'anime', 'illustration',
    'painting', 'sketch', 'render', 'CGI', '3d render',
    'bad hands', 'extra fingers', 'missing fingers', 'deformed hands',
    'bad face', 'ugly face', 'asymmetric face',
  ];

  return [...base, ...universal].join(', ');
}
```