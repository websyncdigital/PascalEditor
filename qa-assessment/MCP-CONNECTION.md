# Pascal MCP connection verification

Date: 2026-10-14. **Current status:** Stage 2A source-built MCP tools were detected and used in the Codex session; Stage 2B completed one approved table move and guarded restoration. The original connection observations and earlier reload instruction below are historical. Current configuration again exposes only four inspection tools. See the [Stage 2A](../docs/mvp/STAGE-2A-MCP-CONNECTION.md) and [Stage 2B](../docs/mvp/STAGE-2B-FIRST-CONTROLLED-EDIT.md) reports for complete evidence.

- Codex VS Code project configuration: `D:\PascalEditor\.codex\config.toml`.
- Source-built entry point: `D:\PascalEditor\packages\mcp\dist\bin\pascal-mcp.js`.
- Transport: stdio, using the installed Bun executable.
- Explicit database: `C:\Users\HP\AppData\Roaming\Pascal\data\pascal.db`.
- MCP handshake returned `pascal-mcp-server` version `1.0.3`.
- The installed VS Code Codex executable accepted the configuration with `codex mcp get pascal-dev`.
- Enabled tools: `list_scenes`, `load_scene`, `get_scene`, and `get_node`. Persisted mutation tools are excluded. Source inspection confirms `load_scene` reads the database and replaces only session memory; its destructive annotation concerns replacing that in-memory scene.

## Read-only evidence

The editor's `GET http://localhost:3002/api/scenes`, a direct read-only SQLite SELECT, and the source-built server's MCP `list_scenes` call all returned an empty scene list. No scene was created or saved. Scene, revision, and event rows compared equal before and after the MCP probe.

The initial empty result above was superseded after the user supplied the scene URL. The same database now contains the verified target below.

## Important session distinction

The stock MCP server initializes an in-memory default graph. Each new session must call `load_scene` with the verified ID before inspecting nodes. The verification used a fresh session and made no save or mutation calls.

Reload the Codex VS Code session to discover the new project MCP entry. Extension-session tool discovery has not been observed directly; the configured process was independently verified using the MCP SDK.

Persisted edit tools remain disabled; edits require a separate explicit request.

## Verified target and follow-up evidence

- URL: http://localhost:3002/scene/ad601e76827b
- Scene: `ad601e76827b`, **Untitled scene**, version 19, 14 nodes.
- Graph hash: `6ce707cde912d189ff7b04695601008ab8e80f8463aef51852644c34dcada774`.
- Furniture: **Modular Cabinet**, `cabinet_10bw9r9jnsw9w9km`.
- Position: `[-9.52200233019024, 0, -8.15]`; rotation: 0.
- Child: **Base Cabinet**, `cabinet-module_dx4f536ya6n0stpo`, stored width 1.2, depth 0.8, carcass height 0.8. It contains three drawers and a double-door compartment with two shelves.

The editor API graph matched the exact SQLite graph JSON. MCP `load_scene` returned the same ID, version, graph hash, and node count. MCP `get_node` and `get_scene` returned cabinet payloads identical to the editor API. All scene, revision, and event rows compared equal before and after these calls. Neither the scene nor furniture was modified.

## Later verified connection and edit — 2026-10-14

Stage 2A detected and called `mcp__pascal_dev` tools directly in the Codex session. For Stage 2B, the founder added catalog furniture to the same saved scene. The live API, read-only SQLite and source-built MCP agreed on scene `ad601e76827b`, version 69, with 18 nodes including a dining table and three chairs. The table's catalog asset ID was `dining-table-mo9ms5yh`; the full pre-move graph hash was `fab823632da2e0decc57462a2db340a71e7575eabd7473fbb10d5997e4d0c287`.

After explicit founder approval, project-level `.codex/config.toml` temporarily allowed `validate_scene`, `check_collisions` and `apply_patch`. The running Codex tool namespace retained its earlier four-tool cache, so a local MCP SDK client launched the same repository-built stdio server and called Pascal's validated tools directly. One position-only `apply_patch` moved the table +0.10 m along its parent-local X axis. The founder confirmed visible movement. A separately approved inverse restored only the original position after an exact version-70 graph check. Saved versions progressed 69 → 70 → 71, and the final full graph and hash match the version-69 baseline. SQLite, API and MCP matched; validation and declared item-footprint collision checks passed.

The project MCP config was returned byte-for-byte to its pretest backup; `codex mcp get pascal-dev` again lists only `list_scenes`, `load_scene`, `get_scene`, and `get_node`. Exact tool calls, graph hashes, backup and unique checkpoint paths are in the [Stage 2B report](../docs/mvp/STAGE-2B-FIRST-CONTROLLED-EDIT.md). No general mutation access remains enabled in Codex.
