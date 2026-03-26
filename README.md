# x.GEN 3.0

Structured prompt-builder PWA for composing image prompts, managing reusable character presets, and sending generation requests through the Venice bridge userscript.

## Project layout

- `js/` application source, state, UI pages, bridge orchestration, and prompt engine
- `data/` split schema files, default dummies, and prompt rules
- `tests/` Node-based regression and repo-consistency checks
- `userscript/` Venice bridge userscript distributed from the app itself
- `assets/icons/` install and app-shell icons used by the manifest and service worker

## Validation

- `node --test`
- `node --check js/pages/xgen.js`
- `node --check js/pages/creationKit.js`
- `node --check js/components/formRenderer.js`
- `node --check js/store.js`
- `node --check sw.js`

## Current constraints

- Bridge generation depends on the userscript plus an open `venice.ai` tab.
- Bridge heartbeat no longer drives app-wide rerenders; remote Venice status and heartbeat freshness now keep xGEN bridge detection alive without constant refresh.
- Hidden same-browser tabs and minimized browser windows can still be throttled by the browser; the bridge now reports that state explicitly and resumes when Venice becomes visible again.
- Negative prompts are intentionally disabled for the current model profile.
- xBatcher runs queued prompts sequentially; new-chat mode is deferred until bridge automation can support it safely.
- Gallery supports single and batch deletion, and groups new images by subject class plus prompt order. Legacy images without stored order metadata are shown under `Unknown`.
- Creation Kit uses one-open-at-a-time accordions, random dummy names from `data/dummyNames.md`, and long-press option detail text for non-color options.
- Saved Doll cards use the current generated image as their preview when available.
- Root documentation is canonical. Ignored `docs/` and `reports/` directories may contain historical notes, but they are not maintained artifacts.

## Notes carried forward from ignored docs/reports

- Historical reports correctly identified a bridge mismatch between `@match` metadata and runtime URL detection; that runtime check is now aligned with `/xGEN_3.0/`, `/xGEN/`, and `/xgen/`.
- Historical service-worker notes showed cache manifest drift; the tracked `sw.js` now serves as the source of truth and is covered by a consistency test.
- Historical xBatcher notes reported that the old mode selector was misleading; the unsupported mode control has been removed pending a future bridge-safe design.
