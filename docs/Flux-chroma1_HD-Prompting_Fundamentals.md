chroma1_HD-Prompting_Fundamentals.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Prompting Fundamentals

> Learn the core framework for writing effective FLUX text-to-image prompts, including structure, style, and context.

<Note>
  This guide covers hosted FLUX models, but most concepts apply to all FLUX models. After reading about those fundamentals, explore [practical enhancement techniques](/guides/prompting_guide_t2i_essentials).
</Note>

## What is prompting?

Prompting is how you tell the model what to render. Clear prompts make better images. Below: the same idea with a short prompt vs. a detailed one.

<Columns cols={2}>
  <Frame caption="Basic Astronaut Prompt">
    <img src="https://cdn.sanity.io/images/gsvmb6gz/production/4620e8990429d74b6ae2db764a9d210521417f8c-2752x1536.jpg" alt="Basic portrait" />
  </Frame>

  <Frame caption="Detailed Astronaut Prompt">
    <img src="https://cdn.sanity.io/images/gsvmb6gz/production/b148b85dfd78522eb00ccf11b78402f7c4c45335-2752x1536.jpg" alt="Basic concept art" />
  </Frame>
</Columns>

**What changed?** The detailed version includes more specifics about style and atmosphere, which gives you better images.

<AccordionGroup>
  <Accordion title="Basic Astronaut Prompt">
    *"An astronaut with a silver spacesuit and blue helmet visor, floating gracefully outside the International Space Station with Earth below"*
  </Accordion>

  <Accordion title="Detailed Astronaut Prompt">
    *"An astronaut with a silver spacesuit and blue helmet visor, floating outside the International Space Station with Earth's blue curve visible below, cinematic photography with dramatic lighting, shot on IMAX camera, bathed in golden sunlight from the terminator line, with deep blue and white Earth tones, composed using rule of thirds, shallow depth of field, 85mm lens, film grain texture, conveying a sense of wonder and human achievement, peaceful and awe-inspiring"*
  </Accordion>
</AccordionGroup>

## Basic Prompt Structure

Use this framework for reliable results:

> **Subject + Action + Style + Context**

**Framework Structure:**

* **Subject**: The main focus (person, object, character)
* **Action**: What the subject is doing or their pose
* **Style**: Artistic approach, medium, or aesthetic
* **Context**: Setting, lighting, time, mood, or atmospheric conditions

<Card title="Red Fox Example" horizontal img="https://cdn.sanity.io/images/gsvmb6gz/production/8d1b4ae89eed8dde8c55c52559aa6c1008d5bc35-1730x965.jpg">
  - **Subject**: Red fox
  - **Action**: sitting in tall grass
  - **Style**: wildlife documentary photography
  - **Context**: misty dawn

  **Result**: *"Red fox sitting in tall grass, wildlife documentary photography, misty dawn"*
</Card>

<Card title="Human Explorer Example" horizontal img="https://cdn.sanity.io/images/gsvmb6gz/production/2ece687d9dbad9b713ea052637a25ef00fe6c5e1-2752x1536.jpg">
  * **Subject**: Human explorer
  * **Action**: walking through cyberpunk forest
  * **Style**: sci-fi fantasy art style
  * **Context**: dramatic atmospheric lighting

  **Result**: *"Human explorer in futuristic gear walking through cyberpunk forest, dramatic atmospheric lighting, sci-fi fantasy art style, cinematic composition"*
</Card>

## Structured descriptions beat keyword lists

FLUX responds best to **structured descriptions** that mix natural relationships with direct specifications.

* **Disconnected keywords (weak)**: "Woman, red dress, beach, sunset, happy, smiling, waves, golden light"
* **Overwritten prose (bloated)**: "A joyful woman ... warm sunset light illuminating her smile"
* **Structured (best)**: "A joyful woman in a flowing red dress walks along a sandy beach, golden hour, gentle waves, warm lighting"

Why it works:

* Natural language handles relationships and spatial cues
* Short, direct specs cover lighting, time, atmosphere
* Fewer filler words; clearer intent

## Prompt length guidelines

<Tip>FLUX supports up to 512 tokens.</Tip>

Pick the length to match complexity:

* **Short (10–30 words)**: Simple ideas, fast iteration. Example: "Serene mountain lake at dawn, watercolor style"
* **Medium (30–80 words)**: Most scenes. Enough control without bloat.
* **Long (80+ words)**: Multi-subject or technical requirements. Use sparingly.

