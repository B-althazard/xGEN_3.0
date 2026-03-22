chroma1_HD-Prompting_Essentials.md

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.bfl.ml/llms.txt
> Use this file to discover all available pages before exploring further.

# Prompting Essentials

> Enhance your FLUX text-to-image prompts with lighting, color, composition, and atmosphere techniques.

<Note>
  Before going into enhancements, make sure you read the [core prompting framework](/guides/prompting_guide_t2i_fundamentals#basic-prompt-structure) covered in Fundamentals.
</Note>

## Building on the Foundation

With your base **Subject + Action + Style + Context**, add details that will make your image even better.

### The Enhancement Hierarchy

<Steps>
  <Step title="Foundation (Required)">
    Start with the [core framework](/guides/prompting_guide_t2i_fundamentals#basic-prompt-structure). Keep it short and specific.
  </Step>

  <Step title="Visual polish">
    Add specific visual details that refine the mood and composition:

    * **Lighting**: "bathed in golden sunlight from the terminator line"
    * **Color palette**: "deep blue and white Earth tones"
    * **Composition**: "composed using rule of thirds"
  </Step>

  <Step title="Technical precision">
    Add camera and artistic details:

    * **Camera settings**: "shallow depth of field, 85mm lens"
    * **Film/texture**: "film grain texture"
    * **Quality markers**: "shot on IMAX camera"
  </Step>

  <Step title="Atmosphere and intent">
    Set the vibe or mood:

    * **Mood**: "moody style", "peaceful", "chill", "uplifting"
    * **Atmosphere**: "relaxed evening", "soft morning light", "cozy", "dreamy"
    * **Narrative element**: "hint of mystery", "carefree moment", "quiet solitude"
  </Step>
</Steps>

## Practical Enhancement Examples

<AccordionGroup>
  <Accordion title="Portrait Photography Enhancement">
    **Foundation**: "Professional headshot of a young entrepreneur with a happy expression"

    **+ Visual Layer**: "wearing a navy blazer over white shirt, sitting in modern office with city skyline background"

    **+ Technical Layer**: "shot with 85mm lens at f/2.8, shallow depth of field"

    **+ Atmospheric Layer**: "soft natural lighting from large window, clean corporate aesthetic, confident and approachable demeanor"

    <Columns cols={2}>
      <Frame caption="Foundation only">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/89826c00c421fae600a36109b357beb370b6c275-2752x1536.jpg" alt="Basic portrait" />
      </Frame>

      <Frame caption="Fully enhanced">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/6bca9942c3235a55a98204e2e5a2df687aaed706-2752x1536.jpg" alt="Enhanced portrait" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Concept Art Enhancement">
    **Foundation**: "Futuristic cityscape with flying cars and neon signs"

    **+ Visual Layer**: "Neo-Tokyo setting with sleek vehicles weaving between glass skyscrapers, holographic advertisements in Japanese and English"

    **+ Technical Layer**: "concept art style with painterly brushstrokes, low-angle perspective emphasizing scale"

    **+ Atmospheric Layer**: "dramatic purple and cyan color palette, cyberpunk atmosphere with rain-slicked streets reflecting neon lights, sense of technological advancement and urban density"

    <Columns cols={2}>
      <Frame caption="Foundation only">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d0cae05794dea901ed2cd2e09b9292ae132c95c6-2752x1536.jpg" alt="Basic concept art" />
      </Frame>

      <Frame caption="Fully enhanced">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/84e391d34bd66039dc64b25475325068e9089373-2752x1536.jpg" alt="Enhanced concept art" />
      </Frame>
    </Columns>
  </Accordion>

  <Accordion title="Product Photography Enhancement">
    **Foundation**: "Luxury perfume bottle on elegant surface"

    **+ Visual Layer**: "Crystal bottle with gold accents and 'ESSENCE' engraved label, positioned on black marble surface"

    **+ Technical Layer**: "shot with macro lens for sharp detail, professional studio lighting with key light and subtle rim lighting"

    **+ Atmospheric Layer**: "minimalist composition with negative space, high-end commercial photography style, sophisticated and premium feeling"

    <Columns cols={2}>
      <Frame caption="Foundation only">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/cf0aa8b1a1ebe52848b35f0a5a7e6f4a28f19d0d-2752x1536.jpg" alt="Basic product shot" />
      </Frame>

      <Frame caption="Fully enhanced">
        <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d6ed20e4868ee54c0becea47d27415c1f2258327-2752x1536.jpg" alt="Enhanced product shot" />
      </Frame>
    </Columns>
  </Accordion>
</AccordionGroup>

## Quick start templates

Use these templates as starting points for common use cases:

<Tabs>
  <Tab title="Portrait">
    **Template**: `[Subject description], [pose/expression], [style], [lighting], [background]`

    **Example**: "Professional businesswoman in navy blazer, confident smile, corporate photography style, natural window lighting, modern office background"

    <Frame>
      <img src="https://cdn.sanity.io/images/gsvmb6gz/production/6bca9942c3235a55a98204e2e5a2df687aaed706-2752x1536.jpg" alt="Basic portrait" />
    </Frame>
  </Tab>

  <Tab title="Product">
    **Template**: `[Product details], [placement], [lighting setup], [style], [mood]`

    **Example**: "Luxury perfume bottle on elegant surface, crystal bottle with gold accents and 'ESSENCE' engraved label, positioned on black marble surface, minimalist composition with negative space, high-end commercial photography style, sophisticated and premium feeling"

    <Frame>
      <img src="https://cdn.sanity.io/images/gsvmb6gz/production/d6ed20e4868ee54c0becea47d27415c1f2258327-2752x1536.jpg" alt="Basic product shot" />
    </Frame>
  </Tab>

  <Tab title="Landscape">
    **Template**: `[Location/setting], [time/weather], [camera angle], [style], [atmosphere]`

    **Example**: "Mountain lake reflection, golden hour with mist, wide-angle landscape, painterly style, serene and majestic, shot with wide-angle lens, natural light, crisp details throughout"

    <Frame>
      <img src="https://cdn.sanity.io/images/gsvmb6gz/production/f81110ee63faadda95f7f6e80553ec03c3fe72ef-2752x1536.jpg" alt="Basic portrait" />
    </Frame>
  </Tab>

  <Tab title="Architecture">
    **Template**: `[Building/space], [perspective], [lighting], [style], [mood]`

    **Example**: "Modern glass skyscraper, low angle view, dramatic evening lighting, architectural photography, impressive and sleek"

    <Frame>
      <img src="https://cdn.sanity.io/images/gsvmb6gz/production/dd87a0c5afd898c059875774b1d8db0571d0fa0f-2752x1536.jpg" alt="Basic concept art" />
    </Frame>
  </Tab>
</Tabs>

## Enhancement Patterns by Use Case

<Tabs>
  <Tab title="Character-focused">
    **Lead with character details, follow with setting enhancements**

    Pattern: Detailed character description → Action/pose → Style → Context → Atmospheric mood

    Example: "A weathered sea captain with salt-and-pepper beard and piercing blue eyes, standing confidently at ship's wheel, traditional maritime portrait style, on deck of sailing vessel with stormy seas, dramatic lighting with spray and wind"
  </Tab>

  <Tab title="Context-focused">
    **Start with location, add atmospheric and technical details**

    Pattern: Setting/location → Atmospheric conditions → Style → Technical specs → Emotional tone

    Example: "Ancient gothic cathedral interior with soaring ribbed vaults and rose windows, golden hour light streaming through stained glass, architectural photography style, wide-angle lens capturing vertical grandeur, sense of spiritual awe and historical weight"
  </Tab>

  <Tab title="Style-focused">
    **Begin with artistic reference, build subject and context around it**

    Pattern: Artistic style → Subject → Context → Technical execution → Mood reinforcement

    Example: "Art Nouveau flowing organic forms and elegant typography, depicting a graceful dancer in flowing silk dress, surrounded by stylized floral motifs, hand-drawn illustration with gold leaf accents, romantic and ethereal atmosphere"
  </Tab>

  <Tab title="Technical-focused">
    **Front-load camera/lighting specs for photographic precision**

    Pattern: Camera settings → Lighting setup → Subject → Composition → Quality markers

    Example: "Shot at f/1.4 with 85mm lens, professional studio lighting with softbox key and rim lights, elegant model in minimalist pose, clean white background, shallow depth of field, commercial fashion photography quality"
  </Tab>
</Tabs>

<Tip>
  For more complex techniques, explore [Advanced Techniques](/guides/prompting_guide_t2i_advanced) for layered compositions, style fusion, and cinematic approaches.
</Tip>

## Quality check before you hit Generate

Make a quick pass for:

* **Foundation**: Core elements present ([see framework](/guides/prompting_guide_t2i_fundamentals#basic-prompt-structure)).
* **Balance**: Enhancements support rather than drown the subject.
* **Specificity**: Swap vague words for concrete descriptors.
* **Order**: Lead with what matters most ([word order](/guides/prompting_guide_t2i_fundamentals#word-order-importance)).
* **Cohesion**: Everything points at the same idea.


Built with [Mintlify](https://mintlify.com).