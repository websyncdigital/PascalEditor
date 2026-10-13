# Stage 1: unmodified source baseline

> **Current status:** Stage 1B room-only restart PASS (founder-provided); ItemsPanel patch IMPLEMENTED; furniture runtime acceptance PENDING; Stage 2 NOT STARTED. Global lint and root test failures remain OPEN. Use the latest Stage 1C Phase A entry at the end and the six-group handoff in STAGE-1C-NAMED-SCENE-ITEMS.md. Earlier installation, missing-Items and import-workaround instructions below are preserved history, not current next actions.

## Historical initial attempt

Recorded 2026-10-02. **Setup BLOCKED; Stage 2 readiness NO.**

This records executed commands separately from proposed commands. No development server, browser test, MCP connection, or agent scene mutation was performed. The frozen installation failed, so dependent checks and startup were stopped.

## Verified baseline

| Field | Observed value |
| --- | --- |
| Repository root | `D:\Open_Source_Repository\Pascal Editor` |
| Branch | `mvp/stage-1-local-baseline` |
| HEAD | `ec0dcea440b02d326b31035ccdd4407332206b5f` |
| Initial working tree | Clean, including untracked files |
| Git | `2.43.0.windows.1` |
| Node.js | `v22.23.1` |
| Bun | `1.3.14`, binary `C:\Users\vivek\.bun\bin\bun.exe` |
| Bun PATH status | Not initially on this Codex session's PATH; process-local adjustment used |
| Port 3002 | No listening TCP socket at preflight |
| Database file and parent | Neither existed when inspected; neither created during this blocked run |

Root AGENTS.md and applicable nested instructions were inspected, including apps/editor/AGENTS.md and apps/ifc-converter/AGENTS.md. No applicable AGENTS.override.md was found. SETUP.md, workspace manifests, bun.lock metadata, bunfig files, turbo.json, CI workflows, and .env.example were inspected. Real .env contents were not read or displayed.

The root manifest and CI require Bun 1.3.14. The lockfile has lockfileVersion 1 / configVersion 0 and pins Next 16.3.0, Turbo 2.9.17 and dotenv-cli 11.0.0. No root trustedDependencies override was found.

## Installation and check results

Executed from the repository root:

```powershell
$env:Path = 'C:\Users\vivek\.bun\bin;' + $env:Path
bun install --frozen-lockfile
```

**Observed exit code: 1.** Relevant output:

```text
bun install v1.3.14 (0d9b296a)
Resolving dependencies
Resolved, downloaded and extracted [78]
error: moving "@babel/runtime" to cache dir failed
EPERM: Operation not permitted (NtSetInformationFile())
  From: .79dfad7fdbe9fef7-0000008A.runtime
    To: @babel/runtime@7.29.7@@@1
error: moving "next" to cache dir failed
EPERM: Operation not permitted (NtSetInformationFile())
  From: .9cdbad7e8fffeccc-00000016.next
    To: next@16.3.0@@@1
error: InstallFailed extracting tarball from @babel/runtime
error: InstallFailed extracting tarball from next
STAGE1_INSTALL_EXIT=1
```

No retry, cache deletion, privilege escalation, alternate package manager, lockfile regeneration, or trust change was attempted.

| Operation | Result | Exit code | Turbo cache |
| --- | --- | --- | --- |
| Preflight | PASS | Read-only probes completed | N/A |
| `bun install --frozen-lockfile` | FAIL; setup BLOCKED | 1 | N/A |
| `bun run check` | BLOCKED; not executed | N/A | N/A; Turbo not used by this script |
| `bun run check-types` | BLOCKED; not executed | N/A | Not run |
| `bun run test` | BLOCKED; not executed | N/A | Not run |
| Installed Next documentation review | BLOCKED; Next not installed successfully | N/A | N/A |
| Source development launch | NOT RUN; installation gate failed | N/A | Not run |
| Health/API/browser/save/refresh/restart | BLOCKED overall; every manual observation PENDING | N/A | N/A |

Script inspection found:

- Root `check` runs `biome check`, without `--write`. No fixing substitute is necessary.
- Root `check-types` runs `turbo run check-types`; prerequisites include dependency builds and dependency type checks. Editor app runs `next typegen && tsc --noEmit`; the editor package runs `tsgo --noEmit`. Generated types/build outputs are expected.
- Root `test` runs `turbo run test`, with dependency builds. Package test scripts use their declared Bun test scopes. Bare `bun test` must not replace the root command.
- Build scripts include TypeScript emission and `scripts/fix-node-esm-imports.ts`, which updates emitted dist files. They were inspected but not executed.
- IFC converter postinstall runs `scripts/copy-web-ifc-wasm.mjs` to copy three dependency WASM files into public assets. Completion of that hook was not established by the failed installation.
- Bun preload files point to `scripts/bun-preload-three.ts`, which resolves/imports React and Three. It does not install or write files.
- Bun's default trusted package list was inspected. The locked intersection found msgpackr-extract and sharp. Exact package metadata showed msgpackr-extract's native prebuild check/install helper; its inspected helper can fall back to node-gyp compilation. Sharp 0.35.3 has no install lifecycle entry in the inspected metadata. No broad trust command was used.

### Installation blocker: evidence and proposed remedy

The observed failure is a Windows filesystem/cache move denial during extraction, not a proven dependency-version or lockfile inconsistency. `C:\Users\vivek\.bun\install\cache` exists, is owned by the current user, and its ACL grants that user FullControl. That does not prove every child path is writable or unlocked.

**Inference only:** an open handle, security software interception, or child-path permissions could explain EPERM. Antivirus interference and Windows path-length problems have not been established.

Smallest next action: inspect Windows Security Protection History and open handles for the named Bun cache entries around the failed install. Identify and resolve a specific obstruction without deleting cache/data or disabling security controls. Then retry the SAME frozen command using Bun 1.3.14. If the failure repeats, preserve the exact error and obtain the affected child-path ACL/lock evidence before proposing a cache-location or permissions change. Such a change has not been made here.

## Launch configuration and script trace

Resolved, nonsecret intended configuration:

```text
PORT=3002
PASCAL_DB_PATH=C:\Users\vivek\AppData\Local\PascalSourceMVP\pascal.db
PASCAL_EDITOR_ORIGIN=http://localhost:3002
```

The database directory creation is deferred because installation blocked the workflow. Preserve any database that exists on the resumed run.

