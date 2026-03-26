# Audit And Stabilization Log

## Scope

Comprehensive audit and cleanup of source, tests, configuration, and documentation with behavior preservation as the default rule.

## Resolved now

| Status | Area | Change | Rationale |
|---|---|---|---|
| resolved | Form state | Fixed emphasis updates to use store mutations instead of mutating a cloned snapshot in `js/components/formRenderer.js`. | Prevents silent loss of emphasis changes and keeps prompt recomputation consistent. |
| resolved | Form rendering | Removed stale post-render prompt and word-counter DOM patching from `js/components/formRenderer.js`. | Prevents UI drift caused by updating from outdated state. |
| resolved | Security | Escaped user-controlled text interpolated into HTML across Creation Kit, xGEN, Gallery, presets, and terminal preset browser flows. | Eliminates stored/local XSS vectors from names and prompts. |
| resolved | Bridge | Fixed userscript runtime URL detection in `userscript/xgen-venice-bridge.user.js` to match deployed app URLs. | Restores bridge detection on the actual published path. |
| resolved | Redundancy | Extracted shared DOM helpers into `js/utils/dom.js` and removed duplicated long-press logic. | Keeps interaction behavior consistent and reduces duplication. |
| resolved | xGEN page | Consolidated duplicated desktop/mobile sidebar rendering in `js/pages/xgen.js`. | Reduces markup drift and keeps edits traceable. |
| resolved | Generation flow | Unified duplicated payload/timer dispatch logic in `js/bridgeManager.js`. | Simplifies orchestration and removes repeated timeout/countdown code. |
| resolved | Bridge stability | Stopped userscript heartbeats from forcing xGEN rerenders and added nonce-based Venice recovery state. | Eliminates bridge-induced flicker and reduces dropped image transfers after tab switches. |
| resolved | Bridge detection | Restored bridge presence detection from remote Venice status and heartbeat freshness instead of relying only on init-time readiness. | Prevents false `Bridge not detected` states while the userscript is active. |
| resolved | Gallery | Added single and batch delete flows plus grouped gallery sections in `js/pages/gallery.js`. | Makes image history manageable without relying on manual storage resets. |
| resolved | Image metadata | Persisted generation-time grouping metadata with images and added legacy `Unknown` fallback order grouping. | Keeps future gallery grouping accurate while avoiding brittle prompt-text heuristics. |
| resolved | Creation Kit UX | Enforced single-open accordions, mobile header long-press locking, generated natural-language option details, and random dummy naming. | Makes the form more understandable and less repetitive without changing prompt behavior. |
| resolved | Settings | Removed misleading negative-prompt and addon toggles from settings UI; wired `Reset All Local Data` to actual storage clearing. | Exposed controls now match implemented behavior. |
| resolved | Assets/schema | Removed broken `modalImage` references pointing to missing assets in schema JSON files. | Prevents broken references and makes validation reliable. |
| resolved | Service worker | Updated precache list for app-shell gaps, added icon/userscript coverage, and restricted runtime caching to successful same-origin responses. | Reduces offline drift and avoids caching failed responses. |
| resolved | Dead code | Removed unused `renderPrompter`, stale xBatcher mode UI, unused store API remnants, and dead home-page branch logic. | Lowers maintenance overhead and clarifies current behavior. |
| resolved | Tests | Added repo-consistency regression coverage for bridge URL detection, precache completeness, missing schema assets, and deferred xBatcher mode UI. | Locks in key audit fixes. |

## Deferred with documentation

| Status | Area | Decision | Reason |
|---|---|---|---|
| deferred | xBatcher unique mode | Do not implement new-chat mode in this stabilization pass. | It requires new bridge behavior and would be feature work rather than cleanup. |
| deferred | Negative prompt generation | Keep model profile on `none` and describe that in UI/docs. | Current prompt engine intentionally returns an empty negative prompt for the active model. |
| deferred | Legacy gallery backfill | Do not infer missing prompt order from old prompt strings. | Heuristic parsing would be brittle and could misgroup existing images. |
| deferred | Store/module architecture | Do not split the large store further in this pass. | It would create broad churn outside targeted stabilization changes. |

## Remaining risks

- `js/store.js` still centralizes a large amount of state and behavior, so future feature work should continue extracting narrowly scoped helpers.
- The userscript remains DOM-selector dependent on Venice markup; selector drift is still a runtime integration risk even with the URL fix.
- Service-worker precache entries are still manually maintained, though they are now covered by tests.
- Legacy images created before metadata capture may appear in `Unknown` gallery subgroups until regenerated or manually cleaned up.

## Validation result

- `node --test`
- `node --check js/pages/xgen.js`
- `node --check js/pages/creationKit.js`
- `node --check js/components/formRenderer.js`
- `node --check js/store.js`
- `node --check sw.js`
