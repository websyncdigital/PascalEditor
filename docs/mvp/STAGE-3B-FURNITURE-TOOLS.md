# Stage 3B — validated floor furniture tools

**Status: PASS for scoped built-in floor furniture (2026-10-15).** Source implementation, disposable SQLite tests, and founder-reported isolated browser review pass. Stage 3C and Stage 3D have not started; Stage 4 is not ready.

## Brief plan and scope

1. Use the existing built-in catalog and canonical `ItemNode`; add a narrow saved-scene tool contract for floor furniture.
2. Refuse stale versions, unknown or wall-mounted assets, out-of-room poses, item overlap, and blocked door clearance before changing the scene.
3. Verify place, move/rotate, delete, persistence, and reload on disposable SQLite storage; then inspect the real GLB in the isolated browser editor before accepting 3B.

Stage 3A's scoped acceptance and the Stage 2B catalog-table move/restoration are prerequisites recorded in [Stage 3A](STAGE-3A-ROOM-LAYOUT-TOOLS.md) and [Stage 2B](STAGE-2B-FIRST-CONTROLLED-EDIT.md). Existing worktree and user scenes were preserved.

## Source contract

`packages/mcp/src/tools/furniture-tools.ts` registers `place_floor_item`, `edit_floor_item` and `delete_floor_item` through `packages/mcp/src/tools/index.ts`. The tools use `ItemNode` from `packages/core/src/schema/nodes/item.ts`, the built-in `findCatalogItem` catalog, `SceneBridge` canonical mutations and `publishLiveSceneSnapshot` for saved-scene events. They do not accept raw graph JSON. Coordinates are level-local metres; `rotationY` is radians or a parseable angle such as `"15°"`. All three require `expectedVersion` and a bound store with event publication. `edit_floor_item` changes only position and Y rotation. `delete_floor_item` refuses non-items and items with children. The place tool rejects an unknown asset instead of producing the legacy `place_item` placeholder.

The placement check uses the item's declared, rotation-aware plan AABB. It requires full containment inside the selected room, refuses intersections with room holes/boundaries, item overlap or less than 0.08 m item clearance, and blocked door keep-outs. This is conservative plan geometry, not loaded-mesh, vertical-clearance, access-path, floor-elevation or rendered-material verification. The new contract is limited to known built-in floor assets with an unpinned level parent. Wall/ceiling mounts, external catalog IDs, pinned supports and same-process concurrent mutation remain outside this acceptance scope. Calls are version-guarded but have no idempotency key: callers must inspect storage before retrying an ambiguous failure. Broad legacy `place_item`, `apply_patch` and `delete_node` remain registered and should not be included in a 3B-only allowlist.

## Verification

| Check | Result |
| --- | --- |
| `bun test src/tools/furniture-tools.test.ts src/tools/place-item.test.ts src/tools/delete-node.test.ts` | Passed: 9 tests before the later added refusal/reload assertions. |
| `bun test` in `packages/mcp` after final edits | Passed: 493 tests, 0 failures, 2,929 assertions across 68 files. |
| `bun x tsc --noEmit -p tsconfig.json` and `bun run build` in `packages/mcp` | Passed. |
| `bun x biome check --formatter-enabled=false` on the four affected MCP files, and `git diff --check` | Passed. Existing whole-repository QA findings remain separate. |
| `bun run scripts/smoke.ts` with a unique disposable database | Passed; source-built stdio server registered 68 tools. |

`furniture-tools.test.ts` creates a disposable SQLite scene, saves a real `sofa` catalog reference, edits its pose, deletes it, and reopens the saved graph. It checks version increments, event count, room preservation, core validation, unknown/attached assets, stale versions, room bounds, item overlap, door clearance, unknown/non-item targets and no-op refusal. The test removes only its own temporary database. The final package suite also passes the MCP approval-annotation contract after `plugin-evals/tool-annotation-justifications.json` was updated for the three new names.

## Isolated browser review checkpoint

A separate disposable scene was created through the registered source tools at `C:\Users\HP\AppData\Local\Temp\pascal-stage3b-review-0fdf9e1be359465d94adcb182b04a2b6\pascal.db`. The saved review scene is `9ab2ede911b1`, version 3, graph hash `3421034954471fb64f05bc9a873a783bb2413a2c6e4475a7502a5a721c7aad81`. It contains room `zone_sewl7w7ljdn4i6a5` and catalog sofa `item_uu7zal151e8ln956` at `[3,0,2]`, rotation `[0,0.2617993877991494,0]`, scale `[1,1,1]`, parent `level_69qxdijpgsof4i8s`, asset ID `sofa`, source `/items/sofa/model.glb`. The asset file exists under both the normal editor and isolated review app. A fresh read-only SQLite query matched the scene ID, version and SHA-256 graph hash in `summary.json` and found one room. This proves saved reference identity, not that the browser loaded its mesh.

At initial checkpoint creation, the isolated editor at `apps/editor-stage3a-review` and loopback port 3003 was not launched. Automatic command review rejected a hidden `Start-Process` launch as `blocked by policy`; a foreground PTY launch then failed with Windows `Access is denied`. No browser API or canvas check was possible in that run. This was resolved by the founder launching the isolated editor in a normal PowerShell terminal against the recorded disposable database.

## Final browser acceptance — 2026-10-15

The founder reports that `http://127.0.0.1:3003/scene/9ab2ede911b1` showed the sofa's real model and materials, that the sofa remained selectable with editing controls, and that refresh and reopening produced no loading or save error. This is founder-reported visual evidence; an independent screenshot and a manual pose change of this review sofa were not performed.

A separate read-only request to the running editor's saved-scene API returned scene `9ab2ede911b1` at version 3 and graph hash `3421034954471fb64f05bc9a873a783bb2413a2c6e4475a7502a5a721c7aad81`. A read-only SQLite query returned the same version and SHA-256 hash; the full parsed 11-node API and database graphs matched. The saved graph retained room `zone_sewl7w7ljdn4i6a5` and item `item_uu7zal151e8ln956`, parent `level_69qxdijpgsof4i8s`, asset `sofa` at `/items/sofa/model.glb`, position `[3,0,2]`, rotation `[0,0.2617993877991494,0]`, and scale `[1,1,1]`. These values also matched the pre-browser `summary.json` checkpoint, so viewing, refreshing and reopening did not persist a graph change.

## Review gate

**Stage 3B is accepted for its scoped built-in floor-furniture operations.** The automated mutation/save/reload tests and founder-reported real-model browser check support this decision; loaded-mesh geometry was not independently inspected. Wall/ceiling mounts, external catalogs and same-process concurrent mutations remain outside this acceptance. Stage 3C and 3D require separate implementation and review. Stage 4 requires accepted 3C and 3D, including persistent real-lighting controls, plus a separate Stage 4 scope.
