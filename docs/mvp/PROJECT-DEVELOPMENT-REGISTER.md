# Project development register

This is the single master register for significant Pascal Editor MVP development. Read its current status before starting substantial work and update the affected sections before calling that work complete. Detailed evidence remains in the linked reports. Historical reports describe their status at the time; the current status below takes precedence when newer verified evidence exists.

## Project overview

The project aims to let people and AI agents design real 3D interiors: rooms, furniture, surfaces, materials and lighting. The standalone browser editor provides manual scene editing; the source-built Pascal MCP server exposes scene operations for agents. The foundation is a Bun/TypeScript monorepo with core scene logic, a 3D viewer, editor UI, a Next.js app and SQLite scene persistence. The current objective is to move from verified read-only MCP inspection toward carefully controlled agent editing, while resolving open repository checks and the separate external-catalog furniture acceptance gap.

## Current project status

| Item | Status as of 2026-10-15 |
| --- | --- |
| Current stage | Stage 3B scoped built-in floor-furniture acceptance passed; Stage 3C materials is next |
| Overall progress | Stage 2B controlled catalog-table edit/restoration and Stage 3A room creation/move plus rotation/divide/merge/delete visual checks verified on isolated scenes |
| Most recent milestone | Founder-reported sofa browser review passed; running editor API, read-only SQLite and pre-browser checkpoint matched the full saved graph on 2026-10-15 |
| Work in progress | Stage 3B is closed for its floor-furniture scope. Stage 3C and 3D remain unstarted; isolated review editor was listening on loopback port 3003 at the final API check |
| Important unresolved issues | Wall/ceiling and external catalog furniture are outside the Stage 3B contract. Independent sofa canvas capture, same-process MCP concurrency and global QA remain open |
| Immediate next action | Review the accepted Stage 3B scope, then start Stage 3C materials as a separate substage; keep Stage 4 on hold until 3C and 3D pass |

## Daily development history

### 2026-10-02 — Stage 1 baseline and furniture integration

**Status:** In Progress.

**What was done:** The source repository, dependencies, editor launch, type checks and tests were investigated. A room-only restart was recorded as founder-reported pass. The Items sidebar and related scene-load guard work were committed in `c728ad82` on 2026-10-13; Stage 1C's detailed report records the implementation and scoped tests.

**Why it was done:** Establish a reproducible local source editor and a manual furniture workflow before agent access.

**Result:** Setup and scoped checks advanced, but furniture runtime acceptance was still pending at that time. An early frozen install failed with Windows `EPERM`; later documentation records successful dependency resolution. Do not treat the early blocked status as current.

**Problems encountered:** Global formatting/check failures and root test failures remained; the catalog-chair path was unverified.

**Next action at the time:** Verify a real saved furniture item through browser editing, refresh and restart.

**Evidence:** [Stage 1 baseline](STAGE-1-BASELINE.md), [Stage 1C report](STAGE-1C-NAMED-SCENE-ITEMS.md), commit `c728ad82`.

### 2026-10-14 — Local setup and QA assessment

**Stage:** Repository QA. **Status:** Completed as an assessment; release checks remain open.

**What was done:** Existing dependencies and local editor startup were checked. Type checking passed 11/11 tasks. The QA assessment captured check and test logs.

**Why it was done:** Establish what runs on this workspace and identify outstanding quality gates.

**Result:** The source editor served on loopback. The frozen install checked 787 installs across 927 packages without required changes. The Biome check reported 3,002 errors and 7 informational diagnostics. The repository test run did not pass; the CLI suite recorded 101 passes and 7 failures, with other tasks interrupted. These are historical test results, not a rerun for this register.

**Next action:** Triage the check failures and complete the interrupted test coverage before claiming a clean global QA result.

**Evidence:** [QA assessment](../../qa-assessment/README.md), [QA findings](../../qa-assessment/QC-FINDINGS.md), [QA coverage](../../qa-assessment/QA-COVERAGE.md).