<Warning>Start short. Add only what changes the image.</Warning>

## Word order importance

FLUX pays more attention to words and concepts mentioned **earlier** in your prompt. Structure your prompts strategically by front-loading the most important elements.

1. **Lead with the subject**: Put the main thing first.
2. **Then the action**: Describe what it’s doing.
3. **Add style**: Artistic approach or medium.
4. **Add context**: Setting and lighting that shape everything.
5. **Finish with details**: Secondary and atmospheric elements.

### Poor word order

> "In a mystical forest with ancient trees and glowing mushrooms, featuring dramatic lighting and a fantasy art style, there stands a powerful wizard casting a spell with magical energy swirling around him"

**Problems:**

* Context details come first
* Main subject (wizard) is buried at the end
* Key action (casting spell) gets less attention

### Front-loaded word order

> "A powerful wizard casting a spell with magical energy swirling around him, fantasy art style with dramatic lighting, standing in a mystical forest with ancient trees and glowing mushrooms"

**Advantages:**

* Wizard (main subject) is front and center
* Spell casting (key action) gets priority
* Style and environment support the main elements

### Front-loading Examples

**Character-focused scenes**\
Start with character description and primary action, follow with style and environmental context.

> *Example*: "A confident astronaut floating in zero gravity, reaching toward a distant star, cinematic sci-fi style, in the vastness of space with Earth visible below"

**Context-focused scenes**\
Start with the main setting or architectural element, follow with atmospheric details and style.

> *Example*: "An ancient gothic cathedral with soaring arches and stained glass windows, dramatic chiaroscuro lighting, interior view with dust motes floating in colored light beams"

<Info>For use‑case patterns, see [Enhancement Patterns](/guides/prompting_guide_t2i_essentials#enhancement-patterns-by-use-case).</Info>

## Key takeaways

* **Write naturally**; avoid raw keyword dumps
* **Use the core structure**: Subject + Action + Style + Context
* **Front‑load what matters** to steer the image
* **Right-size the length** (30–80 words often hits the sweet spot)
* **Iterate**; adjust one variable at a time

<Note>Include mood, lighting, texture, and spatial detail when it actually changes the result.</Note>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Elements feel disconnected">
    Write how things relate instead of listing them separately.

    `"Cat, sunny day, park bench, reading"` becomes `"A tabby cat lounging on a sun-warmed park bench while a person reads nearby"`

    <Columns cols={2}>
      <Frame caption="Disconnected prompt">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/ace2572c2eb28325e6841c6e50dbfdc8b6d6e572-1392x752.jpg" alt="Disconnected prompt" />
      </Frame>

      <Frame caption="Connected prompt">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/9e74f311029a9525ec77e12c412ddc66eccf90e7-1392x752.jpg" alt="Connected prompt" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Style isn't coming through">
    Be specific about style elements and put them early in your prompt.

    `"Make it artistic"` becomes `"Oil painting with visible brushstrokes and rich impasto texture"`

    <Columns cols={2}>
      <Frame caption="Prompt with generic style">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/799ee5ba8f7bbcb438464a836e5c9b24e43d6ea0-1392x752.jpg" alt="Prompt with generic style" />
      </Frame>

      <Frame caption="Prompt with specific style">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/bb65bb51bc07df3ab8864d993d926c4630274c84-1392x752.jpg" alt="Prompt with specific style" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Getting unwanted elements">
    Focus on describing what you want rather than what you don't want.

    `"A garden outside, no rain, no dead plants, not bad mood"` becomes `"A healthy garden outside with many different flowers, good mood, sunset gold light"`

    <Columns cols={2}>
      <Frame caption="Prompt with negatives">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/bc4c33640ba23289facaa832f2279eb145200233-2752x1536.jpg" alt="Prompt with negatives" />
      </Frame>

      <Frame caption="Prompt without   negatives">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/418690c0746064317355fba14f597a9d3b10e7ef-2752x1536.jpg" alt="Prompt without negatives" />
      </Frame>
    </Columns>

    <Info>
      Learn more: [Working Without Negative Prompts](/guides/prompting_guide_t2i_negative)
    </Info>
  </Accordion>
</AccordionGroup>


Built with [Mintlify](https://mintlify.com).