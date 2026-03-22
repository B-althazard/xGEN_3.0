chroma1_HD-Advanced_Techniques.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Advanced Techniques

> Advanced techniques for detailed and creative FLUX prompts

<Note>
  This guide assumes familiarity with [fundamental prompting principles](/guides/prompting_guide_t2i_fundamentals) and [enhancement techniques](/guides/prompting_guide_t2i_essentials).
</Note>

## Layered Compositions

Work with different depths in your image for professional results.

<Steps>
  <Step title="Foreground: What's closest to the viewer">
    "A vintage camera resting on a wooden desk in sharp focus"
  </Step>

  <Step title="Middle Ground: The main subject area">
    "with a photographer adjusting lens settings"
  </Step>

  <Step title="Background: Setting the scene">
    "in a sunlit studio with photography equipment and softly blurred windows"
  </Step>
</Steps>

<Card title="Complete Layered Prompt" horizontal img="https://cdn.sanity.io/images/gsvmb6gz/production/243935d5e1f7cd06f9fe84a8895f16a559433a6c-2752x1536.jpg">
  "A vintage camera resting on a wooden desk in sharp focus, with a photographer adjusting lens settings, in a sunlit studio with photography equipment and softly blurred windows, shot with shallow depth of field to separate the layers"
</Card>

## Style Fusion

Combine multiple artistic approaches for unique results.

* **Primary Style**: "Art Nouveau flowing lines and organic forms"
* **Secondary Style**: "with geometric Bauhaus elements and bold typography"
* **Unifying Element**: "rendered in a cohesive emerald and gold color palette"

<Card title="Style Fusion Example" horizontal img="https://cdn.sanity.io/images/gsvmb6gz/production/f11c404eed10d12b215b7a07e601bf41e7fcc4bb-1392x752.jpg">
  "Ancient Greek marble statue precision and anatomical detail, infused with cyberpunk neon lighting, holographic overlays, and electric blue/magenta glow effects, set against dark futuristic environments"
</Card>

***

## Professional Photography Mastery

### Camera Control Principles

Use specific camera terminology for better photo-style images. FLUX understands technical specs as creative intent, not just numbers.

**Camera terms:**

* **f-number (like f/1.8 or f/8)** = how blurry vs. sharp your background is. Small numbers (f/1.8) blur the background; big numbers (f/8) keep everything sharp.
* **mm (like 24mm or 85mm)** = how much of the scene you see and how "zoomed in" it looks. Small numbers (24mm) show wide scenes; big numbers (85mm) zoom in closer.
* **ISO** = how bright the image is in low light. Low ISO = clean image; high ISO = brighter but grainy.

These are optional controls - lighting and composition matter more for great results.

### Lighting Principles

<AccordionGroup>
  <Accordion title="Portrait Lighting Basics">
    **Rembrandt lighting** (45° key light) creates a triangle of light on the face for dramatic portraits:

    *"A person, portrait with Rembrandt lighting, key light at 45 degrees, dramatic chiaroscuro effect"*

    **Split lighting** (90° side light) illuminates half the face for high contrast:

    *"A person, artistic portrait, split lighting, strong side illumination, dramatic contrast"*

    <Columns cols={2}>
      <Frame caption="Rembrandt lighting">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/ae53f6422efdaf3f51e1e0bd928d7c3952e8a7de-1392x752.jpg" alt="Rembrandt lighting" />
      </Frame>

      <Frame caption="Split lighting">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/284c21b1028f62e395461f7e7e3142f2c7823386-1392x752.png" alt="Split lighting" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Environmental Light Quality">
    **Window Light** = soft even illumination

    *"A mid century style living room, large north-facing window light, soft even illumination"*

    **Golden hour** = warm and soft

    *"A mid century style living room, large north-facing window light, warm and soft"*

    **Blue hour** = blue hour and moody

    *"A mid century style living room, large north-facing window light, blue hour and moody"*

    **Overhead artificial light** = harsh and dramatic

    *"A mid century style living room, lit by a single overhead lamp, harsh and dramatic shadows"*

    <Columns cols={2}>
      <Frame caption="Window Light">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d95a5129f006cd34e184451a5e813be3f3237409-1392x752.jpg" alt="Golden hour" />
      </Frame>

      <Frame caption="Golden hour">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/b9635dc280dfaaba1684083b0f8bbb145eeb3ebf-1392x752.jpg" alt="Blue hour" />
      </Frame>

      <Frame caption="Blue hour">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/6fcccf61808d5cb23b8339a52ade9cd7adf435e3-1392x752.jpg" alt="Blue hour" />
      </Frame>

      <Frame caption="Overhead artificial light">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/9487dd7f4c2ac8a16f5a4ce130ffa010fa57f7f2-1392x752.jpg" alt="Overhead artificial light" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Cinematic Styles">
    **Chiaroscuro** = high contrast light/shadow for drama:

    *"Film noir detective scene, single practical desk lamp, strong chiaroscuro lighting"*

    **Practical lighting** = visible light sources in scene for realism:

    *"Cyberpunk street scene, neon signs and LED strips providing atmospheric lighting"*

    <Columns cols={2}>
      <Frame caption="Chiaroscuro">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/4ac0d069fa68429339f919d528e7c88e403184d6-1392x752.jpg" alt="Chiaroscuro" />
      </Frame>

      <Frame caption="Practical lighting">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/ae31cf4f6cd3d434bddbf7d5659be68fd03c3d91-1392x752.jpg" alt="Practical lighting" />
      </Frame>
    </Columns>
  </Accordion>
