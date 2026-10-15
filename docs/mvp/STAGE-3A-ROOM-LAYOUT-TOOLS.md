# Stage 3A — room and layout tools

**Status:** Stage 3A visual acceptance passed for the scoped room creation, movement, rotation, division, merge and deletion checks. The founder confirmed the final post-restart visual check on 2026-10-15; a read-only database check independently confirmed the four saved scene versions and graph hashes. Stage 3B has not started. Source revision: `c728ad82ab641c43e9085f71913ed2b210aa5085` plus the uncommitted changes below. Runtime used: Bun 1.4.3 (workspace manifest requests Bun 1.3.14).

## Prerequisites and scope

Stage 2A's read-only source-built MCP connection and Stage 2B's catalog-table move and position-only restoration are recorded in [Stage 2A](STAGE-2A-MCP-CONNECTION.md) and [Stage 2B](STAGE-2B-FIRST-CONTROLLED-EDIT.md). Unit tests used a disposable in-memory store; the later review used a separate SQLite database at `D:\PascalEditor-stage3a-review-20261014-1250\data\pascal.db`. No saved user scene or database was targeted for an isolated mutation; separate read-only checks of the normal editor were made. Existing worktree changes were preserved. No MCP write tool was enabled in the Codex configuration.

## Capability audit

| Domain | Classification | Evidence and limit |
| --- | --- | --- |
| Room creation | EXISTS_AND_WORKS for canonical graph and isolated save/reload | `registerCreateRoom` in `packages/mcp/src/tools/room-tools.ts` calls core `createZone` in `packages/core/src/commands/structure/create-zone.ts`, then `SceneBridge.applyPatch` and derived-structure reconciliation. SQLite/API persistence and founder-reported browser rendering after restart passed; independent visual inspection did not. |
| Room editing | EXISTS_AND_WORKS for the tested principal room operations; specialized construction remains UNVERIFIED | `move_zone`, `rotate_zone`, `set_zone_intent`, divide/merge/delete in `packages/mcp/src/tools/structure-tools.ts`. SQLite tests save/reload intent, rotation, division, merge and deletion; the earlier isolated browser/restart check covers `move_zone`. The additional browser review below visually confirmed rotation, division, merge and deletion before restart, and their saved graphs survived editor restart. All registered structure mutators use the shared pre-mutation stored-version guard. Specialized construction operations are not individually covered by this review. |
| Furniture insertion, move, rotation, deletion | EXISTS_BUT_NEEDS_EXPOSURE for a constrained agent contract | `place_item`, `apply_patch`, `delete_node` are registered in `packages/mcp/src/tools/index.ts`; Stage 2B verified one item move and inverse. Broader placement, deletion and failure behavior remain for 3B. |
| Floor and wall finishes | EXISTS_BUT_INCOMPLETE as an agent contract | `set_zone_intent` and construction tools expose finish/material inputs; `ZoneNode` has `floorFinish`/`wallFinish` metadata. Supported preset validation and rendered persistence require 3C verification. |
| Decorative fixtures and actual illumination | UNVERIFIED for persistent light controls | Viewer `glb-interactive.tsx` renders actual `pointLight` instances and `use-item-light-pool.ts` derives intensity from interactive state. Their saved control-state behavior requires 3D verification. |
| Scene validation and collision checking | EXISTS_AND_WORKS in isolated tests | `validate_scene` and `check_collisions` are registered; Stage 2B used both on the saved table scene. Coverage of every new operation remains open. |
| Conflict/error recovery | EXISTS_AND_WORKS for tested precheck, late conflict and event-failure cases; concurrent same-process calls remain UNVERIFIED | `assertLiveSceneCurrent` checks the bound scene against storage before room/structure mutation, including when `create_room.expectedVersion` is omitted. If a save fails after a bridge edit, `publishLiveSceneSnapshot` reloads the stored graph and clears history, or unbinds the scene if reload fails. An event-append failure reports that the save persisted. In-memory and disposable SQLite tests exercise these outcomes. |

These classifications distinguish source registration and unit behavior from browser rendering and restart evidence. They do not authorize 3B–3D edits.

## 3A contract and change

`create_room` accepts a level ID, nonempty name, polygon of `[x, z]` metre points, optional wall dimensions and `outdoor`. It returns a minted zone ID, wall IDs in edge order, derived slab/ceiling IDs, area, and conflicts. IDs are stable for the saved result but a repeated successful request creates a new room; there is no idempotency key. The canonical planner validates polygon geometry and reuses shared walls. No raw graph JSON is an agent input.

