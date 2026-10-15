# Stage 6 — MVP testing, evaluation and demonstration

**2026-10-15: QA assessment executed; scoped local mock demonstration PASS. Full Stage 6 MVP/pilot acceptance remains BLOCKED.** The supported workflow has passing automated/HTTP checks, founder browser acceptance and independently verified final persistence. Global tests/formatting, natural-language coverage, broader support transitions, intermediate draft-state persistence and deployment security remain open. The two unsupported demonstration phrases passed safe-refusal checks, not successful interpretation. No Stage 7 work is authorized or started.

## Environment and preserved work

- Workspace/Git root: `D:\PascalEditor`; branch `work/mvp-progress-2026-10-13`; HEAD `dda35f77c8d62c18fe254a08a892be4846dff34d`, plus the existing uncommitted Stage 3–5 work. Root and app `AGENTS.md`, manifests, architecture/source contracts, existing stage reports and master register were inspected. Existing review applications and Codex settings were preserved.
- Windows 11 Home Single Language 10.0.26200 x64; AMD Ryzen 7 7840HS, 8 cores/16 logical processors; 16,030,588 KiB visible RAM; AMD Radeon and NVIDIA RTX 3050 6 GB laptop GPUs. The active rendering GPU was not measured.
- Installed Bun **1.4.3**, Node **v22.14.0**, Next **16.3.0**, MCP package **1.0.3**. Root `packageManager` declares Bun 1.3.14; this mismatch remains recorded, with no automatic runtime/dependency changes.
- Evidence directory **E**: `C:\Users\HP\AppData\Local\Temp\pascal-stage6-qa-533b3284cbfe4ff8869191a6d602fcb7`. It contains commands, logs, environment, initial/final Git inventories, unique checkpoints and JSON evaluation/performance results. It is outside tracked source; retain it for reproducibility.
- New Stage 6 database: `E\benchmark-b999322e-0985-4fec-9c1e-f3d2251d6d68.db`. Five disposable benchmark scenes and one new manual-acceptance scene were created through the source scene store and validated operations. No founder scene was overwritten.
- Production editor: `http://127.0.0.1:3008`, source app `apps/editor`, `PASCAL_AI_PROVIDER=mock`, exact database above. Managed tool session launched `bun run start -p 3008 -H 127.0.0.1`; observed listener PID 17280. The existing port-3007 editor remains running. An earlier hidden-background launch was rejected by tool policy before execution; the session-managed foreground launch succeeded.
- Stage 5 accepted scene `6db4f5138e8d` was rechecked read-only through its running API and SQLite: still version **28**, hash `1740093d8f761655bbea02c3c8519c47e4259ec541696c756d93fab6f2adedcc`. New uniquely named `reopen-verification-d7e67802-f312-44d1-95ba-eddec0ec8d8c.json` is in its existing Stage 5 evidence directory. This recheck verifies saved state, not a new visual reopening.

## Prerequisite classification

| Milestone | Classification and scope | Current evidence |
| --- | --- | --- |
| Stage 1 | Completed and verified for documented manual persistence scope | Historical founder/browser + independent API/SQLite evidence; fresh Stage 6 ordinary-room save/refresh/reopen now verified |
| Stage 2A/2B | Completed and verified for source MCP inspection and one restored position edit | Existing reports retain exact IDs, versions, hashes and MCP results; no new developer MCP configuration or founder-scene mutation in this task |
| Stage 3A | Completed and verified within accepted room-operation scope | Fresh combined room/structure/persistence tests pass; prior division/merge/rotation/deletion browser evidence retained |
| Stage 3B | Prior acceptance retained; same-slab move extension and subsequent manual refinement/reload verified within scope | Placement/edit/delete regressions pass; approved supported-table movement, manual editing and final saved identity/pose are verified. Ground sentinel, support transitions and pinned deletion remain excluded |
| Stage 3C | Completed and verified for supported finish allowlist | Fresh finish tests, real catalog map checks and prior corrected browser acceptance; two missing-texture entries still excluded |
| Stage 3D | Completed and verified for persistent catalog-item point lights | Fresh tests and production HTTP saved-light checks; prior founder On/Off/color/intensity/restart evidence; ceiling/procedural lights not covered |
| Stage 4 | Completed and verified for approved mock commands | Fresh service/API/provider/guard tests; real production API approval and duplicate checks; paid provider untested |
| Stage 5 | Completed and verified for documented supported styles/layouts | Fresh five-room-fixture and combined tests; accepted saved state unchanged; prior founder style/alternatives/manual refinement/reopen evidence retained |
| Stage 6 | Scoped local demonstration passed; full readiness blocked | All eight supported journeys have founder browser and saved-state evidence. T1–T5 batch is closed with stated evidence limits; global QA, transient move-state persistence, language and pilot-security gaps remain open |

Earlier scoped acceptance does not establish broader coverage of every Stage 6 example. No historical visual result is represented as a newly performed browser test.

## Discovered implementation map

| Capability | Actual source / symbols |
| --- | --- |
| Canonical schemas/state | `packages/core/src/schema/nodes/{item,zone,wall,slab}.ts`, `packages/core/src/store/use-scene.ts` |
| Structure and room persistence | `packages/core/src/lib/structure-kernel.ts`; `packages/mcp/src/tools/room-tools.ts:registerRoomTools`, `structure-tools.ts`, `structure-persistence.test.ts` |
| Furniture | `packages/mcp/src/tools/asset-catalog.ts:MCP_CATALOG_ITEMS/findCatalogItem`; `furniture-tools.ts:registerFurnitureTools/floorItem/validateFloorPose` |
| Manual furniture move support | `packages/editor/src/components/tools/registry/move-registry-node-tool.tsx` calls `packages/core/src/hooks/spatial-grid/support-host-patch.ts:resolveSupportSlabPatch`; ordinary movement can persist `supportSlabId` |
| Finishes | `packages/mcp/src/tools/finish-tools.ts`; canonical zone floor finish/wall material and existing renderer material resolution |
| Real lighting | `packages/core/src/schema/nodes/item.ts`; `packages/nodes/src/item/panel.tsx`; `packages/viewer/src/store/use-item-light-pool.ts` and `systems/item-light/item-light-system.tsx` |
| Named storage/API | `packages/mcp/src/storage/sqlite-scene-store.ts:SqliteSceneStore/resolveDefaultDatabasePath`; `apps/editor/lib/scene-store-server.ts:getSceneStore`; `app/api/scenes/route.ts` and `app/api/scenes/[id]/route.ts` |
| Editor persistence/assistant | `apps/editor/components/scene-loader.tsx`; `interior-assistant.tsx:AssistantProvider`; `lib/assistant-scene-guard.ts:canApplyRemoteScene` |
| Agent contract and approval | `packages/mcp/src/assistant/contracts.ts:assistantOperationSchema`; `service.ts:InteriorAssistantService`; `runtime.ts:serialized/previewStore/withSceneTools/callOperation` |
| Designs | `design-request.ts:parseDesignRequest`, `design-layout.ts:planRoomDesign`, `design-presets.ts:DESIGN_PRESETS`, `design-execution.ts:assertDesignPreserved/callDesignStep` |
| Provider and HTTP boundary | `apps/editor/lib/assistant-provider.ts:assistantPlanner`; `app/api/scenes/[id]/assistant/route.ts`; `lib/scene-api-security.ts:guardSceneApiRequest` |
| Tests | Bun package scripts; MCP `src/assistant/*.test.ts`, validated-tool tests; app `lib/*.test.ts`; root Turbo orchestration and Biome configuration |

