# Stage 3C — room floor and wall finish tools

**Status: PASS for scoped whole-room floor and wall finishes (2026-10-15).** Source implementation, disposable persistence tests, verified texture URLs and founder-reported isolated browser review passed. Stage 3D lighting and Stage 4 have not started.

## Source and contract

The editor's canonical `ZoneNode.floor.finish` supplies the floor finish through `packages/core/src/lib/plate-surface.ts` and `packages/nodes/src/slab/geometry.ts`. `ZoneNode.wallMaterial` supplies the room wall finish through `packages/core/src/systems/wall/wall-finish.ts` and `packages/viewer/src/systems/wall/wall-materials.ts`. The similarly named `floorFinish` and `wallFinish` zone metadata fields do not drive these rendered surfaces. `packages/core/src/commands/structure/set-zone-intent.ts` provides the canonical zone patch plan.

`packages/mcp/src/tools/finish-tools.ts`, registered by `packages/mcp/src/tools/index.ts`, adds two source-built MCP operations:

| Tool | Contract |
| --- | --- |
| `search_finish_materials` | Read-only search by `surface` (`floor` or `wall`), optional query and bounded limit. Returns built-in catalog IDs, labels and categories. |
| `set_room_finish` | Sets one `zoneId`'s whole-floor finish or all boundary-wall finish to a supported `catalogMaterialId`. Requires `expectedVersion` of an active saved scene; returns material reference, scene ID, version and live-sync result. |

`set_room_finish` uses `assertLiveSceneCurrent`, the canonical `setZoneIntent` plan, `SceneBridge.updateNode` and `publishLiveSceneSnapshot`. It refuses unknown/non-room zones, unknown or incompatible materials, floorless rooms, walls with no rendered spans, existing partial floor/wall paint, unchanged finishes, stale saved versions and unexpected multi-node plans. It changes no raw scene JSON or database record directly. Version checks and scene-event publication follow the existing MCP live-sync contract. An ambiguous publication failure requires a fresh storage read before retry; same-process concurrent writes remain unverified. Existing broad mutation tools remain registered and require their own approval controls.

This scoped tool exposes flat built-in colors and a curated set of concrete and siding textures whose referenced files exist in the standalone editor's public assets. It does not claim support for every catalog entry or custom/dynamic material. The surface filter follows `MATERIAL_CATALOG.surfaces`; entries without surface restrictions are available on both surfaces. Whole-room application deliberately refuses partial paint rather than obscuring it.

## Verification

| Check | Result |
| --- | --- |
| `bun test src/tools/finish-tools.test.ts src/tools/read-tool-annotations.test.ts` in `packages/mcp` | Passed: 2 tests, 615 assertions. |
| `bun test` in `packages/mcp` | Passed: 494 tests, 0 failures, 3,065 assertions across 69 files. |
| `bun x tsc --noEmit -p tsconfig.json`, `bun run build` in `packages/mcp` | Passed. |
| `bun x biome check --formatter-enabled=false` on the four changed MCP source/test files; `git diff --check` | Passed. |

The disposable SQLite test in `packages/mcp/src/tools/finish-tools.test.ts` exercises material discovery, asset-file presence, invalid zone/material/surface, stale version and no-op refusal, whole-floor and whole-wall edits, partial-paint/floorless refusal, room/other-node preservation, scene validation, event counts and reopening the saved database. `read-tool-annotations.test.ts` and `plugin-evals/tool-annotation-justifications.json` classify discovery as read-only and finish mutation as destructive. These are isolated test scenes; no user scene was changed.

## Isolated browser evidence

The first disposable review scene, `864e9cbd95f6`, at `C:\Users\HP\AppData\Local\Temp\pascal-stage3c-review-9u0PXx\pascal.db`, reached version 3 and hash `723a9339dcecdd587d71d64da94d710d59efdadf5725976088a63bbef49d3440`. The founder reported a wood-like floor and rustic-brick walls after refresh. A follow-up direct HTTP check found that `wood-finewood27` and `flooring-rusticbrick` catalog map URLs both returned **404** in this editor, although their original source images exist. That first visual report therefore cannot establish real texture loading. Its saved scene and `summary.json` were retained as diagnostic evidence.

A corrected disposable scene, `856573aff7a9`, was created through the source MCP room and finish operations in the same isolated database. Its room `zone_1ezbr1e41xpw7y6o` has `floor.finish = library:concrete-polished` and `wallMaterial = library:siding-lap-cedar`. All four referenced texture URLs returned HTTP 200 from the loopback editor. The founder reported that both finishes visibly rendered after refresh, with no loading or save error, and left the scene unchanged. This is founder-reported visual evidence; an independent canvas capture was unavailable.

After that visual review, a separate read-only check of `http://127.0.0.1:3004/api/scenes/856573aff7a9`, SQLite and `summary-supported.json` found the same scene at version 3 with all 10 nodes and SHA-256 graph hash `6fd6c4975ef5441bc209226dddf92d3ea7d57c94252e6e9a62b1d74e6dfc0cfc`. The full parsed API and SQLite graphs matched. Refreshing the browser therefore produced no persistent graph change. The checkpoint and verification script are outside the tracked source tree at `C:\Users\HP\AppData\Local\Temp\pascal-stage3c-review-9u0PXx`.

## Review gate

**Stage 3C is accepted for the scoped whole-room finish operations.** The founder's visual confirmation, HTTP 200 texture responses, and independent post-refresh saved-graph comparison satisfy this review gate. Independent canvas capture, partial-surface painting, custom materials, same-process concurrent mutation and full catalog asset repair remain outside this acceptance. Stage 3D must separately establish persistent *real* lighting before Stage 4 can begin.
