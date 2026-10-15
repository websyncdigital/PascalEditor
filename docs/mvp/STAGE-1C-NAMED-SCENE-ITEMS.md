# Stage 1C — Items in named scenes

Recorded 2026-10-02 (Asia/Calcutta). Historical catalog-chair acceptance remains PENDING. **Current-device manual procedural-cabinet acceptance PASS on 2026-10-14; Stage 2A READY, not started in this acceptance run.** See section I; earlier device evidence is preserved below.

## A. Stage 1B room-only restart: PASS — founder-provided evidence

The founder reported the completed controlled stop/restart:
`SERVER_STOP_CONFIRMED=True`, scene `b34a488e561b`,
`SameScene=True`, `SameGraphAsRecorded=True`, `SameNodeCount=True`,
`RecordedVersion=45`, `CurrentVersion=45`, `CurrentNodeCount=24`.
The founder's reopened-scene screenshot shows rooms with wall/floor materials
and no visible red hydration-error badge. Codex did not operate the browser.
No repeat of this completed room-only restart test is requested.

Reference graph hash:
`4a01e6decf5c0a676b9ba9ee28a68646595c9c2382c15a1a86dfe3e489d2fe7a`.

Reference counts: site 1, building 1, level 1, zone 3, slab 3, ceiling 3,
wall 12, item 0. Preserve these original nodes.

## B. Targeted preflight and failure triage

- Branch `mvp/stage-1-local-baseline`; HEAD `ec0dcea440b02d326b31035ccdd4407332206b5f`: match.
- Initial Git status: only `?? docs/mvp/STAGE-1-BASELINE.md`. No unexpected source changes or pre-existing Items patch.
- Verified Bun 1.3.14 using `C:\Users\vivek\.bun\bin\bun.exe`, Node v22.23.1, and hoisted installed Next 16.3.0. Bun was absent from the initial shell PATH; commands below used a process-local PATH prefix only.
- Read root and `apps/editor/AGENTS.md`, checked ancestors and applicable descendants for overrides (none found), and read the existing baseline report.
- Read the installed Next guides at `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` and `03-architecture/fast-refresh.md`. The existing client boundary is sufficient; the running source dev server should pick up the component edit.
- Read architecture index and layers guidance. This change only composes existing editor UI in the app host.
- Read root/workspace scripts, Turbo configuration, Bun preloads, and Biome configuration before checks. No install, upgrade, configuration change, server lifecycle action, or root test-suite rerun.

Actual previous failures were read from `packages/{cli,core,ifc-converter}/.turbo/turbo-test.log` and corresponding test source:

| Failure | Exact evidence | Insertion/save/load assessment |
| --- | --- | --- |
| CLI diagnostics, line 68 | mode bits expected 0, received 54 | POSIX permission assertion on Windows; does not establish a catalog or persistence failure. Windows ACL security is not certified by this triage. |
| CLI MCP service, line 45 | token mode bits expected 0, received 54 | Same platform-dependent assertion; CLI-managed service is not used by this source editor flow. |
| Core polygon boolean, line 175 | warning calls expected 1, received 0; preceding invalid-input result assertions passed | Diagnostic warning assertion, not an observed graph corruption. Exact warning cause remains unresolved. |
| Core structure reconcile, line 407 | BadPathName `/D:/Open_Source_Repository/Pascal%20Editor/packages/core/src/utils` | Test uses URL.pathname as a filesystem entrypoint; failure occurs before the bundle/runtime assertion. Does not demonstrate an insertion or migration failure. |
| IFC mapped beam, line 199/helper line 57 | undefined node.parentId | Prior fixture analysis and source show CRLF-sensitive `ENDSEC;\nEND-ISO` test replacement; IFC import is not on the ordinary catalog path. |
| IFC uncontained beam, line 212 | expected null parent, received level ID | CRLF-sensitive `/^#42=.*\n/m` test removal; IFC import is not used here. |

No concrete unresolved ordinary catalog insertion/save/load data-integrity risk was established by these six failures. No prerequisite production repair was justified. They remain **OPEN**, without skips or fixes.

Global baseline remains: `bun run check` FAIL (3,002 errors, 7 infos, including CRLF diagnostics); `bun run test` FAIL (six observed failures; unfinished suites cancelled). Scoped checks below do not supersede these failures. Earlier extension-related hydration attributes are historical; the current founder screenshot does not reproduce the warning. `layout.tsx` was not changed or warnings suppressed.

## C. Production diff and verified integration

Only production file changed: [scene-loader.tsx](../../apps/editor/components/scene-loader.tsx).

Git diff: **22 insertions, 1 deletion**:

1. Import exported `ItemsPanel` and lucide `Package`.
2. Add the same `EditorItemsPanel` wrapper used by the root editor:
   `<ItemsPanel showSourceFilter={false} showTagFilters={false} />`.
3. Add the root editor's `items` tab between Build and Settings, with
   `/icons/couch.webp`, the mobile Package icon, and mobile snap 0.5.

Exact source contracts inspected:

| Contract | Existing file / symbol |
| --- | --- |
| Public ItemsPanel export | [packages/editor/src/index.tsx](../../packages/editor/src/index.tsx), `ItemsPanel` export |
| Existing registration copied | [apps/editor/app/page.tsx](../../apps/editor/app/page.tsx), `EditorItemsPanel`, `SIDEBAR_TABS` items entry |
| Typed host API | [tab-bar.tsx](../../packages/editor/src/components/ui/sidebar/tab-bar.tsx), `SidebarTab`; [editor/index.tsx](../../packages/editor/src/components/editor/index.tsx), `sidebarTabs` prop and v2 `tabMap`/`tabBarTabs` |
| Defaults and plugin panels | [use-editor.tsx](../../packages/editor/src/store/use-editor.tsx), `DEFAULT_ACTIVE_SIDEBAR_PANEL = 'build'`; [use-plugin-panels.tsx](../../packages/editor/src/components/ui/sidebar/use-plugin-panels.tsx), `useHostPanels` |
| Root bootstrap/provider context | [app/client-bootstrap.tsx](../../apps/editor/app/client-bootstrap.tsx), `ClientBootstrap`; [lib/bootstrap.ts](../../apps/editor/lib/bootstrap.ts), `loadBuiltinsSync`, `registerEditorHostPanel`. ItemsPanel reads the existing editor store and needs no new host provider. |
| Catalog and selection | [items-panel/index.tsx](../../packages/editor/src/components/ui/sidebar/panels/items-panel/index.tsx), `ItemsPanel`/`LegacyItemsPanel`; [catalog-panel-model.ts](../../packages/editor/src/lib/catalog-panel-model.ts), `filterCatalogItems` defaults to `CATALOG_ITEMS`, `activateCatalogItem` sets selected asset, item tool, and build mode |
| Normal insertion | [nodes/item/definition.ts](../../packages/nodes/src/item/definition.ts), `tool` loader; [nodes/item/tool.tsx](../../packages/nodes/src/item/tool.tsx), `ItemTool` → `useDraftNode` + `usePlacementCoordinator` |

