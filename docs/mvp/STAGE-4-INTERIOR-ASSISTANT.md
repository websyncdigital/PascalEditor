# Stage 4 — Interior Assistant inside Pascal

**Status: PASS for the scoped in-editor mock Assistant workflow (2026-10-15).** The running source app completed proposal, approval, validated scene editing and independent saved API/SQLite verification. The founder reported the Assistant workflow, illumination, selection, refresh and reopening passed, then confirmed the preceding item move and subsequent Off request were intentional. A fresh read-only comparison retained the exact final version-7 graph. Optional paid-provider and production deployment acceptance remain unverified; no live paid model call has been made.

## Discovery and prerequisites

The active workspace and Git root were independently confirmed as `D:\PascalEditor`, on `work/mvp-progress-2026-10-13`, HEAD `dda35f77c8d62c18fe254a08a892be4846dff34d`. The checkout already contained Stage 3C/3D work and local review/config files; that work was preserved. The installed test runtime reports Bun `1.4.3`; the editor manifest is Next `16.3.0`, React `^19.2.4`, and the source MCP package is `1.0.3`.

Read the root and editor `AGENTS.md`, master development register, architecture index/layers/tools/events, package manifests, existing tests and stage reports. The installed Next route-handler, server/client, environment and Turbopack import documentation informed the implementation. [Stage 2A](STAGE-2A-MCP-CONNECTION.md), [Stage 2B](STAGE-2B-FIRST-CONTROLLED-EDIT.md) and the scoped [3A](STAGE-3A-ROOM-LAYOUT-TOOLS.md), [3B](STAGE-3B-FURNITURE-TOOLS.md), [3C](STAGE-3C-MATERIAL-TOOLS.md), [3D](STAGE-3D-LIGHTING-TOOLS.md) gates were verified from their reports. Stage 3D includes real point-light behavior, founder-reported Off/On controls and visuals, and independent API/SQLite checks after editor restart. Broader lighting, unsupported assets/materials and repository-wide QA remain outside those scoped acceptances.

Source paths and symbols inspected before implementation:

| Concern | Existing implementation reused |
| --- | --- |
| Saved editor and sidebar | `apps/editor/components/scene-loader.tsx`: `SceneLoader`, `SIDEBAR_TABS`, `handleSave`; `packages/editor/src/lib/scene.ts`: `applySceneGraphToEditor` |
| Saved scene lifecycle/API | `apps/editor/app/scene/[id]/page.tsx`; `apps/editor/app/api/scenes/[id]/route.ts`: version-checked `PUT`; `.../[id]/events/route.ts`: persisted event stream |
| Storage and access boundary | `apps/editor/lib/scene-store-server.ts`: `getSceneStore`; `scene-api-security.ts`: `guardSceneApiRequest`; `packages/mcp/src/storage/sqlite-scene-store.ts`: `SqliteSceneStore` |
| Canonical graph and headless execution | `packages/mcp/src/bridge/scene-bridge.ts`: `SceneBridge`; `packages/core/src/store/use-scene.ts`: canonical store and read-only lease; `packages/mcp/src/server.ts`: `createPascalMcpServer`/`executeTool` |
| Accepted editing contracts | `packages/mcp/src/tools/room-tools.ts`, `structure-tools.ts`, `furniture-tools.ts`, `finish-tools.ts`, `lighting-tools.ts`; persistence/error handling in `live-sync.ts` |
| Real lighting | `packages/core/src/schema/nodes/item.ts`; `packages/nodes/src/item/panel.tsx`; `packages/viewer/src/store/use-item-light-pool.ts` and `systems/item-light/item-light-system.tsx` |

No separate agent backend, scene database, scene format or renderer was introduced for the feature. Disposable test storage is separate from user projects.

## Architecture and contract

```text
Saved-scene Assistant tab
  → same-origin scene assistant API
  → deterministic mock or optional server-side Responses planner
  → strict typed operation (one operation per proposal)
  → existing tool preflight against a disposable snapshot
  → user reviews and approves the stored proposal ID
  → fresh version + full graph hash check
  → the same registered Pascal tool against the existing scene store
  → re-read persistent graph and verify result
  → existing live event path + explicit saved-scene reload → editor UI
```

