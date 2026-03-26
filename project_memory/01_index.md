# project_memory — Master Index
_Updated after every write. If this file is stale, run reconciliation before proceeding (see 00_init.md §5)._

**Last reconciled:** 2026-03-26 12:30:00 UTC
**Entry count:** 8

---

## Index Table

| path | type | status | created | tags | load_if | summary |
|------|------|--------|---------|------|---------|---------|
| `logs/2025-03-14_093012_set-db-connection-pool-size.md` | log | active | 2025-03-14 09:30:12 | database, config, decision | Working on database config, performance, or timeout issues | DB pool size raised to 10 to fix timeout errors under load |
| `logs/2026-03-26_111520_reconcile-unindexed-memory-templates.md` | log | active | 2026-03-26 11:15:20 | memory, failure, setup | Starting a session or reconciling `project_memory/` integrity failures | Recorded and reconciled unindexed template files in persistent memory |
| `logs/_template.md` | log | active | 2025-03-14 14:05:00 | memory, setup | Creating a new small log entry in `project_memory/logs/` | Template for small single-topic log entries |
| `actions/auth-refactor/manifest.md` | manifest | active | 2025-03-14 10:15:44 | auth, refactor, breaking-change | Working on auth, login, sessions, tokens, API security, or scaling | Replaced session-cookie auth with JWT; stateless, Redis-backed refresh tokens |
| `actions/auth-refactor/2025-03-14_101544_before-state.md` | artifact | active | 2025-03-14 10:15:44 | auth, refactor | Reviewing what auth looked like before the JWT refactor | Snapshot of auth middleware before JWT refactor |
| `actions/auth-refactor/2025-03-14_103211_route-audit.md` | artifact | active | 2025-03-14 10:32:11 | auth, refactor | Auditing which routes were affected by the auth refactor | Full list of routes affected by auth refactor and their change status |
| `actions/.template/manifest.md` | manifest | active | 2025-03-14 14:05:00 | memory, setup | Creating a new multi-step action entry in `project_memory/actions/` | Template manifest for complex persistent memory actions |
| `actions/bridge-gallery-stabilization/manifest.md` | manifest | active | 2026-03-26 12:30:00 | frontend, testing, refactor | Working on the Venice bridge, gallery behavior, or xGEN image-history stabilization | Stabilized bridge recovery and added grouped gallery delete flows |

---

## Field Definitions

| Field | Type | Rules |
|---|---|---|
| `path` | string | Relative to `project_memory/`. Must resolve. Unique. |
| `type` | enum | `log` · `manifest` · `artifact` · `scratchpad` |
| `status` | enum | `active` · `superseded` · `retracted` · `draft` |
| `created` | datetime | `YYYY-MM-DD HH:MM:SS` UTC |
| `tags` | csv | Lowercase, hyphenated. Max 5. Describe domain + action type. |
| `load_if` | plain English | One sentence: when should this be loaded? Be specific. |
| `summary` | plain English | Max 120 chars. What happened, not what the file contains. |

---

## Tag Vocabulary
_Extend as needed. Consistency matters more than completeness._

**Domain tags:** `api` · `auth` · `database` · `frontend` · `config` · `infra` · `testing` · `memory`

**Action tags:** `decision` · `correction` · `refactor` · `investigation` · `setup` · `failure` · `user-instruction`

**State tags:** `breaking-change` · `unresolved` · `needs-followup` · `blocking`
