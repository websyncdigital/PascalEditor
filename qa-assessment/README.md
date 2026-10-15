# QA and QC assessment

Assessment date: 2026-10-14 (Asia/Calcutta).
Baseline commit: `c728ad82ab641c43e9085f71913ed2b210aa5085`.
Environment: Windows, Node 22.14.0, Bun 1.4.3.

## Result

Local development startup and dependency verification passed. The editor at http://localhost:3002 returned HTTP 200, as did `/scenes`. TypeScript checks passed. Release acceptance remains blocked by formatting failures, test failures, and incomplete interactive coverage. The table below records the original repository QA run; later scene acceptance is recorded separately below.

| Check | Result | Evidence |
| --- | --- | --- |
| Frozen dependency installation | PASS | 787 installs checked across 927 packages; no changes required |
| Editor startup | PASS | Next.js ready; GET / returned 200, 156090 bytes |
| Scene list route | PASS | GET /scenes returned 200, 125116 bytes |
| Type checking | PASS | 11 of 11 Turbo tasks successful |
| Biome check | FAIL | 3002 errors and 7 informational diagnostics |
| Biome without formatter | PASS | 3002 files checked; 7 informational diagnostics |
| Repository test command | FAIL / INCOMPLETE | CLI: 101 passed, 7 failed; other tasks interrupted |
| Browser interaction and visual acceptance in the original QA run | NOT RUN | HTTP success alone did not verify client-side hydration or WebGL; later scoped acceptance is below |
| Production application build | NOT RUN | Development startup and package builds verified only |

## Reports

- [Dependency assessment](DEPENDENCIES.md)
- [QC findings and reproduction](QC-FINDINGS.md)
- [QA coverage and acceptance plan](QA-COVERAGE.md)
- [MCP connection history](MCP-CONNECTION.md)
- [Stage 1C furniture acceptance](../docs/mvp/STAGE-1C-NAMED-SCENE-ITEMS.md)
- [Stage 2A source MCP inspection](../docs/mvp/STAGE-2A-MCP-CONNECTION.md)
- [Stage 2B controlled move and restoration](../docs/mvp/STAGE-2B-FIRST-CONTROLLED-EDIT.md)
- [Master project development register](../docs/mvp/PROJECT-DEVELOPMENT-REGISTER.md)

Raw command logs are in `evidence/`. No application-source fixes or broad formatting changes were made as part of this assessment.

## Later scoped acceptance — 2026-10-14

The founder confirmed that the procedural cabinet was visible and editable through save, refresh, reopen and source-server restart. Saved API and SQLite checks retained its identity and room graph ([Stage 1C](../docs/mvp/STAGE-1C-NAMED-SCENE-ITEMS.md#i-current-device-manual-furniture-acceptance--2026-10-14)). Later, a browser screenshot and saved scene showed one catalog dining table and three chairs; their model visibility was founder-reported.

Codex's source-built MCP connection inspected the same saved scene without persistent changes ([Stage 2A](../docs/mvp/STAGE-2A-MCP-CONNECTION.md)). With separate founder approvals, one MCP patch moved the dining table 0.10 m along parent-local X, the founder confirmed the visible movement, and one guarded inverse restored its original position ([Stage 2B](../docs/mvp/STAGE-2B-FIRST-CONTROLLED-EDIT.md)). The saved scene went from version 69 to 70 to 71. At version 71, the entire graph and hash `fab823632da2e0decc57462a2db340a71e7575eabd7473fbb10d5997e4d0c287` match the pre-move baseline. Scene validation passed and the declared item-footprint collision check found no collisions. The project MCP allowlist was returned to its original four inspection tools.

These milestones cover one scene and specific furniture workflows. They do not supersede the original Biome/test failures, complete the broader interactive matrix, or establish a production build. A separate founder visual confirmation after restoration was not recorded; the restored saved state was verified through the browser API, SQLite and MCP.
