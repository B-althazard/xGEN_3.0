# Plan: Generate Venice.ai Batch Prompt Userscript

## Goal
Create a ViolentMonkey userscript (`batch-prompt_img-testing.user.js`) in `docs/batchPromptUserScript/` that automates batch prompt testing and image downloading on Venice.ai.

## Input Files (all in `docs/batchPromptUserScript/`)
- `batch-prompt_img-testing.userscript.md` — feature spec
- `promptBox-DOM_VeniceAi.md` — prompt textarea & submit button DOM
- `imgBox-DOM_VeniceAi.md` — rendered image, download button, action buttons DOM
- `newChatButton-DOM_VeniceAi.md` — "New chat" button DOM
- `folders-DOM_VeniceAi.md` — folder creation/edit/delete DOM

## Output
- `docs/batchPromptUserScript/batch-prompt_img-testing.user.js`

## Implementation Steps

### 1. Userscript Metadata Block
- `@match`: `https://venice.ai/chat*`
- `@grant`: `GM_download` (for image downloading with custom filenames)
- `@name`: Batch Prompt Image Testing

### 2. Floating Activation Icon
- Create a fixed-position icon on the right side, vertically centered
- On click, toggle the floating control panel UI

### 3. Floating Control Panel UI
Build a panel with:
- **Prompt textarea** + Paste button (uses `navigator.clipboard.readText()`)
- **Prompt_ID_Box** — text input for UniqueID (auto-generates UUID if empty)
- **Repeat count** — number input (how many times to run the prompt)
- **Mode toggle** — radio/checkbox: "Iterations" (same chat) vs "Unique" (new chat each time)
- **Start/Stop button** to control the batch process

### 4. Prompt Injection
- Target: `textarea[name="prompt-textarea"]`
- Set value, dispatch `input` event to trigger React state update
- Click submit button: `button[aria-label="Submit chat"]`

### 5. Image Completion Detection
- Monitor the submit button (`button[aria-label="Submit chat"]`)
- During generation, Venice.ai disables this button (`disabled` attribute)
- Use `MutationObserver` on the submit button's attributes to detect when `disabled` is removed (generation complete)
- Also watch for new `.image-message` elements to capture the latest rendered image

### 6. Image Download with Rename
- After generation completes, find the latest `.image-message` element
- Extract the `<img>` `src` (blob URL)
- Fetch the blob, then use `GM_download` or create a download link
- Filename format: `{UniqueID}-{SequenceNumber}-{Iteration_or_New}.{ext}`
  - `Iteration_or_New`: `ITER` for iteration mode, `NEW` for unique/new-chat mode
  - Sequence number increments per image in the batch

### 7. Folder Creation
- Select the "Add folder" button: `button[aria-label="Add folder"]`
- Click it → a new folder item appears with a default name
- The new folder has an edit button (`button[aria-label="done"]` with pencil SVG)
- Click edit, then set the folder name element (`.css-psklzb`) to the UniqueID
- Save/confirm the rename

### 8. Batch Orchestration Loop
Pseudocode for the main loop:
```
for i in 0..repeatCount:
  if mode == "unique":
    click "New chat" button (wait for page to reset)
    wait for prompt textarea to be available
  inject prompt into textarea
  click submit
  wait for submit button to become enabled (generation done)
  find latest image, download with formatted filename
  sequenceNumber++
if mode == "unique":
  create folder named UniqueID
  (note: moving images into folder may require Venice.ai API — flag as TODO if DOM doesn't support drag-drop)
```

### 9. Edge Cases & Safety
- Rate-limiting: add configurable delay between prompts (e.g., 2-3 seconds)
- Abort controller: Start/Stop button sets a flag; loop checks it each iteration
- Error handling: if image not found after timeout, log and skip to next iteration

## Verification
- Manual test: install in ViolentMonkey, navigate to `venice.ai/chat`, verify:
  1. Floating icon appears on right side
  2. Panel opens/closes on click
  3. Single prompt injection works (prompt appears, submits, image downloads)
  4. Batch mode works with iterations
  5. Batch mode works with new-chat mode
  6. Filename format is correct
  7. Folder creation works (if feasible from DOM)
