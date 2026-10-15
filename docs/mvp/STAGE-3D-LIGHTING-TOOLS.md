# Stage 3D — persistent catalog-item lighting

**Status: PASS for scoped catalog-item point lighting (2026-10-15).** Source implementation, isolated persistence and real `PointLight` tests, ordinary editor control save/refresh, and post-restart founder visual review passed. Stage 4 was not started as part of this substage.

## Source and scope

`packages/core/src/schema/nodes/item.ts` now permits an optional saved `lighting` object on a catalog `ItemNode`: `enabled`, finite intensity from 0 to 10, and a six-digit hex color. It is optional so existing saved items still load. `packages/viewer/src/store/use-item-light-pool.ts` reads this saved state when present, and `packages/viewer/src/systems/item-light/item-light-system.tsx` applies intensity and color to the existing Three.js `PointLight` pool. This is real scene illumination rather than decorative lamp geometry. The existing transient interactive state remains a fallback for older items without a saved lighting object.

`packages/mcp/src/tools/asset-catalog.ts` exposes the editor's local `floor-lamp` GLB and light descriptor to the source MCP catalog. `place_floor_item` seeds its saved light state. The new `configure_item_light` tool in `packages/mcp/src/tools/lighting-tools.ts` changes only one eligible catalog item's lighting through `SceneBridge.updateNode` and `publishLiveSceneSnapshot`. It requires an active saved scene and exact `expectedVersion`, validates the item/light effect and its intensity range, rejects missing or invalid fields and no-ops, and returns the persisted scene version and live-sync result. It does not edit raw SQLite or scene JSON. The tool is marked destructive in the registration and annotation inventory. Existing broad MCP mutation tools remain registered and need separate caller permissions.

`packages/nodes/src/item/panel.tsx` provides the editor's On, Intensity and Color controls for a selected light-bearing catalog item. `packages/nodes/src/shared/item-interactions.ts` and `packages/editor/src/components/editor/first-person-controls.tsx` route lamp toggles to the saved item field and display its saved switch state. Non-light interactive effects retain their previous runtime behavior. This substage covers catalog item point lights; procedural lamp recipes and general room/environment lighting are separate domains.

## Automated verification

| Check | Result |
| --- | --- |
| `bun test` in `packages/mcp` | 495 passed, 0 failed, 3,106 assertions across 70 files. |
| Focused viewer tests for the light pool and system | 5 passed, 31 assertions. |
| Focused nodes item-interaction tests | 6 passed, 20 assertions. |
| TypeScript checks in `packages/core`, `packages/viewer`, `packages/nodes`, `packages/mcp`, `packages/editor`, `apps/editor` | Passed. |
| Source builds in `packages/core`, `packages/viewer`, `packages/nodes`, `packages/mcp` | Passed. |
| Biome check with formatter disabled on the 15 changed source/test files | Passed; no fixes applied. |
| Two focused first-person editor test files | 13 passed, 50 assertions; these do not directly exercise the lamp switch. |

The disposable SQLite test in `packages/mcp/src/tools/lighting-tools.test.ts` covers valid updates, unknown IDs, invalid color/intensity including an asset-range violation, empty requests, stale versions, no-ops, unrelated-node preservation, event publication, scene validation and reopening the database. `packages/viewer/src/systems/item-light/item-light-system.test.ts` checks actual Three.js `PointLight` intensity, color, off state and graph replacement after reload. The tests do not touch a user scene.

## Isolated browser review

A unique disposable database was created at `C:\Users\HP\AppData\Local\Temp\pascal-stage3d-review-6f6783a2b49b4811b593a0095f331f5a\pascal.db`. Its `summary.json` and `create-review.ts` are in the same untracked temporary directory. Source-built MCP operations created room `zone_schdpj0pw07ghnfb`, placed catalog floor lamp `item_i2t894d64risey67` at `[2, 0, 2]`, then saved `{ enabled: true, intensity: 1.8, color: '#ffbb66' }`.

The isolated editor was launched on `127.0.0.1:3005` against this database. The saved API returned HTTP 200 for scene `de70d994bbbb`; the local lamp GLB returned HTTP 200 with 3,836 bytes. The editor server was stopped and restarted against the same database. After restart, the API still reported version 3, 11 nodes and graph SHA-256 `ccf12994be7a383b7a05d40171ebe45156b385470266dec28052f5562cae307a`, including the same lamp ID, asset and lighting. The founder then refreshed the browser and reported that the real lamp loaded, warm room illumination appeared, and the selected lamp's controls showed On, 1.8 and `#ffbb66`. A read-only API comparison after this review matched the original version/hash. Visual evidence is founder-reported; an independent canvas capture was unavailable.

The founder then used the ordinary editor controls on this disposable lamp, switched it Off, set intensity to 1.2 and color to `#00aaff`, saved and refreshed. The founder reported the light extinguished, the item remained selectable and the changed controls persisted without save/conflict error. Read-only SQLite revision 9 independently contains the Off values, 11 nodes and graph hash `807b1595ce80d71378b638dae0349ca07059dc5a388e999cfa8305ab00cbe255`. The founder intentionally switched the lamp back On after that check; revision 10 records only that lighting switch change. The editor was restarted once more against the same database. The founder reported blue illumination, selection and the On/1.2/`#00aaff` controls survived refresh without error.

After this second restart and visual review, the API and SQLite contained the same full graph at version 15, with 11 nodes and hash `fb03acb27a7a3afea3e9a10e0e3f3e586fba15f88e65099916202c224d907465`. Versions 10–15 had the same graph hash despite additional editor saves. Comparing the initial and final SQLite revisions showed only lamp lighting values and the editor's `installedPlugins` metadata changed; the latter was added on opening the isolated scene. All other node payloads, including the room, remained equal. `final-review.json` records the initial, Off and final On checkpoints in the unique temporary evidence directory. No user scene, dependency or Codex MCP allowlist was changed.

## Review boundary

Stage 3D is accepted for catalog-item point lights with the built-in floor lamp. The visual results are founder-reported; actual saved graph, point-light behavior in automated tests, API/SQLite agreement and server-restart persistence were independently checked. First-person lamp toggling was type-checked but not manually exercised in this review. Procedural lamp recipes, broader lighting systems and same-process concurrent MCP mutation remain outside the accepted scope; a failed publication requires a fresh storage read before retry. The repository-wide Biome/test failures documented in the QA assessment remain separate open checks. Stage 4 may be scoped separately after review; no Stage 4 implementation was begun here.
