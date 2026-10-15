# Project development register

This is the single master register for significant Pascal Editor MVP development. Read its current status before starting substantial work and update the affected sections before calling that work complete. Detailed evidence remains in the linked reports. Historical reports describe their status at the time; the current status below takes precedence when newer verified evidence exists.

Owner-facing plan comparison: [Stages 1–6 — original plan versus delivered work](IMPLEMENTATION-PLAN-COMPARISON.md), snapshot dated 2026-10-15. This register remains the master status record.

## Project overview

The project aims to let people and AI agents design real 3D interiors: rooms, furniture, surfaces, materials and lighting. The standalone browser editor provides manual scene editing; the source-built Pascal MCP server exposes scene operations for agents. The foundation is a Bun/TypeScript monorepo with core scene logic, a 3D viewer, editor UI, a Next.js app and SQLite scene persistence. Accepted Stage 4/5 scope provides approved, validated edits and deterministic style/layout alternatives through the in-editor Assistant, with real furniture, finishes and lighting surviving manual edits and reopening. Paid-provider, production deployment, broader catalog and repository-wide QA acceptance remain separate work.

## Current project status

| Item | Status as of 2026-10-15 |
| --- | --- |
| Current stage | Stage 6 assessment executed and scoped local mock demonstration passed; full MVP/pilot acceptance blocked |
| Overall progress | Stage 6 checks executed: 11,206 package tests passed, 57 failed and one skipped; relevant direct builds/types passed. Scoped Stage 3–5 acceptance remains valid |
| Most recent milestone | T1–T5 batch passed within scope: founder screenshots/reports and independent version-42 API/SQLite/history checks agree on the final edited scene |
| Work in progress | Manual acceptance closed; Stage 6 readiness remediation remains open |
| Important unresolved issues | Global tests/formatting, duplicate review workspaces, designLocked inventory, intermediate move flags saved to history, broader support transitions, unsupported mock phrases and public-pilot authorization/proxy boundaries |
| Immediate next action | Prioritize bounded fixes for metadata inventory and active-move persistence, then rerun affected checks; preserve accepted scene/evidence |

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

### 2026-10-15 — Stage 3C room-finish implementation and asset correction

**Status:** Implementation and persistence checks passed; corrected browser visual review pending.

**What was done:** Added source MCP material discovery and version-guarded whole-room floor/wall finish mutation using the canonical zone fields. Tested save/reload, refusal paths, room preservation and tool annotations on disposable SQLite scenes. An initial founder visual review used catalog entries whose texture URLs proved missing; the tool was narrowed to verified asset-backed or map-free entries, and a corrected disposable scene was prepared.

**Why it was done:** Enable an agent to change editable, persistent Pascal room finishes without writing raw graph data or silently hiding partial paint.

**Result:** The MCP package suite passed 494/494; TypeScript, build, targeted Biome and diff checks passed. The corrected scene's API, SQLite and checkpoint match at version 3 and hash `6fd6c4975ef5441bc209226dddf92d3ea7d57c94252e6e9a62b1d74e6dfc0cfc`; its four texture requests returned 200. No user scene was modified. The founder has not yet confirmed the corrected scene visually.

**Problems encountered:** `wood-finewood27` and `flooring-rusticbrick` return 404 for catalog texture maps, so their earlier apparent browser rendering was insufficient evidence of loaded textures. Repair of the broader catalog remains outside the 3C scope.

**Next action:** Founder reviews `http://127.0.0.1:3004/scene/856573aff7a9` after refresh; recheck saved graph. Accept Stage 3C only if both finishes render correctly, then start Stage 3D as a separate reviewed substage. Stage 4 remains gated.

**Evidence:** [Stage 3C report](STAGE-3C-MATERIAL-TOOLS.md); unique disposable checkpoints under `C:\Users\HP\AppData\Local\Temp\pascal-stage3c-review-9u0PXx`.

### 2026-10-15 — Stage 3C corrected browser acceptance

**Status:** Passed for the supported whole-room floor and boundary-wall finish scope.

**What was done:** The founder refreshed the corrected disposable scene and reported visible polished-concrete floor and cedar-siding walls without loading or save errors. A separate read-only comparison then checked the running browser API, SQLite and pre-review checkpoint.

**Result:** All three retained scene `856573aff7a9`, version 3, the same full 10-node graph and SHA-256 hash `6fd6c4975ef5441bc209226dddf92d3ea7d57c94252e6e9a62b1d74e6dfc0cfc`. All four selected texture URLs returned 200. Viewing the scene did not persist a graph change. Visual evidence is founder-reported; independent canvas capture was unavailable.

**Problems encountered:** The earlier wood/brick catalog maps still return 404 and remain outside the new tool's supported set. Broader catalog repair, partial-surface painting and same-process concurrent mutation are not covered by this acceptance.

**Next action:** Implement and review Stage 3D persistent real-lighting controls separately; keep Stage 4 on hold until 3D passes.

**Evidence:** [Stage 3C report](STAGE-3C-MATERIAL-TOOLS.md); `summary-supported.json` and `verify-supported-review.ts` in the unique disposable evidence directory linked above.

### 2026-10-15 — Stage 3D catalog-item lighting implementation and first browser review

**Status:** Scoped catalog-item point-light acceptance passed after follow-up review.

**What was done:** Added optional saved lighting to catalog items, connected it to the existing real point-light renderer, added source MCP `configure_item_light`, a local floor-lamp catalog entry, and editor light controls. Tested guarded SQLite mutations, viewer light output, reload, and selected-item interaction on disposable scenes. The isolated editor restarted against the same database; the founder reported a loaded floor lamp, warm illumination and matching controls after refresh.

**Why it was done:** Make agent and manual light intensity, color and on/off changes editable and persistent in Pascal's canonical scene.

**Result:** MCP suite 495/495, focused viewer 5/5, focused item-interaction 6/6, first-person regression tests 13/13, type checks, source builds and targeted Biome checks passed. The saved API retained scene `de70d994bbbb`, version 3, 11 nodes and its graph hash after the initial restart and browser review. No user scene or Codex MCP configuration changed.

**Problems encountered:** First-person lamp toggling used transient state; it was aligned with saved lighting and type-checked, but has no direct manual review. Independent canvas capture and same-process concurrent mutation remain unverified.

**Follow-up verification:** The founder switched the disposable lamp Off, set intensity 1.2 and color `#00aaff`, saved and refreshed, then reported the light was off and controls persisted. SQLite revision 9 independently contained the Off state. The founder intentionally turned it back On. After a second isolated editor restart, the founder reported blue illumination and unchanged controls. API and SQLite agreed at version 15 with all 11 nodes and hash `fb03acb27a7a3afea3e9a10e0e3f3e586fba15f88e65099916202c224d907465`; all other nodes were preserved. The editor added `installedPlugins` metadata on opening, and later saves increased the version without changing the graph hash.