No second renderer, scene model, dependency or paid service was introduced.

## Executed automated baseline

All package tests below **executed**, not retrieved from Turbo cache. Each row uses that package's actual `bun run test` script. Counts are the latest full run for that package, not a sum of retries. Source probe/process failures are included in failure counts.

| Working directory | Passed | Failed | Skipped | Exit | Log in E |
| --- | ---: | ---: | ---: | ---: | --- |
| `packages/cli` | 101 | 7 | 0 | 1 | `cli-tests.log` |
| `packages/core` | 4,236 | 7 | 0 | 1 | `core-tests.log` |
| `packages/editor` | 1,887 | 19 | 0 | 1 | `editor-tests.log` |
| `packages/ifc-converter` | 43 | 2 | 0 | 1 | `ifc-converter-tests.log` |
| `packages/nodes` | 3,821 | 20 | 1 | 1 | `nodes-tests.log`; six snapshots checked |
| `packages/viewer` | 505 | 2 | 0 | 1 | `viewer-tests.log` |
| `packages/mcp` | 549 | 0 | 0 | 0 | `mcp-tests.log`; 3,753 assertions, 73 files |
| `apps/editor` | 64 | 0 | 0 | 0 | `app-tests-final.log`; 176 assertions, 13 files |
| **Total** | **11,206** | **57** | **1** | **Not passing** | No tests reported cancelled in these completed direct runs |

The original app baseline was 58/58 before adding six security evaluations; the final 64/64 replaces that count. The overall 57 failures happen to equal the prior Stage 5 total, but the composition changed: core gained the `designLocked` inventory failure while nodes reported one fewer failure. Do not describe this as an unchanged failure set.

| Command / directory | Actual result | Evidence |
| --- | --- | --- |
| `bun run test`, `bun run check-types`, `bun run build` / root | Each exit 1 before tasks execute: duplicate package name `editor` in existing `apps/editor`, `apps/editor-stage3a-review` and `apps/.next-stage4-review-7a60b7610cbd4f549b0e0509c7d9bda0` | `root-{test,types,build}.log`; no review folder removed |
| `bun run lint` / root | Exit 0; 3,072 files, seven informational diagnostics; no fixes | `root-lint.log` |
| `bun run format:check` / root | Exit 1; 3,047 formatting errors, 3,072 files; no fixes | `root-format.log` |
| `bun run build` / core, MCP, viewer, nodes | All exit 0 | `{core,mcp,viewer,nodes}-build.log` |
| `bun run check-types` / core, editor package, UI, CLI, editor app | All exit 0 | `{core,editor,ui,cli,app}-types.log` |
| `bun run build` / `apps/editor` | Exit 0; 48.72 s wall time, successful production build | `app-build.log`; dynamic filesystem tracing warning remains |
| Combined prerequisite command below / MCP | 53 passed, 0 failed, 871 assertions; exit 0 | `prerequisites.log` |
| `bun test src/assistant/stage6-evaluation.test.ts` / MCP | 30 passed, 0 failed, 290 assertions; exit 0 | `agent-evaluation-first.log` + unique JSON |
| `bun test src/contracts/reference-inventory.test.ts src/lib/polygon-boolean.test.ts src/store/derived-writer-allowlist.test.ts` / core | 71 passed, 4 failed; exit 1 | `core-triage.log` |
| `bun test src/item/floorplan-rendered-exits.test.tsx` / nodes | 109 passed, 0 failed; exit 0 in isolation | `shelf-triage.log`; combined-run failures remain open |
| `bun test src/systems/wall/wall-floor-step.test.ts` / viewer | 9 passed, 1 failed; exit 1 | `geometry-triage.log`; byte mismatch reproduced independently |

Combined prerequisite command:

```powershell
bun test src/tools/room-tools.test.ts src/tools/structure-tools.test.ts src/tools/structure-persistence.test.ts src/tools/furniture-tools.test.ts src/tools/finish-tools.test.ts src/tools/lighting-tools.test.ts src/assistant/service.test.ts src/assistant/design-layout.test.ts
```

Build scripts executed directly and may reuse TypeScript incremental artifacts. The app build actually compiled routes; no Turbo cached result is claimed. Next configuration skips type validation during build, so the separate passing app type command is necessary. `E\run-baseline.ps1`, `run-builds.ps1`, `baseline-results.jsonl`, `build-results.jsonl` retain exact commands, directories, elapsed times and exits.

Only the two newly added test files were formatted with installed Biome. Repository-wide formatting was not changed. Initial attempts to call unavailable `bunx` and use shell brace expansion did not execute checks; the corrected commands used `bun x --no-install`. Final `bun x --no-install biome check packages/mcp/src/assistant/stage6-evaluation.test.ts apps/editor/lib/stage6-security.test.ts` passed (two files, no fixes, exit 0), and `git diff --check` passed (exit 0). Evidence: `targeted-biome.log`, `git-diff-check.log`, `closeout-checks.json`.

No configured Playwright/Cypress browser E2E suite or callable browser-control tool was discovered. React renderer/source-probe tests are not full browser/GPU acceptance. The new production HTTP test is real network/API integration but is not a visual E2E test.

## Failure investigation and corrective actions

| Finding | Evidence / classification | Required follow-up |
| --- | --- | --- |
| **Stage 5 integration defect: unclassified `designLocked`** | Core reference inventory discovers the metadata read in `assistant/design-execution.ts` but `METADATA_NON_REFERENCES` lacks it; reproduced in reduced run | Classify the boolean according to the canonical metadata contract and rerun inventory/full core checks; not fixed in this QA assessment |
| **Manual-to-agent furniture gap** | Initial E30 and version-23 HTTP preview reproduced pinned-support rejection. Bounded same-slab fix passes 98 combined tests; founder-approved movement and subsequent manual refinement/reload are verified | Scoped issue closed. Ground support, support transitions and pinned deletion still refused; no support stripping or raw patch workaround |
| **Intermediate move-state persistence** | Stage 6 saved revisions 32/36/39/41 contain `metadata.isTransient = true`; version 36 also temporarily omits the table support link. All are resolved in final version 42. T3 screenshot shows Move item mode | Investigate autosave/serialization during an active move and interruption/reopen behavior on disposable storage. Final success does not establish safe mid-drag recovery; no repair or destructive reproduction performed in this closeout |
| **Windows path/process failures** | Core/viewer source guards use URL `.pathname` yielding `/D:/...`; nodes production subprocesses fail `uv_spawn`; editor/slab probes report Bun resolving `three` failures | Fix portable paths and isolated module resolution in scoped follow-up; no dependency reinstalls or blanket skips |
| **Polygon warning contract** | Reduced test expects one warning but receives zero. Caller filtering only recognizes `/polygon-boolean...`, while Windows stacks use backslashes | Verify/fix caller normalization; failing diagnostic behavior is not evidence that all polygon geometry is wrong |
| **Geometry byte regression** | Viewer equal-elevation fixture expected `e1ecc001...` but got `a57c10a9...`; repeats alone after build | Compare actual geometry before updating snapshots or accepting a changed baseline |
| **Rendered shelf test contamination** | Two combined-run shelf exits have no registered mesh; same 109-test file passes independently | Investigate suite isolation; do not close combined failures based on isolated pass |
| **IFC beam imports** | Two assertion failures: mapped part missing and uncontained beam unexpectedly parented to a level | Reproduce importer semantics against fixtures; unresolved source/contract failure, outside the selected room-design demo |
| **CLI managed runtime/archive** | Seven failures around local storage, process lifecycle, archive and symlinks | Diagnose Windows/runtime handling separately; these do not invalidate observed source-editor startup but block global suite acceptance |
| **Root duplicate workspaces / formatting** | Reproduced orchestrator errors and 3,047 formatter diagnostics | Deliberately relocate/exclude duplicate review applications and scope formatting fixes, preserving founder work |