`packages/mcp/src/assistant/contracts.ts` defines a strict Zod discriminated union. It permits `create_room`, `move_zone`, `place_floor_item`, `edit_floor_item`, `delete_floor_item`, `set_room_finish`, and `configure_item_light`. There is no generic patch, raw JSON write, shell tool, undo, arbitrary tool name or automatic style generation in this contract. `search_finish_materials` is used only for server-side discovery. Existing tool validation remains authoritative for room support, floor placement, clearance, supported finishes and lamp intensity ranges. Coordinates use level-local metres; Y rotations use radians at the contract boundary and degrees in the readable UI description.

`InteriorAssistantService.propose` reads the current persisted graph and version, resolves selected IDs against that graph, supplies actual node/catalog IDs, schema-validates planner output, and runs the real tool against a disposable in-memory snapshot. The preview adapter cannot write to the real store. No-op, invalid or unsupported proposals fail before an approval exists. Ambiguous mock targets produce a clarification instead of an edit.

`approve` accepts a stored proposal ID and saved version, not replacement operations from the browser. It rechecks the full graph hash and version, then runs the exact stored operation through the source-built registered tool. Newly created node IDs are assigned by the canonical tool during execution; returned affected-object details are replaced with the actual saved IDs. The service re-reads persistent storage and requires the expected graph and one version increment before reporting success. Event publication and graph persistence are not claimed to be one transaction: a saved change whose event failed is reported as `saved_with_warning`, with refresh instructions and no automatic retry.

`runtime.ts` serializes all assistant headless scene work across scenes because `SceneBridge` uses a process-wide canonical store. The tool executor rejects every name outside its allowlist. A 30-second tool-response timeout retains the scene lock until an already-running handler settles, avoiding concurrent scene-memory reuse. This assistant queue does not retrofit concurrency safety onto independently launched general MCP servers.

The browser panel is part of the existing editor sidebar. It shows the scene name/ID, mock/live state, conversation history, plain-language proposed change, exact details, approval/rejection, progress/cancel and actual results/errors. History and pending proposals are session/process memory, not new persisted scene fields. Reload/restart requires a fresh proposal; unknown proposal IDs cannot be replayed into edits.

## Safety, access and interruption behavior

- One operation per approval; maximum 2,000 prompt characters, 500 scene nodes and 100 changed nodes. Pending proposals expire after ten minutes; the process caps retained proposals at 200.
- Existing scene API authentication and rate limits are retained. Assistant requests additionally require the same origin, a custom header and an HttpOnly SameSite Strict session cookie. Proposals are bound to that session and scene. Cross-session lookup/approval is rejected. These are the existing local/token access boundaries, not new account/tenant authorization.
- Mock is the default. No provider credentials are sent to the browser, planner context or scene graph. The optional provider exposes only mode/configuration/model status.
- The browser refuses planning/execution with unsaved or in-flight manual changes. During approved execution it holds the core read-only lease. Incoming graphs cannot replace local edits. Server-side version checks remain authoritative for other tabs/processes.
- Repeated approval of the same proposal returns its recorded state; it never executes again. Conflicting proposals cannot overwrite the first saved edit. An ambiguous network/save outcome is not automatically retried.
- Planning can be aborted and has a 45-second request deadline; live provider requests have a 30-second deadline. Rejection cancels a pending proposal; cancellation before queued execution prevents the mutation. A save already in progress may finish and is then inspected and reported. A failed notification is distinguished from a failed save. The feature deliberately has no interrupted multi-operation transaction to roll back.

## Provider configuration

