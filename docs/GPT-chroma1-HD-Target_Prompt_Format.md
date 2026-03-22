chroma1-HD-Target_Prompt_Format.md

# Target prompt format

## Prompting Tips
Chroma is sensitive to prompting. It understands plain English (natural language), you can also rely on the official Black Forest Labs or CivitAI Flux guides as a starting point.
It supports negative prompts, but use them sparingly (only if you see unwanted text or style bleed).
🎨 The "Aesthetic" Tag

If you're unfamiliar with the aesthetic tag, check out my other guide for a full breakdown. In short: using this tag can significantly improve output quality, but it works best on stylized images.
Using the aesthetic tag with a number (e.g., aesthetic 7, aesthetic 9) allows you to define the image style without using LoRAs.
	- aesthetic 6: Gives an amateur result with pale / flat colors.
    - aesthetic 10: Delivers a professional artist style with high contrast and vibrant colors.

💡 Tip: Use this tag primarily to fix quality issues. If your generation already looks good, adding this tag might be unnecessary.
✒️ Power in Simplicity

A concise, structured prompt beats a verbose one.
❌ Bad Prompt:

“A cat sitting on a vintage chair, against blue wallpaper with golden flowers that emphasize the aristocratic atmosphere of the room, giving the whole image a noble and majestic vibe...”
(The phrase “aristocratic atmosphere” confuses the model).
✅ Good Prompt:

“Painting of a cat, sitting on a vintage chair. Behind him, blue wallpaper with golden details. Soft cinematic lighting.”
(Short, direct, effective).

## Realism Prompts
To achieve realism, stop using SD1.5 keywords like hyper-realistic, 8k, UHD. These tokens often hurt Flux-based models.
Instead, define the medium and context:

1. Source: "Posted on Reddit", "Instagram photo", "Dashboard cam".
2. Lighting: "Hard flash", "Natural morning light".
3. Style: "Candid amateur photograph", "Retro snapshot".

### Realism Example:
"A stylish young person with short curly hair is enjoying a bowl of ramen noodles. They wear oversized white sunglasses with orange-tinted lenses and a white blazer, exuding a retro yet modern aesthetic. They are holding chopsticks, lifting steaming noodles toward their mouth, while resting their head lazily on one hand. The ramen bowl is ornate with a blue pattern, filled with rich red broth, noodles, vegetables, and pieces of meat. The setting has a sunlit, cinematic vibe with soft golden light casting strong shadows against a tiled wall in the background. The mood is vibrant, fashionable, and slightly playful, like a scene from a trendy editorial photoshoot."

### Amateur/Social Media Example:
"This is a candid amateur 2010s-era photograph, posted on social media sites such as Reddit, Instagram, Twitter, Snapchat or OnlyFans. The subject is a normal person with natural skin, captued in real life. This is a close-up headshot photograph of a young woman with long hair and a large bust wearing a polka dot string bikini, standing on a windswept beach and illuminated by golden rays of sunshine at dawn."
"digital_media_(artwork), absurd_res, surreal, retro_snapshot.A candid self-portrait of a gothic-inspired young woman holding a vintage Canon PowerShot digital camera, the display screen showing her mirrored pose with a peace sign.She has long dark hair with bangs, subtle eyeliner, and a confident smirk. Her nails are long with black-and-white Hello Kitty themed nail art, the same stickers decorating the old camera.She wears a black choker and layered jewelry, adding to the gothic aesthetic.Background is minimal — a plain white wall and beige curtains, softly illuminated by flat artificial lighting.The image carries the nostalgic feeling of early 2000s bedroom snapshots, lo-fi casual realism, indie internet culture vibe."

## Multiple Characters
Use names
Brian is {define brian}
David is {define david}
Brian is leaning against the counter with a beer in hand. David is standing with his hands in his pockets.
You won't have a 100% success rate but if you give it a couple attempts you should get a good result

* sources
https://huggingface.co/lodestones/Chroma1-HD
https://civitai.com/articles/19951/chroma-guide-v06
https://docs.bfl.ml/guides/prompting_summary