Explicit tab IDs are unique: `site`, `build`, `items`, `settings`.
Plugin registration/composition is untouched. Installed host panel source IDs
are `mint:assets:models`, `pascal:bones:panel`,
`pascal:environment:catalog`, `pascal:pool:catalog`,
`pascal:streetscape:streetscape`, `pascal:trees:trees`, and `webxr:panel`;
the manager uses `plugins`. None collides with `items`. Installation/workspace
filtering continues to determine which plugin tabs appear. No plugins were enabled.

The entire exported `SceneLoader` function is unchanged: scene ID, initial
graph, onLoad/onSave, If-Match version handling, empty-save guards, SSE,
thumbnail callback, project ID, and Editor wiring. The default Build panel
and any existing preference handling are unchanged. No second catalog/store,
insertion implementation, scene import, AI/MCP feature, or naming feature.

Biome required CRLF → LF only in this edited TSX file. Git's normalized source
diff remains the small change above; no global formatting or Git settings changed.

Other changes: append-only history entry in [STAGE-1-BASELINE.md](STAGE-1-BASELINE.md)
and this new report. No new test files or testing framework.

## D. Previously executed scoped checks — implementation history

These checks preceded the current Phase A continuation and were not rerun. All commands used the installed tools. Root command setup:
`$env:Path = 'C:\Users\vivek\.bun\bin;' + $env:Path`.
Exit codes below are actual process exits.

| Working directory | Command | Exit / result | Cache / limits |
| --- | --- | --- | --- |
| Root | `bun run check-types` | 0, PASS | 11/11 tasks; 10 cached. Editor app freshly ran `next typegen && tsc --noEmit`; 2.579s. |
| Root | `bun run check apps/editor/components/scene-loader.tsx` | 1 initially | One format error from CRLF; no fixes on this pass. |
| Root | `bun run format apps/editor/components/scene-loader.tsx` | 0 | Formatted that file only. |
| Root | `bun run check apps/editor/components/scene-loader.tsx` | 0, PASS | Biome lint, format and import checks; one file; uncached. |
| apps/editor | `bun test lib/api-put-empty-guard.test.ts lib/empty-graph-guard.test.ts lib/scene-signature.test.ts lib/graph-schema.test.ts` | 0, 32 PASS, 0 fail | Fresh Bun execution. Real route handler + disposable SQLite for guard test; no live HTTP writes. |
| packages/mcp | `bun test src/storage/sqlite-scene-store.test.ts` | 0, 19 PASS, 0 fail | Fresh Bun execution. Temporary DBs: save/reopen, versions, optimistic locking, metadata/materials, events. Two Unix path tests return early on Windows; this is pre-existing platform coverage, not a new skip. |
| packages/editor | `bun test src/lib/catalog-selection.test.ts src/components/tools/item/draft-creation.test.ts src/components/tools/item/placement-history.test.tsx src/lib/scene.test.ts` | 0, 18 PASS, 0 fail | Fresh Bun execution, 21.91s. Normal draft/drop/undo/move/repeat history and scene selection tests. Warnings: unavailable browser preference storage, act environment, deprecated THREE.Clock. |
| Root | TypeScript AST audit through `node -` | 0, PASS | Static audit, **not** a functional test: parses HEAD/current/root host; checks unique IDs, unchanged retained tab objects, exact root Items entry/wrapper reuse, entire SceneLoader function unchanged, existing couch icon. |
| Live API | GET exact scene before/after edit | 0, PASS | Details below. |

69 focused tests passed. The app route tests create their own
`scenes-put-guard-*` temporary directory; SQLite tests explicitly use
`pascal-sqlite-test-*` temporary directories. The founder database was never
opened directly by a test. Tests do not exercise remote GLB loading or the
named-scene browser's complete save/refresh/restart cycle.

No DOM/browser host-tab interaction test was introduced. Registration/persistence
wiring coverage consists of typechecking, static AST comparison, existing unit/
integration tests and source inspection. Actual panel rendering, plugin tab
visibility, real asset meshes/materials and furnished-scene persistence are manual
acceptance gaps. An Items button and unit tests alone do not pass furniture acceptance.
The repository Biome configuration excludes docs/mvp; reports receive manual
Markdown/code-block review, not a claimed Biome Markdown pass.

Prior handoff validation (before the revision in F–G) exited 0: all eight PowerShell blocks parsed; the setup block
was executed against the checkpoint/live GET; JSON key ordering, empty/singleton
array preservation and rejection of a missing item passed. Furniture blocks and
server-control commands were not executed. This validates the handoff helpers,
not furniture runtime acceptance.

## E. Saved-scene checkpoint and integrity

**CREATED**, response JSON from the exact GET before source editing:

`C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-before-20261002T141055039Z-426107c7.json`

Identity `b34a488e561b`; version **45**; node count **24**; graphHash
`4a01e6decf5c0a676b9ba9ee28a68646595c9c2382c15a1a86dfe3e489d2fe7a`.
Counts match the founder reference, with zero items.

This is a **scene-response checkpoint, not a complete database backup**.
It was written with a unique UTC timestamp/suffix and create-new semantics,
outside Git. No live SQLite file was copied.

After the edit and checks, GET returned:
`SameScene=True`, `SameGraphHash=True`, `SameGraphJson=True`,
recorded/current version 45/45, current count 24, item count 0.
No unexpected graph difference, automatic restore, or scene/database write.
Server start/stop remains with the founder.

## F. Phase A read-only verification — 2026-10-02

This continuation inspected the existing patch; it did not implement it again.
Root, branch and HEAD match the expected baseline. Git inventory remains the
one modified scene-loader TSX (22 additions / 1 deletion) and these two
untracked MVP reports. No unexplained source changes were found.
Root/app instructions and applicable ancestor/descendant override locations
were checked; no applicable override was found. No full architecture audit.

The existing DB file and original scene-response checkpoint are present.
GET to the SAME named scene succeeded; an IPv4 listener was observed at
127.0.0.1:3002. No server lifecycle action was performed.
Current scene is still "Untitled scene", version 45, 24 nodes, zero items,
with the original graphHash. Semantic graph comparison and hash comparison
both PASS. Counts remain site 1, building 1, level 1, zone 3, slab 3,
ceiling 3, wall 12. Furniture has not yet been inserted in saved API state.

New response evidence, outside Git, created with unique names and CreateNew:

- Initial diagnostic capture:
  `C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-A-current-20261002T144733579Z-b5f6c58e.json`.
  Saving succeeded; the first revised comparator then hit a StrictMode
  empty-object enumeration error. This file is retained, not called a
  completed comparison.
- Validated capture:
  `C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints\stage-1c-A-current-20261002T144922918Z-1d4c646e.json`.
  SameRoomGraph=True, SameRoomHash=True, ItemCount=0.
- Original checkpoint remains unchanged, with file SHA256
  `5C80EB3C2A78A9FB941DA31691003D4040A008988820797BB4DE9504EA600777`.
  These are scene-response checkpoints, not complete database backups.

Only additional workflow source was read: actual GET response, item schema,
catalog identity/category, Items panel labels, inspector position/rotation
controls, and storage hash construction. The reported toolchain versions and
prior scoped checks in D were not rerun. No browser operation was performed.

### Revised handoff validation and comparison policy

Section G replaces the old memory-only handoff, its fixed 25-node assumption,
and its implicit permission to substitute a catalog asset.
The established function names, variables, API schema and source launch
contract are reused. References B (initial) and C (furnished) are now separate
durable files. D/F explicitly prompt for C's path and never recapture C.
C records B's path and file hash. A can be rerun after a terminal restart
to reload the functions and original checkpoint without resetting the scene.

The revised comparator reports changed field paths, compares object keys
without order sensitivity, keeps array order and missing/null distinctions,
and compares numeric values (1 and 1.0 are equal). Full graph comparison
uses zero numeric tolerance. Planned movement, +45-degree rotation and
scale/elevation checks use absolute tolerance 1e-8 in stored units
(metres/radians/scale units). Scale also remains covered by the exact
non-pose graph comparison. No tolerance is applied to asset/ID fields.

Actual additions are listed by ID/type, without assuming a new total count.
Only the target addition and its one parent-child entry are automatically
accepted. Every other original node/field, geometry, material, root,
collection and plugin field is compared. Any extra node or other difference
is a review gate with precise paths, not an automatic declaration of loss.

The API graphHash is SHA256 of stored graph JSON, not a canonical semantic
hash (`sqlite-scene-store.ts`, `hashGraphJson`). D/F therefore report semantic
equality and raw hash equality separately. A hash-only difference requires
inspection (potential serialization order); it does not prove data loss.
Version-only advancement is allowed; regression stops the check.

Newly executed diagnostic validation: PowerShell parsing of seven fenced
blocks across six groups PASS; corrected helpers exercised against the
original checkpoint and GET PASS. In-memory diagnostic samples verified
key-order/numeric equivalence, array order, empty objects/arrays, missing
item/transform rejection, and accepted only a small X move plus +45-degree
Y rotation. Unchanged pose, elevation/scale changes, placeholder identity,
room-material changes and extra nodes were rejected. A PowerShell pipeline
wrapper quirk that made a string appear as a PSCustomObject was found and
corrected in these report-only helpers. No simulated graph was persisted,
submitted to the API, or counted as furniture runtime evidence.
B–F and the restart commands were parsed but not executed against furniture.
No application tests or global checks were rerun.

## G. Founder workflow — six command groups, run one at a time

**SERVER TERMINAL A** is the existing foreground source server.
**CHECK TERMINAL B** is a separate PowerShell terminal for diagnostics.
Keep other scene tabs/writers closed or paused; use one named-scene tab.
No scene writes occur in these diagnostic blocks; only GET and unique
evidence files. Only the founder performs UI changes and server control.

1. Run A in CHECK TERMINAL B before inserting furniture. Expected current
   result: ROOM_REFERENCE, ItemCount=0, SameRoomGraph=True, SameRoomHash=True.
   If saved items already exist, A lists their IDs and says
   EXISTING_ITEMS_DO_NOT_INSERT. Resume from retained B/C references and
   actual progress; do not add another item or reset. If the initial pose
   evidence is missing after an edit, report that gap; do not reconstruct it.
2. Reopen http://localhost:3002/scene/b34a488e561b. Confirm the rooms/materials,
   then **Items → Furniture**, search **Livingroom Chair**. Click its tile,
   click once inside an existing room away from walls, then **Escape**.
   Select that chair and require real 3D mesh/materials. A thumbnail, preview,
   bounding box, empty node or broken fallback does not qualify. Check its
   model request and dependent textures in DevTools for errors; a successful
   response alone is not visible-mesh evidence. Press **Ctrl+S** with the
   editor focused, wait for a successful scene PUT and no save/conflict banner.
   Run B; it lists/selects the saved item ID without hidden UI controls.
3. B prompts for X or Z and a signed small delta (e.g. 0.20 or -0.20 m) where
   there is clearance; it prints current and NEW UI position values. Change
   that one **Position** value to current + delta, leaving Y and scale alone.
   Click **Rotation → +45°** once. The control exists in this checkout; if
   absent, stop and record the UI. Position is parent-local metres; rotation
   is stored in radians, while the inspector shows rounded degrees.
   One +45° click changes stored Y rotation by pi/4. Asset corrective
   transforms remain untouched. Confirm visible movement/rotation, Ctrl+S,
   then run C, supplying B's printed initial file path.
4. Retain C's furnished path. Refresh the SAME scene; observe chair pose,
   mesh/materials and original rooms. Run D against C. Save output and the
   USER-REPORTED visual result.
5. After D succeeds and saves finish, close ALL tabs of this scene.
   In SERVER TERMINAL A press Ctrl+C once to stop its foreground server.
   Run E's stop check in B. Only after SERVER_STOP_CONFIRMED=True, run E's
   guarded restart in A, with the same DB and port.
6. When A reports ready at 127.0.0.1:3002, run F in B BEFORE reopening any
   scene tab. Supply the SAME C path. Only after F succeeds, reopen the exact
   scene and visually verify the original rooms/materials and same real chair
   at the final pose. Report that visual result separately.

Stop at any thrown error or false comparison. Preserve candidate/current
paths and output; no restore, import, duplicate insertion or assumed success.
If Items is absent or a save fails, stop at that step and investigate read-only.
If the catalog entry is missing or loading fails, record the search, visible
fallback, URL/status and console/network error with secrets redacted.
Do not proxy URLs or substitute a placeholder. A different ordinary catalog
model requires an explicit recorded founder choice and corresponding
diagnostic identity update before proceeding.

If GET is unavailable, distinguish a stopped server (confirmed no listener)
from a listener with blocked/unhealthy API access. Do not call either a
furniture persistence failure. If intentionally stopped, the founder may
use E's guarded restart contract to resume; that preliminary start does not
count as the later furnished stop/restart acceptance. Never start a second
server or infer stopped status from an available PowerShell prompt.