## Agent evaluation and production HTTP verification

[Recorded agent evaluation](STAGE-6-AGENT-EVALUATION.md) defines 30 representative cases plus 14 mapped boundary/security checks. The initial run had nine capability gaps. After the same-slab furniture fix, **30/30 expectations pass; eight language/catalog capability gaps remain** in this case set: thirteen instructions execute approved edits, ten clarify and seven reject invalid/unsupported/no-op actions. This is not a general natural-language success score or unrestricted floor-support acceptance.

The production editor's HTTP Assistant was exercised on disposable scene `0df0f05129a9`, separate from the founder's new manual room. Three explicit lamp-color edits preserved preview state and unrelated nodes, advanced exactly one version each and did not replay on duplicate approval. Final version **13**, graph hash **`6ad9aff400ccd586300e81de6575e8d2003ad981d1262bdafaeb9cdbae88a971`**, with API/read-only SQLite equality. Cross-origin 403, arbitrary operation 400, stale version 409 and unknown scene 404 were observed. Exact calls/results: `E\http-review.mjs`, `http-review.log`, `http-review-999f77ec-45e9-48e9-8e68-13ffce86331e.json`.

## Security and data integrity

This is a source/fixture review, not a penetration test or compliance certification.

| Area | Verified boundary | Remaining risk / limitation |
| --- | --- | --- |
| Credentials/provider | Server-side key; provider status/JSON excludes credential; mock default; explicit paid-provider checkbox/`allowLive` | No live provider call, billing or account-level budget acceptance; scene names/IDs/geometry context are sent externally when opted in |
| Tools/input | Strict Zod operation union, registered-tool allowlist, validated dry run, bounded scenes/operations/input | Raw shell/filesystem tools are absent; prompt-injection tests verify structural refusal, not arbitrary live-model robustness |
| Approval | Stored proposal ID, session owner, explicit alternative, version/hash checks | Proposal session ownership is not scene ownership or authenticated multi-user accounts |
| Conflicts/duplicates | Real stored state rechecked; concurrent manual-edit and duplicate tests pass | General non-Assistant MCP concurrent callers remain outside the serialized Assistant queue |
| Cancellation/partial failure | Stops before next step; completed steps retained; save-vs-event errors distinguished; repeats do not replay | Multi-step designs are not atomic; in-flight saves are drained, and cancellation cannot undo committed work |
| Authentication/access | Configured token rejects missing credentials even with local Host; production test listener is loopback only | No per-scene ACL enforcement. Without a token the guard trusts loopback Host; test confirms spoofed Host accepted at function boundary. Do not publicly expose this configuration |
| Origin/rate controls | Assistant same-origin and session guards pass; basic rate limit works | Base scene API permits other loopback origins. Rate keys trust forwarded headers and lack a demonstrated proxy policy; spoofed client identities create separate buckets |
| Page loading/deployment | Local production page/API loads | Scene page derives fetch base from forwarded host/protocol if app URL absent; configure a trusted base and validate proxy trust before deployment. Authenticated SSR token forwarding is unaccepted |
| Privacy/errors | Provider error text is reduced; no real credentials printed in this task | Raw scene API internal errors can include internal messages; retained scene revisions, request logging and deployment privacy need review |
| Resource/cost controls | 2,000-character prompts, 500-node assistant limit, up to 16 design operations, planner/tool timeout bounds, max output tokens | No account quota/spend cap or production load/abuse test; build warns about broad filesystem tracing |

## Measured performance

`E\benchmark.mjs` used the built source with Node and a new SQLite database: five sequential 6 × 5 metre fixtures, each ending with 13 nodes and roughly 5.6 KB of graph JSON. First sample cold within the process, remaining samples warm. No test/build was intentionally run concurrently with these measurements. The existing development server remained running, so this is not a controlled laboratory benchmark.

| Operation | Samples | Median ms | Observed min–max ms |
| --- | ---: | ---: | ---: |
| Create room + persist via tool | 5 | 17.71 | 14.95–146.86 |
| Layout generation only | 5 | 38.01 | 36.28–78.03 |
| Design planning incl. registered-tool dry runs | 5 | 129.95 | 116.52–232.59 |
| Approve six-step design incl. saves/readbacks | 5 | 50.92 | 41.53–67.57 |
| Single light planning | 5 | 17.03 | 14.79–21.18 |
| Single light mutation/save/verification | 5 | 10.37 | 9.58–13.86 |
| SQLite scene read | 5 | 0.18 | 0.18–0.27 |
| SQLite same-graph save | 5 | 1.03 | 0.89–1.13 |
| Read through fresh store | 5 | 3.45 | 3.35–3.62 |
| Production HTTP scene JSON | 5 | 3.72 | 3.30–4.17 |
| Production HTML download | 5 | 33.28 | 29.14–48.79 |
| Local sofa GLB download (7,908 bytes) | 5 | 3.37 | 3.28–6.63 |

Production server reported **Ready in 610 ms** (single sample, not first visual frame). First production HTTP planning request took **2,109.82 ms**; subsequent samples **35.63/37.63 ms**, indicating a substantial cold initialization cost. HTTP approval samples: **52.42/20.51/23.42 ms**. Full app build took **48.72 s**. Exact per-sample values are in `performance-212acd26-30c5-44f0-980e-8b7fbefe3e1f.json`, `performance-summary.json` and HTTP evidence.

**Unmeasured:** browser GLB parsing/GPU upload, time to visible scene, pointer-to-render latency, viewport FPS/frame times and numerical manual-save latency. HTTP download speed does not measure these. No production-scale performance or layout-quality score is claimed.

## End-to-end acceptance matrix

Current manual scene: `http://127.0.0.1:3008/scene/f4b34c4a42c1` in the new Stage 6 database.

