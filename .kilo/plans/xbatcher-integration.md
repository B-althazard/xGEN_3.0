# Plan: Integrate xBatcher into xGEN PWA

## Summary
Rename the batch userscript tool to "xBatcher", remove folder/image-moving features, and add an xBatcher module as a section on the xGEN page with batch controls, prompt history log, and batch-specific settings.

## Context
- xGEN is a PWA (vanilla JS, no bundler, hash routing, custom store)
- Bridge uses CustomEvents (`xgen:generate` out, `xgen:image-received` in)
- State in `store.js`, persisted to localStorage/IndexedDB
- Pages are render functions in `js/pages/`, components in `js/components/`
- The batch userscript runs on Venice.ai; the xBatcher module runs inside xGEN

---

## Changes

### 1. Rename "Batch Prompt Tool" → "xBatcher" in userscript
**File**: `docs/batchPromptUserScript/batch-prompt_img-testing.user.js`

- Update `@name` in metadata header
- Rename all UI text: panel header, trigger title, log prefix `[BatchPrompt]` → `[xBatcher]`
- Rename CSS IDs: `#bpt-*` → `#xb-*`, `#bpt-trigger` → `#xb-trigger`, `#bpt-panel` → `#xb-panel`
- Update `console.log` prefixes

### 2. Remove folder creation and image-to-folder code
**File**: `docs/batchPromptUserScript/batch-prompt_img-testing.user.js`

- Remove `createFolder()` function entirely
- Remove `setReactValue()` function (only used by createFolder after refactor — but injectPrompt uses it too, so keep it)
- Remove the `createFolder(uid)` call at end of `onStart()` batch loop
- Remove `getAddFolderButton()` function
- Keep `setReactValue()` since `injectPrompt()` depends on it

### 3. Keep current download approach (data URL) — no changes
The user confirmed "Don't touch it. It's working like it is." The current `blobToDataURL()` + anchor download approach stays unchanged.

### 4. Add prompt history log to userscript
**File**: `docs/batchPromptUserScript/batch-prompt_img-testing.user.js`

- Add `history` array to state: `[{ prompt, timestamp, status, filename }]`
- After each image download in the batch loop, push an entry with prompt text, ISO timestamp, status (`'success'` or `'error'`), and filename
- Display history in the UI log area as a scrollable list with timestamps
- Add a "Clear History" button to the panel

### 5. Add xBatcher module section to xGEN page
**Files to modify**:
- `js/pages/xgen.js` — add xBatcher section to the xGEN page render
- `js/store.js` — add `state.batch` state slice + storage key
- `js/bridgeManager.js` — add batch orchestration logic

#### 5a. New state in `store.js`
Add to `defaultState`:
```js
batch: {
  promptList: [],        // [{ id, text, status, timestamp, filename }]
  repeatCount: 1,
  mode: 'iteration',     // 'iteration' | 'unique'
  delay: 3,              // seconds between prompts
  running: false,
  currentIndex: 0,
  history: [],           // [{ prompt, timestamp, status, filename }]
}
```

Add to `STORAGE_KEYS`:
```js
BATCH: 'xgen.batch',
```

Add exported functions:
- `updateBatchSetting(key, value)` — update a batch setting, persist, notify
- `addBatchHistoryEntry(entry)` — push to history array, persist
- `clearBatchHistory()` — clear history, persist
- `setBatchRunning(running)` — toggle running state
- `addPromptToList(text)` — add a prompt to the list
- `removePromptFromList(id)` — remove a prompt
- `clearPromptList()` — clear all prompts

#### 5b. xBatcher section in `xgen.js`
Add an xBatcher section below the existing action grid on the xGEN page. Render it as an accordion/collapsible section with:

**Controls**:
- Prompt textarea + "Add to List" button
- Prompt list display (scrollable, removable items)
- Repeat count input
- Mode toggle (iteration / unique)
- Delay input (seconds)
- Start / Stop button

**History Log**:
- Scrollable list of history entries
- Each entry: timestamp, prompt (truncated), status icon, filename link
- "Clear History" button

#### 5c. Batch orchestration in `bridgeManager.js`
Add `startBatchJob()` function:
1. Read batch state (prompt list, repeat count, mode, delay)
2. Loop through prompts × repeat count
3. For each: dispatch `xgen:generate` with the prompt
4. Listen for `xgen:image-received` → record success in history
5. Listen for `xgen:generation-error` → record error in history
6. Wait delay seconds, then proceed to next
7. Support abort via `setBatchRunning(false)`
8. On completion, set `running = false`

The existing `xgen:image-received` handler already saves images and navigates to `#xgen`. The batch orchestrator needs to:
- Temporarily override navigation (don't navigate to `#xgen` on each image during batch)
- Collect images into `generatedImages[]` (existing behavior)
- Track which prompt each image belongs to

### 6. Update userscript metadata
**File**: `docs/batchPromptUserScript/batch-prompt_img-testing.user.js`

- Bump version to `1.1.0`
- Update `@name` to `xBatcher`

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `docs/batchPromptUserScript/batch-prompt_img-testing.user.js` | Modify | Rename, remove folder code, add prompt history, bump version |
| `js/store.js` | Modify | Add `batch` state, `STORAGE_KEYS.BATCH`, batch setter functions |
| `js/pages/xgen.js` | Modify | Add xBatcher section (controls + history) to xGEN page |
| `js/bridgeManager.js` | Modify | Add `startBatchJob()` orchestration function |

## Verification
1. Userscript loads on Venice.ai as "xBatcher", no folder creation code
2. Prompt history shows in the userscript UI with timestamps
3. xGEN PWA shows xBatcher section on the xGEN page
4. Adding prompts to the list, setting repeat/delay, clicking Start triggers batch generation via bridge
5. History log updates after each generation
6. Batch can be aborted with Stop button