The added optional positive integer `expectedVersion` is checked against both the bound MCP scene and current storage **before** room mutation. A stale binding or caller version returns `scene_version_conflict` before bridge changes. Even when callers omit the field, bound room and structure tools compare the active and stored versions. Unbound/in-memory tool behavior remains available. Successful bound edits use `publishLiveSceneSnapshot` for optimistic save and live event. A late rejected save now reloads the authoritative stored graph into MCP memory and clears undo history; if recovery cannot reload, the scene is unbound. A failed event append after a successful save returns `live_sync_event_failed` with the persisted version and unknown event status, so callers must inspect storage before retrying. Repeated successful calls are still not idempotent, and concurrent calls inside one MCP process have not been serialized or tested.

## Verification

| Command | Result |
| --- | --- |
| `bun test src/tools/room-tools.test.ts src/tools/structure-tools.test.ts` from `packages/mcp` | 23 pass, 0 fail, 274 assertions after the final reload assertion. |
| `bun x tsc --noEmit -p tsconfig.json` from `packages/mcp` | Pass. |
| `git diff --check` | Pass. |

The initial test uses `InMemorySceneStore` and an MCP client. It verifies room persistence, version increment, four saved walls, reload into a fresh `SceneBridge`, stale session rejection and external storage-version rejection without a bridge graph change. Its 23 room/structure tests, TypeScript check, and `git diff --check` passed at that checkpoint. The later checks below supersede its then-open conflict and persistence findings. The prior unrelated Biome/test findings in `qa-assessment/` remain open.

## Isolated SQLite and browser review — 2026-10-14

The rebuilt source MCP stdio entrypoint (`packages/mcp/dist/bin/pascal-mcp.js`) saved a default scene and called `create_room` with `expectedVersion: 1` against the isolated database. It returned scene `b2240e060ef7`, room `zone_7ftpssyt9y0xqb0o`, four wall IDs, derived slab `slab_00028s0hrqtvi665` and ceiling `ceiling_6t079y6r8kyh7v79`. MCP validation was valid. The saved editor API agreed at version 2, ten nodes and graph hash `71f9941d1713aa78bd359ce1c99d762707f14862d37e47e73f6bcad2bdb6aa93`. Unique MCP result: `D:\PascalEditor-stage3a-review-20261014-1250\mcp-result.json`.

A disposable editor copy served the same database on loopback port 3003. The first browser check was founder-reported **blank/loading**, and the isolated dev process later stopped responding to API requests. The copy outside the repo had build-resolution problems, so a temporary copy under `apps/editor-stage3a-review` was used. Only the isolated port-3003 process was restarted; the original editor/database was not touched. After restart, the scene page and API returned HTTP 200, and the founder reported that the room, walls, floor and ceiling rendered correctly on refresh. This is founder visual evidence, not an independent screenshot-based inspection.

The browser editor made one saved version change while opening the test scene: version 2 became 3, with hash `13243c2e640b47d23ba9780dfb31d6a7c4f0bf9123b51234091bdef0ae19582f`. Read-only SQLite revision comparison found identical nodes and roots; the only graph difference was a new `installedPlugins` list. After restarting the isolated editor, the API still showed version 3, one zone, four walls, one slab and one ceiling. This verifies SQLite-backed restart persistence of the room graph while explicitly retaining the editor's legitimate metadata save.

The isolated port-3003 server was stopped after the successful check. Its temporary app copy at `apps/editor-stage3a-review/` remains untracked: automatic command review rejected cleanup of its junction and directory, so no deletion was attempted. The disposable database and MCP result remain outside the repository for evidence.

## Isolated room edit and restart review — 2026-10-14

The previous isolated SQLite database was copied, including its WAL state, to a unique test database at `D:\PascalEditor-stage3a-edit-review-20261014-131444\data\pascal.db`; the original test checkpoint and live user database were not targets of the edit. Against the source-built stdio MCP server, scene `b2240e060ef7` began at version 3, hash `13243c2e640b47d23ba9780dfb31d6a7c4f0bf9123b51234091bdef0ae19582f`, with room `zone_7ftpssyt9y0xqb0o` and polygon `[[0,0],[5,0],[5,4],[0,4]]`. A `create_room` call with stale `expectedVersion: 2` returned an error; the active graph, stored version and hash remained unchanged.