**Next action:** Review [Stage 3D acceptance and limits](STAGE-3D-LIGHTING-TOOLS.md), then scope Stage 4 as a separate task. Retain broader lighting and global QA gaps.

### 2026-10-15 — Stage 4 in-editor Interior Assistant

**Status:** Implementation and automated checks passed; final browser evidence reconciliation pending.

**Purpose and work:** Added an Assistant sidebar with free deterministic mock planning and an optional server-side structured provider. Users review one validated Pascal operation and approve it before execution. The server binds proposals to the browser session, rechecks the saved version/hash, serializes its headless scene work, prevents duplicate execution and independently verifies the persistent result. Unsaved manual edits are protected. Existing scene tools, storage and renderer are reused.

**Verified result:** All 504 MCP tests passed with 3,173 assertions; 13 focused app tests passed with 51 assertions; MCP build, app TypeScript, targeted Biome and whitespace checks passed. In the running isolated editor, preview preserved the graph, approval persisted only the intended lamp color, and read-only SQLite matched the API. The founder reported the Assistant On workflow, refresh and reopen passed. Saved revisions show On at version 6 followed by Off at version 7, both through `configure_item_light`; each changed only lighting. The room remained unchanged. The founder has been asked whether the later Off action and preceding small manual move were intentional.

**Meaningful problems:** Next transformed the headless scene store into a client reference; the supported native dynamic-import boundary fixed the real HTTP failure. Next's local-hostname normalization also required a Host-aware same-origin check. No paid calls were made. Browser control surfaces were unavailable; visual evidence is founder-reported. Global QA and production/native-package deployment tracing remain open.

**Next action:** Resolve the final-check clarification and record scoped Stage 4 acceptance. Do not begin style generation. Live provider acceptance requires explicit paid-call authorization and configuration.

**Evidence:** [Stage 4 report](STAGE-4-INTERIOR-ASSISTANT.md); isolated checkpoint directory `C:\Users\HP\AppData\Local\Temp\pascal-stage4-review-7a60b7610cbd4f549b0e0509c7d9bda0`.

### 2026-10-15 — Stage 4 browser acceptance closed

**Status:** PASS for the scoped in-editor mock Assistant workflow.

**Purpose and work:** Reconciled the founder's browser review with the saved scene history. The founder confirmed the earlier small move and later Assistant Off request were intentional after the successful On refresh/reopen check. Performed a fresh saved API GET and read-only SQLite comparison, then updated the acceptance report and current register status. Earlier evidence is preserved.

**Verified result:** Scene `a3bd2c951555` remains at version 7 with graph SHA-256 `be16d1f42029fcda03c2b012af1accb42227341a14fdab1f1fc90cce02828f68`. API, SQLite and the final reference match exactly. Each Assistant On/Off action changed only the existing lamp's lighting; the room was preserved. Visual success is founder-reported; saved identity/graph comparisons were independently checked. The prior 504 MCP and 13 focused app test passes stand; this documentation-only closeout required no application test rerun. `git diff --check` passed.

**Remaining limits and next action:** No paid live-model call or production deployment acceptance is claimed. Existing global QA issues remain open. Stop after Stage 4; do not begin automated style generation. No scene mutation, source edit, commit or push occurred during this closeout.

**Evidence:** [Stage 4 acceptance report](STAGE-4-INTERIOR-ASSISTANT.md); new unique `acceptance-e02f511a-0d88-46a5-b08d-3428c13bdf44.json` in its linked evidence directory.

### 2026-10-15 — Stage 5 prerequisite verification blocked

**Status:** BLOCKED before implementation.

**Purpose and work:** Rechecked the current workspace, instructions, source contracts and accepted milestone reports before automated design work. Ran the relevant room, furniture, finish, lighting and Assistant tests on disposable storage, then reduced a failing room test to two smaller reproductions.

**Verified result:** The seven-file prerequisite group ran twice with 37 passes and one failure each time. After room division, storage stayed at version 1 instead of the expected 2. The room persistence test passes alone (1/1), but fails after the room suite (15 passes, one failure). After the Assistant suite, it found five zones instead of two (nine passes, one failure). Furniture, finish, lighting and all nine Assistant service tests passed. Earlier browser acceptance remains historical evidence; no new browser review was performed.

**Meaningful problem:** The failure depends on which suites run together. Shared scene/test state is a hypothesis; the root cause and production impact are not established. This is a current prerequisite failure, so the requested stop rule prevents Stage 5 implementation. No application source, user scene, dependency or configuration was changed.

**Next action:** Diagnose fixture initialization, shared state and scene loading; resolve the failure without weakening assertions, then rerun the reduced reproductions and prerequisite group. Resume Stage 5 only after the gate passes. Stage 6 is not ready.

**Evidence:** [Stage 5 prerequisite report and exact commands](STAGE-5-AUTOMATED-DESIGNS.md).

### 2026-10-15 — Combined prerequisite fix and Stage 5 implementation

**Status:** Implementation and scoped automated checks passed; manual acceptance pending.

**Purpose and work:** Resolved the failing combined room-persistence test before building automated layouts. The test assumed loading a default scene would clear an existing scene; Pascal intentionally preserves it. The fixture now clears its own shared state, tests both clean and previously populated stores, and retains the original persistence assertions. Production room-loading and division code were not changed for this fix.

**What was implemented:** Three supported style presets, deterministic furniture placement, boundary/door/walking-space checks, protected-object handling and up to three alternatives. The existing Assistant now shows alternatives for explicit selection and approval, executes through Stage 3 tools and verifies each saved step. Partial failure, cancellation and intervening edits stop further operations without replay or whole-scene rollback. Actual catalog models, concrete flooring, light wall finishes and real lamp settings are used. Oak/style-specific catalog gaps are disclosed before approval.

**Verified result:** Both reduced room regressions pass (17 and 11 tests); the complete prerequisite group passes all 39. Final MCP suite: 519 passed, zero failed. Final editor app suite: 58 passed, zero failed. The 14 Stage 5 tests cover living, bedroom, narrow, furnished/protected and irregular rooms, SQLite reopening and failure boundaries. MCP build, app TypeScript, targeted Biome and whitespace checks passed. A real running HTTP Assistant produced three alternatives, preserved preview state, rejected approval without a choice and saved the selected design in a disposable scene. API and SQLite agree; duplicate approval did not replay.

**Meaningful problems:** The first new HTTP test exposed optional furniture occupying space needed by a required lamp; placing essential pieces first resolved it without relaxing the test. Root test orchestration is blocked by the existing review app's duplicate workspace name. Each maintained package test script was run separately: 57 failures remain across CLI, core, editor package, IFC converter, nodes and viewer, plus one skipped nodes test. Those failures were observed before Stage 5 integration and remain open. Existing work and review applications were preserved.

