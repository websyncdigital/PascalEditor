# Stage 5 — automated layouts and design styles

**Current status: PASS for the supported Stage 5 MVP scope (2026-10-15).** Scoped automated tests, live HTTP approval/persistence checks and the founder's Scandinavian design, alternatives, manual editing, refresh and reopening checks have passed. Final API and read-only SQLite state exactly match the version-28 manual-position reference, including graph hash and all nodes. The original room is preserved. Catalog/spatial limitations and separate global QA failures remain open; this is not repository-wide release acceptance. The Stage 5 prerequisite for Stage 6 is satisfied; Stage 6 has not started. Earlier observations remain below as history.

## Prerequisite failure resolved

The failure was shared test state, not a demonstrated production division defect. `SceneBridge.loadDefault()` in `packages/mcp/src/bridge/scene-bridge.ts` calls `useScene.getState().loadScene()` in `packages/core/src/store/use-scene.ts`. The latter intentionally preserves an already populated scene. The persistence fixture assumed that call reset the process-wide store, so rooms left by previous suites contaminated its geometry and room-count assertions.

`packages/mcp/src/tools/structure-persistence.test.ts` now explicitly empties the bridge before creating its default fixture, clears history and cleans shared state afterward. It tests both initially empty and deliberately populated stores, verifies that `loadDefault()` itself still preserves existing content, asserts the clean initial node types and room identity, and checks tool conflicts in addition to the original persistence assertions. No production load, storage or division behavior was changed to fix this failure.

| Executed regression command from `packages/mcp` | Result |
| --- | --- |
| `bun test src/tools/room-tools.test.ts src/tools/structure-persistence.test.ts` | 17 passed, 0 failed; 175 assertions |
| `bun test src/assistant/service.test.ts src/tools/structure-persistence.test.ts` | 11 passed, 0 failed; 142 assertions |
| `bun test src/tools/room-tools.test.ts src/tools/structure-tools.test.ts src/tools/structure-persistence.test.ts src/tools/furniture-tools.test.ts src/tools/finish-tools.test.ts src/tools/lighting-tools.test.ts src/assistant/service.test.ts` | 39 passed, 0 failed; 630 assertions |

Accepted Stage 3A–3D and Stage 4 browser evidence remains in their existing reports. Current tool and Assistant persistence tests pass; prior browser/restart checks were not represented as newly repeated tests.

## Implementation and source contracts

The existing canonical scene, renderer, SQLite adapter and Stage 4 Assistant remain authoritative. There is no second renderer or persistent scene store. Designs are deterministic local plans; this task makes no paid model calls.

| File / symbol | Responsibility |
| --- | --- |
| `packages/mcp/src/assistant/design-presets.ts`: `DESIGN_PRESETS` | Three configurable style rules, existing catalog IDs, finishes, lighting, furniture density and layout preferences |
| `design-contracts.ts`: `designRequestSchema`, `DesignAlternative`, `DesignStep` | Strict input bounds, one room, protected IDs, clearance units and alternative operation lists |
| `design-request.ts`: `parseDesignRequest` | Supported request grammar, actual room resolution, purpose/style selection and protected-item clarification |
| `design-layout.ts`: `planRoomDesign` | Deterministic footprint placement, constraints, recommendations and reasons for rejected candidates/alternatives |
| `design-spatial.ts`: `insideRoom`, `checkCirculation` | Polygon/hole containment and conservative connected walking-space checks |
| `design-execution.ts`: `callDesignStep`, `assertDesignPreserved` | Strict Stage 3 operations, returned new-item IDs and unrelated/protected graph preservation |
| `service.ts`: `InteriorAssistantService.proposeDesign`, `approveDesign` | Dry-run validation, session-owned alternatives, explicit choice, version/hash checks and verified sequential saving |
| `contracts.ts` | Optional design proposal and partial-result contract; the existing single-operation planner contract remains available |
| `apps/editor/components/interior-assistant.tsx` | Structured alternative comparison, explicit selection, approval, warnings and saved-result synchronization |
| `apps/editor/app/api/scenes/[id]/assistant/route.ts` | Accepts only an alternative ID belonging to the stored proposal; preserves existing same-origin/session/security checks |
| `design-layout.test.ts`, `apps/editor/lib/assistant-route.test.ts` | Disposable fixture, failure, preservation, reload and HTTP approval tests |

