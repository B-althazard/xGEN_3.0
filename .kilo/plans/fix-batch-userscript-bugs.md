# Plan: Fix 3 Bugs in Batch Prompt Userscript

## Context
The userscript at `docs/batchPromptUserScript/batch-prompt_img-testing.user.js` has three bugs reported by the user:

1. **Folder created but images not moved to it** — folder appears in sidebar but chats/images stay unsorted
2. **Folder names reset to "New folder" on page refresh** — Venice's internal state not updated
3. **Images open in new tab after rendering** — blocks generation of next image

All changes go to: `docs/batchPromptUserScript/batch-prompt_img-testing.user.js`

---

## Bug 3: Images Open in New Tab (Fix First — Blocking)

**Root cause**: `downloadBlob()` creates a `blob:` object URL, sets it as `<a href>`, and clicks it. On Venice.ai (and some Chromium configs), `blob:` URLs opened via programmatic click can trigger a new tab instead of a download.

**Fix**: Convert the blob to a **data URL** using `FileReader.readAsDataURL()`, then use that as the anchor href. Data URLs with the `download` attribute are never opened in new tabs. This is the same approach `venice-bridge.user.js:202-209` uses via `blobToDataURL()`.

**Changes**:
- Add a `blobToDataURL(blob)` helper (from bridge script)
- In `downloadBlob()`: convert blob to data URL first, then create anchor with data URL href

---

## Bug 2: Folder Names Reset on Refresh (Fix Second)

**Root cause**: The `createFolder()` function sets `.css-psklzb` textContent directly on the DOM. Venice.ai is a React app with internal state (likely IndexedDB via dexie). DOM-only changes don't update Venice's persistence layer.

**Investigation needed**: Venice.ai's folder rename flow requires:
1. Click the pencil (edit) button (`button[aria-label="done"]` with pencil SVG path `M4 20h4l10.5 -10.5...`)
2. An `<input>` appears for inline editing (not found by current selector `.relative.flex.items-center input`)
3. Type the name and press Enter
4. Venice internally saves via its state management

From `completeSideBar-DOM_VeniceAi.md` lines 133-163, after clicking "Add folder":
```
<div class="relative flex items-center css-obf0wy">
  <button class="chakra-button css-1h3rnan">    ← folder button (collapsed state)
    <div class="css-psklzb">New folder</div>
  </button>
  <div class="css-5kvp62">                       ← action buttons container
    <button aria-label="done">                   ← pencil/edit SVG
    <button aria-label="done">                   ← trash/delete SVG
  </div>
</div>
```

**Fix approach**:
1. Click "Add folder" → wait for new folder element
2. Click the **pencil edit button** (first `aria-label="done"` button inside the new folder's `css-5kvp62` container) to enter edit mode
3. Wait for an `<input>` to appear inside the folder container
4. Use React-compatible native value setter on the input
5. Dispatch `input` + `change` events
6. Press Enter to confirm
7. Click outside the folder to trigger Venice's blur handler (which may save to IndexedDB)

---

## Bug 1: Chats Not Moved to Folder (Blocked — Missing API Data)

**Root cause**: Venice.ai manages chat-folder associations internally. The sidebar DOM shows chats as draggable `<a>` elements (`aria-roledescription="draggable"`) and folders as potential drop targets. But there's no "move to folder" button in the DOM — it's drag-and-drop or API-based.

From `completeSideBar-DOM_VeniceAi.md`:
- Chats: `<a draggable="true" aria-roledescription="draggable" href="/chat/CHATID">` with prompt preview text
- Folders: `<div class="css-psklzb">FOLDER_NAME</div>` with edit/delete buttons
- Chats use a virtual scroller (`data-virtuoso-scroller`) — not all chats are in the DOM at once

**HAR Analysis**: The 4 discovery files in `veniceAPI-Discovery/` only captured:
- Clerk auth (`clerk.venice.ai`) — session touch
- PostHog analytics (`ph.venice.ai`) — telemetry (gzip, unreadable)
- Status page (`veniceai-status.com`) — system status

**No Venice.ai API calls for folder creation, renaming, or chat-folder assignment were captured.** This is the critical gap — without these endpoints, we cannot implement API-based folder management.

**Action needed**: The user must capture a HAR specifically during:
1. Creating a folder (click "Add folder", rename it, confirm)
2. Renaming an existing folder
3. Dragging a chat into a folder

This will reveal the Venice API endpoints (likely POST/PUT to something like `api.venice.ai/v1/folders` or similar) needed for proper folder management.

**Temporary approach until API is discovered**:
- Implement folder creation via DOM edit-mode simulation (Bug 2 approach)
- Log the current chat URL so the user can manually drag it to the folder
- Add infrastructure code (API interception via `fetch` hook) to auto-discover endpoints during manual operations

---

## Implementation Order
1. Fix `downloadBlob` with data URL approach (Bug 3) — immediate, well-understood fix
2. Fix `createFolder` with proper edit-mode flow + fallback to storage (Bug 2)
3. Add `fetch` hook to auto-discover Venice API endpoints during manual folder operations (Bug 1 prep)
4. Bug 1 full implementation depends on captured API data from step 3

## Verification
- After fix 3: Generate an image → verify it downloads with custom filename without opening a new tab
- After fix 2: Create a folder → refresh page → verify folder name persists
- After step 3: Manual folder operations in Venice → check browser console for intercepted API calls
- Bug 1: Pending API discovery