A reloads setup/functions and checks current state; B/C must NOT be rerun
after successful capture just because a terminal closed. Reuse their files.
If needed, list retained references (read-only) with
`Get-ChildItem -LiteralPath $stageDirectory -Filter 'stage-1c-*.json' |
Select-Object FullName`; choose the exact original B/C path, never automatically
the newest file. A missing reference is an evidence gap, not permission to
silently replace it. Do not execute this whole Markdown document.

### A. SETUP / ROOM REFERENCE — CHECK TERMINAL B

This block defines the existing diagnostic helpers, reads the original room
reference, GETs the current scene and saves a new uniquely named response.
It also works for reloading helpers after a terminal restart; an existing
item causes the explicit DO_NOT_INSERT status.

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$stageSceneId = 'b34a488e561b'
$stageApi = 'http://localhost:3002/api/scenes/b34a488e561b'
$stageDirectory = 'C:\Users\vivek\AppData\Local\PascalSourceMVP\checkpoints'
$stageCheckpoint = Join-Path $stageDirectory 'stage-1c-before-20261002T141055039Z-426107c7.json'
$stageTolerance = 1e-8

function Assert-Stage($Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}
function Get-RequiredField($Object, [string]$Name) {
    if ($null -eq $Object) { throw "Missing object for $Name" }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property -or $null -eq $property.Value) { throw "Missing/null field: $Name" }
    return ,$property.Value
}
function Test-StageNumber($Value) {
    return ($null -ne $Value -and $Value.GetType().Name -in
        @('Byte','SByte','Int16','UInt16','Int32','UInt32','Int64','UInt64','Single','Double','Decimal') -and
        -not [double]::IsNaN([double]$Value) -and -not [double]::IsInfinity([double]$Value))
}
function ConvertTo-OrderedValue($Value) {
    if ($null -eq $Value) { return $null }
    if ($Value -is [System.Collections.IDictionary]) {
        $ordered = [ordered]@{}
        foreach ($key in ($Value.Keys | Sort-Object -CaseSensitive)) {
            $ordered[$key] = ConvertTo-OrderedValue $Value[$key]
        }
        return $ordered
    }
    if ($Value.GetType() -eq [System.Management.Automation.PSCustomObject]) {
        $ordered = [ordered]@{}
        foreach ($p in ($Value.PSObject.Properties | Sort-Object Name -CaseSensitive)) {
            $ordered[$p.Name] = ConvertTo-OrderedValue $p.Value
        }
        return $ordered
    }
    if ($Value -is [array]) {
        $array = @()
        foreach ($entry in $Value) { $array += ,(ConvertTo-OrderedValue $entry) }
        return ,$array
    }
    return $Value
}
function Get-StableJson($Value) {
    ConvertTo-Json -InputObject (ConvertTo-OrderedValue $Value) -Depth 100 -Compress
}
function Get-StageDiff($Before, $After, [string]$Path = 'graph') {
    if ($null -eq $Before -or $null -eq $After) {
        if ($null -ne $Before -or $null -ne $After) { "$Path : null/value changed" }
    } elseif ($Before.GetType() -eq [System.Management.Automation.PSCustomObject] -and $After.GetType() -eq [System.Management.Automation.PSCustomObject]) {
        $keys = @(@($Before.PSObject.Properties | ForEach-Object Name) + @($After.PSObject.Properties | ForEach-Object Name) |
            Sort-Object -Unique -CaseSensitive)
        foreach ($key in $keys) {
            $a = $Before.PSObject.Properties | Where-Object Name -CEQ $key
            $b = $After.PSObject.Properties | Where-Object Name -CEQ $key
            if ($null -eq $a) { "$Path.$key : added" }
            elseif ($null -eq $b) { "$Path.$key : removed" }
            else { Get-StageDiff $a.Value $b.Value "$Path.$key" }
        }
    } elseif ($Before -is [array] -and $After -is [array]) {
        if ($Before.Count -ne $After.Count) { "$Path : array length changed ($($Before.Count) -> $($After.Count))" }
        for ($i = 0; $i -lt [Math]::Min($Before.Count, $After.Count); $i++) {
            Get-StageDiff $Before[$i] $After[$i] "$Path[$i]"
        }
    } elseif ((Test-StageNumber $Before) -and (Test-StageNumber $After)) {
        if ([double]$Before -ne [double]$After) { "$Path : number changed" }
    } elseif ((Get-StableJson $Before) -cne (Get-StableJson $After)) {
        "$Path : value/type changed"
    }
}
function Assert-StageEqual($Before, $After, [string]$Label) {
    $differences = @(Get-StageDiff $Before $After $Label)
    if ($differences.Count) {
        $differences | ForEach-Object { Write-Host $_ }
        throw "$Label differs; stop and review these paths. Do not restore."
    }
}
function Assert-StageScene($Scene) {
    foreach ($field in @('id','version','nodeCount','graphHash','graph')) {
        $null = Get-RequiredField $Scene $field
    }
    Assert-Stage ($Scene.id -is [string] -and $Scene.id -ceq $stageSceneId) 'Wrong scene.'
    foreach ($field in @('version','nodeCount')) {
        $n = $Scene.$field
        Assert-Stage ((Test-StageNumber $n) -and $n -ge 0 -and $n -eq [Math]::Floor($n)) "Invalid $field."
    }
    Assert-Stage ($Scene.graphHash -is [string] -and $Scene.graphHash -cmatch '^[a-f0-9]{64}$') 'Invalid graphHash.'
    Assert-Stage ($Scene.graph -is [pscustomobject]) 'Invalid graph object.'
    foreach ($field in @('nodes','materials')) {
        Assert-Stage ((Get-RequiredField $Scene.graph $field) -is [pscustomobject]) "Invalid graph.$field."
    }
    $roots = Get-RequiredField $Scene.graph 'rootNodeIds'
    Assert-Stage ($roots -is [array] -and $roots.Count -gt 0) 'Invalid roots.'
    Assert-Stage ($Scene.nodeCount -eq @($Scene.graph.nodes.PSObject.Properties).Count) 'Node count mismatch.'
    foreach ($p in $Scene.graph.nodes.PSObject.Properties) {
        $id = Get-RequiredField $p.Value 'id'; $type = Get-RequiredField $p.Value 'type'
        Assert-Stage ($id -is [string] -and $id -ceq $p.Name -and $type -is [string] -and $type.Length -gt 0) 'Invalid node ID/type.'
    }
    foreach ($id in $roots) { $null = Get-RequiredField $Scene.graph.nodes $id }
}
function Get-StageScene {
    try { $scene = Invoke-RestMethod -Uri $stageApi -Method Get -TimeoutSec 30 }
    catch { throw "GET unavailable: $($_.Exception.Message). Inspect Terminal A/access; this alone is not a persistence failure." }
    Assert-StageScene $scene
    return $scene
}
function Get-StageItem($Scene, [string]$Id) {
    Assert-StageScene $Scene
    $item = Get-RequiredField $Scene.graph.nodes $Id
    foreach ($field in @('id','type','parentId','asset','position','rotation','scale')) {
        $null = Get-RequiredField $item $field
    }
    Assert-Stage ($item.id -ceq $Id -and $item.type -ceq 'item') 'Target item missing/wrong.'
    Assert-Stage ($item.parentId -is [string] -and $item.parentId.Length -gt 0) 'Invalid parent.'
    Assert-Stage ($item.asset -is [pscustomobject]) 'Invalid asset.'
    $assetId = Get-RequiredField $item.asset 'id'; $src = Get-RequiredField $item.asset 'src'
    Assert-Stage ($assetId -is [string] -and $assetId -ceq 'livingroom-chair' -and
        $src -is [string] -and $src -ceq 'https://byrpxoiotywskoojsrzd.supabase.co/storage/v1/object/public/items/system/livingroom-chair/model.glb') 'Expected real catalog identity/source; placeholders excluded. A different asset needs an explicit recorded choice.'
    foreach ($field in @('position','rotation','scale')) {
        $v = $item.$field
        Assert-Stage ($v -is [array] -and $v.Count -eq 3) "Invalid $field vector."
        foreach ($n in $v) { Assert-Stage (Test-StageNumber $n) "Invalid $field number." }
    }
    foreach ($n in $item.scale) { Assert-Stage ($n -gt 0) 'Invalid scale.' }
    $parent = Get-RequiredField $Scene.graph.nodes $item.parentId
    $children = Get-RequiredField $parent 'children'
    Assert-Stage ($children -is [array] -and @($children | Where-Object { $_ -ceq $Id }).Count -eq 1) 'Parent must reference target exactly once.'
    return $item
}
function Get-ItemSnapshot($Scene, [string]$Id) {
    Get-StageItem $Scene $Id | Select-Object id,parentId,asset,position,rotation,scale
}
function Assert-OriginalRooms($Scene, [string]$Id) {
    $item = Get-StageItem $Scene $Id
    $added = @($Scene.graph.nodes.PSObject.Properties | Where-Object {
        $null -eq $stageRooms.graph.nodes.PSObject.Properties[$_.Name]
    } | ForEach-Object { [pscustomobject]@{ id=$_.Name; type=$_.Value.type } })
    Write-Host ('Actual added nodes: ' + (ConvertTo-Json -InputObject $added -Compress))
    Assert-Stage ($null -eq $stageRooms.graph.nodes.PSObject.Properties[$Id]) 'Target existed in room reference.'
    $originalParent = Get-RequiredField $stageRooms.graph.nodes $item.parentId
    $copy = Get-StableJson $Scene.graph | ConvertFrom-Json
    $copy.nodes.PSObject.Properties.Remove($Id)
    $parent = Get-RequiredField $copy.nodes $item.parentId
    $parent.children = @($parent.children | Where-Object { $_ -cne $Id })
    if ($null -eq $originalParent.PSObject.Properties['children'] -and $parent.children.Count -eq 0) {
        $parent.PSObject.Properties.Remove('children')
    }
    Assert-StageEqual $stageRooms.graph $copy 'original-room'
    Write-Host "Allowed change: $($item.parentId).children gained $Id; all other original graph content matches."
}
function Save-StageEvidence([string]$Label, $Value) {
    Assert-Stage (Test-Path -LiteralPath $stageDirectory -PathType Container) 'Checkpoint directory missing; stop.'
    $name = 'stage-1c-' + $Label + '-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8) + '.json'
    $path = Join-Path $stageDirectory $name
    $bytes = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $Value -Depth 100))
    $stream = [IO.File]::Open($path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
    Write-Host "Evidence: $path"
    return $path
}
function Read-StageRecord([string]$Path, [string]$Kind) {
    $record = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    Assert-Stage ((Get-RequiredField $record 'kind') -ceq $Kind) "Wrong reference kind; expected $Kind."
    Assert-StageScene (Get-RequiredField $record 'scene')
    return $record
}
function Assert-StageEdit($Initial, $FinalScene) {
    $a = Get-ItemSnapshot $Initial.scene $Initial.itemId
    $b = Get-ItemSnapshot $FinalScene $Initial.itemId
    Assert-StageEqual ($a | Select-Object id,parentId,asset) ($b | Select-Object id,parentId,asset) 'target-identity'
    $axis = $Initial.axis; $delta = $Initial.delta
    Assert-Stage ((Test-StageNumber $axis) -and $axis -in @(0,2) -and (Test-StageNumber $delta) -and [Math]::Abs($delta) -gt $stageTolerance -and [Math]::Abs($delta) -le 0.5) 'Invalid intended small X/Z delta.'
    for ($i=0; $i -lt 3; $i++) {
        $expectedMove = if ($i -eq $axis) { $delta } else { 0 }
        $expectedTurn = if ($i -eq 1) { [Math]::PI / 4 } else { 0 }
        Assert-Stage ([Math]::Abs(($b.position[$i]-$a.position[$i])-$expectedMove) -le $stageTolerance) "Position[$i] differs from planned delta/elevation."
        Assert-Stage ([Math]::Abs(($b.rotation[$i]-$a.rotation[$i])-$expectedTurn) -le $stageTolerance) "Rotation[$i] differs from one +45-degree turn."
        Assert-Stage ([Math]::Abs($b.scale[$i]-$a.scale[$i]) -le $stageTolerance) "Scale[$i] changed."
    }
    $copy = Get-StableJson $FinalScene.graph | ConvertFrom-Json
    $copy.nodes.PSObject.Properties[$Initial.itemId].Value.position = $a.position
    $copy.nodes.PSObject.Properties[$Initial.itemId].Value.rotation = $a.rotation
    Assert-StageEqual $Initial.scene.graph $copy 'unexpected-edit'
    Assert-OriginalRooms $FinalScene $Initial.itemId
}
function Test-StageFurniture([string]$Phase, [string]$ReferencePath) {
    $reference = Read-StageRecord $ReferencePath 'furnished'
    Assert-Stage ((Get-FileHash -LiteralPath $reference.initialPath -Algorithm SHA256).Hash -ceq $reference.initialHash) 'Initial reference file changed.'
    $initial = Read-StageRecord $reference.initialPath 'initial'
    Assert-StageEdit $initial $reference.scene
    $scene = Get-StageScene
    $currentPath = Save-StageEvidence $Phase $scene
    Assert-OriginalRooms $scene $initial.itemId
    $targetDiff = @(Get-StageDiff (Get-ItemSnapshot $reference.scene $initial.itemId) (Get-ItemSnapshot $scene $initial.itemId) 'target')
    $graphDiff = @(Get-StageDiff $reference.scene.graph $scene.graph)
    $sameHash = $scene.graphHash -ceq $reference.scene.graphHash
    [pscustomobject]@{
        Phase=$Phase; SameScene=$true; ItemId=$initial.itemId
        SameItemAssetPose=($targetDiff.Count -eq 0); OriginalRoomsPreserved=$true
        SameFurnishedGraph=($graphDiff.Count -eq 0); SameGraphHash=$sameHash
        RecordedVersion=$reference.scene.version; CurrentVersion=$scene.version
        NodeCount=$scene.nodeCount; GraphHash=$scene.graphHash
        ReferencePath=$ReferencePath; CurrentPath=$currentPath
    } | Format-List
    @($targetDiff + $graphDiff) | ForEach-Object { Write-Host $_ }
    Assert-Stage ($scene.version -ge $reference.scene.version) 'Version regressed; stop and investigate.'
    Assert-Stage ($targetDiff.Count -eq 0 -and $graphDiff.Count -eq 0 -and $sameHash) 'Comparison needs review. A hash-only difference may be serialization order; do not declare data loss or replace C.'
}