**Acceptance and next action:** The isolated source editor is running at `http://127.0.0.1:3007/scene/6db4f5138e8d` using a new temporary database. Founder visual/approval, second-arrangement, manual-edit and refresh/reopen checks are pending. HTTP success does not establish visual acceptance. Complete those checks and compare saved evidence before accepting Stage 5. Stage 6 is not ready. No dependency upgrades, user-scene edits, commit, push or deployment were performed.

**Evidence:** [Stage 5 implementation, test matrix, constraints and manual procedure](STAGE-5-AUTOMATED-DESIGNS.md). Logs: `C:\Users\HP\AppData\Local\Temp\pascal-stage5-prerequisite-fix-ee4b0945384f4e0f8ef9d6580948422f`. Disposable API/database/checkpoint evidence: `C:\Users\HP\AppData\Local\Temp\pascal-stage5-review-1087dc79015643f4a6a277bd8a127e1a`.

### 2026-10-15 — Stage 5 browser failure reported and investigated

**Status:** Manual acceptance not passed; specific symptom awaiting clarification.

**Purpose and work:** Followed up the founder's “error or missing model/finish” report with read-only API, log and SQLite history inspection. At the first check the review scene was version 3 with no furniture. During diagnosis it advanced through the six design steps and two further arrangements to version 15, retaining the same sofa, table and lamp IDs and saved concrete floor, light walls and warm lamp settings. A separate temporary copy of the browser-saved state also executed successfully through the validated service.

**Verified result and limit:** Persistence is verified, but the original browser complaint and visual outcome remain unresolved. The log's Grammarly hydration warning and Solid shading setting do not establish a root cause. No agent mutation of the founder review scene, database restoration, production source change or configuration change was performed during this investigation. Earlier automated passes remain valid; they were not repeated for this diagnosis.

**Next action:** Obtain the exact missing element/error and timing, reproduce and fix if needed, then repeat visual, manual-edit and refresh/reopen acceptance. Do not accept Stage 5 or begin Stage 6 yet.