Existing `runtime.ts` functions `serialized`, `withSceneTools`, `previewStore`, `callOperation` remain the execution boundary. Actual operations are `place_floor_item`, `edit_floor_item`, `set_room_finish`, `configure_item_light`; they are existing validated Stage 3 registrations. Layouts do not delete existing furniture or modify structure. New lamp references resolve from the placement tool's returned ID, never an invented node ID.

### Available styles and mappings

| Style | Living-room assets | Bedroom assets | Floor / walls | Real light state |
| --- | --- | --- | --- | --- |
| Scandinavian | `sofa`, optional `coffee-table`, `floor-lamp` | `double-bed` (catalog fallback `single-bed`), optional `bedside-table`, `floor-lamp` | `concrete-polished` / `preset-softwhite` | On, 1.5, `#ffddaa` |
| Modern Minimalist | `sofa`, `floor-lamp` | `double-bed` (catalog fallback `single-bed`), `floor-lamp` | `concrete-polished` / `preset-white` | On, 1.2, `#ffe8cc` |
| Contemporary | `sofa`, optional `coffee-table`, optional `tv-stand`, `floor-lamp` | `double-bed` (catalog fallback `single-bed`), optional `bedside-table`, optional `dresser`, `floor-lamp` | `concrete-polished` / `preset-beige` | On, 1.8, `#ffe0b2` |

Mappings use `findCatalogItem` and real `MATERIAL_CATALOG` entries. Tests verify mapped GLB magic bytes and every declared texture file. Essential pieces are placed before optional ones; otherwise a table could prevent lamp placement in a small room. An initial HTTP test exposed this ordering defect, and the corrected algorithm now passes that same test without weakening it.

The catalog does not establish style-specific variants. Tags are preferences, not claims about asset provenance. Verified oak flooring is unavailable; Scandinavian/oak requests explicitly disclose the supported concrete substitute before approval. Missing-texture catalog materials remain excluded. The bed fallback is used when the preferred catalog entry is unavailable, not as an exhaustive fit search. Decoration is intentionally absent. Density is implemented through category lists and optional pieces, not a fabricated quality score.

### Geometry, constraints and limits

Supported rooms are flat, bounded living rooms or bedrooms, including straight-edged irregular polygons. Positions are level-local metres; Y rotation is radians. Existing scaled asset dimensions supply conservative plan boxes. The planner reuses Pascal's `inspectItemPlanFootprint`, `itemPlanAabb`, `collectDoorKeepouts`, `polygonBounds` and `aabbsOverlap`.

- Room polygons and holes constrain footprint containment; walls and represented door openings constrain placement.
- Defaults: 0.60 m between item boxes, at least 0.15 m from the room boundary (increased for wall thickness), and 0.80 m door keep-out depth. Walking-space requests use 0.80 m item clearance. Explicit clearance input supports 0.08–2 m.
- A sampled connected route must reach furniture and represented doors. Neighbor transitions are also checked, including polygon holes. This is a conservative grid/box approximation, not an accessibility, building-code, ergonomics or specific furniture-face guarantee.
- Existing items are obstacles throughout the sequential plan. Explicit `keep ITEM_ID`/unique name, `metadata.locked`, `metadata.designLocked`, pinned supports and attached children preserve objects. Other rooms, structure, material metadata and unrelated nodes are compared after execution.
- Curved walls, unknown structural obstacles, manual/elevated/cut-out floor plates and stepped/hosted/open room floors fail with an explanation. The current floor gate supports the ordinary automatic base plate at 0.05 m; arbitrary support topology is not inferred.
- At most 500 scene nodes, ten target furniture items, 64 polygon vertices, 30 m room span per axis, three alternatives and sixteen operations per proposal. A bounded grid and fixed orientation/anchor ordering make results repeatable.

This is a bounded greedy search, not proof that no arrangement can exist. Failed alternatives explain which constraint prevented a supported proposal; optional pieces can be omitted with a visible reason. Fewer than three distinct feasible alternatives may be offered. Exact rotation-only mesh collisions, arbitrary decor, external catalog assets and unsupported room purposes remain outside this scope.

### Approval, persistence and safe interruption

