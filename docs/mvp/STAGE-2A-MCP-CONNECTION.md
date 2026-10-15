# Stage 2A: source-built MCP connection

## Current decision

**VERIFIED — 2026-10-14.** Codex's live source-built MCP tools inspected the accepted scene and cabinet; browser API and SQLite evidence matched, with no persistent changes. The original blocked attempt and readiness evidence are retained below. No Stage 2B action was taken.

## Repository discovery

- Workspace and Git root: `D:\PascalEditor`.
- Branch: `work/mvp-progress-2026-10-13`.
- HEAD: `c728ad82ab641c43e9085f71913ed2b210aa5085`.
- Root instructions: `AGENTS.md`; no override was found by the repository file search.
- Bun/Turbo monorepo with `apps/*`, `packages/*`, and `tooling/*` workspaces.
- Initial tracked diff: empty. Existing untracked `.codex/config.toml` and `qa-assessment/` were preserved.

## Prerequisite evidence

Current evidence superseding the original blocker: section I of `STAGE-1C-NAMED-SCENE-ITEMS.md` records manual cabinet editing, save, refresh, close/reopen, and source-server restart acceptance. Scene `ad601e76827b`, cabinet `cabinet_10bw9r9jnsw9w9km`, database `C:\Users\HP\AppData\Roaming\Pascal\data\pascal.db`, final version 43 and graph hash `ecf1b07d2732cf1189e0389d551e66e8f9f12edf11f48e95289ca6c5a5e0c102`. Founder visual observations and independently compared saved API responses both passed. External catalog GLB acceptance is not claimed.

### Original blocked attempt

`STAGE-1-BASELINE.md` reports furniture runtime acceptance PENDING. The acceptance table in `STAGE-1C-NAMED-SCENE-ITEMS.md` (lines 680 onward) marks real asset visibility, initial save, same-item editing, refresh persistence, and post-restart appearance/integrity PENDING.

`../../qa-assessment/MCP-CONNECTION.md` separately records earlier source MCP inspection of a saved modular cabinet. That report is historical evidence, not proof that manual furniture placement, save, refresh, and reopen acceptance has passed. Its scene ID and database path were not adopted as the current target.

Missing acceptance: identify the current intended scene, demonstrate a real editable furniture model, save it, refresh and reopen that same scene, and verify the same item ID, asset or model identity, parent, and transform with visual observations and saved API evidence. The existing Stage 1C procedure additionally requires controlled restart verification.

## Source implementation located

- `packages/mcp/package.json`: package version 1.0.3, executable `dist/bin/pascal-mcp.js`, source build and start scripts.
- `packages/mcp/src/server.ts:33`: `createPascalMcpServer`.
- `packages/mcp/src/tools/index.ts:44`: `registerTools`.
- `packages/mcp/src/bin/pascal-mcp.ts:69`: HTTP startup; line 94: stdio startup.
- `packages/mcp/src/storage/sqlite-scene-store.ts:97`: `resolveDefaultDatabasePath`; line 284: `SqliteSceneStore`; lines 332 and 453: save/load implementations.
- `packages/mcp/src/tools/scene-lifecycle/load-scene.ts:33`: `registerLoadScene`; reads the saved graph and replaces session graph/active-scene metadata.

These locations establish implementation presence only. Runtime server version, active database, current scene identity, graph hashes, and tool results were not verified in this gated attempt.

## Checks and scope

Executed Git root/branch/HEAD/status commands, repository instruction and manifest reads, source searches, and progress-report inspection. No builds or tests were run because the prerequisite failed. No official configuration proposal or user-level settings change was attempted.

No existing daily project log was found in `docs/mvp`; this report records the blocked attempt without rewriting historical reports. Only this new report was added.

## Resume condition

Stage 1C evidence is now recorded. Resume Stage 2A only when requested, with fresh API/database identity checks, inspection of existing configuration, any required configuration approval, actual MCP results, and before/after persistence verification. Stage 2B remains blocked. No configuration or MCP connection was changed during this readiness update.

## Completed Stage 2A verification — 2026-10-14

The existing connection was reused without config edits. Stage 1C section I and its retained acceptance checkpoint establish manual procedural-furniture save, edit, refresh, reopen, and source-restart acceptance. Discovery reconfirmed the same Git root, branch, revision, and existing changes. Only one supplied workspace root was identified. No source build, dependency installation, scene edit, managed CLI runtime, or HTTP MCP launch was performed.

### Resolved connection and access policy