Assert-Stage (Test-Path -LiteralPath 'C:\Users\vivek\AppData\Local\PascalSourceMVP\pascal.db' -PathType Leaf) 'Existing DB missing; do not create one.'
Assert-Stage (Test-Path -LiteralPath $stageCheckpoint -PathType Leaf) 'Original room checkpoint missing; stop, do not fabricate it.'
Assert-Stage ((Get-FileHash -LiteralPath $stageCheckpoint -Algorithm SHA256).Hash -ceq '5C80EB3C2A78A9FB941DA31691003D4040A008988820797BB4DE9504EA600777') 'Original checkpoint file changed.'
$stageRooms = Get-Content -LiteralPath $stageCheckpoint -Raw | ConvertFrom-Json
Assert-StageScene $stageRooms
Assert-Stage ($stageRooms.version -eq 45 -and $stageRooms.nodeCount -eq 24 -and $stageRooms.graphHash -ceq '4a01e6decf5c0a676b9ba9ee28a68646595c9c2382c15a1a86dfe3e489d2fe7a') 'Wrong room reference.'
Assert-Stage (@($stageRooms.graph.nodes.PSObject.Properties.Value | Where-Object type -CEQ item).Count -eq 0) 'Room reference contains items.'
$stageBefore = Get-StageScene
$stageCurrentPath = Save-StageEvidence 'A-current' $stageBefore
$stageItems = @($stageBefore.graph.nodes.PSObject.Properties.Value | Where-Object type -CEQ item)
$stageItems | Select-Object id,parentId,@{n='AssetId';e={$_.asset.id}},position,rotation,scale | Format-List
$stageRoomDiff = @(Get-StageDiff $stageRooms.graph $stageBefore.graph)
[pscustomobject]@{
    SceneId=$stageBefore.id; Version=$stageBefore.version; NodeCount=$stageBefore.nodeCount
    ItemCount=$stageItems.Count; SameRoomGraph=($stageRoomDiff.Count -eq 0)
    SameRoomHash=($stageBefore.graphHash -ceq $stageRooms.graphHash)
    Status=$(if ($stageItems.Count) { 'EXISTING_ITEMS_DO_NOT_INSERT' } else { 'ROOM_REFERENCE' })
    EvidencePath=$stageCurrentPath
} | Format-List
if ($stageItems.Count -eq 0) {
    $stageRoomDiff | ForEach-Object { Write-Host $_ }
    Assert-Stage ($stageRoomDiff.Count -eq 0 -and $stageBefore.graphHash -ceq $stageRooms.graphHash) 'Room changed; inspect before insertion.'
}
```

### B. INITIAL ITEM CAPTURE — CHECK TERMINAL B

Only after exactly one real chair is placed and saved; before moving it.
Requires A. Type YES only for observations actually made. B-candidate is the
raw response; the separate initial file retains that response plus the chosen
movement and USER-REPORTED confirmation. Keep the printed InitialPath.

```powershell
$stageInserted = Get-StageScene
$stageCandidatePath = Save-StageEvidence 'B-candidate' $stageInserted
$stageItems = @($stageInserted.graph.nodes.PSObject.Properties.Value | Where-Object type -CEQ item)
$stageItems | Select-Object id,parentId,@{n='AssetId';e={$_.asset.id}},position,rotation,scale | Format-List
Assert-Stage ($stageItems.Count -eq 1) 'Expected one item. Stop; inspect saved item list, do not add another.'
$stageItemId = [string](Get-RequiredField $stageItems[0] 'id')
Assert-OriginalRooms $stageInserted $stageItemId
$stageInitialItem = Get-ItemSnapshot $stageInserted $stageItemId
$stageInitialItem | ConvertTo-Json -Depth 20
Assert-Stage ((Read-Host 'Items visible, real chair mesh/materials visible (no fallback), and Ctrl+S save succeeded? Type YES') -ceq 'YES') 'Visual/save evidence still pending.'
$stageAxisText = (Read-Host 'Choose clear local movement axis: X or Z').ToUpperInvariant()
Assert-Stage ($stageAxisText -in @('X','Z')) 'Choose X or Z.'
$stageAxis = if ($stageAxisText -ceq 'X') { 0 } else { 2 }
$stageDelta = [double]::Parse((Read-Host 'Signed small delta in metres, e.g. 0.20 or -0.20; decimal point'), [Globalization.CultureInfo]::InvariantCulture)
Assert-Stage ((Test-StageNumber $stageDelta) -and [Math]::Abs($stageDelta) -gt $stageTolerance -and [Math]::Abs($stageDelta) -le 0.5) 'Choose a nonzero delta within 0.50 m and room clearance.'
$stageInitialPath = Save-StageEvidence 'initial' ([pscustomobject]@{
    kind='initial'; scene=$stageInserted; itemId=$stageItemId
    axis=$stageAxis; delta=$stageDelta
    observation='USER-REPORTED: Items visible; real mesh/materials; initial save succeeded'
})
[pscustomobject]@{
    InitialCapture=$true; OriginalRoomsPreserved=$true; ItemId=$stageItemId
    Axis=$stageAxisText; CurrentValue=$stageInitialItem.position[$stageAxis]
    NewUIValue=($stageInitialItem.position[$stageAxis]+$stageDelta)
    InitialPath=$stageInitialPath
} | Format-List
```

### C. FURNISHED REFERENCE — CHECK TERMINAL B

Only after editing the SAME item and saving. Requires A and B's initial path.
Keep the printed FurnishedPath permanently for D/F. Expected true fields:
FurnishedReferenceCaptured, PositionChanged, RotationChanged,
SameItemParentAsset, ScalePreserved, ElevationPreserved, OriginalRoomsPreserved.
This is a NEW reference; the old room hash is no longer the furnished expectation.

```powershell
$stageInitialPath = Read-Host 'Paste the full initial JSON path printed by B'
$stageInitial = Read-StageRecord $stageInitialPath 'initial'
$stageFurnished = Get-StageScene
$stageCandidatePath = Save-StageEvidence 'C-candidate' $stageFurnished
Assert-StageEdit $stageInitial $stageFurnished
Assert-Stage ($stageFurnished.graphHash -cne $stageRooms.graphHash) 'Furnished hash must differ from the room-only hash.'
Assert-Stage ((Read-Host 'Same chair visibly moved/rotated, scale/elevation retained, and Ctrl+S save succeeded? Type YES') -ceq 'YES') 'Edited visual/save evidence still pending.'
$stageFurnishedPath = Save-StageEvidence 'furnished' ([pscustomobject]@{
    kind='furnished'; scene=$stageFurnished; initialPath=$stageInitialPath
    initialHash=(Get-FileHash -LiteralPath $stageInitialPath -Algorithm SHA256).Hash
    observation='USER-REPORTED: same chair moved/rotated; scale/elevation retained; save succeeded'
})
Get-ItemSnapshot $stageFurnished $stageInitial.itemId | ConvertTo-Json -Depth 20
[pscustomobject]@{
    FurnishedReferenceCaptured=$true; PositionChanged=$true; RotationChanged=$true
    SameItemParentAsset=$true; ScalePreserved=$true; ElevationPreserved=$true
    OriginalRoomsPreserved=$true; Version=$stageFurnished.version
    NodeCount=$stageFurnished.nodeCount; GraphHash=$stageFurnished.graphHash
    FurnishedPath=$stageFurnishedPath
} | Format-List
```

### D. REFRESH COMPARISON — CHECK TERMINAL B

After browser refresh and visual inspection. Requires A and C's exact path.
Expected SameScene, SameItemAssetPose, OriginalRoomsPreserved,
SameFurnishedGraph and SameGraphHash all True. Version may advance.
A thrown error stops acceptance even if preceding fields were True.

```powershell
$stageFurnishedPath = Read-Host 'Paste the full furnished JSON path printed by C (never recapture it here)'
Test-StageFurniture 'D-refresh' $stageFurnishedPath
```

### E. CONTROLLED STOP CHECK AND CONDITIONAL SOURCE RESTART

First close saved scene tabs, then Ctrl+C in SERVER TERMINAL A.
Run this read-only listener check in CHECK TERMINAL B (requires A).
Listener enumeration errors must throw; they are not treated as an empty port.
Retain the E-stop evidence path and founder Ctrl+C observation.

```powershell
$stageListeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop |
    Where-Object LocalPort -EQ 3002)