Supported examples include the three style requests, `Rearrange the furniture without changing the walls`, `Show me three alternative layouts`, `Design Living room in a Scandinavian style; keep ITEM_ID`, and `Use a light oak floor and warm lighting`. Ambiguous rooms/items or unmapped styles request clarification. This is a bounded request grammar, not unrestricted natural-language comprehension.

Planning runs every proposed operation through the registered tools against disposable memory snapshots, then checks schema validity and preservation. The saved scene stays unchanged. UI alternatives list objects, positions, rotations, materials, light settings, warnings and exact steps; they are structured comparisons, not rendered scene previews.

Approval must name one stored alternative. Session ownership, ten-minute expiry, scene version and graph SHA-256 are rechecked. The service serializes headless bridge work, rechecks persisted state before each operation, applies through the registered tool, then requires an actual saved version increment and graph equality with the bridge. This is one save per operation, not an atomic multi-operation transaction. Lighting is canonical item data consumed by the existing renderer.

Cancellation or a 60-second execution deadline stops before the next operation; an in-flight operation can finish. Tool calls retain the existing 30-second timeout and lock-drain behavior. Save failures, intervening edits and notification failures stop the sequence, retain verified work and report partial/conflict/uncertain outcomes. Result versions/hashes reflect the most recent observed storage when readable. Approving the same proposal again cannot replay it or apply a different alternative. No automatic retry, undo, graph rollback or overwrite of an intervening manual edit is used.

## Current verification

Evidence directory (outside Git): `C:\Users\HP\AppData\Local\Temp\pascal-stage5-prerequisite-fix-ee4b0945384f4e0f8ef9d6580948422f`.

| Command / working directory | Actual result |
| --- | --- |
| `bun test` in `packages/mcp` after final changes | **519 passed, 0 failed; 3,463 assertions**, `final-mcp.log` |
| `bun test lib` in `apps/editor` after final changes | **58 passed, 0 failed; 164 assertions**, `final-app.log` |
| `bun test packages/mcp/src/assistant/design-layout.test.ts` from root | **14 passed, 0 failed; 241 assertions**; included in final MCP suite |
| `bun run build` in `packages/mcp` | Passed; TypeScript build and Node ESM import repair, `mcp-build-final.log` |
| `bun x tsc --noEmit -p tsconfig.json` in `apps/editor` | Passed, `app-types-final.log` |
| `bun x biome check` on all 13 Assistant TypeScript files, the persistence test, Assistant UI, API route and API test | 17 files checked, passed without fixes |
| `git diff --check` | Passed; existing LF/CRLF notices only |

Fixture coverage: A small living room, B medium bedroom, C impossible narrow bedroom, D furnished room with a protected sofa and unrelated room, E irregular room. Assertions cover deterministic alternatives, actual assets, footprint containment, collisions, clearance, parent IDs, finish/light values, fresh SQLite reopening, preserved objects/structure, duplicate approval, unknown IDs/dimensions/support, ambiguous targets, unsupported styles, stale versions, missing choice, cross-session access, cancellation, second-save failure, event failure and intervening edits. The existing Stage 3 suites retain invalid material/asset and storage-conflict coverage.

### All maintained workspace test scripts were attempted

Root `bun run test` fails before executing tests because the existing untracked `apps/editor-stage3a-review/package.json` duplicates workspace name `editor`. That founder review directory was preserved. Each maintained workspace with a test script was therefore run directly using `bun run test`, excluding review copies. Non-MCP/editor-app results below were captured before Stage 5 integration and were not fixed in this task.

| Workspace | Passed | Failed | Skipped | Evidence log |
| --- | ---: | ---: | ---: | --- |
| `packages/cli` | 101 | 7 | 0 | `packages-cli.log` |
| `packages/core` | 4,237 | 6 | 0 | `packages-core.log` |
| `packages/editor` | 1,887 | 19 | 0 | `packages-editor.log` |
| `packages/ifc-converter` | 43 | 2 | 0 | `packages-ifc-converter.log` |
| `packages/nodes` | 3,820 | 21 | 1 | `packages-nodes.log` |
| `packages/viewer` | 505 | 2 | 0 | `packages-viewer.log` |
| `packages/mcp` | 519 | 0 | 0 | Final rerun, `final-mcp.log` |
| `apps/editor` | 58 | 0 | 0 | Final rerun, `final-app.log` |

