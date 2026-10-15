# QA coverage and acceptance plan

## Executed scope

The original assessment verified locked dependency installation, native Windows package resolution, development startup, editor HTTP responses, repository formatting/lint checks, type checks, and one repository test invocation. See the summary and raw logs for results. Later scoped scene acceptance is linked below; the original logs have not been rerun or rewritten.

HTTP 200 alone establishes server rendering and routing only. Later founder-reported browser observations and independently checked saved scene data establish interactivity and persistence for specific furniture workflows. No release-ready claim is made.

## Interactive acceptance status after later scoped tests

| Scenario | Acceptance criteria | Status |
| --- | --- | --- |
| Open editor | Canvas initializes; no persistent loader or uncaught console error | Partial: founder showed rendered furniture; console audit not recorded |
| Create scene | New scene opens with working controls | Not run |
| Save and reload | Authored geometry and metadata survive reload | Partial: cabinet and room passed refresh/reopen/restart; later catalog item saved; full scenario matrix open |
| 2D / 3D switching | Both views load and retain consistent scene state | Not run |
| Place and move geometry | Applicable interactions behave consistently in both views | Partial: browser cabinet edit and 3D catalog-table MCP move/restoration passed; 2D parity not checked |
| Selection and history | Select, move, undo, redo produce expected state | Partial: founder selected cabinet; undo/redo not tested |
| Internal dimensions | Baselines, witness lines, ticks, values clear walls; perimeter door width visible | Not run |
| Plugins | Each bundled plugin can initialize and perform its principal operation | Not run |
| IFC import / export | Representative file converts; dimensions and placement remain valid | Not run |
| Keyboard and accessibility | Focus is visible; primary controls work without pointer | Not run |
| Responsive layout | Controls remain usable on small laptop viewport | Not run |
| Production build | `bun run build` succeeds and production routes respond | Not run |

## Acceptance sequence

1. Reproduce and resolve QC-01 through QC-03 with an agreed runtime and Windows support policy.
2. Rerun `bun run check`, `bun run check-types`, and the full `bun run test` to completion.
3. Run the production build and smoke-test it independently of development servers.
4. Execute the interactive scenarios above using disposable scenes; record screenshots and console evidence.
5. Mark release acceptance only after all required gates pass or specific exceptions have been explicitly accepted.

## Scoped scene evidence — 2026-10-14

- [Stage 1C](../docs/mvp/STAGE-1C-NAMED-SCENE-ITEMS.md#i-current-device-manual-furniture-acceptance--2026-10-14): founder-confirmed cabinet geometry, controls, save, refresh, reopen and restart; saved scene/API integrity checked.
- [Stage 2A](../docs/mvp/STAGE-2A-MCP-CONNECTION.md): source-built MCP read-only scene and cabinet inspection matched saved API and database.
- [Stage 2B](../docs/mvp/STAGE-2B-FIRST-CONTROLLED-EDIT.md): saved catalog table and three chairs; approved 0.10 m table move visible to founder, followed by separately approved position-only restoration. Final scene graph matches the baseline at version 71; validation passed and declared item-footprint check found no collisions.

The catalog models' appearance was reported by the founder and shown in a supplied screenshot; the agent did not perform an independent browser model-load check. A separate visual confirmation after restoration was not recorded. The remaining table rows and acceptance sequence are pending checks, not claimed successful tests.