- `package.json:6`: root dev loads .env and .env.defaults with dotenv-cli, then runs `turbo run dev --env-mode=loose`.
- `turbo.json`: dev depends on `^build`, is persistent and uncached. First launch builds dependencies and creates generated outputs.
- `apps/editor/package.json:7`: editor dev loads ../../.env.local and ../../.env.defaults, then `next dev`.
- The partially installed `node_modules/dotenv-cli/cli.js` was read as text: override is enabled only by `-o`/`--override`. Neither dev script supplies it. Existing process variables therefore take precedence; loose Turbo mode forwards them. Runtime forwarding has not been exercised.
- The exact published Next 16.3.0 CLI source was inspected as text at https://unpkg.com/next@16.3.0/dist/bin/next because its local installation failed. It defines `--hostname`, `--port`, and PORT support; its default hostname is 0.0.0.0. This is supplemental version-specific evidence, not a completed installed-doc review.
- Read installed `apps/editor/node_modules/next/dist/docs/` (or the package's actual resolved location) after successful installation, as apps/editor/AGENTS.md requires. Verify Turbo argument forwarding and Next CLI help before releasing the launch block below for use. These checks remain pending.
- `apps/editor/app/scenes/page.tsx:9` and `app/scene/[id]/page.tsx:13` prefer NEXT_PUBLIC_APP_URL when set; otherwise they derive the origin from request headers. An existing nonlocal setting could redirect their server-side API fetches. Its value was not read. Investigate if the lists/routes do not match the local API; do not silently edit real environment files.

**Prepared launch block — HELD until installation, checks, installed-doc review, and argument-forwarding verification are complete. Not executed.**

```powershell
Set-Location -LiteralPath 'D:\Open_Source_Repository\Pascal Editor'
$env:Path = 'C:\Users\vivek\.bun\bin;' + $env:Path
if ((& bun --version) -ne '1.3.14') { throw 'Bun 1.3.14 is required.' }
if (Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Port 3002 is occupied. Do not terminate its owner or use a fallback port.'
}
$env:PORT = '3002'
$env:PASCAL_DB_PATH = 'C:\Users\vivek\AppData\Local\PascalSourceMVP\pascal.db'
$env:PASCAL_EDITOR_ORIGIN = 'http://localhost:3002'
$taskDbDirectory = Split-Path -Parent $env:PASCAL_DB_PATH
if (-not (Test-Path -LiteralPath $taskDbDirectory)) {
    New-Item -ItemType Directory -Path $taskDbDirectory -ErrorAction Stop | Out-Null
}
bun run dev --filter=./apps/editor -- --hostname 127.0.0.1 --port 3002
```

The intended binding is IPv4 loopback 127.0.0.1:3002. The additional arguments are intended for the editor dev task through Turbo's argument separator; their end-to-end forwarding is still unverified. Keep the server in this dedicated foreground terminal. Confirm its printed address/port and stop this server with Ctrl+C if they differ. Do not run `npx @pascal-app/cli editor`, MCP connect commands, or the unfiltered root dev script as substitutes.

## API checks prepared for a second terminal

Only run after an approved source launch is actually ready. These are read-only and were NOT executed:

```powershell
$taskOrigin = 'http://localhost:3002'
Invoke-RestMethod "$taskOrigin/api/health" |
    Select-Object status, app, timestamp
$taskList = Invoke-RestMethod "$taskOrigin/api/scenes?limit=5"
$taskList.scenes | Select-Object id, name, version, nodeCount, updatedAt

# After a scene exists, paste its actual ID from /scene/<id>.
$taskSceneId = Read-Host 'Actual scene ID'
$taskSceneUrl = "$taskOrigin/api/scenes/$([Uri]::EscapeDataString($taskSceneId))"
$taskScene = Invoke-RestMethod $taskSceneUrl
$taskScene | Select-Object id, name, version, nodeCount, updatedAt
$taskScene.graph.nodes.PSObject.Properties.Value |
    Where-Object { $_.type -eq 'item' } |
    Select-Object id, parentId, position, rotation, scale, asset |
    ConvertTo-Json -Depth 12
```

The list response is `{ scenes: [...] }`; the single-scene response is the top-level scene metadata plus `graph`, whose `nodes` is an ID-keyed object. It is not a `{ scene: ... }` envelope. Evidence: `apps/editor/app/api/scenes/route.ts:31`, `app/api/scenes/[id]/route.ts:41`, and `packages/mcp/src/storage/types.ts:8,36`.

For exact saved-item comparison, keep the second terminal open through browser refresh and server restart:

```powershell
$taskItemId = Read-Host 'Actual furniture item node ID from the API output'
function Get-Stage1ItemSnapshot {
    $taskStoredScene = Invoke-RestMethod $taskSceneUrl
    if ($taskStoredScene.id -ne $taskSceneId) { throw 'Wrong scene returned.' }
    $taskItemProperty = $taskStoredScene.graph.nodes.PSObject.Properties[$taskItemId]
    if (-not $taskItemProperty -or $taskItemProperty.Value.type -ne 'item') {
        throw 'Expected furniture item missing.'
    }
    $taskItemProperty.Value |
        Select-Object id, parentId, position, rotation, scale, asset |
        ConvertTo-Json -Depth 12 -Compress
}
# Run only after the intended manual edit has been saved and verified.
$taskSavedItem = Get-Stage1ItemSnapshot
$taskSavedItem
# Repeat after refresh, then again after Ctrl+C/relaunch of the same server:
if ((Get-Stage1ItemSnapshot) -cne $taskSavedItem) {
    throw 'Saved furniture/pose differs from the captured baseline.'
}
```

A 200 health response proves neither renderer success nor SQLite persistence. API comparisons supplement visual confirmation; do not substitute for it.

## Manual checklist and source-discovered gates

All visual outcomes remain PENDING. The full requested UI-only flow cannot yet be handed off as verified on this revision:

1. Open `http://localhost:3002/scenes`. The actual button is **Create new scene**. `CreateSceneButton` at `apps/editor/components/save-button.tsx:22,34` posts an empty graph with the hard-coded name **Untitled scene**, then navigates to `/scene/<id>`. It offers no naming prompt. The `SaveButton`/Save-as component in that file is defined but no mounting call was found in the app. Thus creating the exact requested name **MVP-Stage1-Manual-Baseline** through this UI is a source-discovered gap. The API implements metadata rename, but no rename or creation request was performed here and no API mutation workaround is prescribed for this stage.
2. Record the actual `/scene/<id>` URL. Do not switch to `/` and assume it is the same persisted project. The root editor has a separate browser-local fallback save path.
3. For a simple room, the verified source controls are **Build → Rooms → Rectangle**. The caption says to click two corners on the grid; walls, floor and ceiling are created together. Evidence: `apps/editor/components/build-tab.tsx`, `packages/editor/src/components/ui/build-panel/build-panel.tsx`, and `packages/editor/src/lib/wall-draw-variant.ts:26`. Actual successful room creation is PENDING.
4. Furniture selection is another gate: `apps/editor/components/scene-loader.tsx:36` configures **Scene, Build, Settings**, omitting the **Items** tab mounted by `apps/editor/app/page.tsx:59`. Editor v2 renders supplied/registered host tabs (`packages/editor/src/components/editor/index.tsx:1626`). The app bootstrap registers external plugin panels, but no ordinary ItemsPanel registration was found there. Runtime availability of an alternate plugin catalog is unverified. The command palette's **Item Tool** only arms placement; `packages/nodes/src/item/tool.tsx` returns null without a selected catalog asset. Do not count that as a working picker.
5. Once a verified existing furniture picker is available in the SAME named scene, the catalog contains **Bedside Table** / **Double Bed** entries (`catalog-items.tsx:420,984`). Their model URLs are external; a thumbnail or the presence of public model files does not prove a model loaded. Require an actual rendered model and successful model loading without missing-model/placeholder warnings. Do not replace assets or insert scene data through an agent workaround.
6. With an actual item selected, the inspector has **Position** controls in metres and **Rotation** with Y rotation and **-45°/+45°** buttons (`packages/nodes/src/item/panel.tsx:108,159`). Move X or Z slightly and rotate once, recording the before/after values. API position is parent-local; rotation is stored in radians although the inspector displays degrees.
7. Press **Ctrl+S** while the editor is focused and wait for the scene PUT to complete successfully. The shortcut is implemented by `packages/editor/src/hooks/use-save-shortcut.ts`; autosave also exists. Named scenes call `SceneLoader.handleSave`, PUT `/api/scenes/<id>` with `If-Match` (`scene-loader.tsx:128,153`). Check for save/conflict banners and verify the stored item through the GET above; a generic save indication is insufficient because handleSave can return after recording an error.
8. Refresh the same `/scene/<id>`. Confirm the same model, item ID, position, and rotation visually and in the GET response.
9. Stop only this server with Ctrl+C in its dedicated terminal. Relaunch with the identical launch block and database path. Reopen the exact same scene URL. Repeat the visual and API comparison.

Do not assume all nine steps are executable until the naming/catalog gates are resolved. A narrowly scoped future remediation could expose the already-existing ItemsPanel on the named-scene host and supply a real name-entry/rename flow; that would be a source change requiring a separately authorized task and a revised baseline. It was not implemented.

Use one browser tab and no concurrent writers during verification. SceneLoader uses an If-Match version for saves, but incoming SSE snapshots can replace the browser graph and clear history (`scene-loader.tsx:199`; `packages/editor/src/lib/scene.ts:407,428`). Do not assume atomic batches, shared browser/MCP history, or conflict-free concurrent editing.

Founder report-back, after the gates permit testing: scene URL/ID and server-side name; furniture item ID and asset ID/source; before/after pose; screenshot showing the real asset; save/refresh/restart outcomes; health/list/item API results; startup and browser errors with secrets redacted. User-reported visual outcomes must remain labelled as user-reported.

## Persistence evidence

`apps/editor/app/scene/[id]/page.tsx` loads the scene by exact ID and hands graph/metadata to SceneLoader. `apps/editor/lib/scene-store-server.ts` creates a singleton using process.env. `packages/mcp/src/storage/index.ts` selects SqliteSceneStore. Its path resolver honors PASCAL_DB_PATH (`sqlite-scene-store.ts:97`), creates the parent directory non-destructively when needed (`:607`), and derives editor URLs using PASCAL_EDITOR_ORIGIN (`:158`). No database was opened in this run. The ordinary `/` localStorage save path (`packages/editor/src/lib/scene.ts:433`) is not proof of named-scene SQLite persistence.

## Change inventory and next action

- Intentional file added: **docs/mvp/STAGE-1-BASELINE.md** only.
- Application/package source, manifests, bun.lock, framework configuration, AGENTS.md and real environment files: unchanged in the post-install Git inspection.
- Partial ignored node_modules and Bun cache contents were created by the failed installer and left in place. They are not a successful installation.
- No tracked generated changes were observed. No build, test, database, server, browser automation, or MCP execution occurred.
- Final expected Git inventory: this report is untracked; `git diff --stat` is empty because there are no tracked modifications. The final commands must verify this inventory.

**Exact next action:** investigate the two cache-move EPERM failures, then resume with the same `bun install --frozen-lockfile`. After a successful install, read installed Next docs, run `bun run check`, `bun run check-types`, and `bun run test` with actual exit/cache results, verify the launch argument chain, and reassess the named-scene UI gaps before releasing manual verification.

**Stage 2 readiness: NO.** Gates outstanding: successful frozen installation; executed baseline checks; verified source launch; real furniture/manual-edit/save/refresh/restart proof in one exact SQLite scene; and the naming/catalog workflow gaps. Only a future stage may connect a source-built MCP server to that exact absolute database and saved scene ID and test guarded furniture movement with manual editing paused.

## Resumed verification — current handoff

This section supersedes the initial attempt's status and proposed next actions. No installation was rerun. No source/configuration fixes, agent connection, browser automation, or development server startup were performed. The actual dev command was exercised only with Next's terminating `--help` option. Automated package tests exercised their own test fixtures; that is not a connection to a founder scene.

### Successful installation evidence supplied by the founder

The founder reported running the guarded command in an ordinary VS Code PowerShell terminal, outside Codex command execution:

```text
bun install --frozen-lockfile
bun install v1.3.14 (0d9b296a)
2 packages installed [75.86s]
INSTALL_EXIT_CODE=0
LOCKFILE_UNCHANGED=True
```

The reported cache was `C:\Users\vivek\.bun\install\cache`; the reported final status contained only this baseline report. Installation status is **PASS, founder-provided evidence**, corroborated below by dependency resolution and successful prerequisite builds. The old EPERM root cause remains unknown. No cache retry, cleanup, dependency deletion, permissions change, branch creation, or further EPERM investigation was performed during this continuation.

### Current checkout and dependency verification

Directly verified again:

- Root: `D:\Open_Source_Repository\Pascal Editor`.
- Branch: `mvp/stage-1-local-baseline`.
- HEAD: `ec0dcea440b02d326b31035ccdd4407332206b5f`.
- Node `v22.23.1`; Bun `1.3.14`. Used `C:\Users\vivek\.bun\bin` in process-local PATH only.
- Git initially and after checks reported only `?? docs/mvp/STAGE-1-BASELINE.md`; no unrelated edits were found. `git diff --exit-code -- bun.lock` returned 0.
- Applicable AGENTS files and this entire pre-existing report were read. No ancestor or applicable override instructions were found. No existing installation-recovery report was found; none was invented.

Resolution used Node `createRequire` anchored at the owning workspace's package.json, rather than assuming root resolution:

| Owner / dependency | Result |
| --- | --- |
| apps/editor: Next.js | PASS, 16.3.0; resolved hoisted package and executable |
| apps/editor: @babel/runtime | PASS, 7.29.7; package metadata and helpers/extends resolve |
| apps/editor: core, viewer, nodes, MCP | Initially missing only generated dist entry points; after prerequisite builds all resolve to local packages/*/dist |
| apps/editor: editor package | PASS, resolves to packages/editor/src/index.tsx by its declared source export |
| apps/editor: installed plugin dependencies | PASS for Mint, Bones, Environment, Pool, Streetscape, Trees, and WebXR entry points |
| apps/editor: Three and Windows Next SWC | PASS; actual Three entry and next-swc.win32-x64-msvc.node resolve |
| core: TypeScript / Zod | PASS, TypeScript 6.0.3 / Zod 4.5.4 |
| editor and IFC app TypeScript | PASS, workspace-owned TypeScript 7.0.2; React/Node type packages resolve |
| editor package native TS compiler | PASS, @typescript/native-preview 7.0.0-dev.20260624.1 |
| root verification tools | PASS, Biome 2.4.16, Turbo 2.9.17, dotenv-cli 11.0.0 |

One initial metadata probe of `three/package.json` returned ERR_PACKAGE_PATH_NOT_EXPORTED. The subsequent actual `three` entry resolved successfully; this was an exports restriction, not a missing dependency. Package-entry resolution does not prove browser asset loading or plugin runtime behavior.

Installed Next documentation is present at `node_modules/next/dist/docs/`, reached by resolving Next from apps/editor. Relevant installation requirements, CLI dev/typegen options, environment precedence, and TypeScript guidance were read. In particular:

- `01-app/03-api-reference/06-cli/next.md` documents hostname/port and independent route type generation.
- `01-app/02-guides/environment-variables.md` gives process.env first priority.
- `01-app/03-api-reference/05-config/02-typescript.md` describes TypeScript 7 CLI checking.
- Installed `dist/lib/typescript/writeConfigurationDefaults.js` returns before automatic config rewriting for tsconfigs with extends/references; both apps have those. Route type generation completed without tracked configuration changes.
- Installed `dist/server/lib/generate-agent-files.js` reports the editor's agent rules already current. No AGENTS changes were made.

### Executed baseline checks

All commands below ran from the root with Bun 1.3.14 on process-local PATH. Root/downstream scripts, preloads, configs, and emitted-import rewrite scripts were inspected first. No fixing flags, replacement tools, source edits, or weakened checks were used.

| Exact command | Result | Exit | Execution/cache evidence |
| --- | --- | --- | --- |
| `bun run check` | FAIL | 1 | Biome executed; no fixes applied; no Turbo cache |
| `bun run check --reporter=summary` | FAIL, diagnostic follow-up | 1 | Same check, alternate reporting only; 3002 files checked, 3002 errors, 7 infos; no fixes applied |
| `bun run check-types` | PASS | 0 | 11 successful / 11 tasks; 0 cached; 2m29.247s |
| `bun run test` | FAIL | 1 | 5 successful / 13 tasks, all 5 successes cached prerequisite builds; test tasks were cache misses; stopped after IFC test task failure; 16.437s |
| `bun run build --filter=@pascal-app/nodes --filter=@pascal-app/mcp` | PASS, launch prerequisites | 0 | 4 successful / 4 tasks, all cached from the executed typecheck prerequisites |
| `bun run dev --filter=./apps/editor --only -- --hostname 127.0.0.1 --port 3002 --help` | PASS, CLI forwarding only | 0 | Only editor#dev ran; cache bypass; Next printed help and exited; no server started |

`check-types` executed core, CLI, editor package, UI package, editor app, and IFC app checks, plus core/viewer/MCP/nodes/IFC dependency builds. The app checks performed `next typegen && tsc --noEmit`. This is actual type-check evidence, not an inference from a build. `next.config.ts` still has its pre-existing ignoreBuildErrors setting; it was not changed or used to substitute for the separate checks.

The initial verbose Biome output was large, so the installed tool's supported summary reporter was used to capture the diagnostic totals. It still exited 1. Representative formatting diagnostics show CRLF being replaced by LF. `git ls-files --eol` reports `i/lf w/crlf` for biome.jsonc, package manifests, and the IFC fixture; read-only `git config --get core.autocrlf` returned true. This verifies a checkout line-ending contribution, not that every formatting error has been individually proven to have that sole cause. The 7 informational diagnostics concern useExhaustiveDependencies in procedural-item/renderer.tsx and viewer interactive-system.tsx. No normalization or Git configuration change was made.

The root test command stopped on the first completed failing package, so it is not evidence that the other suites completed or passed. Logs contain these six observed failures before cancellation:

| Test location | Observed failure | Interpretation / limit |
| --- | --- | --- |
| packages/cli/src/diagnostics.test.ts:68 | `(stat.mode & 0o077)` expected 0, received 54 | POSIX permission-bit assertion on Windows; does not itself establish a Windows ACL vulnerability |
| packages/cli/src/mcp-service.test.ts:45 | Same 0 versus 54 mode assertion for the test token | Same platform-dependent assertion; no production MCP scene connection was made |
| packages/core/src/lib/polygon-boolean.test.ts:175 | Expected one warning call, received zero | Failed assertion; cause not established. Caller filtering uses slash-sensitive stack strings, but that was not independently proven to cause this result |
| packages/core/src/lib/structure-reconcile.test.ts:407 | BadPathName opening `/D:/Open_Source_Repository/Pascal%20Editor/packages/core/src/utils` | Test passes URL.pathname to Bun.build; the malformed Windows/encoded-space path is directly visible in the error and source |
| packages/ifc-converter/tests/beams.test.ts:199 | Missing mapped beam leads to undefined node.parentId at helper line 57 | Fixture contains CRLF; test's exact `ENDSEC;\nEND-ISO` replacement needle is absent. This matching failure was confirmed in memory without modifying the fixture |
| packages/ifc-converter/tests/beams.test.ts:212 | Expected null parentId, received a level ID | Test's `/^#42=.*\n/m` removal does not match this CRLF fixture; the #42 line remains. Confirmed by read-only string inspection |

IFC's completed suite reported **43 pass, 2 fail, 45 tests across 8 files**. Turbo then cancelled unfinished work. CLI/core already had the failures above; editor/viewer/nodes/MCP test suites must not be called passing merely because their log excerpts include passing tests. Generated detailed logs remain under the relevant workspace `.turbo/turbo-test.log` paths. No broad rerun, source repair, or failure suppression was attempted.

### Verified launch preparation

The original combined command is superseded. Its Turbo dry-run output listed the Next-only CLI arguments on dependency build tasks. The current handoff separates prerequisites from an editor-only invocation:

1. `bun run build --filter=@pascal-app/nodes --filter=@pascal-app/mcp` selects the actual core/viewer/nodes/MCP builds through the declared dependency graph. Its dry-run shows empty CLI argument arrays on those builds and no editor-app production build; its real run succeeded using four cached build results.
2. `bun run dev --filter=./apps/editor --only -- --hostname 127.0.0.1 --port 3002` has a dry-run containing only editor#dev. A real invocation with final `--help` reached exactly `next dev --hostname 127.0.0.1 --port 3002 --help` and exited 0. Next-only arguments cannot reach dependency builds in this split plan. `--only` is used only after the required builds; it does not bypass baseline quality checks.

Both dotenv layers were inspected and a no-server subprocess probe exercised them plus installed @next/env with the three intended launch variables. All three survived unchanged; the probe exited 0. Turbo's installed help and dry-run verify that the root dev script uses loose environment mode. Existing process values take precedence over dotenv/Next environment files because no override flag is supplied. The scene-page origin compatibility probe also returned true without printing any unrelated variable values.

LOCALAPPDATA resolves to the intended database location. Its absent parent directory was created non-destructively during this continuation. The database file still did not exist afterward. Port 3002 was free at the latest check. Recheck both conditions at launch; never remove an existing database.

Run this in a dedicated VS Code PowerShell terminal. This is the **current verified command handoff**, not a claim that the server has already run:

```powershell
Set-Location -LiteralPath 'D:\Open_Source_Repository\Pascal Editor'
$env:Path = 'C:\Users\vivek\.bun\bin;' + $env:Path
if ((& bun --version) -ne '1.3.14') { throw 'Bun 1.3.14 is required.' }
if ((Join-Path $env:LOCALAPPDATA 'PascalSourceMVP\pascal.db') -ne 'C:\Users\vivek\AppData\Local\PascalSourceMVP\pascal.db') {
    throw 'LOCALAPPDATA does not match the verified database location.'
}
if (Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Port 3002 is occupied. Do not kill its owner or switch ports.'
}
$env:PORT = '3002'
$env:PASCAL_DB_PATH = 'C:\Users\vivek\AppData\Local\PascalSourceMVP\pascal.db'
$env:PASCAL_EDITOR_ORIGIN = 'http://localhost:3002'
$taskDbDirectory = Split-Path -Parent $env:PASCAL_DB_PATH
if (-not (Test-Path -LiteralPath $taskDbDirectory)) {
    New-Item -ItemType Directory -Path $taskDbDirectory -ErrorAction Stop | Out-Null
}
bun run build --filter=@pascal-app/nodes --filter=@pascal-app/mcp
if ($LASTEXITCODE -ne 0) { throw 'Prerequisite builds failed; server was not started.' }
bun run dev --filter=./apps/editor --only -- --hostname 127.0.0.1 --port 3002
```

The server should bind only to IPv4 loopback 127.0.0.1:3002. The installed Next CLI accepts both options. `node_modules/next/dist/cli/next-dev.js:213` allows port retry only when portSource is default; an explicit --port disables that fallback. Keep this terminal foreground-owned and stop only this server using Ctrl+C. The block uses the existing source workspace, not a downloaded Pascal CLI runtime. Generated dist, .next, type, tsbuildinfo and Turbo cache/log outputs are expected. The non-fixing baseline failures remain open even if the browser smoke test succeeds.

### Revised manual tests: A–D

| Test | Current state |
| --- | --- |
| A. Server starts on the exact loopback port | PENDING; only CLI help was executed |
| B. Named scene and room render | PENDING |
| C. Room save, refresh, restart persistence | PENDING |
| D. Real furniture insertion and pose persistence | Direct named-scene picker BLOCKED by missing Items tab; supported whole-scene import exists in source but is unexercised. No furniture result has passed |

The founder now accepts **Untitled scene**. No naming feature is needed or proposed.

**A — server and APIs.** Run the launch block, wait for Next's ready message, and use this second-terminal block. A health response is not a rendering or persistence test:

```powershell
$taskOrigin = 'http://localhost:3002'
Invoke-RestMethod "$taskOrigin/api/health" |
    Select-Object status, app, timestamp
$taskList = Invoke-RestMethod "$taskOrigin/api/scenes?limit=5"
$taskList.scenes | Select-Object id, name, version, nodeCount, updatedAt
```

The health response has status/app/timestamp (plus optional runtime metadata). The list is `{ scenes: [...] }`, verified at `apps/editor/app/api/scenes/route.ts:48`. Do not interpret an empty list as a failed renderer.

**B — actual room.** Open `http://localhost:3002/scenes`, click **Create new scene**, and record the exact `/scene/<actual-id>` URL. The button creates a fresh Untitled scene (`apps/editor/components/save-button.tsx:22,34`). Use **Build → Rooms → Rectangle**, then click two corners on the grid. The source caption specifies walls, floor and ceiling together (`packages/editor/src/lib/wall-draw-variant.ts:26`; `build-panel/build-panel.tsx:212`). Confirm a room actually renders and remains selectable/editable. Do not switch to `/` and treat its localStorage scene as the named server scene.

**C — room persistence.** Press Ctrl+S with the editor focused. Wait for its PUT `/api/scenes/<id>` to succeed and check for save/conflict banners. Ctrl+S is wired at `packages/editor/src/components/editor/index.tsx:1381`; named-scene saves use SceneLoader.handleSave with If-Match (`apps/editor/components/scene-loader.tsx:128,153`). **Save build** is a file export, not the server-save command.

Capture the saved server graph in the second terminal without writing a file:

```powershell
$taskSceneId = Read-Host 'Paste the actual ID from /scene/<id>'
$taskSceneUrl = "$taskOrigin/api/scenes/$([Uri]::EscapeDataString($taskSceneId))"
$taskSavedScene = Invoke-RestMethod $taskSceneUrl
if ($taskSavedScene.id -ne $taskSceneId) { throw 'Wrong scene returned.' }
$taskSavedScene | Select-Object id, name, version, nodeCount, updatedAt, graphHash
$taskSavedScene.graph.nodes.PSObject.Properties.Value |
    Group-Object type | Select-Object Name, Count
$taskSavedGraph = $taskSavedScene.graph | ConvertTo-Json -Depth 100 -Compress
```

Verify that this graph contains the actual authored room nodes, not just default site/building/level nodes. Refresh the same browser URL and confirm the room visually. Then fetch it again and compare the stored graph; investigate any mismatch instead of declaring success:

```powershell
$taskReloadedScene = Invoke-RestMethod $taskSceneUrl
if ($taskReloadedScene.id -ne $taskSceneId) { throw 'Wrong scene returned.' }
$taskReloadedGraph = $taskReloadedScene.graph | ConvertTo-Json -Depth 100 -Compress
[pscustomobject]@{
    SceneId = $taskReloadedScene.id
    Version = $taskReloadedScene.version
    ExactGraphMatches = ($taskReloadedGraph -ceq $taskSavedGraph)
}
```

Keep the second terminal open. Ctrl+C only the foreground server, rerun the identical launch block, reopen the same scene URL, and repeat the visual and graph comparison. JSON ordering can affect a textual comparison, so a false result requires inspecting the actual node data; matching node counts alone are insufficient. A preserved pose/room must survive the server restart using the same absolute database path.

**D — furniture route findings and optional UI import.** The direct gap is verified: named SceneLoader's tabs omit Items, while `apps/editor/app/page.tsx:22,59` wraps the already-existing ItemsPanel. Item Tool cannot select an asset by itself (`packages/nodes/src/item/tool.tsx`). Mint is an opt-in external-service panel, not a verified built-in furniture-picker substitute.

There ARE existing scene-import routes:

- **Settings → Save and load → Save build / Load build**, implemented at `packages/editor/src/components/ui/sidebar/panels/settings-panel/index.tsx:539,555,599,1121`. Load validates a file through validateBuildJson, then its dialog offers **Replace current scene**. This replaces the graph, resets selection/history, and retains the enclosing named scene's existing save callback; it is not an additive item importer.
- `/import?src=...` validates a hosted Pascal build and offers **Import as a new scene** (`apps/editor/app/import/import-client.tsx:102,226`). It needs a real reachable build URL; no URL, remote hosting, or raw seed file was fabricated for this task.

An optional no-source-change furniture test can use a genuine file exported by Pascal's UI. A preference question about this route was sent during work; no import was executed. If using it, preserve the room and scene ID as follows:

1. Complete C first. With manual editing paused, export that named scene via **Settings → Save and load → Save build** and retain this original export.
2. In a fresh private browser window, open `/` so existing normal-profile browser-local work is left untouched. Use **Load build** to load the original Pascal-exported room into this private canvas. Review and confirm replacement only of this fresh private canvas.
3. Use **Items → Furniture**, search for an ordinary catalog item such as **Double Bed**, select it, and click the room floor to place it. Require the real rendered model and successful asset loading. A thumbnail, bounding box or missing-model fallback does not pass.
4. Use **Save build** to export the UI-authored scene containing the furniture. Do not hand-write, edit, or seed raw scene JSON. Do not overwrite the retained original export.
5. Return to the original named `/scene/<id>` with no intervening edits. Use **Load build** with the furniture export, review it, and confirm **Replace current scene**. If the named scene has changed in the meantime, stop rather than overwrite it. This import replaces the whole graph and clears browser undo history.
6. Select the real item in the named scene, change its **Position** and **Rotation** controls, then Ctrl+S. Position controls use metres; Y rotation is displayed in degrees and stored in radians (`packages/nodes/src/item/panel.tsx:108,159`). This manual edit after import exercises the named scene save callback.
7. Read `/api/scenes/<id>` and extract item nodes from the top-level `graph.nodes` object using the previously documented item GET/snapshot blocks. Record the actual item node ID, asset identity/source, parentId, position, rotation and scale. Repeat the visible and API checks after refresh and foreground-server restart.

This is a source-verified export/import route, not an observed end-to-end success. If that whole-scene workflow is unsuitable, D remains BLOCKED for direct insertion. The smallest proposed source change is to reuse the existing ItemsPanel wrapper/tab from app/page.tsx in SceneLoader's sidebar configuration, keeping onLoad/onSave, scene ID, API routes and SQLite persistence unchanged. No such change was implemented; no naming feature is needed.

Use one active editor for the named scene while saving/importing. Do not assume If-Match protects a full graph replacement against all intervening edits: incoming SSE snapshots can also replace local state. Do not connect MCP for this test.

Founder report-back: A/B/C/D outcomes separately; exact scene URL/ID; room screenshot; actual furniture item ID and asset/pose when D is attempted; successful save evidence; refresh and restart visual/API comparisons; startup/browser errors with secrets redacted. Any founder-reported browser behavior will be recorded as such, not as directly observed by Codex.

### Final inventory and readiness

- Intentional repository change remains this one untracked baseline report, now updated while preserving its original history.
- Generated dist, next-env/type files, tsbuildinfo and Turbo outputs were created by declared checks/builds. No tracked generated changes were observed; tracked source/manifests/bun.lock/AGENTS/configuration remain unchanged.
- Created `C:\Users\vivek\AppData\Local\PascalSourceMVP` only because absent. No database file was created or existing data removed.
- No application server was started. No scene was created or mutated by the agent. No production MCP/AI integration occurred.
- Final Git commands: `git diff --stat` (no tracked diff) and `git status --short --untracked-files=all` (expected report only).

**Next action:** the founder can run the verified foreground launch block and report A–C separately. D can use the optional genuine UI export/import workflow above or await a separately authorized minimal catalog-tab change. Baseline lint/test failures remain unresolved and require a separate remediation decision; no further installation recovery is needed on the current evidence.

**Stage 2 remains NOT READY** until the relevant baseline checks and named-scene real-furniture save/refresh/restart evidence are satisfactory. Stop before MCP connection, AI scene edits, or MVP feature work.

## Stage 1B completed / Stage 1C implemented — 2026-10-02

This appended update supersedes the earlier pending room-only runtime gate and
the missing-Items/import-workaround handoff, while preserving all history above.

**Stage 1B room-only controlled restart smoke test: PASS — founder-provided
evidence.** The founder reported `SERVER_STOP_CONFIRMED=True`, scene
`b34a488e561b`, `SameScene=True`, `SameGraphAsRecorded=True`,
`SameNodeCount=True`, recorded/current version 45/45 and node count 24.
The founder's reopened-scene screenshot shows rooms with wall/floor materials
and no visible red hydration-error badge. Codex did not operate the browser
and did not request a repetition of this completed test.

Reference graphHash:
`4a01e6decf5c0a676b9ba9ee28a68646595c9c2382c15a1a86dfe3e489d2fe7a`.
Counts: site 1, building 1, level 1, zone 3, slab 3, ceiling 3, wall 12;
no item nodes.

**Stage 1C ItemsPanel patch: IMPLEMENTED.** The only production edit is
`apps/editor/components/scene-loader.tsx`: import ItemsPanel/Package, reuse
the root editor's ItemsPanel wrapper and items tab between Build and Settings.
The 22-insertion/1-deletion diff retains Scene, Build, Settings, plugin panels,
the Build default, and all scene/persistence wiring. The named scene can now
use its own existing catalog; the historical whole-scene import workaround is
not the handoff for this stage. No naming change is required.

Preflight confirmed branch `mvp/stage-1-local-baseline`, HEAD
`ec0dcea440b02d326b31035ccdd4407332206b5f`, Bun 1.3.14, Node v22.23.1,
Next 16.3.0 and initially only this untracked report. Applicable AGENTS,
installed Next client/Fast Refresh guidance, actual previous test logs and
relevant test source were read. None of the six prior failures establishes a
concrete ordinary catalog insertion/save/load integrity blocker. Those failures
and incomplete global coverage remain open; no unrelated repair or skip was made.

Executed checks:

- `bun run check-types`: exit 0; 11/11 tasks successful, 10 cached; the editor
  app freshly executed next typegen + tsc.
- `bun run check apps/editor/components/scene-loader.tsx`: initially exit 1
  for CRLF formatting. `bun run format apps/editor/components/scene-loader.tsx`
  exited 0; the scoped check then exited 0. Only this TSX was formatted.
- App API graph/schema/signature/empty-save tests: exit 0, 32 passed.
- SQLite storage save/reopen/version/conflict tests: exit 0, 19 passed
  (two pre-existing Unix-specific path cases return early on Windows).
- Editor catalog selection, draft/history and scene selection tests:
  exit 0, 18 passed; browser-storage/act/THREE.Clock warnings recorded.
- Static TypeScript AST audit: exit 0; unique host IDs, retained tab objects,
  Items/root equivalence and the complete SceneLoader function unchanged.
  This is static verification, not a browser interaction test.
- Handoff PowerShell: all eight blocks parsed, setup GET/checkpoint comparison
  and JSON ordering/array/missing-item guards passed, exit 0.
- Scoped tests used existing Bun tooling and disposable test storage/in-memory
  state. No test used the founder database. Full commands and limits are in the
  Stage 1C report.

Global status remains `check` FAIL (3,002 errors, 7 infos) and `test` FAIL
(six observed failures across CLI/core/IFC; remaining suites cancelled).
No global rerun, reinstall, layout.tsx edit or hydration-warning suppression.

**Scene-response checkpoint CREATED** outside Git:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-before-20261002T141055039Z-426107c7.json`.
This is not a complete database backup. Before/after GETs matched scene
`b34a488e561b`, version 45, count 24, the reference hash and full graph;
item count stayed zero. No scene/database writes, live SQLite copies, restores,
server start/stop, port changes, commits/pushes, or AI/MCP features.

Use [STAGE-1C-NAMED-SCENE-ITEMS.md](STAGE-1C-NAMED-SCENE-ITEMS.md) for exact
UI steps, guarded read-only PowerShell comparisons and the unchanged founder-owned
restart contract. Reopen the same scene on the running server, place one ordinary
real catalog chair/table/sofa, move/rotate/save, capture a NEW furnished reference,
then check refresh and the controlled furniture restart before browser reopen.
The old 24-node hash must change on insertion; original room nodes/materials
must remain, allowing the parent to gain the item child.

**Furniture runtime acceptance PENDING. Stage 2 NOT STARTED.**
Real mesh/material loading and furnished-scene save/refresh/restart require
actual runtime evidence; tests and an Items tab do not establish those results.


## Stage 1C Phase A read-only handoff verification — 2026-10-02

**Furniture runtime acceptance PENDING. Stage 2 NOT STARTED.**
The completed Stage 1B room-only restart remains PASS, founder-provided.
The existing ItemsPanel patch was inspected, not implemented again.
Branch/HEAD remain `mvp/stage-1-local-baseline` /
`ec0dcea440b02d326b31035ccdd4407332206b5f`.
Expected inventory: modified `apps/editor/components/scene-loader.tsx`
(22 additions / 1 deletion), plus these two untracked MVP reports.
No unexplained source changes were found.

The exact scene GET is available and a listener was observed at
127.0.0.1:3002. Saved scene `b34a488e561b`, "Untitled scene", remains version 45,
24 nodes and zero items, matching the original graphHash and semantic graph.
The existing DB and original room checkpoint are present. No server lifecycle
action, scene/database write, import, restore or browser automation occurred.

Original checkpoint preserved:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-before-20261002T141055039Z-426107c7.json`.
New validated response:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-A-current-20261002T144922918Z-1d4c646e.json`.
An earlier uniquely saved response from the same continuation is also retained:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-A-current-20261002T144733579Z-b5f6c58e.json`.
Its first comparator attempt failed on empty-object enumeration; it is not
reported as a passed comparison. These files are scene-response checkpoints,
not complete database backups.

Use sections F–H of [STAGE-1C-NAMED-SCENE-ITEMS.md](STAGE-1C-NAMED-SCENE-ITEMS.md)
for the current six-group handoff. This supersedes memory-only comparisons,
fixed total-node assumptions and any unrecorded asset substitution.
The original room file remains the original-node reference; B retains the
initial item and chosen small movement; C is a separate immutable furnished
reference for D refresh and F post-restart API checks.
Actual added nodes and unexpected field paths are reported.
Semantic graph comparison preserves array order; raw storage hash comparison
is reported separately, with hash-only differences requiring inspection.
A version-only advance is allowed.

Newly executed: read-only Git/source/GET/checkpoint checks, PowerShell parsing
of seven blocks across six groups, and in-memory diagnostic guard checks.
The report helpers were corrected for empty objects and PowerShell-wrapped
strings before handoff. No simulated graph was written/submitted.
These checks do not prove visible mesh loading or furniture persistence.
Prior typecheck (11 tasks / 10 cached), scoped Biome, API/graph (32),
disposable SQLite (19), catalog/placement/scene (18), and static registration
checks remain historical; they were not rerun.

| Furniture outcome | Status |
| --- | --- |
| Items visibility | PENDING |
| Real mesh/materials | PENDING |
| Initial save | PENDING |
| Same-item position/rotation edit, scale/elevation preservation | PENDING |
| Original room preservation after furniture | PENDING |
| Refresh API/visual persistence | PENDING |
| Verified furniture stop | PENDING |
| Post-restart API integrity against C before browser reopen | PENDING |
| Post-restart visual appearance | PENDING |

Global lint remains OPEN: 3,002 errors and 7 infos. Root tests remain OPEN:
six observed CLI/core/IFC failures and cancelled remaining coverage; exact
prior detail is preserved above and in the Stage 1C report.
No waiver, source repair, reinstall/upgrade or broad formatting was performed.
Earlier hydration observations remain historical and USER-REPORTED;
no layout change or warning suppression.

Next action: founder runs A, places exactly one Livingroom Chair through the
named-scene UI, saves/captures B, edits the same chair by the recorded relative
X/Z delta and one +45-degree rotation, saves C, then completes D–F and returns
evidence. Stop on a missing panel/model, failed save or unexplained diff.
If an item appears before A is run, inspect and resume; do not insert a duplicate.
Only after all furniture outcomes pass may a Stage 2 proposal inspect the
source-built MCP server and current official Codex IDE configuration docs.
No live MCP connection, Codex config change or AI scene edit is authorized.
The later +0.10 m local-X test and guarded position-only inverse require
separate authorization; this is not a completed customer assistant.

Only the two existing reports were updated in this continuation.
Final inventory commands remain `git diff --stat` and
`git status --short --untracked-files=all`.


## Stage 1C interactive acceptance — A executed, awaiting initial chair save — 2026-10-02

**A: PASS — VERIFIED-BY-COMMAND. Furniture acceptance PENDING. Stage 2 NOT STARTED.**
The founder retains browser UI and server lifecycle control. Stage 1B room-only
restart remains PASS, USER-REPORTED from the prior handoff; it was not repeated.

Root, branch and HEAD match the handoff: `D:\Open_Source_Repository\Pascal Editor`,
`mvp/stage-1-local-baseline`, `ec0dcea440b02d326b31035ccdd4407332206b5f`.
Git showed only the expected scene-loader patch (22 additions / 1 deletion)
and two untracked reports; no unexpected work was found. Root/app instructions
and applicable ancestor/docs override locations were checked. Both reports were
read in full. The full section G/A setup, every helper, and B-F callers were
reviewed before executing A. Diagnostic network operations are GETs for the
exact named scene; evidence writes use unique names and FileMode.CreateNew
under the existing checkpoint directory. Graph copies/comparisons are in memory.
The E build/dev block is founder-owned and was not executed. The GET handler's
load path was inspected through operations.loadStoredScene, store.load and its
SELECT by scene ID; no mutation endpoint or MCP tool was invoked.

The Stage 1C report remains unchanged and its handoff guard remains valid:
`2C733E398ECA9C85ECDE6848C4E36EAAAA81BB071EE079FC6C67B11FC49A37F2`.
Hash identity was checked separately from the code review. Original response
checkpoint SHA256 also matched
`5C80EB3C2A78A9FB941DA31691003D4040A008988820797BB4DE9504EA600777`.
No initial/furnished B/C files were present in the checkpoint inventory.

Executed the following command in the agent's own PowerShell process (exit 0).
Only the reviewed A fenced block was evaluated, not the complete Markdown:

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$stageReportPath = 'D:\Open_Source_Repository\Pascal Editor\docs\mvp\STAGE-1C-NAMED-SCENE-ITEMS.md'
$stageExpectedReportHash = '2C733E398ECA9C85ECDE6848C4E36EAAAA81BB071EE079FC6C67B11FC49A37F2'
if ((Get-FileHash -LiteralPath $stageReportPath -Algorithm SHA256).Hash -cne $stageExpectedReportHash) { throw 'Stage 1C report hash mismatch; stop and inspect without replacing the guard.' }
$stageReportText = Get-Content -LiteralPath $stageReportPath -Raw
$stageAMatches = [regex]::Matches($stageReportText, '(?ms)^### A\. SETUP / ROOM REFERENCE[^\r\n]*\r?\n.*?^```powershell\r?\n(?<code>.*?)^```\r?$')
if ($stageAMatches.Count -ne 1) { throw 'Expected exactly one reviewed A setup block.' }
$stageACode = $stageAMatches[0].Groups['code'].Value
$stageParseTokens = $null
$stageParseErrors = $null
$null = [System.Management.Automation.Language.Parser]::ParseInput($stageACode, [ref]$stageParseTokens, [ref]$stageParseErrors)
if ($stageParseErrors.Count) { throw ($stageParseErrors | Out-String) }
. ([scriptblock]::Create($stageACode))
$stageBefore.graph.nodes.PSObject.Properties.Value | Group-Object type | Select-Object Name,Count | Format-Table -AutoSize
```

Actual result: scene `b34a488e561b`, version 45, node count 24,
`ItemCount=0`, `SameRoomGraph=True`, `SameRoomHash=True`,
`Status=ROOM_REFERENCE`. Counts: site 1, building 1, level 1, zone 3,
slab 3, ceiling 3, wall 12. Graph hash remains
`4a01e6decf5c0a676b9ba9ee28a68646595c9c2382c15a1a86dfe3e489d2fe7a`.

New A response evidence:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-A-current-20261002T152053694Z-ea46e918.json`.
Original reference retained:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-before-20261002T141055039Z-426107c7.json`.
Prior A evidence retained:
`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-A-current-20261002T144922918Z-1d4c646e.json`.
These are scene-response checkpoints, not complete database backups.

| Furniture outcome | Status |
| --- | --- |
| Items visibility | PENDING |
| Real asset mesh/materials | PENDING |
| Initial save | PENDING |
| Transform edit | PENDING |
| Original room preservation after furniture | PENDING; room-only A matches |
| Refresh | PENDING |
| Verified stop | PENDING |
| Post-restart API integrity | PENDING |
| Post-restart appearance | PENDING |

No current screenshot or visual/save observation was supplied. Next action:
founder opens the exact named scene, uses Items > Furniture > Livingroom Chair,
places ONE real chair with clearance, presses Escape, selects it and Ctrl+S,
then supplies a screenshot and actual mesh/material/save observations.
Do not move/rotate before B captures the initial state.
**WAITING_FOR_INITIAL_CHAIR_SAVE.**

Only this baseline report was appended and the unique A response was written.
The ItemsPanel source and hash-guarded Stage 1C report were preserved. Reported
toolchain versions and prior scoped application checks remain historical and
were not rerun. Global lint stays OPEN (3,002 errors, 7 infos); root tests stay
OPEN (six observed failures and cancelled coverage). No scene/database mutation,
server start/stop, browser automation, or new integration was performed.