[pscustomobject]@{ SERVER_STOP_CONFIRMED=($stageListeners.Count -eq 0) } | Format-List
Assert-Stage ($stageListeners.Count -eq 0) 'Port 3002 still listening; stop here. Do not restart or kill processes.'
$stageStopPath = Save-StageEvidence 'E-stop' ([pscustomobject]@{
    sceneId=$stageSceneId; checkedAtUtc=[DateTime]::UtcNow.ToString('o')
    SERVER_STOP_CONFIRMED=$true; port=3002
})
```

Only after SERVER_STOP_CONFIRMED=True, run the following in SERVER TERMINAL A.
It is the founder-owned source launch, not a diagnostic/agent-executed block.
It checks the existing DB, exact Bun binary/version, free port and build exit.
No replacement DB or fallback port is permitted. Wait for the ready message.

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath 'D:\Open_Source_Repository\Pascal Editor'
$stageBun = 'C:\Users\vivek\.bun\bin\bun.exe'
if (-not (Test-Path -LiteralPath $stageBun -PathType Leaf)) { throw 'Pinned Bun executable missing.' }
$stageBunVersion = & $stageBun --version
if ($LASTEXITCODE -ne 0 -or $stageBunVersion -cne '1.3.14') { throw 'Bun 1.3.14 required.' }
$env:Path = 'C:\Users\vivek\.bun\bin;' + $env:Path
$env:PORT = '3002'
$env:PASCAL_DB_PATH = 'C:\Users\vivek\AppData\Local\PascalSourceMVP\pascal.db'
$env:PASCAL_EDITOR_ORIGIN = 'http://localhost:3002'
if (-not (Test-Path -LiteralPath $env:PASCAL_DB_PATH -PathType Leaf)) { throw 'Existing DB missing; do not create a replacement.' }
$stageListeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object LocalPort -EQ 3002)
if ($stageListeners.Count) { throw 'Port occupied; do not start another server or change port.' }
& $stageBun run build --filter=@pascal-app/nodes --filter=@pascal-app/mcp
if ($LASTEXITCODE -ne 0) { throw 'Prerequisite builds failed; do not start.' }
if (-not (Test-Path -LiteralPath $env:PASCAL_DB_PATH -PathType Leaf)) { throw 'DB missing after builds; stop.' }
$stageListeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object LocalPort -EQ 3002)
if ($stageListeners.Count) { throw 'Port became occupied; do not start.' }
& $stageBun run dev --filter=./apps/editor --only -- --hostname 127.0.0.1 --port 3002
```