One `move_zone` call translated that room by `[0.25, 0]` metres. A fresh MCP process loaded version 4 with hash `f0730aee001651b93787772d86077400f18b7e4a6faa4c2acbfb0360259ffbb3`, the same room ID, ten node IDs and roots, and polygon `[[0.25,0],[5.25,0],[5.25,4],[0.25,4]]`. `validate_scene` returned valid. The only changed node fields were the room polygon/seed, four wall start/end points, and derived slab/ceiling polygons. The targeted 23 tests passed with 274 assertions and `git diff --check` passed again. Unique before/after graphs, tool result and summary are in `D:\PascalEditor-stage3a-edit-review-20261014-131444`.

The copied editor served this database on loopback port 3003. The scene API and page returned HTTP 200. After a controlled editor restart, the API still returned version 4, the same hash and ten nodes. The founder then refreshed the scene and reported that the moved room rendered with four walls, floor and ceiling, without a blank/loading page or error. A following read-only API check still returned version 4, hash `f0730aee001651b93787772d86077400f18b7e4a6faa4c2acbfb0360259ffbb3`, one zone, four walls, one slab and one ceiling. This is founder visual evidence plus independently checked persistent data, not an agent screenshot inspection. The isolated port-3003 server was stopped after review; the normal editor on port 3002 remained running.

## Conflict recovery and broader SQLite verification — 2026-10-14

`packages/mcp/src/tools/live-sync.ts` now checks the stored version before bound room edits and recovers the bridge from the stored graph after a rejected save. `room-tools.ts` and `structure-tools.ts` call that guard before their mutations. A late storage conflict was injected between the precheck and save: the rejected room was absent from both bridge and storage, the competing graph and version were restored, undo history was cleared, and a later request using the current version succeeded. The same recovery was checked against a unique disposable SQLite database. A separate test made event append fail after save and confirmed the saved graph and version remained committed while the tool returned `live_sync_event_failed`.

The new `packages/mcp/src/tools/structure-persistence.test.ts` uses a temporary SQLite database and fresh `SceneBridge.loadJSON` validation after each save. It verifies `set_zone_intent`, `rotate_zone`, `divide_zone`, `merge_zones` and `delete_zone`, including version increments, saved events and room counts. The database is removed after the test. This verifies saved canonical graphs, not browser rendering or server-restart behavior for each of these paths. Existing in-memory tests cover their other contracts; specialized floor/construction operations remain separately scoped.

| Command | Result |
| --- | --- |
| `bun test src/tools/live-sync.test.ts src/tools/room-tools.test.ts src/tools/structure-tools.test.ts` from `packages/mcp` | 34 pass, 0 fail, 332 assertions after conflict-safety changes. |
| `bun test src/tools/structure-persistence.test.ts` from `packages/mcp` | 1 pass, 0 fail, 26 assertions. |
| `bun test` from `packages/mcp` after the new SQLite test | 492 pass, 0 fail, 2,871 assertions across 67 files. |
| `bun x tsc --noEmit -p tsconfig.json` from `packages/mcp` | Pass after the new test. |
| `bun run build` from `packages/mcp` | Pass after conflict-safety source changes; source-built MCP entrypoint rebuilt. |
| `bun run scripts/smoke.ts` against unique disposable database `D:\PascalEditor-stage3a-runtime-20261014-134006\pascal.db` | Pass; 65 tools registered. |
| `bun x biome check --formatter-enabled=false` on the seven changed MCP source/test files | Pass. Targeted full Biome check reports six whole-file formatting/line-ending errors in the existing modified files; the new test is fully formatted and no broad reformat was applied. |
| `git diff --check` | Pass after source changes. |

## Isolated browser review of four room edits — 2026-10-14

The source-built `packages/mcp/dist/bin/pascal-mcp.js` ran over stdio against a new disposable database at `D:\PascalEditor-stage3a-browser-review-20261014-135455\pascal.db`. Its MCP tools created four separate default-room scenes, then applied one named operation per scene; the merge case divided first. A fresh MCP process loaded each saved result and `validate_scene` returned valid. Before opening the browser, the isolated editor API on loopback port 3003 matched every MCP scene ID, version and graph hash. No user scene, database or Codex tool allowlist was changed.