| Journey | Independent automated / persistent evidence | Current Stage 6 browser evidence |
| --- | --- | --- |
| 1. Ordinary room creation, save, refresh, reopen | API and SQLite agree at version 2, 10 nodes; room `zone_e8ytpre25gtcyrdo`, polygon `[[-8,2],[-2,2],[-2,7],[-8,7]]`; final hash equals reference | **PASS, founder-reported** walls/floor/ceiling and save/refresh/reopen; exact saved comparison passed |
| 2. Manual catalog insert/move/rotate | API/SQLite and saved history verify the same Dining Chair from version 11 to 14; refresh/reopen retains version 14 and the exact graph hash | **PASS:** founder confirms real model, selection, move/rotation/save and continued editability after refresh/reopening; independent full-graph comparison passes |
| 3. Floor/wall finish changes | Finish tests pass; final version 42 retains the exact concrete floor and soft-white wall references from the approved design | **PASS within scope:** founder confirms finish rendering through T2 refresh and T3 reopening; supplied screenshots show the finishes |
| 4. Actual light modification | Versions 25/26 change only lamp color; final version 42 retains the full lamp payload, On/intensity 1.5/#ffbb66 | **PASS within scope:** intentional approvals, warm illumination and final refresh/reopen confirmed. Screenshots show illumination/model; numeric light controls are founder-reported and independently verified in saved data |
| 5. In-editor natural-language furniture move | Fixed E30 passes; approved 23→24 move changes only target X by +0.10 m; same item is retained through subsequent manual refinement | **PASS for the explicit supported command:** founder confirms preview, approval, movement, saved result and later editability. Unsupported doorway request separately passes safe refusal only |
| 6. Design style generation | Version 14→20 design adds the real catalog items and finishes; final version 42 preserves all design content except the intended table refinement and level child order | **PASS for supported design:** founder confirms alternatives, approval, models/finishes/illumination and final refresh/reopen. Original design preview has no independent intermediate checkpoint |
| 7. Manual refinement after AI | Same table moves to [-5.4, 0, 4.908630767842986] and rotates to 45° Y by version 38; exact table payload retained through version 42 | **PASS, T1:** founder report and before/after screenshots agree with saved pose. Identity/asset/parent/support/scale preserved; intermediate draft flags and level child reorder disclosed below |
| 8. Final save/refresh/reopen | Final API/read-only SQLite agree at version 42, 14 stable node IDs; full graph differs from the version-26 baseline only by table X/Z/Y-rotation and level child order | **PASS within observed scope, T2/T3:** founder reports refresh/reopen and continued editability; final graph is stable on repeated read. No independently timed API checkpoint before each browser action; final graph is not byte-identical to version 38 |

Room reference: `E\manual-room-saved-94585aa6-0452-4ceb-ae7d-67146b3f4b32.json`. Refresh/reopen checkpoint: `E\manual-room-reopened-5798963e-8571-462c-9cf6-4804a726bdb3.json`. Both version 2, hash `4b57abf3d175100ed1939d6326569df541c9d754a996288b0d3aeb0eb4d08c68`, all graph content identical. Visual observations are founder-reported; graph checks are independently read from API and SQLite. Original four walls and room identity are now the preservation reference.

### 2026-10-15 — Manual chair insertion and edit saved

The founder confirmed the Dining Chair loaded as a real model, remained selectable, moved and rotated using ordinary editor controls, and saved without error. Independently read the current API and SQLite in read-only mode; they agree on scene `f4b34c4a42c1`, **version 14**, **11 nodes**, graph SHA-256 **`eff9c00b7d2bc121590392975af58fd94f086f40f285bdbea3727b059fdefd84`**.

| Reference field | Verified value |
| --- | --- |
| Furniture ID | `item_1g83lapa0xefcysz` |
| Asset | `dining-chair`, source `library`, real catalog model URL ending `/items/system/dining-chair/model.glb` |
| Parent | `level_jtg4n8h0f87mlnqh` |
| Current floor support | `slab_00010ck4m6taf3fy`, present in the saved graph |
| First saved position for this item, version 11 | `[-7.076745615309799, 0, 2.9233049504435202]` metres |
| Final position, version 14 | `[-7.445268799474535, 0, 2.9280789561204275]` metres |
| First saved rotation | `[0, 0, 0]` radians |
| Final rotation | `[0, 0.5235987755982988, 0]` radians (30° around Y) |
| Scale | `[1, 1, 1]`, unchanged |

Saved revisions independently confirm translation and rotation of the same item, with equal asset payload, parent and scale. Compared with the version-2 room reference, every original room/structural node is exactly preserved. The existing level changes only by adding the chair to its children. The pinned support is ordinary manual-editor data; the previously documented AI move-tool limitation remains open and was not bypassed.

New unique checkpoints in E:

- `manual-chair-saved-31162352-c488-49f8-bec1-89e2b04f6ac1.json`: full saved scene and API/database equality, before refresh.
- `manual-chair-history-cb300955-02a4-47fb-87a4-8202abd579c9.json`: initial/final item fields, relevant saved revisions and preservation checks.
- `verify-manual-chair.mjs`: read-only database/history comparison, exit 0. No scene mutation was performed by the agent.

**Next check:** founder refreshes and closes/reopens the same scene without editing or saving; confirm the real chair retains its pose and editing controls, then compare with the version-14 reference. The earlier room-only refresh/reopen pass does not establish chair persistence. Automated suites were not repeated for this read-only evidence/documentation update; their prior results and unresolved failures remain unchanged.

### 2026-10-15 — Chair refresh and reopening passed

The founder confirmed the chair retained its pose, real model and editing controls after refreshing and closing/reopening the same scene, without further edits or errors. A fresh API GET and read-only SQLite comparison match the pre-refresh reference exactly: **version 14**, **11 nodes**, SHA-256 **`eff9c00b7d2bc121590392975af58fd94f086f40f285bdbea3727b059fdefd84`**. Scene identity, every node and all graph content are unchanged; the comparison reports zero changed IDs.

Evidence: `E\manual-chair-reopened-3f6f4c4c-093c-4c4c-8af0-892b7f8bf835.json`, compared with `manual-chair-saved-31162352-c488-49f8-bec1-89e2b04f6ac1.json`. `checkpoint.mjs` completed with exit 0. Visual/editability success is founder-reported; stored identity, graph and transforms are independently verified. No persistent scene mutation was performed by the agent.

**Journey 2 is now passed.** The next milestone is the Assistant's Scandinavian design preview: alternatives should appear without changing the saved room or chair, and the concrete-for-oak limitation must remain visible before approval. The founder has been asked to preview only, without approving yet. Completed-design rendering, approval, later manual refinement and final reopen remain pending. This evidence update does not rerun or close existing automated failures and pilot-readiness gaps.

### 2026-10-15 — Design approval clarified and saved design verified

The founder first reported alternatives appearing with the scene unchanged. The next API read instead found **version 20**, so verification paused to clarify the action sequence. The founder then explicitly confirmed: **“I also clicked Approve selected layout.”** The six saved design steps are therefore consistent with a founder-approved layout; this observation is not evidence of an approval bypass. Preview appearance and the approval action are founder-reported. No independent snapshot was captured between preview and approval, so this manual check alone does not establish preview immutability; the separate automated/production HTTP preview checks remain the independent evidence for that behavior.

