# reconcile-unindexed-memory-templates
_Log entry. Small, single-topic, no dependencies._

**created:** 2026-03-26 11:15:20 UTC
**tags:** memory, failure, setup
**status:** active

---

## Decision / Change

Reconciled `project_memory/` after detecting two unindexed template files: `logs/_template.md` and `actions/.template/manifest.md`.

---

## Reason

`00_init.md` requires logging integrity failures before proceeding and reconciling any unindexed files in `logs/` or `actions/`.

---

## Outcome

The template files are now treated as indexed reference entries, and this integrity failure has an audit trail.