- Server name: `pascal-dev`; server runtime version: `1.0.3`, verified with the local source entrypoint's `--version`. Earlier handshake evidence also recorded 1.0.3; this run does not claim new handshake metadata from the live tool API.
- Transport: stdio. This is simpler than a separate HTTP listener and requires no MCP port or bearer token.
- Executable: `C:\Users\HP\AppData\Local\Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64\bun.exe`.
- Arguments: `D:\PascalEditor\packages\mcp\dist\bin\pascal-mcp.js`, `--stdio`.
- Working directory: `D:\PascalEditor`.
- Environment: `PASCAL_DB_PATH=C:\Users\HP\AppData\Roaming\Pascal\data\pascal.db`.
- Project configuration: `.codex/config.toml`. Existing user-level MCP registration names were inspected without displaying unrelated settings; no user-level Pascal registration or config change was needed.
- Codex CLI: `0.162.0-alpha.17.2`; installed VS Code extension: `openai.chatgpt-26.1007.21434-win32-x64`.
- Installed CLI `codex mcp get pascal-dev` resolves the source command and four-tool allowlist. The four tools are available and callable directly in this Codex session, so no reload is required now.

Current official documentation confirms stdio command/args/env/cwd and `enabled_tools` allowlisting: https://learn.chatgpt.com/docs/extend/mcp?surface=cli. Proposal delta is empty: preserve the working configuration. User-level approval and backup requirements were not triggered because user-level configuration was not written.

Allowed tools and actual side effects:

| Tool | Inspection contract |
| --- | --- |
| `list_scenes` | Reads persisted scene metadata; optional projectId and limit |
| `get_scene` | Exports session nodes, rootNodeIds and collections |
| `get_node` | Returns the node identified by id |
| `load_scene` | Reads saved scene by id and replaces session memory/active metadata; no scene save or event publication |

`load_scene` is not strictly read-only in session memory and carries a destructive annotation. Source review of `registerLoadScene`, `loadStoredScene`, and `SqliteSceneStore.load` established its non-persistent behavior. It was used deliberately to inspect the correct saved scene. `list_scenes`, `get_scene`, and `get_node` advertise read-only annotations. Persisted mutation, patch, creation, delete, undo and redo tools are absent from the allowlist. No explicit per-tool approval override is configured; the capability allowlist provides the restriction. This does not make the underlying database or shell read-only.

### Actual returned scene and furniture

- Browser API: `http://127.0.0.1:3002/api/scenes/ad601e76827b`.
- Scene: `ad601e76827b`, Untitled scene, version 43, 14 nodes.
- Initial/final graph hash: `ecf1b07d2732cf1189e0389d551e66e8f9f12edf11f48e95289ca6c5a5e0c102`.
- Room: `zone_xx99pa06llnx2cgv`.
- Furniture: Modular Cabinet `cabinet_10bw9r9jnsw9w9km`.
- Parent: `level_lbuhba1p0ffg4ugq`; support: `slab_0003kp4b0r924jsc`.
- Position: `[-8.5539346076198, 0, -7.166403059444667]`.
- Rotation: `24.347343065320896` radians.
- Child: Base Cabinet `cabinet-module_dx4f536ya6n0stpo`, three drawers and double-door compartment with two shelves.
- Model identity: built-in procedural cabinet (`buildCabinetGeometry`), not an external catalog asset. Asset and scale fields are absent, not null/default values invented for the test.

### Verification results

1. Read-only SQLite graph matched the browser API before MCP calls.
2. Live `list_scenes` and `load_scene` returned the same scene ID, version, node count and graph hash.
3. Live `get_scene` returned all 14 node payloads and roots identical to the browser API; `get_node` inspected both cabinet nodes.
4. After inspection, API graph, graph hash and version were unchanged.
5. SHA256 of all scene, revision and event rows was identical before and after inspection. No persistent graph/revision/event mutation occurred.

Complete before/MCP/after evidence: `C:/Users/HP/AppData/Local/PascalSourceQA/checkpoints/stage2a-verified-1791958356599.json`. This is a unique evidence artifact outside Git, not a database backup.

Executed checks: Git discovery/status, source and schema inspection, installed Codex MCP resolution/version, source server version command, live MCP calls, API comparison, read-only SQLite before/after comparison, and `git diff --check`. No application tests were rerun for report-only changes; historical unrelated formatting/test failures remain open. No daily project log exists; the proposed location remains `docs/mvp/DAILY-DEVELOPMENT-LOG.md`, not created here.

Stage 2A is complete. Stage 2B requires a separate explicit request, a reviewed mutation-tool access change, and fresh scene/version checks plus a guarded restoration procedure. External catalog asset loading is outside this verified cabinet scope. Stop here; no cabinet movement was performed.