Open failures include CLI managed-runtime/archive tests, core initialization/derived-construction audits, editor history/source-invalidation checks, IFC beam imports, nodes initialization/shelf/material-cache checks, and viewer dependency/geometry audits. These remain separate global QA failures. Neither this report nor the scoped prerequisite pass claims a clean repository-wide suite. Global Biome was not rerun; its previously documented failures remain open.

## Running editor and HTTP evidence

The source app is running on loopback `http://127.0.0.1:3007`, launched from `D:\PascalEditor\apps\editor` with `bun run dev -p 3007 -H 127.0.0.1`, `PASCAL_AI_PROVIDER=mock` and `PASCAL_DB_PATH=C:\Users\HP\AppData\Local\Temp\pascal-stage5-review-1087dc79015643f4a6a277bd8a127e1a\pascal.db`. Node reports `v22.14.0`, Bun `1.4.3`, Next `16.3.0`, source MCP package `1.0.3`. Source HEAD is unchanged; implementation is in the working tree.

Review evidence directory: `C:\Users\HP\AppData\Local\Temp\pascal-stage5-review-1087dc79015643f4a6a277bd8a127e1a`. It contains uniquely created initial checkpoints, `prepare.mjs`, `http-check.mjs`, editor output and `http-acceptance-1792062404222.json`. Initial checkpoints were not overwritten. Both rooms were created through source-built room tools in this new disposable database.

Independent HTTP smoke scene `571f6aa5c730`:

- Before: version 2, SHA-256 `e33e7777b749a66dcb551b68ea94031f6e9fe885818c08202ccadbd7aa1494ce`.
- The running Assistant returned three alternatives; preview preserved the graph. Approval without a choice returned HTTP 400. One chosen alternative executed five operations and saved version 7, SHA-256 `98e1de423af7e14da7d3db217fd8d0cf95d51211fedb4ab2e45d60ab16fb33f9`.
- API and separately opened SQLite adapter matched. Replaying approval with another alternative returned the existing result without another change. Sofa and lamp asset requests returned HTTP 200 and actual GLB headers. Lamp persisted On, intensity 1.5, color `#ffddaa`. This is API/asset evidence, not visual evidence.