Read-only saved history records versions 15–20: `place_floor_item`, `place_floor_item`, `configure_item_light`, `place_floor_item`, `set_room_finish`, `set_room_finish`. The original Dining Chair payload is unchanged. The original room identity, polygon and structural nodes are preserved; the zone changes only its finishes, and the parent level gains the three new item children.

| Saved design field | Verified value |
| --- | --- |
| Scene / version / nodes | `f4b34c4a42c1` / **20** / **14** |
| Graph SHA-256 | `c325355c112109158a09d64df80b37f50b6882c15badb69a2d3c4b02263e2cf7` |
| Sofa | `item_2wigj7s59kxjsatb`, asset `sofa`, position `[-7, 0, 5.25]` metres, rotation `[0, 1.5707963267948966, 0]` radians |
| Coffee table | `item_p52sqw099amvtmt2`, asset `coffee-table`, position `[-4.75, 0, 4.5]` metres, rotation `[0, 1.5707963267948966, 0]` radians |
| Lamp | `item_y3apzq25uyf0z5z7`, asset `floor-lamp`, position `[-5, 0, 6.5]` metres, rotation `[0, 0, 0]` radians |
| New-item parent / scale | `level_jtg4n8h0f87mlnqh` / `[1, 1, 1]` for all three |
| Room finishes | `floor.finish = library:concrete-polished`; `wallMaterial = library:preset-softwhite` |
| Real lamp settings | `lighting.enabled = true`, intensity `1.5`, color `#ffddaa` |

Evidence in E:

- `design-preview-unchanged-0002a311-a95b-4108-b988-9a7bc2ea3643.json`: the first version-20 observation. Its filename describes the intended check; its actual comparison with version 14 is **false**, not a preview pass. Retained unchanged.
- `design-history-investigation-cf73de54-a37d-4b0b-95af-6183295d5b98.json`: saved operation sequence and chair/structural preservation, captured before the founder clarified approval. Its pending interpretation is superseded by this dated clarification, not overwritten.
- `design-approval-confirmed-b44a7f7a-98df-438c-b42c-952bccb70a40.json`: fresh API/read-only SQLite agreement after the clarification; version 20 and full graph still match the first version-20 observation, with zero changed IDs. `checkpoint.mjs` exited 0.

**Next check:** founder confirms the actual sofa, table and lamp models, concrete floor, light walls, warm illumination and table selection/edit controls without moving or saving. These visual outcomes remain pending. Then continue explicit approved furniture/light edits, manual refinement and final persistence checks. No scene or application source was changed by the agent; automated suites were not rerun for this read-only evidence update. Existing QA and pilot-readiness blockers remain open.

### 2026-10-15 — Approved design visual check passed

The founder confirmed that the approved layout displays the real sofa, coffee table and lamp models, concrete floor, light walls and warm illumination. Selecting the coffee table shows editing controls; no loading/save error was reported and the original chair remains present. These observations are founder-reported, not an agent-operated GPU inspection.

A fresh API/read-only SQLite checkpoint, `E\design-visual-confirmed-86e80e01-e853-45c5-889c-88fdbc96d8d3.json`, matches the approved-design reference exactly: scene `f4b34c4a42c1`, **version 20**, **14 nodes**, hash **`c325355c112109158a09d64df80b37f50b6882c15badb69a2d3c4b02263e2cf7`**, zero changed IDs. `checkpoint.mjs` exited 0. The current supported design-application/finish checks pass; final design refresh/reopening remains pending.

**Next check:** select only the AI-created coffee table, request `move selected by 0.10 m on x` and click **Preview change only**. The current position is `[-4.75, 0, 4.5]` metres; the proposal should target `item_p52sqw099amvtmt2` at `[-4.65, 0, 4.5]`, preserving rotation, scale and all unrelated data. Inspect the saved state before asking the founder to approve. The existing manually pinned-chair limitation remains open; using the unpinned table does not establish that broader capability. No application or scene changes were made by the agent; prior automated results stand.

### 2026-10-15 — Coffee-table move preview blocked by pinned support

The founder reported an error and no move preview. The exact browser error text and whether it was in-panel or a full-page error were requested and remain unconfirmed. Independently, the current production API reproduced **HTTP 422**, `operation_refused`, with **`MCP error -32600: Item item_p52sqw099amvtmt2 has an unsupported parent or pinned support`**. This establishes a move-validation failure on the current scene; it does not establish a compilation failure or prove that the founder saw this identical message.

The initial read found scene `f4b34c4a42c1` at **version 23**, **14 nodes**, SHA-256 **`f3af6ef028f7789e8b66e6ae717045fad9d36d7ac0d9e5c8b5eedb281a16cc5f`**, rather than the version-20 reference. Only the coffee table differs from that reference. Saved revisions 21–23 change its pose; version 22 adds `supportSlabId = slab_00010ck4m6taf3fy`. There are no new `scene_events` rows after the approved design. Revision `author_kind = mcp` alone does not identify who performed an edit. The founder's intent and precise manual actions are not inferred from these rows.

Current table fields:

- Same ID `item_p52sqw099amvtmt2`, asset `coffee-table`, parent `level_jtg4n8h0f87mlnqh` and scale `[1, 1, 1]`.
- Position `[-4.49060825420414, 0, 3.594072605174318]` metres; rotation `[0, 1.5707963267948963, 0]` radians.
- Floor support `slab_00010ck4m6taf3fy` exists in the same saved graph.
- All other nodes, including the original chair, room geometry, finishes, sofa and lamp, exactly match the version-20 design reference. The old proposed X target −4.65 is no longer based on the current position and must not be reused.

The reproduction used only `action: propose`, prompt `move selected by 0.10 m on x`, the exact table ID, current version 23 and `allowLive: false` after confirming provider mode `mock`. No approval was sent. Before/after API responses and all scene/revision/event rows for this scene match exactly; SQLite was inspected read-only. The server still listens on `127.0.0.1:3008` with PID 17280. No application build was attempted during this diagnosis.

Source cause: `packages/mcp/src/tools/furniture-tools.ts:floorItem` rejects any `supportSlabId`, even when the referenced floor exists. `packages/mcp/src/assistant/service.ts:InteriorAssistantService.propose` runs the registered tool on `previewStore`, and the Assistant route maps this refusal to HTTP 422. Ordinary manual movement can attach this support through `resolveSupportSlabPatch`; this is the already recorded mixed manual/AI editing gap, not invalid user furniture. The rejection was not bypassed by clearing support or editing raw scene data.

Evidence in E:

- `table-preview-error-8af436b0-4bd1-4ec8-bdc0-cbbbc1112702.json`: initial API/SQLite version-23 checkpoint and comparison with the approved reference.
- `table-preview-diagnostic-9c34a7e1.mjs` and `table-preview-diagnostic-d0a87cb8-f9fc-432b-a2ef-592b24e4a630.json`: exact mock HTTP request/error, saved history, row-preservation assertions; exit 0.
- `pinned-preview-e30-recheck-20261015-1256.log`: from `packages/mcp`, `bun test src/assistant/stage6-evaluation.test.ts --test-name-pattern E30`; **1 passed, 0 failed, 29 filtered out, 3 assertions**, exit 0. This is a safety-rejection test, not a successful furniture-move test or a replacement for the full baseline.

