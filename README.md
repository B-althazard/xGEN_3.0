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
- Negative prompts are intentionally disabled for the current model profile.
- xBatcher runs queued prompts sequentially; new-chat mode is deferred until bridge automation can support it safely.
- Root documentation is canonical. Ignored `docs/` and `reports/` directories may contain historical notes, but they are not maintained artifacts.

## Notes carried forward from ignored docs/reports

- Historical reports correctly identified a bridge mismatch between `@match` metadata and runtime URL detection; that runtime check is now aligned with `/xGEN_3.0/`, `/xGEN/`, and `/xgen/`.
- Historical service-worker notes showed cache manifest drift; the tracked `sw.js` now serves as the source of truth and is covered by a consistency test.
- Historical xBatcher notes reported that the old mode selector was misleading; the unsupported mode control has been removed pending a future bridge-safe design.