**Evidence:** [Stage 5 failure investigation and checkpoint paths](STAGE-5-AUTOMATED-DESIGNS.md#2026-10-15--first-browser-failure-investigation).

### 2026-10-15 — Stage 5 visual report corrected; designs and alternatives confirmed

**Status:** Visual design and alternative-selection checks passed; manual-edit persistence acceptance pending.

**Purpose and work:** Recorded the founder's correction that the earlier negative answer was UI confusion. The founder confirmed the real Scandinavian furniture models, concrete floor, light walls, warm lamp illumination, selection/edit controls and intentional approval of the two additional arrangements. Read the saved API and SQLite without mutation and compared the graph with the original room checkpoint.

**Verified result:** API and database agree at version 15 and hash `4cdbd9a6d28449a50db3986a5e33c438b93399c5e2daef6ca1e3fa6789abd2cd`. Exactly three furniture items retain their IDs and assets, and the original room structure is preserved. Rendering and UI success are founder-reported; persistence and preservation comparisons are independently verified. The earlier visual complaint is closed by clarification, not an application patch.

**Next action:** Manually move the existing coffee table and save, capture the saved reference, then verify refresh/reopening and continued editability. Stage 5 remains pending for these checks; Stage 6 is not ready. No scene or application source changes were made in this documentation closeout; prior automated results stand.

**Evidence:** [Stage 5 corrected visual acceptance](STAGE-5-AUTOMATED-DESIGNS.md#2026-10-15--founder-correction-and-visual-acceptance); unique `rendering-confirmation-db8038a4-ca02-44c8-b719-91c722a9fde8.json` in the report's review evidence directory.

### 2026-10-15 — Stage 5 manual translation still unverified

**Status:** Pending; saved observation does not yet confirm the reported table movement.

**Purpose and work:** Compared the founder's move/save confirmation against the saved API, read-only SQLite and version-15 reference. Captured a unique checkpoint without changing the scene.

**Verified result:** API and database agree at version 18, hash `8d29974e26952b07c33082247744ad3e88400ff5a01f588d49dbf80edf81987c`. All three items rotated 180 degrees, but the coffee table remains at `[3, 0, 1.75]`. Other item properties, room geometry, finishes and lighting remain unchanged. This proves saved rotations, not the requested table translation; no save defect is established.

**Next action:** Founder uses the normal move controls to shift only the coffee table in the same scene and saves, or requests control guidance. Capture the changed position before refresh/reopen. Prior visual/alternative passes stand; Stage 5 remains pending and Stage 6 gated. No application source or scene mutation was performed by the agent.

**Evidence:** [Stage 5 manual-movement comparison](STAGE-5-AUTOMATED-DESIGNS.md#2026-10-15--manual-movement-report-checked-against-storage); checkpoint `manual-edit-check-75183768-24ab-4744-9d7f-2f1e67034f41.json` in the report's existing evidence directory.

### 2026-10-15 — Stage 5 manual furniture edit and save verified

**Status:** Manual edit/save passed; refresh/reopen pending.

**Purpose and work:** Checked the founder's second movement/save report against version 18, the saved API and read-only SQLite. Captured the actual final table pose and support in a new reference without overwriting earlier evidence.

**Verified result:** Scene `6db4f5138e8d` is version 28, hash `1740093d8f761655bbea02c3c8519c47e4259ec541696c756d93fab6f2adedcc`. The same coffee table moved from `[3, 0, 1.75]` to `[2.994778922003897, 0, 2.0899598898840415]`; its actual new rotation and existing floor support are recorded. Asset, parent and scale remain unchanged. Every other node, including room structure, finishes, sofa and lamp lighting, is unchanged. The founder reports normal move controls and successful saving; persistent state is independently verified.

**Next action:** Refresh without editing, confirm the saved pose/rendering/selection, then close/reopen and compare again. Stage 5 remains pending until reload acceptance passes; Stage 6 stays gated. No source or scene changes were made by the agent; prior automated results stand.

**Evidence:** [Stage 5 final-position reference](STAGE-5-AUTOMATED-DESIGNS.md#2026-10-15--manual-editsave-verified-and-final-position-reference-captured); `manual-position-reference-38f3b6bf-cb72-4688-b5cc-ebf3e0d0674e.json` in the existing review evidence directory.

### 2026-10-15 — Stage 5 refresh/reopen acceptance completed

**Status:** PASS for the supported Stage 5 MVP scope.

**Purpose and work:** Closed the final acceptance checks after the founder separately confirmed browser refresh and closing/reopening the scene. Compared the saved API and read-only SQLite after each action with the captured manual table-edit reference, then updated the technical report and this master register.

**Verified result:** Both comparisons retain scene `6db4f5138e8d`, version 28 and SHA-256 `1740093d8f761655bbea02c3c8519c47e4259ec541696c756d93fab6f2adedcc`, with identical full graphs. The table's edited pose, all three item identities/assets, approved finishes, real lamp settings and room geometry are preserved. The founder confirms visible models/lighting and selection/editability without errors after both reload actions. This completes the scoped Scandinavian browser demonstration; three styles and A–E room fixtures also have the previously recorded automated coverage.

**Limits and next action:** The earlier UI-confusion report is resolved. Catalog/spatial limits and the 57 separate workspace failures remain open; this is not global QA or production-release acceptance. The Stage 5 prerequisite for Stage 6 is satisfied, but Stage 6 was not started and requires its own requested scope. No source/scene mutation, dependency change, commit, push or deployment occurred during this closeout. Read-only comparison scripts and `git diff --check` passed; prior 519 MCP and 58 app test passes stand without an unnecessary rerun.

**Evidence:** [Stage 5 final acceptance and scope](STAGE-5-AUTOMATED-DESIGNS.md#2026-10-15--refreshreopen-verified-scoped-stage-5-acceptance-closed). Distinct `refresh-verification-fcb6bbf1-441b-4558-aeff-d75902e2b186.json` and `reopen-verification-423d577d-9f36-4fad-89d2-f361b610576f.json` checkpoints are in the report's existing review evidence directory.

### 2026-10-15 — Stage 6 baseline, agent evaluation and production demonstration setup

**Status:** Assessment executed; manual demonstration in progress. Full MVP/public-pilot acceptance blocked.

**Purpose and work:** Rechecked the current checkout and accepted stages, ran every maintained package test script directly after duplicate review-app names blocked root orchestration, ran relevant types/builds and non-fixing lint/format checks, and investigated significant failures. Added 30 recorded Assistant evaluation cases and six security/provider checks. Created new isolated SQLite benchmark/manual scenes and started the production build on loopback port 3008. Existing work, scenes and the port-3007 editor were preserved.

**Verified result:** Latest full package totals are 11,206 passes, 57 failures and one skip. MCP: 549/549; editor app: 64/64; combined prerequisite group: 53/53. Direct core/MCP/viewer/nodes and app builds plus core/editor/UI/CLI/app type checks passed. Root lint passed with seven infos; formatting failed with 3,047 diagnostics. All 30 new evaluation safety expectations passed, with nine explicitly recorded capability gaps. Production HTTP preview/approval/duplicate/security checks and independent SQLite comparisons passed. Five-sample local measurements and a founder-friendly script are recorded; GPU/frame latency is unmeasured.

**Meaningful problems:** A Stage 5 metadata flag, `designLocked`, is not classified in the core reference inventory. Ordinary manual movement can pin furniture to its floor, which the current AI furniture tool then refuses. Several requested natural-language phrases are unsupported in mock mode. Windows path/subprocess failures, geometry-byte mismatch, IFC/CLI failures and order-dependent shelf tests remain open. The total failure count matches the prior count by coincidence: its composition changed. Public-pilot scene ownership and trusted-header/rate controls are incomplete. A successful local build is not full release acceptance.

**Founder evidence:** The founder created a 6 × 5 m room with ordinary tools, saved, refreshed and reopened it. The API and read-only database agree at version 2 with hash `4b57abf3d175100ed1939d6326569df541c9d754a996288b0d3aeb0eb4d08c68`; all ten nodes match the initial reference. Visual success is founder-reported. Manual chair placement/editing is the next pending check. Stage 5's accepted version-28 scene remains byte-for-byte unchanged.

**Next action:** Continue the isolated browser journey, capture exact saved references, then triage the documented blockers before full MVP/pilot acceptance. No production implementation fix, dependency upgrade, commit, push or deployment was made. Stage 7 has not started.

**Evidence:** [Stage 6 assessment](STAGE-6-MVP-EVALUATION.md), [agent evaluation](STAGE-6-AGENT-EVALUATION.md), [demonstration script](STAGE-6-DEMONSTRATION.md). Logs/checkpoints: `C:\Users\HP\AppData\Local\Temp\pascal-stage6-qa-533b3284cbfe4ff8869191a6d602fcb7`.

### 2026-10-15 — Stage 6 manual chair edit captured

**Status:** Manual insertion/edit/save verified; chair refresh/reopen pending.

**Purpose and work:** Reconciled the founder's confirmation of a real loaded, selectable chair with the saved scene API and read-only SQLite history. Captured unique full-scene and item-history checkpoints before refresh.

**Verified result:** Scene `f4b34c4a42c1` is version 14, hash `eff9c00b7d2bc121590392975af58fd94f086f40f285bdbea3727b059fdefd84`, with 11 nodes. The same Dining Chair `item_1g83lapa0xefcysz` moved between saved versions 11 and 14 and rotated 30°; its asset, parent and scale are unchanged. Every original room node is preserved; only the chair and its level-child link were added. Rendering/edit-control success is founder-reported; identity, transforms and storage comparisons are independently verified.

**Limit and next action:** The chair has normal pinned-floor support, so the existing AI furniture-tool limitation remains open. Refresh and reopen without editing, confirm the chair remains visible/editable, and compare against the captured reference. No application source or scene was changed by the agent, and automated suites were not rerun for this read-only documentation update. Stage 6 remains pending with broader readiness blockers.

**Evidence:** [Stage 6 chair reference and checkpoint paths](STAGE-6-MVP-EVALUATION.md#2026-10-15--manual-chair-insertion-and-edit-saved); `manual-chair-saved-31162352-c488-49f8-bec1-89e2b04f6ac1.json` and `manual-chair-history-cb300955-02a4-47fb-87a4-8202abd579c9.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 chair refresh/reopen acceptance passed

**Status:** Manual furniture journey passed; Assistant design demonstration pending.

**Purpose and work:** Reconciled the founder's successful refresh/reopen and editability confirmation with a fresh scene API and read-only SQLite comparison. Preserved the initial checkpoint and wrote a new uniquely named result.

**Verified result:** Scene `f4b34c4a42c1` remains at version 14, 11 nodes and hash `eff9c00b7d2bc121590392975af58fd94f086f40f285bdbea3727b059fdefd84`. The full saved graph equals the pre-refresh reference, including chair identity/asset/pose/support and every original room node. Visual/editability evidence is founder-reported; graph equality is independently checked.

**Next action:** Founder requests a Scandinavian design and clicks Preview change only. Confirm alternatives and unchanged saved state before approval. Existing global QA, language, pinned-item editing and deployment limitations remain open. No application source or scene change was made; automated suites were not repeated for this evidence update.

**Evidence:** [Stage 6 chair reopening comparison](STAGE-6-MVP-EVALUATION.md#2026-10-15--chair-refresh-and-reopening-passed); `manual-chair-reopened-3f6f4c4c-093c-4c4c-8af0-892b7f8bf835.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 design approval clarified and persistence verified

**Status:** Approved design saved; current visual acceptance pending.

**Purpose and work:** Investigated why the saved scene changed after a preview-only question. The founder clarified that they also clicked Approve selected layout. Recorded that confirmation separately from independent saved-state checks; no approval-bypass defect is established by this sequence.

**Verified result:** Scene `f4b34c4a42c1` advanced from version 14 to 20 through six design operations. API and read-only SQLite agree on hash `c325355c112109158a09d64df80b37f50b6882c15badb69a2d3c4b02263e2cf7`, with three new catalog items, concrete flooring, light wall material and enabled warm lamp settings. The existing Dining Chair and room structure remain intact. A fresh checkpoint confirms no further graph changes.

**Evidence limit and next action:** The unchanged preview appearance and approval click are founder-reported; no intermediate saved checkpoint was captured before approval. Existing automated preview checks stand. Confirm the actual design rendering and edit controls, then continue furniture/light edits and final persistence checks. No application code or scene was changed by the agent, and automated suites were not repeated. Full Stage 6/pilot acceptance remains blocked on the previously recorded issues.

**Evidence:** [Stage 6 approved-design verification](STAGE-6-MVP-EVALUATION.md#2026-10-15--design-approval-clarified-and-saved-design-verified); unique `design-history-investigation-cf73de54-a37d-4b0b-95af-6183295d5b98.json` and `design-approval-confirmed-b44a7f7a-98df-438c-b42c-952bccb70a40.json` in the existing Stage 6 evidence directory. Earlier investigation files are retained unchanged.

### 2026-10-15 — Stage 6 approved design visually confirmed

**Status:** Supported design application and finish rendering passed; remaining demonstration checks pending.

**Purpose and result:** The founder confirmed real sofa/table/lamp models, concrete flooring, light walls, actual warm illumination, table editing controls and the preserved chair, without loading/save errors. A fresh API/read-only SQLite comparison retains scene `f4b34c4a42c1` at version 20 with the exact approved graph and zero changed nodes. Visual observations remain founder-reported; saved data is independently checked.

**Next action:** Preview `move selected by 0.10 m on x` for the AI-created coffee table, stopping before approval so the saved-state boundary can be checked. Then complete explicit lighting, manual refinement and final refresh/reopen checks. Existing pinned-item, language, global QA and pilot-readiness issues remain open. No application source or scene was changed by the agent; prior automated results stand.

**Evidence:** [Stage 6 design visual check](STAGE-6-MVP-EVALUATION.md#2026-10-15--approved-design-visual-check-passed); `design-visual-confirmed-86e80e01-e853-45c5-889c-88fdbc96d8d3.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 coffee-table preview failure diagnosed

**Status:** Furniture-move acceptance blocked; existing design visual pass retained.

**Purpose and work:** Investigated the founder's report of an error and no preview. The saved table has moved since the version-20 reference and now carries an ordinary floor-support link. A mock-only production preview for its exact ID returned HTTP 422: unsupported parent or pinned support. The current move tool rejects this data; it is the existing mixed manual/AI editing limitation.

**Verified result:** API and read-only SQLite agree on scene `f4b34c4a42c1`, version 23, hash `f3af6ef028f7789e8b66e6ae717045fad9d36d7ac0d9e5c8b5eedb281a16cc5f`. Only the table differs from the accepted design; other furniture, room geometry, finishes and lighting are preserved. The diagnostic preview changed no scene, revision or event rows. No approval was sent. The targeted E30 safety test passes (1 pass, 0 fail, 29 filtered); this confirms safe rejection, not successful movement.

**Limit and next action:** Obtain the exact browser error and confirm the additional table edits. Fix/test supported floor-linked movement before repeating this table's acceptance check. The old −4.65 X proposal is stale. No support stripping, raw scene/database edit, substitute item or pose restoration was performed. No application source was changed during diagnosis; global tests and other readiness blockers remain open.

**Evidence:** [Stage 6 preview diagnosis](STAGE-6-MVP-EVALUATION.md#2026-10-15--coffee-table-move-preview-blocked-by-pinned-support); unique version-23 checkpoint, diagnostic request/history JSON and targeted E30 log in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 same-floor furniture movement repaired

**Status:** Source fix and runtime preview verified; browser acceptance pending.

**Purpose and work:** The founder's error text and screenshot confirmed that the Assistant rejected an ordinary floor-supported table. Updated `furniture-tools.ts` to allow movement/rotation fully within the same valid floor slab, retaining the support link and height offset. Existing collision, room, version, approval and persistence checks remain. No scene data was rewritten to bypass validation.

**Verified result:** Fifteen new isolated support tests plus existing prerequisites and all 30 evaluations pass together: **98 passed, 0 failed, 1,265 assertions**. MCP build and targeted Biome checks pass. E30 now tests a successful approved supported-table move; eight language/catalog gaps remain in that evaluation set. Initial test assertion and build type-guard errors were corrected and retained in the detailed report.

**Runtime and preservation:** Restarted only the isolated port-3008 editor with the same database and mock provider. Actual HTTP preview now returns 200 for the existing table, proposing X −4.49060825420414 to −4.390608254204141. No approval was sent; the diagnostic proposal was cancelled. Scene version 23, hash `f3af6ef028f7789e8b66e6ae717045fad9d36d7ac0d9e5c8b5eedb281a16cc5f`, and all scene/history/event rows stay unchanged.

**Limits and next action:** Founder refreshes and retries Preview change only before an approved browser movement. Ground-pinned furniture, slab transitions, edge overhang, changed height offsets and pinned deletion remain refused. Existing global QA/pilot blockers remain open. No dependency change, raw scene edit, commit or push occurred.

**Evidence:** [Same-slab repair, commands and checkpoints](STAGE-6-MVP-EVALUATION.md#2026-10-15--same-slab-furniture-movement-fix-and-runtime-verification), [updated evaluation status](STAGE-6-AGENT-EVALUATION.md), [demonstration instructions](STAGE-6-DEMONSTRATION.md).

### 2026-10-15 — Stage 6 approved table movement persistently verified

**Status:** Saved movement passed; visual movement confirmation pending.

**Purpose and work:** The founder confirmed a correct stationary preview, then clarified that they also clicked Approve change. Independently compared the saved API, SQLite graph, revision and operation event with the pre-move version-23 reference. The intermediate browser-preview state was not captured independently; existing automated/HTTP preview checks remain the evidence for that boundary.

**Verified result:** Scene `f4b34c4a42c1` is version 24, hash `541083e5039a7a20abdd962df3b5bdfb5faf2a5529f25757d8e7f41c4a51a28c`. Coffee table `item_p52sqw099amvtmt2` moved from X −4.49060825420414 to −4.390608254204141 metres. One revision and one `edit_floor_item` event were added. Its floor support, Y/Z, rotation, scale, asset and all other graph content are unchanged.

**Next action:** Founder confirms visible movement and an error-free saved-result message, then continue lighting and final refresh/reopen checks. Do not repeat approval. No source or scene mutation was performed by the agent in this follow-up; prior 98 regression passes/build results stand and broader QA/pilot issues remain open.

**Evidence:** [Approved supported-table move](STAGE-6-MVP-EVALUATION.md#2026-10-15--founder-approved-supported-table-move-saved); `supported-table-approved-a3402534-94c4-4f05-85bd-4d3a35abbeea.json` and its read-only verification script in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 table movement visually accepted

**Status:** Journey 5 passed for the approved same-slab table movement; overall Stage 6 remains in progress and full readiness blocked.

**Purpose and result:** The founder confirmed visible movement and an error-free saved result after approval. A fresh API/read-only SQLite comparison retains scene `f4b34c4a42c1` at version 24 with hash `541083e5039a7a20abdd962df3b5bdfb5faf2a5529f25757d8e7f41c4a51a28c` and zero changed nodes since the approved-movement reference. Visual evidence is founder-reported; saved graph equality is independently checked.

**Next action and limits:** Preview the explicit lamp-color request, verify no save before approval, then complete lighting and final refresh/reopen checks. Earlier manual table edits still need intent confirmation. No application source or scene was changed by the agent; prior regression results stand and broader QA/pilot issues remain open.

**Evidence:** [Table visual acceptance and checkpoint](STAGE-6-MVP-EVALUATION.md#2026-10-15--supported-table-visual-acceptance-passed); unique `supported-table-visual-confirmed-fa7f6b15-0c94-4106-9487-97e23866b5f8.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 lighting preview boundary verified

**Status:** Preview check passed; approval and actual light-change acceptance pending.

**Purpose and result:** The founder confirmed the correct `#ffbb66` proposal and that it had not been approved. An independent API/read-only SQLite checkpoint before requesting approval retains version 24 and the exact full graph/hash. This verifies that the browser preview did not persist the proposed color change.

**Next action:** Founder approves the reviewed proposal once and confirms visible illumination and a saved result. Compare the complete persistent graph to ensure only the lamp color changed, then continue final persistence checks. No scene or application source was changed; prior automated results and global blockers remain as recorded.

**Evidence:** [Lighting preview comparison](STAGE-6-MVP-EVALUATION.md#2026-10-15--lamp-color-preview-preserves-saved-scene); `lighting-preview-unchanged-67b5c780-65d8-4f01-9389-41cb1dc9e60f.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 warm-light result and extra operation investigated

**Status:** Final saved color and visual result verified; approval-sequence clarification pending.

**Purpose and result:** The founder reported warmer illumination and a saved result without errors. The single-edit check failed because version 26 was saved instead of 25. Read-only history then showed two light operations: blue at version 25 and warm at version 26. API and SQLite agree on final hash `c7be786851bc5ef595e6dc6f98eb563a32a5d3810baebd7903d76a9a89d0284b`. Only the lamp color differs from the version-24 reference; its On state/intensity and all furniture, room and finish data remain intact.

**Next action and limit:** Confirm whether the founder intentionally approved both changes before accepting this sequence, then continue manual refinement and final refresh/reopen checks. The saved history alone does not establish intent. No agent scene mutation or application-source change occurred; the failed exact-version check is retained, not counted as a pass. Existing QA/pilot blockers remain open.

**Evidence:** [Light history and clarification](STAGE-6-MVP-EVALUATION.md#2026-10-15--warm-lamp-result-verified-intermediate-blue-edit-awaiting-clarification); unique `lamp-color-history-investigation-0aecfa07-afb2-4f06-b4f4-3e9feb547507.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Stage 6 lighting accepted and review workflow batched

**Status:** Supported light-color application passed; remaining browser batch pending.

**Purpose and result:** The founder confirmed intentionally approving blue and then warm, resolving the extra-operation question. Both saved revisions change only lamp color; the final API/database graph remains version 26 with all other data preserved. Warm illumination and error-free saving are founder-reported. A fresh unchanged baseline was captured outside Git.

**Workflow change:** At the founder's request, consolidated the remaining manual refinement/save, refresh, reopen/editability and two unsupported-request checks into T1–T5. They can run together and be reported in one reply, with a stop only for errors or unexpected changes. No batch outcome is marked passed yet; later verification will use the persistent history and current API without claiming independent snapshots before every browser action.

**Next action and limits:** Complete that batch and compare saved evidence. Preserve the earlier strict-version failure as evidence of the initial one-edit assumption; the intentional two-edit clarification does not change that test result. Global QA and pilot-readiness blockers remain open. No application-source or scene mutation was performed by the agent.

**Evidence:** [Lighting clarification and baseline](STAGE-6-MVP-EVALUATION.md#2026-10-15--lighting-approvals-clarified-remaining-checks-batched), [batched test cases](STAGE-6-DEMONSTRATION.md#remaining-checks--one-batch).

### 2026-10-15 — Stage 6 batched browser acceptance completed

**Status:** T1–T5 and the scoped local mock demonstration PASS; full Stage 6 MVP/pilot acceptance remains BLOCKED.

**Purpose and work:** The founder reported all five checks passed and supplied before/after, lamp and unsupported-request screenshots. Compared the final API with read-only SQLite, inspected every revision since the baseline and preserved hash-verified copies of the five images outside Git. Updated the assessment and demonstration results together, without another sequential browser checklist.

**Verified result:** Scene `f4b34c4a42c1` is version 42 with 14 stable node IDs and hash `fffb02a7f1864a50f2a4e126c10f9d8457a445c768927625e56ae2537867b48a`. The same table moved to `[-5.4, 0, 4.908630767842986]` and rotated from 90° to 45°, retaining its asset, parent, floor support and scale. The room, finishes, chair, sofa and complete warm-lamp data are preserved. The level child order changed, but membership/parent links did not. No new MCP operation events followed the batch baseline. Both read-only history/acceptance scripts passed; whitespace checking passed.

**Evidence limits and problem:** Refresh/reopen actions and exact lighting-control display are founder-reported; screenshots support visible models, editing controls and illumination, while saved data verifies exact values. T4/T5 passed safe refusal and do not close their unsupported-language gaps. Intermediate revisions contain temporary move flags, and one briefly omits the table support link; final data is correct. This is a newly recorded interruption/recovery risk, not an assumed safe autosave behavior. No mid-move restart test was performed.

**Next action:** Preserve this accepted local demonstration and address outstanding QA/security/language/persistence gates in bounded work. No further T1–T5 repeat is needed without a relevant change or failure. No application source, scene, database, dependency, commit or push changed during this closeout; earlier automated suite outcomes remain as recorded.

**Evidence:** [Batch results, exact transforms, history and screenshot manifest](STAGE-6-MVP-EVALUATION.md#2026-10-15--batched-manual-acceptance-closed-with-screenshot-and-saved-history-evidence), [completed demonstration](STAGE-6-DEMONSTRATION.md). Unique acceptance file: `batch-acceptance-016a1c47-5462-457f-8bba-c61441d580e3.json` in the existing Stage 6 evidence directory.

### 2026-10-15 — Original-plan progress comparison prepared

**Status:** Reporting task completed; milestone acceptance statuses are unchanged.

**Purpose and work:** Compared the founder's stage instructions with the recorded implementation, automated results and browser/persistence evidence. Created a concise stage-by-stage report covering the delivered architecture, scope restrictions, final demonstration, unresolved gates and local Git delivery state.

**Result:** Work was executed in every stage from 1 through 6. Stages 1–5 passed their documented MVP scope and Stage 6's supported local mock demonstration passed; full original-plan completion and pilot readiness remain blocked. The report explicitly distinguishes safe refusal from successful language capability, historical tests from new runs, and local files from committed/pushed delivery.

**Next action:** Use the comparison to prioritize the existing metadata, move-state persistence, global QA, language/catalog and security gaps. No new tests, application changes, scene edits, commits or pushes were performed for this documentation task; whitespace and report-link checks were run.

**Evidence:** [Implementation plan comparison](IMPLEMENTATION-PLAN-COMPARISON.md), linked stage reports and [Stage 6 assessment](STAGE-6-MVP-EVALUATION.md).

### 2026-10-15 — Separate mock-test branch prepared for publication

**Status:** Branch created; commit and remote publication pending.

**Purpose and work:** The founder requested the work to date on a separate GitHub branch named “Pascal Editor MCP Mock Test”. Git ref names cannot contain spaces, so the branch is `Pascal-Editor-MCP-Mock-Test`, created from `dda35f77c8d62c18fe254a08a892be4846dff34d`. Verified the existing destination as `https://github.com/websyncdigital/PascalEditor.git`; the requested branch name was unused locally and remotely.

**Snapshot scope:** All 54 modified/new project source, test, contract and report files are selected, including Stage 3C/3D, the Assistant, layouts, Stage 6 evaluation/repair and plan comparison. The original branch is retained. Machine-specific `.codex/config.toml`, the 765-file disposable `apps/editor-stage3a-review/` copy, ignored build/dependency files, scene databases and external checkpoints remain local and unchanged.

**Validation and limits:** A credential-pattern scan of the 54 selected files found no flagged files. Prior executed tests and known failures remain documented; publication is not a new acceptance gate or a deployment. No source implementation was changed for the snapshot.

**Next action:** Commit the selected project files, push only this new branch to `origin`, verify its remote commit identity, then record publication. Full Stage 6 acceptance remains blocked by the existing findings.

**Evidence:** [Plan comparison](IMPLEMENTATION-PLAN-COMPARISON.md), [Stage 6 results](STAGE-6-MVP-EVALUATION.md); branch `Pascal-Editor-MCP-Mock-Test`.

## Milestone register


| Stage or milestone | Objective | Status | Verified completion date | Evidence | Remaining requirements |
| --- | --- | --- | --- | --- | --- |
| Local source setup | Install and run source editor | Completed on current workspace | 2026-10-14 | [QA assessment](../../qa-assessment/README.md) | Global check/test failures remain separate QA gates |
| Stage 1B | Preserve room through restart | Founder-reported pass | — | [Stage 1C report](STAGE-1C-NAMED-SCENE-ITEMS.md) | No independently repeated room-only restart claimed |
| Stage 1C procedural cabinet | Manual edit, save, refresh, reopen and restart | Completed for accepted cabinet | 2026-10-14 | [Stage 1C report](STAGE-1C-NAMED-SCENE-ITEMS.md) | External catalog GLB/chair acceptance remains separate |
| Stage 2A | Read-only source MCP inspection of same saved scene | Completed | 2026-10-14 | [Stage 2A report](STAGE-2A-MCP-CONNECTION.md) | No Stage 2A work outstanding for this verified scene |
| Stage 2B | Controlled agent scene mutation | Completed for one table move and restoration | 2026-10-14 | [Stage 2B report](STAGE-2B-FIRST-CONTROLLED-EDIT.md) | Broader autonomous editing is a separate future stage |
| Stage 3A | Canonical room/layout MCP operations | Scoped acceptance retained; combined persistence failure resolved and regression checks pass | 2026-10-15 | [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md), [fixture fix and recheck](STAGE-5-AUTOMATED-DESIGNS.md) | Existing general concurrency and specialized-operation limits remain |
| Stage 3B | Validated agent-callable floor furniture operations | Scoped acceptance passed; founder-reported browser review and independent saved-graph comparison | 2026-10-15 | [Stage 3B report](STAGE-3B-FURNITURE-TOOLS.md) | Wall/ceiling and external catalog assets, concurrency and independent canvas capture remain outside this acceptance |
| Stage 3C | Validated whole-room floor and wall finish operations | Scoped acceptance passed; founder-reported browser review and independent saved-graph comparison | 2026-10-15 | [Stage 3C report](STAGE-3C-MATERIAL-TOOLS.md) | Broader catalog repair, partial painting, concurrency and independent canvas capture remain separate |
| Stage 3D | Persistent real catalog-item lighting controls | Scoped acceptance passed; founder-reported Off/On visual checks and independent saved API/SQLite/restart comparison | 2026-10-15 | [Stage 3D report](STAGE-3D-LIGHTING-TOOLS.md) | Procedural/broader lighting, first-person manual review, concurrency and independent canvas capture remain separate |
| Stage 4 | Approved AI-assisted changes inside the existing editor | Scoped mock workflow acceptance passed; founder browser confirmation and independent saved-state comparison | 2026-10-15 | [Stage 4 report](STAGE-4-INTERIOR-ASSISTANT.md) | Optional paid live-provider, production deployment and global QA acceptance remain separate |
| Stage 5 | Automated layouts and design styles through approved editable scene changes | Scoped acceptance passed: automated/HTTP, visual design, alternatives, manual edit/save, refresh and reopening | 2026-10-15 | [Stage 5 report](STAGE-5-AUTOMATED-DESIGNS.md) | Retain documented scope; Stage 6 now evaluates broader readiness |
| Stage 6 | MVP QA, agent evaluation and demonstration | Assessment executed; scoped local mock demonstration passed; full acceptance blocked | 2026-10-15 | [Stage 6 assessment](STAGE-6-MVP-EVALUATION.md) | Address global QA, language, intermediate move-state persistence and deployment/security gaps |
| Global QA | Clean check and test suite | Open | — | [QA assessment](../../qa-assessment/README.md) | Triage Biome failures; resolve or classify test failures and interrupted coverage |

## Important decisions

| Decision | Reason and evidence |
| --- | --- |
| Keep technical reports separate from this master register | The reports hold detailed steps, source paths and checkpoints; this register is a concise owner-facing status record. |
| Use the source-built MCP server over stdio for Stage 2A | The project registration points to this repository's built entrypoint and avoids a public listener; [verification](STAGE-2A-MCP-CONNECTION.md). |
| Initially expose only inspection tools | Scene identity and graph integrity had to be verified before agent mutation. `load_scene` changes session memory but did not persist; [verification](STAGE-2A-MCP-CONNECTION.md). |
| Keep scene persistence on the verified existing SQLite database | Browser API and MCP were checked against the same saved scene without database replacement; [verification](STAGE-2A-MCP-CONNECTION.md). |
| Accept procedural-cabinet Stage 1C separately from catalog GLB acceptance | The existing cabinet is real editable generated geometry, but it has no external asset ID; [acceptance scope](STAGE-1C-NAMED-SCENE-ITEMS.md#i-current-device-manual-furniture-acceptance--2026-10-14). |
| Stage 4 uses one stored operation per human approval, with mock as default | Keeps review and interruption boundaries clear; no multi-operation atomicity or paid model access is assumed. Assistant headless work is serialized because the existing bridge shares process memory. [Contract](STAGE-4-INTERIOR-ASSISTANT.md). |
| Stage 5 extends approval to one selected, bounded design alternative | Every step uses existing tools and saves separately. Explicit choice, snapshot validation and per-step version/hash checks preserve approval and conflict boundaries; partial completion is reported. Structured comparisons do not mutate the scene. [Contract and limits](STAGE-5-AUTOMATED-DESIGNS.md). |

## Known problems and blockers

| Problem | Impact and status | Next required action | Detail |
| --- | --- | --- | --- |
| Stage 3A combined persistence test failure | Resolved: the fixture now resets shared state explicitly; clean/populated regressions and combined prerequisite group pass | Preserve the regression coverage; production default loading still protects existing scenes | [Stage 5 fix and recheck](STAGE-5-AUTOMATED-DESIGNS.md) |
| Stage 5 manual acceptance | Resolved: founder confirmed the full workflow; refresh/reopen API and read-only database exactly match the version-28 manual reference | Preserve acceptance evidence and scoped limitations; reopen only for a new regression | [Stage 5 acceptance](STAGE-5-AUTOMATED-DESIGNS.md) |
| Global Biome check failures | Stage 6 lint passes with seven infos; format check fails with 3,047 errors | Fix formatting only in scoped changes; no broad rewrite performed | [Stage 6 checks](STAGE-6-MVP-EVALUATION.md) |
| Repository tests not fully passing | Stage 6 direct runs: CLI 7, core 7, editor package 19, IFC converter 2, nodes 20 and viewer 2 failures; nodes 1 skip. Root test/types/build stop on duplicate review workspaces | Resolve classified source and environment failures; preserve review work. Isolated shelf pass does not close combined failures | [Current Stage 6 matrix](STAGE-6-MVP-EVALUATION.md), [historical QA coverage](../../qa-assessment/QA-COVERAGE.md) |
| Stage 5 designLocked inventory | New metadata flag is missing from the canonical non-reference inventory; core contract test fails | Classify the boolean and rerun contract/full checks | [Stage 6 investigation](STAGE-6-MVP-EVALUATION.md) |
| Mixed manual/AI furniture editing | Scoped issue resolved: same-slab move/rotation tested, approved movement verified, manual refinement and final refresh/reopen passed. Broader support transitions excluded | Preserve scoped acceptance and support references; assess broader transitions separately | [Batch acceptance](STAGE-6-MVP-EVALUATION.md#2026-10-15--batched-manual-acceptance-closed-with-screenshot-and-saved-history-evidence), [evaluation E30](STAGE-6-AGENT-EVALUATION.md) |
| Active-move data persisted in scene history | Revisions 32/36/39/41 save temporary move flags; version 36 temporarily omits table support. Final version 42 has correct support and no transient flags | Investigate save serialization and interruption/reopen behavior on disposable storage; do not infer recovery safety from the final successful state | [Batch history and source observations](STAGE-6-MVP-EVALUATION.md#2026-10-15--batched-manual-acceptance-closed-with-screenshot-and-saved-history-evidence) |
| Broader language and pilot security | Eight remaining evaluation language/catalog gaps after E30 repair; scene ACLs, trusted headers/proxy policy and paid-provider acceptance incomplete | Keep demo local and explicit; resolve before shared/public pilot | [Stage 6 readiness](STAGE-6-MVP-EVALUATION.md) |
| Catalog furniture loading lacks independent browser inspection | The founder reported real table/chair models loaded and supplied a screenshot; saved assets are verified, but the agent did not operate the browser | If needed for broader acceptance, run an independent browser model-loading check | [Stage 2B report](STAGE-2B-FIRST-CONTROLLED-EDIT.md) |
| Stage 3A isolated browser startup | Earlier blank/loading check recovered after restart; a second automated capture did not reach editor controls in 40 seconds. The founder later confirmed the final visual check and the saved database matched all four checkpoints | Investigate the reproducible startup stall if it recurs; retain the missing independent post-restart screenshot as an evidence limit | [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md) |
| Stage 3A room-edit conflict safety | The earlier memory divergence was addressed by stored-version precheck and reload after failed save; late-conflict tests pass in memory and SQLite. Concurrent calls within one MCP process remain unverified | Review concurrency needs before broader agent editing; inspect storage before retrying an event-publication failure | [Stage 3A report](STAGE-3A-ROOM-LAYOUT-TOOLS.md) |
| Stage 3B browser acceptance | Resolved on 2026-10-15 by founder-reported visual pass and matching running API/SQLite/checkpoint graph | Preserve the evidence; investigate only if the browser mismatch recurs | [Stage 3B report](STAGE-3B-FURNITURE-TOOLS.md) |
| Missing catalog texture maps | `wood-finewood27` and `flooring-rusticbrick` map URLs returned HTTP 404; initial Stage 3C visual report could reflect fallback appearance | Keep them outside the new finish-tool allowlist; repair and verify the broader catalog separately | [Stage 3C report](STAGE-3C-MATERIAL-TOOLS.md) |

## Next actions

1. Preserve the accepted Stage 6 local demonstration, final version-42 scene and screenshot/history evidence. No further T1–T5 repetition is required without a relevant change or new failure.
2. Prioritize the metadata inventory defect and active-move persistence/recovery risk, then the remaining evaluation, support and global QA failures; fix and reverify in bounded changes before declaring full MVP acceptance.
3. Keep any demonstration within the disclosed local mock scope. Public/shared pilot, paid-provider acceptance and a subsequent stage remain unapproved and blocked on their required checks.