**Journey 5 remains blocked.** Confirm the browser error and additional table edits, then implement and test validated support-aware floor movement before repeating this table's preview/approval check. Do not restore the old pose, strip support, duplicate the table or silently substitute another target to claim this check passed. No application source or persistent scene change was made by the agent during diagnosis. Existing broader failures and readiness blockers remain open.

### 2026-10-15 — Same-slab furniture movement fix and runtime verification

The founder supplied the exact pinned-support error and a screenshot showing it inside the Assistant, with the coffee table selected and the editor rendering normally. This confirms the reported failure is the reproduced validation refusal, not a compilation error. The screenshot shows the current table near X −4.49, Y 0, Z 3.59; intent behind the earlier additional edits remains unconfirmed and no old pose was restored.

**Source scope:** `packages/mcp/src/tools/furniture-tools.ts` now permits `edit_floor_item` for an existing slab-supported floor item. `validateSlabSupport` verifies the referenced node is a slab on the item's level and uses core `getRenderableSlabPolygon` plus existing polygon predicates to require both current and proposed rotation/scale-aware AABB footprints strictly inside the same support, clear of holes. The move retains the exact support reference and canonical Y offset; existing room, collision, door, version and persistence checks remain. `floorFootprint` shares the existing AABB calculation. No manual UI interaction changed, so both existing 2D/3D views consume the same canonical result; no view-specific behavior was introduced.

**Explicit limits:** support-edge contact/overhang, missing or cross-level hosts, the `ground` sentinel, support transitions, changed Y offsets and pinned deletion are still refused. AABB containment is conservative for rotated/irregular shapes. This is same-slab movement/rotation, not general support reelection or multi-level collision handling. The original Stage 3D light initialization in this already-modified source file was preserved.

**Regression coverage:** new `packages/mcp/src/tools/furniture-support.test.ts` has 15 isolated tests for approved translation/rotation, unchanged support/Y/asset/metadata/unrelated nodes, ownership, duplicate approval, SQLite reopening, stale conflicts, invalid support types/levels, slab boundaries/holes/concavity, vertical offset refusal and retained collision/room/deletion guards. E30 in `packages/mcp/src/assistant/stage6-evaluation.test.ts` now requires a successful approved 0.10 m movement with the complete item payload otherwise unchanged.

Executed from `packages/mcp`:

```powershell
bun test src/tools/furniture-support.test.ts src/tools/furniture-tools.test.ts src/assistant/stage6-evaluation.test.ts src/assistant/service.test.ts src/assistant/design-layout.test.ts src/tools/room-tools.test.ts src/tools/structure-tools.test.ts src/tools/structure-persistence.test.ts src/tools/finish-tools.test.ts src/tools/lighting-tools.test.ts
bun run build
```

- Combined regression: **98 passed, 0 failed, 1,265 assertions, 10 files**, 9.99 seconds; `E\support-fix-regression-20261015.log`. All executed on disposable storage, not the browser scene.
- An initial new stale-scene test wrongly expected a rejected promise (44 pass/1 fail in the first three-file run). Corrected it to require the existing `conflict` result and unchanged saved graph. No production conflict behavior was changed.
- Initial build caught missing explicit WallNode/SlabNode filter type guards; `support-fix-mcp-build-20261015.log` retains the failure. Corrected those types; **final build exit 0**, `support-fix-mcp-build-final-20261015.log`. No dependencies changed.
- New 30-case JSON: `agent-evaluations-349a686d-c305-457c-87ce-3843b600c350.json`; 13 succeeded, 10 clarified, 7 rejected safely. E30 now succeeds. Original evaluation evidence remains intact.
- `bun x --no-install biome check packages/mcp/src/tools/furniture-tools.ts packages/mcp/src/tools/furniture-support.test.ts packages/mcp/src/assistant/stage6-evaluation.test.ts`: **exit 0**, three files, no fixes on final check. Formatting changes were limited to these three files.

**Runtime:** captured `support-fix-before-restart-3e46b49c-c753-41db-8f5f-a18dd970127a.json`, confirmed the port-3008 process command and stopped only PID 17280. The stop command ended with a no-listener query and exit 1; the process was stopped and the subsequent launch succeeded. Restarted the same app, database, port and mock provider using `bun run start -p 3008 -H 127.0.0.1`; new session 77127, observed PID 25652, Next Ready 568 ms. No scene/database replacement. The existing production app uses `assistant-server.ts:getAssistantRuntime` to load built MCP code natively; only MCP needed rebuilding, and the new HTTP result verifies that runtime behavior.

**Actual production result:** `table-preview-fixed-9c34a7e1.mjs` returned **HTTP 200** for the exact saved table and prompt at version 23. The proposed position is `[-4.390608254204141, 0, 3.594072605174318]` from `[-4.49060825420414, 0, 3.594072605174318]`; only the table is in the proposed diff. No approval was sent; the diagnostic proposal was cancelled. API, scene rows, revisions and event rows remain identical before/after. Scene stays **version 23**, hash **`f3af6ef028f7789e8b66e6ae717045fad9d36d7ac0d9e5c8b5eedb281a16cc5f`**. Evidence: `E\table-preview-fixed-a6d868eb-2f63-4422-aec1-e33308978a72.json`, exit 0.

**Next:** refresh the browser, select only the table and repeat Preview change without approval. Browser success, an approved movement and final reload remain pending. The initial 57 global failures and other readiness limitations remain open; this focused run does not replace the global baseline.

### 2026-10-15 — Founder-approved supported-table move saved

The founder reported the correct move preview appearing while the table stayed stationary. The next saved checkpoint already showed version 24; when asked about the sequence, the founder explicitly confirmed **“I also clicked Approve change.”** This verifies approval by founder report. It does not provide an independent intermediate saved checkpoint between that browser preview and approval. Earlier automated and production HTTP preview-immutability checks remain separate evidence; no approval bypass is inferred from this timing.

Read-only API/SQLite/history verification now passes for scene `f4b34c4a42c1`:

| Check | Actual result |
| --- | --- |
| Version | **23 → 24**, exactly one increment |
| Graph hash before | `f3af6ef028f7789e8b66e6ae717045fad9d36d7ac0d9e5c8b5eedb281a16cc5f` |
| Graph hash after | `541083e5039a7a20abdd962df3b5bdfb5faf2a5529f25757d8e7f41c4a51a28c` |
| Target | Same `item_p52sqw099amvtmt2`, asset `coffee-table` |
| Position before | `[-4.49060825420414, 0, 3.594072605174318]` metres |
| Position after | `[-4.390608254204141, 0, 3.594072605174318]` metres; exact JavaScript `oldX + 0.10` result |
| Preserved target fields | Same parent, `supportSlabId = slab_00010ck4m6taf3fy`, Y/Z, rotation, scale, asset and every other field |
| Unrelated scene data | Entire graph equals the prior graph with only target X changed; all room geometry, finishes, chair, sofa and lamp data preserved |
| Saved history | One new revision and one `edit_floor_item` event, event ID 50, version 24 at `2026-10-15T13:14:25.043Z` |