### F. POST-RESTART COMPARISON — CHECK TERMINAL B, BEFORE BROWSER REOPEN

Requires A's helpers and C's exact furnished file. If B was closed, run A
again to load its helpers; retain the original B/C files. Do not recapture C.
Expected the same five comparison booleans as D, all True, with no exception.

```powershell
$stageFurnishedPath = Read-Host 'Paste the SAME furnished JSON path printed by C'
Test-StageFurniture 'F-before-browser' $stageFurnishedPath
```

Then reopen http://localhost:3002/scene/b34a488e561b and confirm the same
rooms/materials and chair mesh/pose. Return screenshots/observations marked
USER-REPORTED, B/C paths, D/F outputs/current paths, and the E stop output/path.
A screenshot/API response cannot substitute for the other evidence type.

## H. Acceptance, deferred Stage 2 and final inventory

| Outcome | Current status / evidence needed |
| --- | --- |
| Stage 1B room-only restart | PASS — existing founder-provided evidence retained |
| Existing ItemsPanel implementation | IMPLEMENTED; prior scoped checks retained |
| Items visibility in named scene | PENDING — founder UI observation |
| Real asset mesh/materials | PENDING — founder screenshot/observation, loading errors if any |
| Initial furniture save | PENDING — B and successful UI-save evidence |
| Same-item transform edit | PENDING — B → C position/rotation, parent/asset, scale/elevation |
| Original room preservation after furniture | PENDING — B/C comparison by original IDs/fields |
| Refresh persistence | PENDING — D API plus founder visual result |
| Verified furniture stop | PENDING — E listener evidence plus founder stop action |
| Post-restart API integrity | PENDING — F against C before opening browser |
| Post-restart visual appearance | PENDING — founder screenshot/observation after F |
| Furniture runtime acceptance | **PENDING** |
| Global lint/tests | **OPEN**, unchanged failures detailed in B and baseline |
| Stage 2 | **NOT STARTED** |

