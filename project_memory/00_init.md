# project_memory — Constitution
_This file governs how all memory in this directory is written, read, and maintained._
_Do not modify this file during a task. Changes require explicit user instruction._

---

## 1. Purpose

`project_memory/` is the persistent memory layer for this agent. It survives across sessions.
Its job is to answer three questions at any point in time:

1. **What has been done?** (audit trail)
2. **Why was it done?** (rationale)
3. **What should I load now?** (context retrieval)

---

## 2. Directory Layout

```
project_memory/
  00_init.md              ← YOU ARE HERE. Rules. Do not skip.
  01_index.md             ← Master index. One row per memory entry.
  02_scratchpad.md        ← Ephemeral working notes. Wiped each session start.
  logs/                   ← Small, atomic, single-topic entries
  actions/                ← Complex multi-file entries
    <action_name>/
      manifest.md         ← Required. Single source of truth for the action.
      <artifacts>         ← Optional supporting files only if manifest refs them.
```

---

## 3. Write Decision Tree

Before writing anything, evaluate in order:

```
Is this a session-start or session-end event?
  YES → Write to 02_scratchpad.md (overwrite, not append)

Is the content < 400 characters AND single-topic AND has no file/action dependencies?
  YES → Write to logs/ as a flat .md file

Does it involve code, multi-step reasoning, external references, or depends on / is depended on by another entry?
  NO to all → logs/
  YES to any → actions/<action_name>/manifest.md
```

**"Small" is defined as ALL THREE:**
- Raw content under 400 characters
- Touches exactly one concept or decision
- No `refs:` links to other entries needed

If in doubt, use `actions/`. Over-filing is recoverable. Under-filing loses context.

---

## 4. Filename Format

| Location | Format | Example |
|---|---|---|
| `logs/` | `YYYY-MM-DD_HHMMSS_<slug>.md` | `2025-03-14_093012_set-api-timeout.md` |
| `actions/<name>/` | `manifest.md` (always) | `actions/auth-refactor/manifest.md` |
| `actions/<name>/` | `YYYY-MM-DD_HHMMSS_<descriptor>.md` | `2025-03-14_093012_before-state.md` |

**Slug rules:** lowercase, hyphens only, max 40 chars, describes the *decision or change* not the file type.

---

## 5. Index Protocol

`01_index.md` is updated **after** every write, never before.

If a write is interrupted before the index is updated, the next session MUST scan for unindexed files and reconcile before proceeding. Detection: any file in `logs/` or `actions/` whose path does not appear in `01_index.md`.

Index columns are fixed. Do not add or remove columns without updating this file.

---

## 6. Retrieval Protocol

At session start, the agent MUST:

1. Read `00_init.md` (this file) — always, fully
2. Read `01_index.md` — always, fully
3. Read `02_scratchpad.md` — always, fully
4. For each index row where `load_if` matches current task context: load that file

`load_if` is evaluated as a plain-English tag match against the current task description.
When uncertain, load. Context window cost is lower than the cost of a wrong decision.

---

## 7. Update Rules

| Situation | Action |
|---|---|
| Correcting a past log entry | Do NOT edit the original. Write a new `correction_of:<slug>` entry. |
| Superseding an action | Write new manifest with `supersedes: <path>`. Mark old manifest `status: superseded`. |
| Deleting memory | Never delete. Set `status: retracted` in the entry and update index. |
| Amending an action mid-task | Append to existing manifest under `## Amendments`. Timestamp each amendment. |

---

## 8. Integrity Checks

Run these checks at session start and before session end:

- [ ] Every file in `logs/` and `actions/*/` has a row in `01_index.md`
- [ ] Every `refs:` path in any file resolves to a real file
- [ ] `02_scratchpad.md` exists (create empty if missing)
- [ ] No manifest is missing a `status:` field
- [ ] `01_index.md` has no duplicate `path` values

If any check fails, log the failure in `logs/` before proceeding.