Evidence in E: `supported-table-browser-preview-b0a7e4b4-e57c-4abc-9ddf-5724296b276c.json` is the first post-approval observation; despite its intended-check filename, its comparison with version 23 correctly reports changed data. `verify-approved-supported-table-20261015.mjs` and `supported-table-approved-a3402534-94c4-4f05-85bd-4d3a35abbeea.json` independently assert the exact intended full graph, version, API/database equality and history; exit 0. No scene mutation was performed by the agent in this follow-up.

**Next:** confirm the table visibly moved and the Assistant reported a saved, verified result without errors. Then continue the explicit lighting and final persistence checks. Do not approve the move again. The saved movement is verified; browser-visible acceptance is still pending. No automated suites were repeated for this read-only evidence/documentation update; the prior 98-test regression and build results stand, with global readiness issues still open.

### 2026-10-15 — Supported-table visual acceptance passed

The founder confirmed **visible movement and a saved result, without errors**, after clicking Approve change. This closes Journey 5 for the scoped 0.10 m same-slab table movement. Visual appearance and the Assistant message are founder-reported; persistence is independently verified.

Fresh checkpoint `E\supported-table-visual-confirmed-fa7f6b15-0c94-4106-9487-97e23866b5f8.json` matches `supported-table-approved-a3402534-94c4-4f05-85bd-4d3a35abbeea.json`: same scene `f4b34c4a42c1`, **version 24**, **14 nodes**, SHA-256 **`541083e5039a7a20abdd962df3b5bdfb5faf2a5529f25757d8e7f41c4a51a28c`**, zero changed IDs. API and read-only SQLite agree. `checkpoint.mjs` exited 0. The table remains at `[-4.390608254204141, 0, 3.594072605174318]` metres with its support and all other fields preserved.

**Next check:** in Assistant preview `set lamp color to #ffbb66` without approving yet. The current floor lamp `item_y3apzq25uyf0z5z7` is On, intensity 1.5, color `#ffddaa`; the proposed edit should change only its color. Capture unchanged saved state before approval, then verify illumination and final persistence. No scene or application-source mutation was performed in this follow-up. Automated suites were not repeated for this evidence-only update; the prior 98-test regression/build results and outstanding global failures remain as recorded.

### 2026-10-15 — Lamp-color preview preserves saved scene

The founder reported a correct preview for `set lamp color to #ffbb66` and explicitly confirmed **not approving it**. Before requesting approval, a fresh API GET/read-only SQLite comparison independently retained scene `f4b34c4a42c1` at **version 24**, hash **`541083e5039a7a20abdd962df3b5bdfb5faf2a5529f25757d8e7f41c4a51a28c`**, with zero changed IDs and the complete graph matching the previous reference. This browser sequence now has an independent unchanged saved-scene checkpoint between preview and approval.

Evidence: `E\lighting-preview-unchanged-67b5c780-65d8-4f01-9389-41cb1dc9e60f.json`; `checkpoint.mjs` exited 0. The approved table pose, original chair/room, finishes and lamp's existing On/intensity 1.5/color `#ffddaa` remain unchanged. The founder has now been asked to click Approve change once and report visible warmer illumination and the saved-result message. Approval, the saved color change and its visual result remain pending; no scene mutation was performed by the agent.

### 2026-10-15 — Warm lamp result verified; intermediate blue edit awaiting clarification

The founder reported warmer illumination and an error-free saved result after the requested approval. The strict single-edit verification script `E\verify-approved-lamp-color-bbb455be.mjs` exited **1** because the saved scene was version **26**, rather than expected version **25**. This check was not weakened or reported as passing. A separate read-only API/SQLite/history investigation explains the extra version:

| Saved version | Event | Only graph change from previous version |
| --- | --- | --- |
| 25 | `configure_item_light`, event 51, `2026-10-15T16:52:04.351Z` | Lamp color `#ffddaa` → `#00aaff` |
| 26 | `configure_item_light`, event 52, `2026-10-15T16:58:30.571Z` | Lamp color `#00aaff` → `#ffbb66` |

Scene `f4b34c4a42c1` has **14 nodes**, version **26**, graph SHA-256 **`c7be786851bc5ef595e6dc6f98eb563a32a5d3810baebd7903d76a9a89d0284b`**. API and read-only SQLite agree. The complete final graph equals the version-24 reference with only `item_y3apzq25uyf0z5z7.lighting.color` set to `#ffbb66`. The lamp stays On at intensity 1.5; its identity/asset/pose, table pose/support, chair, sofa, room geometry and finishes are all preserved. Each intermediate revision also changed only this color field.

Evidence: `E\lamp-color-history-investigation-0aecfa07-afb2-4f06-b4f4-3e9feb547507.json`, produced by a read-only Node/API/SQLite comparison that exited 0. The history establishes two persisted light operations, not the user's intent or approval sequence. The founder has been asked whether they intentionally previewed and approved blue and then warm. **Lighting acceptance is pending that clarification and final reload.** No restoration, replay, scene/database write or application-source change was performed by the agent. Previous automated results and broader readiness blockers remain open.

### 2026-10-15 — Lighting approvals clarified; remaining checks batched

The founder explicitly confirmed **“Yes, I intentionally approved blue, then warm.”** The two saved `configure_item_light` events therefore agree with the reported two approvals. Journey 4 passes for the supported color-edit application: founder-reported illumination/saved result and independently verified color-only persistence. The earlier single-edit verification failure remains recorded because that script expected one edit; it is not relabeled as a passing run. No approval bypass is established by the two intentional edits.