| Operation | Scene and saved result | Browser observation before restart |
| --- | --- | --- |
| `rotate_zone` | `fa4b6bfe2280`, version 2→3, hash `5f89c8683dcc5e3366a8afcb47ee4cfb6ad958617c19ce610b174063bfecf819`; polygon changed from `[[0,0],[8,0],[8,4],[0,4]]` to `[[2,-2],[6,-2],[6,6],[2,6]]` | Captured 3D canvas showed the rotated room with four walls and floor. |
| `divide_zone` | `d9fa6276ed1c`, version 2→3, hash `54ab8c07868a0a144fd0a0fe2562f3f3296950b7d45288344455c6db9b1b40f0`; two zones and one separator | Captured 2D canvas showed two room labels and the dashed separator. The unselected separator is deliberately hidden in 3D by `packages/nodes/src/separator/renderer.tsx`, so the 3D overview alone was insufficient. |
| `merge_zones` | `07cdf1f7e305`, version 2→4 through divide/merge, hash `3b7f176d97c6e554ff89fc2889eb480d9d6b8ae537e421627c173923af92e296`; one zone and no separator | Captured 2D canvas showed one room with the dashed separator removed; 3D walls and floor remained. |
| `delete_zone` | `7a8532a50fae`, version 2→3, hash `c6687c57173d948a547ceb7d1df59a22c438c28b0be81f44be60e4249b088a81`; zero zones/walls and three base nodes | Captured editor controls and an empty 3D workspace, consistent with deletion, without a loading or error display. |

All four pages reached `document.readyState === 'complete'`, had a canvas and reported no captured browser exceptions. Screenshots, full before/after graphs, MCP tool results, the exact test scripts and API comparisons are in `D:\PascalEditor-stage3a-browser-review-20261014-135455`. Notable screenshots are `rotate-browser.png`, `divide-browser-2d.png`, `merge-browser-2d.png` and `delete-browser.png`. After viewing, the saved API version and graph hash remained unchanged for all four scenes. The API also returned the same versions and hashes after stopping and restarting only the isolated editor against that database. Port 3003 and the test browser were stopped; the normal editor on port 3002 remained listening.

The in-app browser-control runtime failed twice before opening a tab (`failed to write kernel assets`), so the visual evidence came from a local headless Chrome session and inspected screenshots. Its first command-line screenshot attempt stalled; Chrome DevTools capture succeeded. During the later restart check, the test browser did not expose editor controls within 40 seconds, although the saved API remained healthy. A fresh background Chrome launch was then rejected by automatic approval review as `blocked by policy`, so **post-restart browser rendering was not independently verified on 2026-10-14**. The isolated editor also logged a viewer-readiness timeout during the first visual pass even though the captured room canvases rendered. These are test-harness limits, not evidence of a changed saved graph.

## Final visual confirmation and saved-state recheck — 2026-10-15

The founder reported that the final visual check was completed and verified for the four isolated Stage 3A review scenes after the restart. This closes the requested visual acceptance check as **founder-reported evidence**; no independent post-restart screenshot was captured. The earlier screenshot and browser-harness results remain historical evidence above.

With the local test servers no longer listening, a read-only `bun:sqlite` connection to `D:\PascalEditor-stage3a-browser-review-20261014-135455\pascal.db` queried `scenes` and computed SHA-256 over each stored `graph_json`, matching `SqliteSceneStore.hashGraphJson`. All four records matched `summary.json`: rotation `fa4b6bfe2280` version 3/hash `5f89c8683dcc5e3366a8afcb47ee4cfb6ad958617c19ce610b174063bfecf819`; division `d9fa6276ed1c` version 3/hash `54ab8c07868a0a144fd0a0fe2562f3f3296950b7d45288344455c6db9b1b40f0`; merge `07cdf1f7e305` version 4/hash `3b7f176d97c6e554ff89fc2889eb480d9d6b8ae537e421627c173923af92e296`; deletion `7a8532a50fae` version 3/hash `c6687c57173d948a547ceb7d1df59a22c438c28b0be81f44be60e4249b088a81`. No scene write, source change or new MCP mutation was performed for this check.

## Review gate

The identified late-conflict memory divergence is fixed and covered by in-memory and SQLite tests. Automated save/reload and initial browser views cover the principal room rotation, division, merge and deletion paths; creation and movement have earlier browser/restart evidence. The four new graphs survived server restart by API identity, version and hash, and the founder confirmed the final visual check. **Stage 3A passes its scoped acceptance review.** Independent post-restart screenshot capture, concurrent calls in one MCP process, specialized room construction operations and the isolated browser startup stall remain limits. Stage 3B may be scoped in a separate task; no furniture implementation or general mutation-tool enablement is authorized by this report. Stage 3B should validate asset selection, parent/support and placement, deletion, collisions, idempotency and safe persistence on disposable scenes.