Founder review room `6db4f5138e8d`: [open isolated Stage 5 scene](http://127.0.0.1:3007/scene/6db4f5138e8d). Initial version 2, SHA-256 `0e9211b6e52f365a10d57fb7d57cbd5143274ce8208d716d8fd512c916f15e6b`, ten nodes and no furniture. Page and saved API return HTTP 200; API, SQLite and `6db4f5138e8d-initial.json` agree. This scene was left unchanged for the founder's approval-flow check.

A final read-only check is captured in `read-only-check-1792062733609.json`: review scene remains at version 2 with the same hash; all three concrete texture URLs return HTTP 200 with nonempty content. Wall presets use solid colors without texture maps. The exact full working-tree inventory, including preserved earlier changes, is saved in `working-tree-status.txt` in the review evidence directory. The listener was verified as `127.0.0.1:3007`.

### Manual acceptance checklist

1. In the review room, open Assistant and enter `Design my living room in a Scandinavian style`. Preview, compare and approve: **passed**. Automated HTTP checks verify preview does not save; the founder confirmed the approval/alternative workflow and real resulting models.
2. Verify the listed real models, supported concrete floor, light walls and warm illumination; select furniture and check editing controls. **Founder-confirmed pass** after correcting the earlier UI-confusion report.
3. Request `Show me three alternative layouts`, compare and approve a different valid arrangement. Check that structure remains unchanged and no duplicate furniture appears. **Founder-confirmed pass** for the two saved rearrangements; saved history and structural comparison independently support this.
4. Manually move one item and save: **passed**, with the version-28 reference below. Refresh and close/reopen the same scene, confirm continued visibility/editability and compare the saved graph: **passed**, with distinct refresh and reopen checkpoints below.

Manual rendering, alternative selection, editing, refresh and reopening are founder-confirmed passes. Saved state before and after those reload checks is independently verified against the version-28 reference. Stage 5 acceptance is closed for this documented scope. Stage 6 requires a separate task and has not begun.

### 2026-10-15 — First browser failure investigation

**Historical observation, clarified below:** the founder later corrected this report as UI confusion, not a reproduced application failure.

The founder answered “An error or missing model/finish appeared.” A follow-up requested the exact error text or missing object/surface/light and whether this happened before or after approval. No specific application defect is established from that answer alone.

The source editor is still listening on `127.0.0.1:3007`; saved API and texture requests succeed. Initial read-only inspection captured version 3, graph hash `7da62375c605fc8ee9020d1f6f05a452fa28cf96c6ed820d4c29224341792b3d`, in `read-only-check-1792063248682.json`. All ten original nodes matched the initial room; the graph gained `installedPlugins` metadata during browser saving. There were no design items at that observation. A separate preview against this state returned three validated alternatives without persistent writes.

While diagnosis continued, the review scene advanced to version 15. SQLite was opened with `DatabaseSync(..., {readOnly: true})` to capture its revision/event history in `failure-investigation-1792063397867.json`. The API and this checkpoint report graph hash `4cdbd9a6d28449a50db3986a5e33c438b93399c5e2daef6ca1e3fa6789abd2cd`:

| Observed saved content | Identity / value |
| --- | --- |
| Room | `zone_xmkse9lkpg8hqw14` |
| Sofa | `item_hrb6tvihdojyytst`, asset `sofa`, position `[1.5, 0, 4]` |
| Floor lamp | `item_ub2n1f6z3pq81jpb`, asset `floor-lamp`, position `[3.75, 0, 4.5]` |
| Coffee table | `item_cwdd5e234bz6q54i`, asset `coffee-table`, position `[3, 0, 1.75]` |
| Floor / walls | `library:concrete-polished` / `library:preset-softwhite` |
| Lamp | On, intensity 1.5, color `#ffddaa` |

Versions 4–9 record the six design operations; versions 10–12 and 13–15 record three furniture edits each, retaining the same three item IDs. These observations establish saved operations, not founder confirmation of successful rendering, intentional additional actions or manual refresh/reopen acceptance. The agent did not approve or mutate this review scene during diagnosis.

A separate new disposable database at `C:\Users\HP\AppData\Local\Temp\pascal-stage5-browser-state-PlkLbb\pascal.db` was seeded with a snapshot for diagnosis. Its `result.json` records three approved operations succeeding against the copied browser-saved state. The original review database was not replaced or restored. No production source or configuration was changed during this investigation; automated suites were not rerun for read-only diagnosis/documentation.

The editor log contains a hydration mismatch involving Grammarly-injected body attributes and records Solid render mode. Neither observation proves the reported failure's cause. No unsupported renderer fix or automatic display-setting change was made. Direct browser automation was unavailable in this tool session, so visual confirmation still depends on the founder's reply.

**Next required action:** clarify the exact failure, fix a reproduced defect if present, then repeat the affected browser check. Keep Stage 5 unaccepted and Stage 6 gated.

### 2026-10-15 — Founder correction and visual acceptance

The founder clarified that the previous negative response was confusion with the UI and confirmed that the Scandinavian sofa, coffee table and lamp rendered through the Assistant. In the subsequent explicit checks, the founder confirmed the concrete floor, light-colored walls, warm illumination and furniture editing controls, and confirmed intentionally comparing and approving the two further arrangements without duplicates or changed structure. The earlier reported visual blocker is closed by this correction; no application fix was needed or claimed.

Fresh saved API and `DatabaseSync(..., {readOnly: true})` inspection match at version 15, SHA-256 `4cdbd9a6d28449a50db3986a5e33c438b93399c5e2daef6ca1e3fa6789abd2cd`. Exactly three catalog items retain the IDs listed above. Comparison with the initial checkpoint proves original node identity and structure are preserved, allowing the approved room finishes and added level children. New evidence: `rendering-confirmation-db8038a4-ca02-44c8-b719-91c722a9fde8.json` in the existing review directory. Its pending fields describe the instant before the two visual follow-up answers; this report records those later confirmations.

The next requested founder action is to move the existing coffee table slightly using normal editor controls and save with Ctrl+S. Capture that saved reference before asking for refresh/reopen. Manual movement/save and reload checks are still pending. This closeout changes documentation only; existing automated test results stand, and no scene edit was made by the agent.

### 2026-10-15 — Manual movement report checked against storage

The founder reported moving and saving the coffee table without errors. The fresh API and read-only SQLite comparison found scene `6db4f5138e8d` at version **18**, graph SHA-256 `8d29974e26952b07c33082247744ad3e88400ff5a01f588d49dbf80edf81987c`. The table `item_cwdd5e234bz6q54i` still has position `[3, 0, 1.75]`, identical to the version-15 reference.

The only node changes from version 15 are rotation `[0, 0, 0]` → `[0, 3.141592653589793, 0]` on the sofa, floor lamp and coffee table. Revisions 16–18 each have an `edit_floor_item` event. Assets, IDs, parents, scales, positions, room structure, floor/wall finishes and lamp settings are unchanged. The checkpoint is `manual-edit-check-75183768-24ab-4744-9d7f-2f1e67034f41.json` in the existing review evidence directory; it records both the founder statement and the differing saved observation.

This verifies additional saved rotations, not the requested manual translation. It does not establish a save defect or identify how those rotations were requested. The founder has been asked to select only the coffee table in this exact scene, shift it across the floor with normal move controls and save, or report needing help with the controls. Do not proceed to refresh/reopen acceptance until a distinct saved table position can be captured. Preserve version 18 as the latest observed comparison state; no scene changes were made by the agent.

### 2026-10-15 — Manual edit/save verified and final-position reference captured

Following the more specific move-control instruction, the founder reported moving the coffee table across the floor and saving. API and read-only SQLite now agree at **version 28**, graph SHA-256 `1740093d8f761655bbea02c3c8519c47e4259ec541696c756d93fab6f2adedcc`.

| Table property | Version 18 | Version 28 saved reference |
| --- | --- | --- |
| ID / asset | `item_cwdd5e234bz6q54i` / `coffee-table` | Unchanged |
| Parent | `level_gueibdiv9ys6wfgd` | Unchanged |
| Position, metres | `[3, 0, 1.75]` | `[2.994778922003897, 0, 2.0899598898840415]` |
| Rotation, radians | `[0, 3.141592653589793, 0]` | `[0, 4.974188368183839, 0]` |
| Scale | `[1, 1, 1]` | Unchanged |
| Floor support | Absent | `slab_0000gegdg7606xli` |

All other nodes are unchanged, including the sofa, lamp lighting, room geometry and finishes. All node IDs, the table's asset and parent, and its scale are preserved. The normal move tool uses `resolveSupportSlabPatch` in `packages/editor/src/components/tools/registry/move-registry-node-tool.tsx` to record floor support; the table now references the existing floor plate. The actual rotation change is included in the reference rather than falsely describing this as a position-only edit. Revisions 19–28 contain browser saves, with no additional scene tool events after version 18.

Unique checkpoint: `manual-position-reference-38f3b6bf-cb72-4688-b5cc-ebf3e0d0674e.json` in `C:\Users\HP\AppData\Local\Temp\pascal-stage5-review-1087dc79015643f4a6a277bd8a127e1a`. It contains the full saved graph, before/after table fields, change inventory, revision list and API/SQLite verification. Earlier references remain untouched. The founder has now been asked to refresh once without editing and verify the saved pose, models, finishes, light and selection controls. Reopening follows that check. No scene mutation or source edit was made by the agent.

### 2026-10-15 — Refresh/reopen verified; scoped Stage 5 acceptance closed

The founder confirmed that after a browser refresh, the moved/rotated coffee table remained in place and selectable with editing controls, and the sofa, lamp, finishes and warm illumination remained visible without error. The founder then closed the scene tab, reopened the same URL and separately confirmed continued persistence and editability of all these elements.

After each confirmation, a new saved API GET and a separately opened read-only SQLite connection were compared with `manual-position-reference-38f3b6bf-cb72-4688-b5cc-ebf3e0d0674e.json`. All six checks passed on both runs: API/database graph equality, API/database version equality, same scene ID, same reference version, identical full reference graph and identical graph SHA-256. No save-version change needed an exception.

| Checkpoint | Scene / version | SHA-256 |
| --- | --- | --- |
| Manual edit/save reference | `6db4f5138e8d` / 28 | `1740093d8f761655bbea02c3c8519c47e4259ec541696c756d93fab6f2adedcc` |
| `refresh-verification-fcb6bbf1-441b-4558-aeff-d75902e2b186.json` | Same / 28 | Same |
| `reopen-verification-423d577d-9f36-4fad-89d2-f361b610576f.json` | Same / 28 | Same |

Both new checkpoints are in `C:\Users\HP\AppData\Local\Temp\pascal-stage5-review-1087dc79015643f4a6a277bd8a127e1a`; earlier files remain intact. The final scene retains exactly the three generated catalog items, their saved assets and transforms, the table's manually chosen pose/floor support, approved finishes, persistent lamp settings and original room geometry. Visual success is founder-reported, while the identity, graph and storage comparisons are independently observed.

**Acceptance: PASS for the supported Stage 5 MVP.** Three style mappings and the A–E room fixtures have automated coverage; the end-user browser demonstration covers Scandinavian design, approved alternative arrangements and manual edit/save/refresh/reopening. No claim is made that all styles/catalog assets or every renderer/device were manually reviewed. Earlier limits remain: supported concrete in place of unavailable oak, bounded deterministic search, unsupported spatial cases, optional paid-provider scope and 57 failures in other workspace suites. Those separate global issues are not silently marked resolved.

This closeout changes this report and the master register only. Verification commands were `node ...\verify-refresh.mjs`, `node ...\verify-reopen.mjs` and `git diff --check`; all passed. Application suites were not rerun for documentation/read-only checks: the most recent 519 MCP and 58 app test passes remain the recorded results. No agent scene mutation, database restoration, dependency change, commit, push or deployment occurred. **Stage 6 readiness: YES with respect to the scoped Stage 5 prerequisite; Stage 6 is not started and its own requirements must be reviewed separately.**

## Changed-file inventory and remaining work

Task changes: the room persistence fixture; seven new `design-*` modules/tests; Assistant `contracts.ts` and `service.ts`; editor Assistant UI, API route and API test; this report and the existing master register. Earlier Stage 3C/3D/4 source changes, local Codex config and review application remain untouched except the explicitly extended Assistant files. No dependencies were installed/upgraded, user database changed, config registration modified, commit made, push made or deployment performed.

Next: review the accepted Stage 5 scope and any separately supplied Stage 6 task. Keep the bounded-catalog/spatial/parser limitations, missing textures and global failures open. **Stage 5 acceptance complete; Stage 6 not started.**

## Historical preflight — superseded by the verified fix above

The sections below retain the original blocked observation from earlier on 2026-10-15. Their statements about unimplemented work and next actions describe that earlier state, not the current status.

## Discovery and preserved work

The active workspace and Git root are `D:\PascalEditor`, branch `work/mvp-progress-2026-10-13`, HEAD `dda35f77c8d62c18fe254a08a892be4846dff34d`. The test runtime reports Bun `1.4.3`. Root/editor instructions, the central register, relevant architecture guidance, package manifests, stage reports and the source contracts were inspected. Existing Stage 3C/3D/4 changes, local configuration and review applications remain in place.

Relevant existing source paths and symbols:

| Concern | Source |
| --- | --- |
| Canonical room division | `packages/core/src/commands/structure/divide-zone.ts`: `divideZone`, `createZoneDivisionContext`, `snapZoneBoundary` |
| Registered room edits and saving | `packages/mcp/src/tools/structure-tools.ts`: `registerStructureTools`, `apply`; `tools/live-sync.ts`: `assertLiveSceneCurrent`, `publishLiveSceneSnapshot` |
| Canonical scene bridge | `packages/mcp/src/bridge/scene-bridge.ts`: `SceneBridge.loadDefault`, `loadJSON`, `exportJSON` |
| Furniture, finishes and lighting | `packages/mcp/src/tools/furniture-tools.ts`: `registerFurnitureTools`; `finish-tools.ts`: `registerFinishTools`; `lighting-tools.ts`: `registerLightingTools` |
| Existing spatial checks | `packages/mcp/src/tools/layout-clearance.ts`: `classifyPlacement`, `findValidPlacement`, `findItemItemCollisions`, `layoutIssuesFromScene` |
| Existing Assistant contracts and execution | `packages/mcp/src/assistant/contracts.ts`: `assistantOperationSchema`; `service.ts`: `InteriorAssistantService`; `runtime.ts`: `serialized`, `withSceneTools`, `previewStore`, `callOperation` |
| Failing integration test | `packages/mcp/src/tools/structure-persistence.test.ts`: `persists intent, rotation, division, merge, and deletion in disposable SQLite scenes` |

Discovery stopped at the failed gate. No active user scene, database or browser endpoint was selected for Stage 5 mutation testing. The executed tests use their existing disposable scenes and storage.

## Prerequisite decision

| Prerequisite | Historical evidence | Current verification |
| --- | --- | --- |
| Stage 3A rooms/layout | Scoped acceptance in [Stage 3A](STAGE-3A-ROOM-LAYOUT-TOOLS.md) | **Blocked:** combined saved-room division test fails; standalone execution passes |
| Stage 3B furniture | Scoped acceptance in [Stage 3B](STAGE-3B-FURNITURE-TOOLS.md) | Existing furniture tool persistence test passes |
| Stage 3C finishes | Scoped acceptance in [Stage 3C](STAGE-3C-MATERIAL-TOOLS.md) | Existing finish tool persistence test passes |
| Stage 3D real lighting | Scoped acceptance and restart evidence in [Stage 3D](STAGE-3D-LIGHTING-TOOLS.md) | Existing lighting tool persistence test passes; visual/restart checks were not repeated |
| Stage 4 Assistant | Scoped mock workflow acceptance in [Stage 4](STAGE-4-INTERIOR-ASSISTANT.md) | All nine service tests pass; app/browser/provider checks were not rerun after the blocker |

Historical acceptance is preserved. The new results prevent claiming that every prerequisite currently passes together. They do not establish damage to user scenes or prove a production room-division defect: test isolation, shared state and actual runtime behavior still need to be distinguished.

## Executed checks

All commands below ran from `D:\PascalEditor\packages\mcp` on the unchanged application source.

```powershell
bun test src/tools/room-tools.test.ts src/tools/structure-tools.test.ts src/tools/structure-persistence.test.ts src/tools/furniture-tools.test.ts src/tools/finish-tools.test.ts src/tools/lighting-tools.test.ts src/assistant/service.test.ts
```

Executed twice: **37 passed, 1 failed, 570 assertions** on each run. After `divide_zone`, the verification at `structure-persistence.test.ts:42`, called from line 69, expected saved version **2** but received **1**. The preceding intent/rotation checks completed; this was the division save check, not the first structural edit. Subsequent merge/deletion assertions in this test were not reached.

```powershell
bun test src/tools/structure-persistence.test.ts
```

**1 passed, 0 failed, 26 assertions.** Intent, rotation, division, merge and deletion completed in an independent process.

```powershell
bun test src/tools/room-tools.test.ts src/tools/structure-persistence.test.ts
```

**15 passed, 1 failed, 115 assertions.** Reproduced the same division persistence mismatch: expected version 2, received 1.

```powershell
bun test src/assistant/service.test.ts src/tools/structure-persistence.test.ts
```

**9 passed, 1 failed, 84 assertions.** The division save advanced, but the assertion at `structure-persistence.test.ts:72` expected **2 zones** and found **5**. All nine Assistant service tests passed.

The differences between independent and combined execution suggest shared test/runtime state, but that is a diagnostic hypothesis, not a confirmed root cause. `SceneBridge` uses the canonical process-wide store; its `loadDefault()` delegates to `useScene.getState().loadScene()`. Investigate fixture initialization, cleanup and scene-loading behavior before changing production geometry code. Do not hide the failure by running only the passing isolated test or weakening the assertions.

## Implementation and acceptance status

Style presets, deterministic layout generation, asset/material mappings, design alternatives, multi-operation approval/execution, Stage 5 fixtures and the manual design demonstration are **not implemented or accepted** in this task. No layout-quality score or new rendering/persistence claim is made.

Changes in this task are limited to this report and `PROJECT-DEVELOPMENT-REGISTER.md`. Existing application work is preserved. No dependency installation, configuration change, user-scene write, database restoration, commit, push or deployment was performed.

**Next required action:** diagnose and resolve the combined Stage 3A persistence failure, retain meaningful assertions, then rerun both reduced reproductions and the complete prerequisite group. Reassess whether the diagnosis requires another disposable browser check. Resume Stage 5 only when that gate passes.

**Stage 6 ready: NO.** Stage 5 remains blocked before implementation.