The founder requested multiple test cases together to reduce waiting. [The demonstration document](STAGE-6-DEMONSTRATION.md#remaining-checks--one-batch) now provides T1 manual table move/rotation/save, T2 refresh, T3 reopening/editability and lamp controls, and T4/T5 safe refusal of the two known unsupported phrases. Completed mutations should not be repeated. The founder can run the batch and return one result; stop only on an error, missing model or unexpected scene change. Unsupported-language refusal does not close the underlying capability gaps.

Fresh baseline `E\batch-review-baseline-e334dec9-b67e-41dd-8077-6dd6f31c08c8.json` retains **version 26**, **14 nodes**, hash **`c7be786851bc5ef595e6dc6f98eb563a32a5d3810baebd7903d76a9a89d0284b`**, identical to the light-history checkpoint. API and read-only SQLite agree, with zero changed IDs; `checkpoint.mjs` exited 0. It was captured while preparing the batch, before the founder's approval clarification arrived. All batch outcomes remain pending. Final verification will compare persistent revisions and the live graph; it will not claim independently captured API states before each browser action. No scene or application source was changed; prior automated results and global blockers remain open.

### 2026-10-15 — Batched manual acceptance closed with screenshot and saved-history evidence

The founder returned **T1 PASS, T2 PASS, T3 PASS, T4 PASS, T5 PASS**, no errors, and five screenshots of this exact scene. The images were reviewed directly; no agent-operated browser session or new GPU performance measurement is claimed.

| Test | Observed evidence and acceptance |
| --- | --- |
| T1 manual refinement/save | Before screenshot shows table X −4.39, Y 0, Z 3.59; After shows X −5.40, Y 0, Z 4.91 and a changed orientation. Saved versions independently verify the exact translation and 90°→45° Y rotation of the same table. **PASS** |
| T2 refresh | Founder reports retained pose, room, models, finishes and lighting after refresh. Saved table payload is unchanged from revision 38 through 42. **PASS with founder-reported browser sequence** |
| T3 reopen/editability | Founder reports reopen/editability and correct lamp values. Screenshot shows the real lamp, warm illumination and Move item controls, not the numeric Lighting panel. Saved lamp payload is exactly unchanged from the baseline. **PASS with that visual-evidence limit** |
| T4 unsupported chair instruction | Screenshot shows the Assistant's explicit-command guidance and no proposal to approve. Founder reports no movement/save; there are no new MCP operation events after baseline. **PASS for safe refusal; doorway-aware movement remains unsupported** |
| T5 unsupported warmer instruction | Screenshot shows the already-known inappropriate style clarification. Founder reports no scene change/save, consistent with final graph and event history. **PASS for safe refusal only; misleading response and unsupported interpretation remain open** |

Final saved reference:

| Field | Verified value |
| --- | --- |
| Scene / version / nodes | `f4b34c4a42c1` / **42** / **14**, same node-ID set as baseline |
| Graph SHA-256 | `fffb02a7f1864a50f2a4e126c10f9d8457a445c768927625e56ae2537867b48a` |
| Table ID / asset / parent / support | `item_p52sqw099amvtmt2` / `coffee-table` / `level_jtg4n8h0f87mlnqh` / `slab_00010ck4m6taf3fy`, all unchanged |
| Position before → final, metres | `[-4.390608254204141, 0, 3.594072605174318]` → `[-5.4, 0, 4.908630767842986]` |
| Rotation before → final, radians | `[0, 1.5707963267948963, 0]` → `[0, 0.7853981633974481, 0]` |
| Scale and other table properties | `[1, 1, 1]`, asset payload, metadata and every field except position/rotation unchanged |
| Lamp | Entire node unchanged, including On, intensity **1.5**, color **#ffbb66**, asset and pose |
| Room and other furniture | Original room geometry/materials, chair, sofa and all other node properties preserved, except the level's child-list order described below |
| Parent relationships | Same parent IDs and child membership, no duplicate/missing child IDs; reciprocal parent/child links checked |

**History and limits:** revisions 27–42 record the manual editing sequence, with zero new MCP operation events. The final table pose first appears at version 38 and remains exactly equal through version 42. The level's final child list swaps the table/lamp ordering; membership and all parent relationships remain equal. This is an observed additional graph change, not an identical whole-graph refresh result. The specific runtime call responsible for the reorder was not independently traced, and no raw data was normalized or rewritten to hide it.

Intermediate revisions 32/36 (table) and 39/41 (lamp) contain `metadata.isTransient = true`; version 36 also temporarily removes the table support reference. All temporary flags are absent in the final saved graph and the original table support is restored. Source `packages/editor/src/components/tools/item/use-draft-node.ts:useDraftNode.adopt` adds the transient marker and `commit` strips it; `apps/editor/components/scene-loader.tsx:SceneLoader.handleSave` submits the supplied graph. T3 screenshot visibly shows an active Move item interaction. Persisting these intermediate states is recorded as an open interruption/recovery risk; no mid-move reload safety or exact autosave root cause is claimed. Final successful reopening does not close that issue.

Evidence retained outside Git in E:

- `batch-review-final-e0f02a66-5fc8-4206-a143-d51419d3ad6d.json`: initial final API/database checkpoint.
- `inspect-final-batch-68d2e483.mjs` and `batch-history-3d1ce1b2-1583-4b06-8007-6e3d9d2ab01a.json`: complete relevant revisions, events and field-level comparisons; **exit 0**.
- `verify-final-batch-60df8bc9.mjs` and `batch-acceptance-016a1c47-5462-457f-8bba-c61441d580e3.json`: asserts exact allowed final changes, table fields, all other node content, parent membership, absence of final draft flags, version-38→42 table equality, no new operation events and a fresh API/read-only SQLite comparison; **exit 0**.
- `manual-batch-screenshots-e15e8684-6fef-4de0-8f02-290395059ba8/`: five unchanged PNG copies plus `manifest.json` with original paths, sizes, SHA-256 hashes and filesystem times. Sources were the five explicitly supplied files under `C:\Users\HP\OneDrive\图片\Screenshots`; all copied hashes match. Filesystem times are not asserted to be independently verified capture times.

The scoped local mock demonstration is now accepted. Full Stage 6/pilot readiness remains blocked by the recorded QA, language, security and persistence limits. This closeout changes documentation/evidence only; no scene write, application-source edit, dependency change, commit, push or deployment occurred. Automated suites were not rerun for the evidence-only closeout; prior executed results remain recorded separately. `git diff --check` passed.

## Demonstration and readiness

Use [the founder demonstration script](STAGE-6-DEMONSTRATION.md). It explicitly substitutes supported mock commands for unsupported “away from doorway” and “make lighting warmer” phrases. The exact unrestricted demonstration requested in the brief is not yet supported.

- **Controlled local mock demonstration:** **PASS within the documented scope.** Supported design, explicit table/light commands, manual refinement, saved identity, refresh/reopen and final editability are accepted using founder reports/screenshots plus independent persistence checks. T4/T5 are safe-refusal checks, so the unrestricted natural-language demonstration is still unsupported.
- **Public/shared pilot and full Stage 6 MVP acceptance:** **NO**. Resolve scene authorization/proxy boundaries, unsupported language, significant failing tests and active-move persistence/recovery risk; retain broader support limitations and missing measured viewport evidence. Earlier browser passes do not close those gates.
- **Next stage:** not started. Preserve this accepted scene/evidence and prioritize bounded remediation before repeating the affected automated checks; no additional repetition of T1–T5 is required without a relevant change or new failure.

## Changes made for this assessment

New reusable tests: `packages/mcp/src/assistant/stage6-evaluation.test.ts`, `apps/editor/lib/stage6-security.test.ts`, and the follow-up `packages/mcp/src/tools/furniture-support.test.ts`. The bounded repair updates `packages/mcp/src/tools/furniture-tools.ts` and E30; other recorded defects remain open. Documentation: this report, `STAGE-6-AGENT-EVALUATION.md`, `STAGE-6-DEMONSTRATION.md`, and the existing master register. Temporary runners/checkpoints are in E. No dependency upgrade, reset, review-folder cleanup, database replacement, commit, push or deployment occurred.

Git remains on `work/mvp-progress-2026-10-13` at the original HEAD with pre-existing work intact. Stage 6 now adds six files and updates the existing register and furniture tool. Initial-assessment inventories: `E\git-status-before.txt` and `E\git-status-after.txt`; the follow-up inventory is separate. No files were staged.