### 2026-10-14 — Stage 1C manual furniture acceptance

**Status:** Completed for the existing procedural cabinet.

**What was done:** The founder selected, saved, moved and rotated the cabinet in the browser, then refreshed, reopened and restarted the source editor. Saved API and read-only SQLite comparisons tracked the same scene, item and room graph.

**Why it was done:** Prove that a real editable furniture model survives the ordinary editor workflow and persistence lifecycle.

**Result:** Scene `ad601e76827b`, cabinet `cabinet_10bw9r9jnsw9w9km`, final version 43 and graph hash `ecf1b07d2732cf1189e0389d551e66e8f9f12edf11f48e95289ca6c5a5e0c102` were retained. Visual observations were founder-reported; saved graph comparisons were independently checked. This does not verify an external catalog GLB/chair.

**Problems encountered:** An initial server stop and restart command needed correction; the detailed report retains these events. A suggested exact 0.20 m move was withdrawn because the cabinet lacked a numeric X control; the founder accepted the actual final pose.

**Next action:** Inspect this scene through source-built MCP without changing persistent data.

**Evidence:** [Stage 1C report, section I](STAGE-1C-NAMED-SCENE-ITEMS.md#i-current-device-manual-furniture-acceptance--2026-10-14); unique checkpoint files are listed there outside Git.

### 2026-10-14 — Stage 2A MCP connection and inspection

**Status:** Completed.

**What was done:** Codex used the existing project-level, source-built stdio MCP registration with only `list_scenes`, `load_scene`, `get_scene` and `get_node` enabled. It inspected the same cabinet, room and saved scene as the browser API.

**Why it was done:** Establish scene and database identity before permitting AI-driven edits.

**Result:** All 14 MCP node payloads and roots matched the saved API graph. Scene version and graph hash stayed unchanged, and hashes of SQLite scene, revision and event rows matched before and after inspection. `load_scene` changed MCP session memory only. No user-level Codex configuration was modified; no mutation tool was enabled.

**Next action:** Require a separate Stage 2B request, reviewed tool permissions, fresh scene/version checks and a guarded recovery plan before any agent scene edit.

**Evidence:** [Stage 2A report](STAGE-2A-MCP-CONNECTION.md); unique before/MCP/after checkpoint path is recorded there.

### 2026-10-14 — Mandatory register established

**Status:** Completed.

**What was done:** Created this master register and added a repository-level Codex logging rule. Existing technical reports and scene checkpoints were retained.

**Why it was done:** Make progress, failures and next steps visible across future work sessions.

**Result:** One central register now links to the detailed evidence and distinguishes verified, founder-reported and still-pending outcomes. No application code or scene was changed.

**Next action:** Maintain this register as significant work proceeds.

**Evidence:** [Repository instructions](../../AGENTS.md), this file.

### 2026-10-14 — Stage 2B eligibility check

**Status:** Blocked before mutation.

**What was done:** Rechecked the live source MCP scene list and saved browser scene API, then inspected the catalog item schema and MCP update-patch contract.

**Why it was done:** The requested 0.10 m edit requires an existing furniture item with a valid loaded asset.

**Result:** The current scene is still version 43 with the Stage 2A graph hash and 14 nodes, including a procedural cabinet but zero catalog `item` nodes. The cabinet has no asset or scale field. No mutation tool was enabled and no scene edit was attempted.

**Next action:** Insert and verify one loaded catalog furniture model through the browser before preparing an exact edit and seeking approval.

**Evidence:** [Stage 2B eligibility report](STAGE-2B-FIRST-CONTROLLED-EDIT.md).

### 2026-10-14 — Stage 2B target prepared

**Status:** Pending explicit edit approval.

**What was done:** Rechecked the saved browser scene, read-only SQLite graph and source-built MCP. Captured a unique full-scene baseline and calculated a 0.10 m parent-local X move for the saved dining table.

**Why it was done:** Establish an asset-backed test subject and a reviewable mutation before enabling the MCP write tool.

**Result:** The saved scene now has four catalog items at version 69; API, database and MCP agree. The table asset and transform are present, and its proposed footprint remains inside the room with clearance from the chairs. No agent scene edit or MCP configuration change has been made.

**Next action:** Founder pauses manual editing, confirms no unsaved changes and approves the exact position patch and temporary tool allowlist; then recheck live state before moving.

**Evidence:** [Stage 2B report and baseline](STAGE-2B-FIRST-CONTROLLED-EDIT.md).

### 2026-10-14 — Stage 2B first controlled move

**Status:** In Progress; saved move verified, visual confirmation and restoration pending.

**What was done:** With founder approval, temporarily exposed the source-built MCP patch and validation tools and sent one validated position-only update for the dining table. Rechecked the full saved API graph, SQLite scene and fresh MCP validation/collision results.

**Why it was done:** Demonstrate a bounded agent furniture edit with persistent identity and integrity checks.

**Result:** The table moved +0.10 m on parent-local X; scene version 69 became 70. Every other saved graph field remained equal. Validation passed and no item footprint collisions were reported. No inverse has been attempted.

**Next action:** Obtain browser visual confirmation, then re-read the saved state and request separate approval for a position-only restoration.

**Evidence:** [Stage 2B move report and unique checkpoint](STAGE-2B-FIRST-CONTROLLED-EDIT.md).

### 2026-10-14 — Stage 2B guarded restoration

**Status:** Completed for the first controlled edit.

**What was done:** After the founder confirmed visible movement and approved restoration, rechecked the exact moved graph and sent one position-only inverse through the source-built MCP server. Compared final browser API, SQLite and MCP states, then restored the original four-tool Codex allowlist.

**Why it was done:** Prove that an agent edit can be undone without replacing or altering unrelated scene data.

**Result:** Version 70 became 71 and the full saved graph and hash returned exactly to the version-69 baseline. Validation passed, no item footprint collisions were reported, and the project MCP config matched its pretest backup. No broader editing occurred.

**Next action:** Triage global QA failures. Treat any further agent scene edits as a separate reviewed stage.

**Evidence:** [Stage 2B final report and unique checkpoints](STAGE-2B-FIRST-CONTROLLED-EDIT.md).

### 2026-10-14 — QA documentation reconciled

**Status:** Completed.

**What was done:** Updated the QA summary, coverage, findings and MCP connection notes to reflect the later Stage 1C–2B evidence while retaining the original setup/check/test results.

**Why it was done:** Keep the open QA pages consistent with the verified project milestones and remaining release gates.

**Result:** The pages now distinguish scoped scene acceptance from global QA. No application source, dependency, scene or MCP configuration was changed in this documentation update.

**Next action:** Triage the recorded Biome and test failures; continue the remaining interactive and production acceptance checks.

**Evidence:** [QA summary](../../qa-assessment/README.md), [QA coverage](../../qa-assessment/QA-COVERAGE.md), [QC findings](../../qa-assessment/QC-FINDINGS.md), [MCP connection notes](../../qa-assessment/MCP-CONNECTION.md).

### 2026-10-14 — Stage 3A room/layout guard

**Status:** Scoped implementation complete; review pending before Stage 3B.

**What was done:** Audited existing room, furniture, finish, lighting and validation tool paths. Added an optional saved-scene version precheck to `create_room` and isolated persistence/conflict tests. No user scene or MCP configuration was changed.

**Result:** Room tool and structure tests pass, including an isolated saved-room reload and stale-version rejection. Browser rendering and cross-tool recovery remain open; Stage 3 as a whole is not complete.

**Next action:** Review [Stage 3A contract and evidence](STAGE-3A-ROOM-LAYOUT-TOOLS.md), then scope Stage 3B separately.

### 2026-10-14 — Stage 3A isolated browser/SQLite retry

**Status:** Room creation persistence and restart verified; code review still pending.

**What was done:** Rebuilt the source MCP server, created a room in a disposable SQLite scene, compared MCP and browser API identities, restarted only the isolated editor after a blank/loading first attempt, then compared saved revisions and reran the targeted tests.

**Result:** MCP and API agreed on the room at version 2. After restart, the founder reported visible walls, floor and ceiling; API/SQLite retained all ten graph nodes and roots. The editor advanced to version 3 only by adding `installedPlugins`. The 23 room/structure tests, TypeScript check and diff check passed again. The first-load stall remains an open test-harness issue; independent visual inspection was unavailable.

**Next action:** Review [Stage 3A evidence and limits](STAGE-3A-ROOM-LAYOUT-TOOLS.md) before 3B; keep the dev-server stall recorded. The temporary `apps/editor-stage3a-review/` copy remains untracked because automatic command review rejected its cleanup; the isolated server is stopped.

### 2026-10-14 — Stage 3A isolated room-edit review

**Status:** Saved room move, restart and founder visual check passed; conflict-safety gate remains open.

**What was done:** Copied the prior disposable SQLite scene to a unique checkpoint, rejected a stale `create_room` request without graph change, moved the test room 0.25 m on X through source-built MCP, reopened it in a fresh MCP process, and restarted the isolated editor against the same copied database.

**Why it was done:** Check real room-edit persistence before deciding whether Stage 3B can start, without altering the user scene or earlier test evidence.

**Result:** Room ID and all ten node IDs stayed stable. Saved scene version 3 became 4; only room/wall/floor/ceiling geometry changed as expected, validation passed, and the editor API retained the exact hash after restart and the founder's refresh. The founder reported four walls, floor and ceiling rendered without error. The 23 targeted tests and diff check passed. The isolated server was stopped after review; the normal editor remained running.

**Problems encountered:** `move_zone` lacks a pre-mutation saved-version check, and a late storage conflict can leave MCP session memory changed. Other room edit paths remain untested with SQLite restart.

**Next action:** Resolve and test safe persisted-scene conflict handling for agent-exposed room edits, then verify the remaining required room-edit paths on isolated storage before enabling Stage 3B work.

**Evidence:** [Stage 3A report and unique before/after checkpoints](STAGE-3A-ROOM-LAYOUT-TOOLS.md).

### 2026-10-14 — Stage 3A conflict recovery and room-edit persistence

**Status:** Automated implementation checks passed; Stage 3A review pending before Stage 3B.

**What was done:** Added a stored-version precheck to bound room/structure edits and authoritative bridge recovery after a rejected save. Distinguished a saved graph with failed event publication from an unsaved edit. Added late-conflict and event-failure tests plus disposable SQLite save/reload checks for room intent, rotation, divide, merge and delete. The source-built MCP server was rebuilt and smoke-tested against a separate disposable database. No user scene, dependency or Codex MCP configuration was changed.

**Why it was done:** Prevent a conflicting room edit from leaving MCP memory out of sync with persistent storage and verify the main room operations beyond in-memory tests.

**Result:** The focused conflict tests passed 34/34; the new SQLite operation test passed 1/1; the final MCP package suite passed 492/492 with 2,871 assertions. TypeScript, source build, smoke test, lint/assist checks with formatting disabled, and diff whitespace checks passed. Full formatting remains open. Browser rendering of the additional edit paths and concurrent same-process calls were not verified.

**Problems encountered:** Targeted full Biome check reported six whole-file formatting/line-ending errors in the existing modified files; no broad reformat was made. The prior isolated dev-server stall remains open.

**Next action:** Review [Stage 3A evidence and remaining limits](STAGE-3A-ROOM-LAYOUT-TOOLS.md); decide if another isolated visual check is needed before accepting 3A. Keep Stage 3B on hold until that review.

**Evidence:** [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md), `packages/mcp/src/tools/live-sync.test.ts`, `packages/mcp/src/tools/structure-persistence.test.ts`.

### 2026-10-14 — Stage 3A isolated browser review of room edits

**Status:** Four initial browser checks passed; saved state survived isolated editor restart. Stage 3A acceptance review remains open.

**What was done:** Using the source-built stdio MCP server and a new disposable SQLite database, created separate scenes for rotation, division, merge and deletion. Reopened each through MCP, matched the saved editor API, and inspected local browser screenshots. The 2D view showed the divided-room separator and its removal after merge. Stopped and restarted only the isolated editor, then rechecked the saved API. No source code, dependency, Codex configuration or user scene was changed.

**Why it was done:** Close the Stage 3A visual-evidence gap without risking the normal editor scene.

**Result:** Rotation showed the expected 4×8 m room with walls and floor; division showed two labeled rooms and a dashed separator; merge showed one room without the separator; deletion showed an empty workspace with working editor controls. Browser viewing caused no saved version or graph-hash change. After restart, all four scene IDs, versions, hashes and node graphs still matched. The isolated server and test browser were stopped; port 3002 remained active.

**Problems encountered:** The in-app browser-control runtime failed to initialize, and a second headless browser capture after editor restart did not reach controls within 40 seconds. An attempted fresh background Chrome launch was rejected by automatic approval review as `blocked by policy`. Post-restart *visual* rendering remains unverified, although persistence and the pre-restart visual checks passed. The editor logged a viewer-readiness timeout during the first capture.

**Next action:** Review [Stage 3A screenshots, hashes and limits](STAGE-3A-ROOM-LAYOUT-TOOLS.md). Decide whether the post-restart visual check is required before accepting 3A; do not begin 3B yet.

**Evidence:** [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md); local evidence and screenshots at `D:\PascalEditor-stage3a-browser-review-20261014-135455`.

### 2026-10-15 — Stage 3A final visual acceptance

**Status:** Scoped Stage 3A acceptance passed; Stage 3B not started.

**What was done:** The founder reported completing and verifying the final visual check for the four isolated rotation, division, merge and deletion scenes. A separate read-only query of the disposable SQLite database compared every saved scene ID, version and graph hash with the recorded Stage 3A checkpoint. Neither local editor port 3002 nor isolated test port 3003 was listening during this recheck.

**Why it was done:** Close the post-restart visual review gate without changing user scenes or repeating mutation tests.

**Result:** Founder-reported visual acceptance passed. All four database records matched their checkpoint versions and graph hashes. There was no scene write, source change or new MCP mutation in this closeout. The earlier independent screenshots were captured before restart; an independent post-restart screenshot remains unavailable.

**Problems encountered:** The prior browser-harness stall remains a diagnostic issue. Same-process MCP concurrency and specialized construction operations remain unverified; global QA remains open.

**Next action:** Review and scope Stage 3B furniture tools as a separate substage. Keep testing on disposable scenes and address the listed limits in the relevant scope.

**Evidence:** [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md); disposable database and `summary.json` at `D:\PascalEditor-stage3a-browser-review-20261014-135455`.

### 2026-10-15 — Stage 3B floor furniture implementation

**Status:** Automated checks passed; browser acceptance pending.

**What was done:** Added narrow source MCP tools for built-in floor furniture placement, position/Y-rotation editing and leaf deletion. They require a saved scene version and check room bounds, asset suitability, plan clearance and door keep-outs. Created and reopened disposable SQLite scenes, rebuilt the source MCP server and updated its tool-annotation inventory. No user scene, dependency or Codex allowlist changed.

**Why it was done:** Give the agent a constrained furniture editing path before broader scene automation.

**Result:** The final MCP package suite passed 493/493; TypeScript, build, targeted Biome checks, smoke registration (68 tools) and whitespace checks passed. A saved review scene contains one catalog sofa at a known pose, and a read-only SQLite recheck matched its version and graph hash. Browser mesh loading and selection remain unverified.

**Problems encountered:** Automatic command review rejected a hidden isolated-editor launch as `blocked by policy`; a foreground launch failed with Windows `Access is denied`. The isolated server is not running. Built-in floor assets are the verified tool scope; other mounting and catalog sources need separate work if required.

**Next action:** Run the isolated browser check described in [Stage 3B](STAGE-3B-FURNITURE-TOOLS.md), compare the saved API, and review the scope before accepting 3B. Stage 3C and 3D remain pending; do not begin Stage 4.

**Evidence:** [Stage 3B report](STAGE-3B-FURNITURE-TOOLS.md); `packages/mcp/src/tools/furniture-tools.test.ts`; isolated checkpoint at `C:\Users\HP\AppData\Local\Temp\pascal-stage3b-review-0fdf9e1be359465d94adcb182b04a2b6`.

### 2026-10-15 — Stage 3B isolated browser acceptance

**Status:** Passed for the built-in floor-furniture scope.

**What was done:** The founder launched the isolated editor against the disposable Stage 3B database and reported visible sofa geometry/materials, selection and edit controls, and successful refresh/reopen without loading or save errors. A separate read-only check compared the running saved-scene API, SQLite graph and earlier checkpoint.

**Why it was done:** Confirm that the catalog sofa saved by the new MCP tools remains a real editable model in the normal browser editor.

**Result:** API and SQLite returned the same scene at version 3, the same SHA-256 graph hash and the same full 11-node graph. Room, sofa ID, parent, asset and transform matched the pre-browser checkpoint; browser viewing caused no persistent graph change. Visual results are founder-reported, while graph comparisons were independently checked.

**Problems encountered:** No independent sofa canvas capture or manual pose change was made in this browser review. Wall/ceiling/external catalog assets and concurrent MCP mutations remain outside the accepted scope.

**Next action:** Review Stage 3B's scoped result, then begin Stage 3C materials as a separate substage. Stage 3D lighting and Stage 4 remain gated.

**Evidence:** [Stage 3B report](STAGE-3B-FURNITURE-TOOLS.md); checkpoint `C:\Users\HP\AppData\Local\Temp\pascal-stage3b-review-0fdf9e1be359465d94adcb182b04a2b6\summary.json`.

## Milestone register


| Stage or milestone | Objective | Status | Verified completion date | Evidence | Remaining requirements |
| --- | --- | --- | --- | --- | --- |
| Local source setup | Install and run source editor | Completed on current workspace | 2026-10-14 | [QA assessment](../../qa-assessment/README.md) | Global check/test failures remain separate QA gates |
| Stage 1B | Preserve room through restart | Founder-reported pass | — | [Stage 1C report](STAGE-1C-NAMED-SCENE-ITEMS.md) | No independently repeated room-only restart claimed |
| Stage 1C procedural cabinet | Manual edit, save, refresh, reopen and restart | Completed for accepted cabinet | 2026-10-14 | [Stage 1C report](STAGE-1C-NAMED-SCENE-ITEMS.md) | External catalog GLB/chair acceptance remains separate |
| Stage 2A | Read-only source MCP inspection of same saved scene | Completed | 2026-10-14 | [Stage 2A report](STAGE-2A-MCP-CONNECTION.md) | No Stage 2A work outstanding for this verified scene |
| Stage 2B | Controlled agent scene mutation | Completed for one table move and restoration | 2026-10-14 | [Stage 2B report](STAGE-2B-FIRST-CONTROLLED-EDIT.md) | Broader autonomous editing is a separate future stage |
| Stage 3A | Canonical room/layout MCP operations | Scoped acceptance passed for tested principal operations, with founder-reported final visual confirmation | 2026-10-15 | [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md) | Same-process concurrency and specialized construction remain unverified; independent post-restart screenshot unavailable |
| Stage 3B | Validated agent-callable floor furniture operations | Scoped acceptance passed; founder-reported browser review and independent saved-graph comparison | 2026-10-15 | [Stage 3B report](STAGE-3B-FURNITURE-TOOLS.md) | Wall/ceiling and external catalog assets, concurrency and independent canvas capture remain outside this acceptance |
| Global QA | Clean check and test suite | Open | — | [QA assessment](../../qa-assessment/README.md) | Triage Biome failures; resolve or classify test failures and interrupted coverage |

## Important decisions

| Decision | Reason and evidence |
| --- | --- |
| Keep technical reports separate from this master register | The reports hold detailed steps, source paths and checkpoints; this register is a concise owner-facing status record. |
| Use the source-built MCP server over stdio for Stage 2A | The project registration points to this repository's built entrypoint and avoids a public listener; [verification](STAGE-2A-MCP-CONNECTION.md). |
| Initially expose only inspection tools | Scene identity and graph integrity had to be verified before agent mutation. `load_scene` changes session memory but did not persist; [verification](STAGE-2A-MCP-CONNECTION.md). |
| Keep scene persistence on the verified existing SQLite database | Browser API and MCP were checked against the same saved scene without database replacement; [verification](STAGE-2A-MCP-CONNECTION.md). |
| Accept procedural-cabinet Stage 1C separately from catalog GLB acceptance | The existing cabinet is real editable generated geometry, but it has no external asset ID; [acceptance scope](STAGE-1C-NAMED-SCENE-ITEMS.md#i-current-device-manual-furniture-acceptance--2026-10-14). |

## Known problems and blockers

| Problem | Impact and status | Next required action | Detail |
| --- | --- | --- | --- |
| Global Biome check failures | Clean repository check remains open; last documented run reported 3,002 errors and 7 infos | Classify existing formatting and other diagnostics, then fix in scoped changes | [QA assessment](../../qa-assessment/README.md) |
| Repository tests not fully passing | Release confidence limited; CLI had 7 failures and other tasks were interrupted | Reproduce and triage failing tests; finish interrupted suites | [QA coverage](../../qa-assessment/QA-COVERAGE.md) |
| Catalog furniture loading lacks independent browser inspection | The founder reported real table/chair models loaded and supplied a screenshot; saved assets are verified, but the agent did not operate the browser | If needed for broader acceptance, run an independent browser model-loading check | [Stage 2B report](STAGE-2B-FIRST-CONTROLLED-EDIT.md) |
| Stage 3A isolated browser startup | Earlier blank/loading check recovered after restart; a second automated capture did not reach editor controls in 40 seconds. The founder later confirmed the final visual check and the saved database matched all four checkpoints | Investigate the reproducible startup stall if it recurs; retain the missing independent post-restart screenshot as an evidence limit | [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md) |
| Stage 3A room-edit conflict safety | The earlier memory divergence was addressed by stored-version precheck and reload after failed save; late-conflict tests pass in memory and SQLite. Concurrent calls within one MCP process remain unverified | Review concurrency needs before broader agent editing; inspect storage before retrying an event-publication failure | [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md) |
| Stage 3B browser acceptance | Resolved on 2026-10-15 by founder-reported visual pass and matching running API/SQLite/checkpoint graph | Preserve the evidence; investigate only if the browser mismatch recurs | [Stage 3B report](STAGE-3B-FURNITURE-TOOLS.md) |

## Next actions

1. Reproduce and triage the recorded Biome and test failures before declaring global QA clean.
2. If broader catalog acceptance is required, independently inspect model loading in the browser after a fresh reopen.
3. Review the accepted Stage 3B floor-only scope, then implement and review Stage 3C materials and Stage 3D lighting as separate substages. Stage 4 remains on hold until both pass.