</AccordionGroup>

### Composition Concepts

<AccordionGroup>
  <Accordion title="Creating Depth & Interest">
    **Rule of thirds** places subjects on intersection points for natural balance:
    *"Landscape composition, rule of thirds horizon placement, balanced and natural"*

    **Leading lines** guide the eye toward your subject:
    *"Architectural photography, diagonal lines leading to main entrance"*

    **Foreground/background layers** create 3D depth:
    *"Strong foreground boulder, middle ground lake, background mountains"*

    <Columns cols={2}>
      <Frame caption="Rule of thirds">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/4512e4e29ef63af03bde8714597464ed231cf9e8-1392x752.jpg" alt="Rule of thirds" />
      </Frame>

      <Frame caption="Foreground/background layers">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d9c6fe99741e58199c4a966be25ed2fdf709c111-1392x752.jpg" alt="Foreground/background layers" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Camera Angles for Impact">
    **Low angle** (worm's eye view) makes subjects powerful and dominant:
    *"Architectural photography, low angle worm's eye view, dramatic diagonal lines"*

    **High angle** (bird's eye view) shows patterns and relationships:
    *"Urban scene, bird's eye view, geometric patterns of city blocks"*

    **Dutch angle** (tilted camera) adds tension and unease:
    *"Thriller scene, dutch angle, psychological tension and unbalanced feeling"*

    <Columns cols={2}>
      <Frame caption="Low angle">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/cc94cae34add72df606cc44d078aa07a5b59e71c-2752x1536.jpg" alt="Low angle" />
      </Frame>

      <Frame caption="High angle">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d2f1b3586ce1582ad98780fef80de7e14af31cf7-2752x1536.jpg" alt="High angle" />
      </Frame>
    </Columns>
  </Accordion>
</AccordionGroup>

### Cinematic Techniques

Reference film styles and cinematography for dramatic results.

* **Lighting**: "Dramatic chiaroscuro lighting in the style of Roger Deakins cinematography"
* **Color Grading**: "with teal and orange color grading reminiscent of Blade Runner 2049"
* **Camera Angle**: "captured with slight Dutch angle for psychological tension"

<Columns cols={2}>
  <Frame caption="'Film noir detective in rain-soaked alley with dramatic lighting'">
    <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d9b0bae38f4e695864b7ddd6766b16b8336d3567-2752x1536.png" alt="Cinematic Example 1" />
  </Frame>

  <Frame caption="'Film noir detective in rain-soaked alley, 35mm lens, f/2.0, ISO 1600, dramatic chiaroscuro lighting, teal and orange color grading, slight Dutch angle'">
    <img src="https://cdn.sanity.io/images/gsvmb6gz/production/7b04bdfe19575b5dfc44249f86ace7097e7332e2-2752x1536.png" alt="Cinematic Example Enhanced" />
  </Frame>
</Columns>

***

## Text Integration & Typography

<Info>
  For working with existing text in images, see the [Image-to-Image text editing section](/guides/prompting_guide_kontext_i2i#text-editing).
</Info>

### Text Rendering Capabilities

FLUX handles text exceptionally well when prompted correctly.

<Steps>
  <Step title="Enclose in Quotation Marks">
    Use quotes for exact text: "COFFEE SHOP" or "Est. 1952"
  </Step>

  <Step title="Describe Placement">
    "The text 'OPEN' appears in red neon letters above the door"
  </Step>

  <Step title="Specify Font Style">
    "elegant serif typography" or "bold industrial sans-serif lettering"
  </Step>
</Steps>

**Text Example**:
"Vintage storefront with the text 'BELLA'S BAKERY' in elegant serif typography painted in gold letters on the large front window"

<Frame>
  <img src="https://cdn.sanity.io/images/gsvmb6gz/production/13ad6a22e7b718af7106029788ec033118a8dbd8-2752x1536.jpg" alt="Text rendering example" />
</Frame>

### Typography Basics

<AccordionGroup>
  <Accordion title="Font Character & Effects">
    **Serif fonts** = traditional, formal, readable\
    **Sans-serif** = modern, clean, minimal\
    **Script** = elegant, vintage, decorative\
    **Display** = bold, impactful headlines

    **3D text** adds dimension: "raised chrome letters with realistic metal reflections"\
    **Neon effects** create atmosphere: "glowing neon text with electric blue light"\
    **Vintage signs** add authenticity: "weathered painted text with chipped paint and rust"
  </Accordion>

  <Accordion title="Text Integration & Placement">
    **Environmental Integration**: "carved directly into the ancient stone wall"\
    **Object-Based Text**: "printed on a newspaper being read by the character"\
    **Atmospheric Text**: "spelled out in glowing constellation stars across the night sky"
  </Accordion>

  <Accordion title="Text Quality Tips">
    * **Front-load text descriptions** in your prompt for better accuracy
    * **Be specific about font style** rather than using generic terms
    * **Describe text color and effects** for visual impact
    * **Include text integration** with environment for realism
    * **Use quotation marks** around exact text you want rendered
  </Accordion>
</AccordionGroup>

<Info>
  **Cross-reference**: For systematic prompt building that includes text elements, review the [Enhancement Layers approach](/guides/prompting_guide_t2i_essentials#enhancement-patterns-by-use-case).
</Info>


Built with [Mintlify](https://mintlify.com).