Only after all furniture outcomes pass, prepare (do not execute) the Stage 2
proposal. Inspect the actual source-built MCP entrypoint, transport/loopback
endpoint and tool schemas/side effects from this checkout for this exact DB
and scene. Do not assume /api/mcp or use the separately managed Pascal CLI
runtime. Consult official current Codex documentation for the installed IDE
version and Codex config.toml, without assuming CLI availability or substituting
VS Code/Copilot mcp.json. Preserve existing settings and secrets; no config edits
or live connection are authorized now.

The later proposal must start with verified read-only/discovery tools and a
separately authorized integration test: pause manual editing, load the saved
scene, move the existing target +0.10 m local X only, verify saved/browser
results, freshly recheck for intervening edits, and restore only that position
if a guarded inverse is still valid. No browser Ctrl+Z, whole-graph restore,
assumed universal transaction, or blind retry after an uncertain mutation.
This would be development integration, not a completed customer assistant.

Git inventory remains the existing 22-addition/1-deletion scene-loader patch
and the two untracked reports. Only the two reports were edited in this
continuation. Source fingerprint before/after is checked; no source/test/config,
AGENTS, layout, dependency, server lifecycle, MCP, commit/push/deploy, or
scene/database mutation. Historical hydration attributes remain historical;
no proven extension cause or warning suppression is claimed.

Final commands: `git diff --stat` and
`git status --short --untracked-files=all`. Untracked reports do not appear in
the tracked diff stat.

## I. Current-device manual furniture acceptance — 2026-10-14

**STAGE 1C: PASS for the existing procedural cabinet. STAGE 2A READY = YES.** This acceptance reuses furniture already present instead of inserting a duplicate. It does not establish external catalog GLB loading or repeat the historical chair scenario.

Repository: `D:\PascalEditor`, branch `work/mvp-progress-2026-10-13`, HEAD `c728ad82ab641c43e9085f71913ed2b210aa5085`. Database: `C:\Users\HP\AppData\Roaming\Pascal\data\pascal.db`. Scene: `ad601e76827b`, Untitled scene, 14 nodes. API and read-only SQLite graph comparison matched during preflight and after server stop.

Target: Modular Cabinet `cabinet_10bw9r9jnsw9w9km`, parent `level_lbuhba1p0ffg4ugq`, child Base Cabinet `cabinet-module_dx4f536ya6n0stpo`. Geometry is generated by `buildCabinetGeometry`; there is no external asset ID or stored scale field. Assembly and module dimensions, model-defining fields, and child identity were preserved exactly.

| Evidence | Initial | Accepted final |
| --- | --- | --- |
| Scene version | 23 | 43 |
| Position (metres) | [-9.52200233019024, 0, -8.149999999999999] | [-8.5539346076198, 0, -7.166403059444667] |
| Rotation (radians) | 0 | 24.347343065320896 |
| Graph hash | 6ce707cde912d189ff7b04695601008ab8e80f8463aef51852644c34dcada774 | ecf1b07d2732cf1189e0389d551e66e8f9f12edf11f48e95289ca6c5a5e0c102 |

The original precise 0.20 m / 15 degree suggestion was withdrawn because this cabinet has no numeric X inspector. The founder performed a visible manual edit and explicitly accepted the resulting pose: +0.9680677225704404 m X, +0.9835969405553318 m Z, unchanged elevation; stored rotation 1395 degrees (equivalent to 315 degrees). It is not reported as a precise 0.20 m movement.

Only additional graph differences were cabinet layout revision 4 to 7 and a new supportSlabId pointing to existing `slab_0003kp4b0r924jsc`. The founder confirmed the intended pose and correct floor support before the final reference was captured. Every other node, room geometry, cabinet dimension/content, root, material, collection, and plugin field was preserved relative to the initial checkpoint. No prior room-only checkpoint for this device was fabricated.

| Acceptance check | Result |
| --- | --- |
| Visible real cabinet geometry/materials and selection controls | PASS, founder-reported |
| Normal UI save | PASS, founder-reported Ctrl+S action plus saved API state |
| Manual move and rotation | PASS, saved pose changed; founder accepted actual pose |
| Same identity, parent, dimensions and contents | PASS, graph comparison |
| Original room preservation | PASS, all non-target graph content unchanged |
| Browser refresh | PASS, founder visual confirmation and identical API graph/hash |
| Close and reopen | PASS, founder visual confirmation and identical API graph/hash |
| Source-server stop | PASS, founder forced only the verified editor process tree; agent confirmed port free |
| Restart, before browser reopening | PASS, API graph/hash identical at version 43 |
| Restart, after browser reopening | PASS, founder confirmed all requirements; final API still identical |

All visual observations came from founder chat confirmations, not agent-operated browser inspection or screenshots. No agent-controlled scene edits, MCP calls, database writes/restoration, dependency changes, or source changes were performed in this acceptance workflow.

Checkpoint directory outside Git: `C:\Users\HP\AppData\Local\PascalSourceQA\checkpoints`. These are scene-response evidence files, not database backups. Existing references were retained:

- `initial-1791956162678.json`
- `edit-observed-1791956546154.json`
- `final-position-1791956784957.json`
- `refresh-1791956932125.json`
- `reopen-1791957289442.json`
- `restart-before-browser-1791957838760.json`
- `accepted-1791957983317.json`

The first non-forced taskkill failed; founder `taskkill /PID 9876 /T /F` succeeded and listener absence was independently verified. The first Bun restart command printed help and did not start a server. The successful founder-controlled restart ran from `D:\PascalEditor\apps\editor`, pinned the existing PASCAL_DB_PATH, and executed:

```powershell
node ../../node_modules/dotenv-cli/cli.js -e ../../.env.local -e ../../.env.defaults -- node ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3002
```

The new listener was verified on 127.0.0.1:3002. Database and saved graph survived the forced stop. No full build/lint/test rerun was required for report-only changes; historical unrelated failures remain open. External catalog-item insertion/loading remains outside this cabinet acceptance. No existing daily development log was found; proposed future location is `docs/mvp/DAILY-DEVELOPMENT-LOG.md`, not created here.

Next milestone: Stage 2A inspection against this same scene and database, with fresh identity/version checks. Stage 2B mutations remain unauthorized. Stop after this acceptance report.

