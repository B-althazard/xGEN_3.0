# Manifest — bridge-gallery-stabilization
_Single source of truth for this action. All supporting files are listed under Artifacts._

**created:** 2026-03-26 12:30:00 UTC
**status:** active
**tags:** frontend, testing, refactor
**supersedes:** —
**correction_of:** —

---

## Action

Stabilized the x.GEN to Venice bridge, added gallery delete/grouping behavior, and simplified xGEN metrics while preserving existing generation and history flows.

---

## Reason

User reported bridge-induced PWA flicker, unreliable image handoff when Venice lost focus, missing gallery delete/grouping controls, and extra xGEN metrics that should be removed.

---

## Steps Taken

1. Removed heartbeat-driven bridge-ready churn and added nonce-based Venice recovery state in the userscript and bridge manager.
2. Added image deletion APIs/store actions and persisted generation-time gallery metadata.
3. Implemented grouped gallery rendering with single/batch delete and `Unknown` fallback for legacy prompt-order metadata.
4. Removed xGEN metric cards for model, ratio, and cost.
5. Added regression tests and re-ran syntax checks plus the full Node test suite.

---

## Outcome

The bridge no longer forces xGEN to rerender every heartbeat, gallery history can be pruned from the UI, and new images carry grouping metadata for Female/Futa and Subject First/Style First organization.

---

## Side Effects & Risks

Venice automation still depends on page selectors and browser tab scheduling, so future Venice UI changes can still break the bridge. Legacy images without saved prompt-order metadata are intentionally grouped under `Unknown`.

---

## Refs
_Paths to related entries. Relative to project_memory/._

- logs/2026-03-26_111520_reconcile-unindexed-memory-templates.md

---

## Artifacts
_Supporting files in this action's folder. Delete this section if none._

| filename | description |
|---|---|
| — | — |

---

## Amendments
_Append timestamped amendments below if this manifest is updated mid-task. Do not edit above sections after initial write._