No dependencies were installed or upgraded. The existing Zod and MCP SDK are reused. `apps/editor/lib/assistant-provider.ts` implements a server-side Responses HTTP adapter with one forced strict function tool, `parallel_tool_calls: false`, response parsing/validation, bounded output, timeout handling and `store: false`. The [official OpenAI function-calling guide](https://developers.openai.com/api/docs/guides/function-calling) was consulted for this API contract. No particular paid model is silently selected.

Default: leave `PASCAL_AI_PROVIDER` unset or set it to `mock`. To configure optional real planning, the operator must provide server-side `PASCAL_AI_PROVIDER=openai`, `PASCAL_AI_MODEL` for an available model supporting Responses strict function tools, and `OPENAI_API_KEY`. Keep them out of `NEXT_PUBLIC_*` variables and Git. Restart the editor after configuration. The UI requires consent to send the prompt and scene context before a live request. Model availability, account permissions and live response quality still require an explicitly authorized paid acceptance run; simulated provider tests do not establish those outcomes. A Codex subscription is not API billing configuration.

The Next runtime initially transformed the headless core store into a React client reference, producing `default.getState is not a function` before any edit. The supported `webpackIgnore` dynamic-import comment in `assistant-server.ts` now loads the built assistant in native Node. The installed Turbopack documentation confirms this preserves the import. Rebuild `packages/mcp` and restart the editor when changing this native runtime. A `serverExternalPackages` trial did not resolve the workspace case and was reverted; no unrelated Next configuration change remains.

## Executed verification

| Command/check | Observed result |
| --- | --- |
| `bun run build` in `packages/mcp` | Passed; built package exports resolve, including native Node loading |
| `bun test` in `packages/mcp` | 504 passed, 0 failed; 3,173 assertions across 71 files |
| `bun test lib/assistant-route.test.ts lib/assistant-provider.test.ts lib/assistant-scene-guard.test.ts lib/scene-signature.test.ts lib/api-put-empty-guard.test.ts` in `apps/editor` | 13 passed, 0 failed; 51 assertions |
| Focused three assistant app test files after the native import fix | 6 passed, 0 failed; 32 assertions |
| `bun x tsc --noEmit -p tsconfig.json` in `apps/editor` | Passed |
| Targeted Biome check on all 15 Stage 4 source/test files | Passed; final non-fixing run reported no fixes or diagnostics |
| `git diff --check` | Passed; Git reports normal LF/CRLF conversion notices |
| Running Next page and actual `/items/floor-lamp/model.glb` | HTTP 200; actual GLB response 3,836 bytes |
| Running assistant HTTP proposal/approval and read-only SQLite comparison | Passed; details below |

The nine service tests cover preview-without-save, light persistence, duplicate approvals, unknown assets, unsupported requests, ambiguous targets, invalid placement, unregistered raw tools, no-op changes, ownership, expiry, rejection, stale versions, cancellation, save failure, event failure after save, simultaneous proposals, independent-scene serialization, a late competing manual save, furniture movement/rotation/deletion, room movement and floor finish persistence. The app route tests cover same-origin/session/token boundaries, malformed direct execution, paid-call consent, actual preview/approve/replay and wrong-session approval. Provider tests use injected fake HTTP responses only.

The HTTP tests exposed Next's `127.0.0.1` → `localhost` URL normalization. The assistant guard now uses the incoming Host with the request protocol for the browser's origin, while preserving the existing authentication guard. Cross-origin requests remain rejected.

The root/global QA failures in the existing QA assessment have not been fixed or rerun as a clean release gate. A production/standalone deployment build and its native-package tracing have not been accepted in this stage. No deployment was performed.

## Disposable live review evidence

Unique evidence/database directory:

`C:\Users\HP\AppData\Local\Temp\pascal-stage4-review-7a60b7610cbd4f549b0e0509c7d9bda0`

Files: `environment.json`, `create-review.ts`, `initial.json`, `http-review.json`, `verify-http.ts`, `api-sqlite-check.json`, `verify-browser.ts`, `browser-final.json`, `verify-revisions.ts`, `browser-revisions.json`, and `pascal.db`. Checkpoint files were created uniquely; earlier references were not overwritten.

The test app is a source snapshot at `D:\PascalEditor\apps\.next-stage4-review-7a60b7610cbd4f549b0e0509c7d9bda0`, ignored by the existing `.next-*/` rule. It shares existing dependency/static-asset directories and uses a fresh database. Existing review servers/databases were not stopped or replaced. This is a disposable test harness, not a second product scene store or renderer.

Launch used in that app directory:

```powershell
$env:PASCAL_DB_PATH='C:\Users\HP\AppData\Local\Temp\pascal-stage4-review-7a60b7610cbd4f549b0e0509c7d9bda0\pascal.db'
$env:PASCAL_AI_PROVIDER='mock'
bun run dev -p 3006 -H 127.0.0.1
```

Scene `a3bd2c951555`, **Stage 4 Assistant Review**, contains 11 nodes, including catalog floor lamp `item_1zlpulm1fm36ljn6`, asset `floor-lamp`, at `[2, 0, 2]`. The initial saved version was 3 with SHA-256 `0c557061171e311c3f1e94b9addca387a57593aafc756d3575a2d367ee638fb9`. The test requested `set lamp color to #ffbb66` through the real HTTP assistant endpoint. Preview preserved the full graph and version. Approval saved version 4 with SHA-256 `cf94a6e1e1fde52befac0a29cdf20a31909578e3ca21758df34f086a6bc57854`.

Independent read-only SQLite inspection matched the saved API checkpoint exactly. Only the lamp node changed, solely its lighting color from `#ffffff` to `#ffbb66`; enabled remained false, intensity remained 2, other item fields and the room/root graph were preserved. No user project was used for a mutation test.

**Founder browser report:** at `http://127.0.0.1:3006/scene/a3bd2c951555`, the founder reported all requested checks passed: Assistant preview, approval, warm illumination/saved feedback, refresh, reopening and selectability. The browser-control surface inventory was empty, so this is founder visual evidence rather than an independent canvas capture.

The first post-report comparison expected the original position and an On lamp. It correctly stopped on a mismatch, preserving `browser-final.json` instead of changing the scene. Read-only revision inspection then found:

| Revision | Independently observed saved change | Graph SHA-256 |
| --- | --- | --- |
| 5 | Before the Assistant lighting edit, the browser saved position `[2.1704961907841724, 0, 1.9498963481784264]`, updated `supportSlabId`, and added its default `installedPlugins`. Only the item node changed; room nodes remained identical. | `be16d1f42029fcda03c2b012af1accb42227341a14fdab1f1fc90cce02828f68` |
| 6 | `configure_item_light` event: only the same lamp's `lighting.enabled` changed to true. Position, support, asset, scale and room were preserved. | `5dc2b7a65189e4ddfe63b19cf5ea41be118bb039773e08b4e158800499f8620f` |
| 7 | A second `configure_item_light` event changed only `lighting.enabled` back to false. The complete graph equals revision 5. API and SQLite agree at version 7. | `be16d1f42029fcda03c2b012af1accb42227341a14fdab1f1fc90cce02828f68` |

The founder confirmed: “Yes, those additional edits were intentional.” This resolves the earlier comparison mismatch: the initial manual move and later approved Off request were intentional, following the successful On refresh/reopen check. No restoration or further agent mutation was performed. The ordinary editor's plugin defaults are independently explained by `apps/editor/lib/bootstrap.ts`/host panel registrations and `applySceneGraphToEditor`, not attributed to the lighting tool. The existing viewer-readiness warning appeared during browser startup; the founder nevertheless reported successful rendering.

**Acceptance recheck, 2026-10-15:** a fresh saved API GET and read-only `bun:sqlite` query both retained scene `a3bd2c951555`, version 7, and the exact full graph/hash recorded above. The lamp remains intentionally Off, with intensity 2 and color `#ffbb66`; the accepted position, item identity, asset and room remain preserved. The new unique checkpoint is `acceptance-e02f511a-0d88-46a5-b08d-3428c13bdf44.json` in the evidence directory. Earlier mismatch and revision checkpoints remain intact. This closeout changed only documentation and added external evidence; no scene or application source was changed. `git diff --check` passed; the already-passing application tests were not unnecessarily repeated for documentation-only acceptance.

## Changed-file inventory and acceptance limits

Stage 4 changes:

- `packages/mcp/package.json`: built assistant and contract exports.
- `packages/mcp/src/assistant/{contracts,runtime,service,mock-planner,index}.ts` and `service.test.ts`.
- `apps/editor/components/scene-loader.tsx` and new `interior-assistant.tsx`.
- `apps/editor/app/api/scenes/[id]/assistant/route.ts`.
- `apps/editor/lib/assistant-{provider,server,scene-guard}.ts` and provider/route/scene-guard tests.
- This report and the existing master development register.

Pre-existing Stage 3C/3D changes, `.codex/config.toml`, the older review app, and historical reports remain in the working tree. No dependency change, commit, push, deployment or Codex MCP permission change was made.

**Stage 4 scoped acceptance is complete.** The customer can request, review and approve a real editable scene change inside Pascal using deterministic mock mode, with saved-state and founder-reported visual verification. Live paid-model, production deployment and repository-wide QA acceptance remain separate unverified work. Stop after Stage 4; automated style generation was not begun.
