# QC findings

Date: 2026-10-14. These are observed local-check results, not a full architecture or security review.

## QC-01: Repository formatting gate fails

Priority: medium. `bun run check` exited 1: 3002 files checked, 3002 errors, seven informational diagnostics. Sample output shows CRLF-to-LF differences; Git `core.autocrlf` is `true`.

Follow-up command `bun x biome check --formatter-enabled=false --max-diagnostics=10` exited 0 with seven informational diagnostics. This isolates the current blocking Biome errors to formatting. It does not prove every formatting diagnostic is exclusively about line endings.

Recommended action: agree on repository line-ending policy, inspect formatter changes, then rerun the standard check. Avoid a blind whole-repository rewrite. Evidence: `evidence/check.log`, `evidence/lint.log`.

## QC-02: CLI tests fail on this Windows environment

Priority: high for cross-platform release acceptance. `bun run test` exited 1. CLI reported 101 passes and seven failures across 108 tests in 11 files.

Observed failures include Unix permission-bit expectations in `diagnostics.test.ts` and `mcp-service.test.ts`, refusal to stop recorded test runtimes in `runtime.test.ts`, an unnamed cleanup failure with EBUSY, an executable-bit expectation in `tar.test.ts`, and EPERM when creating a symlink.

Recommended action: reproduce with the preferred Bun version, inspect Windows-specific behavior and test expectations, and validate Windows access control separately from POSIX mode bits. Do not weaken runtime identity safeguards to make tests pass.

## QC-03: Core tests also emitted failures before interruption

Priority: high for test acceptance. Observed failures:

- `polygon-boolean.test.ts:175`: expected development warning invocation count did not match.
- `structure-reconcile.test.ts:407`: Bun build failed opening `/D:/PascalEditor/packages/core/src/utils`.
- `procedural-items/schema-import.test.ts:8`: two bundle tests failed with `/D:/...` root-directory paths.

The path errors suggest URL-to-Windows-path handling needs inspection; this is an inference, not a verified fix. The warning assertion requires isolated reproduction. Turbo stopped on CLI failure, so the core suite has no complete result in this run. Evidence: `evidence/test.log`.

## QC-04: Release coverage is incomplete

Priority: high for release sign-off. The full test suite has not passed. Later scoped browser furniture and MCP scene workflows passed for one saved scene, but the broader interactive matrix remains open. Production application build, browser console audit, accessibility, performance, and plugin operation remain unverified. Scene persistence is verified for the specific Stage 1C–2B workflows only.

`bun run check-types` passed all 11 tasks, including package build prerequisites. This does not replace a production build: `apps/editor/next.config.ts` sets `typescript.ignoreBuildErrors` to true, so the independent type gate should remain part of acceptance.

The later [Stage 1C cabinet acceptance](../docs/mvp/STAGE-1C-NAMED-SCENE-ITEMS.md#i-current-device-manual-furniture-acceptance--2026-10-14) and [Stage 2B table move/restoration](../docs/mvp/STAGE-2B-FIRST-CONTROLLED-EDIT.md) did not rerun the global Biome check or repository test suite. QC-01 through QC-03 therefore retain their recorded failure status. The table movement was founder-confirmed visually; restoration was confirmed by saved API, SQLite and MCP graph equality, with no separate founder visual check after restoration.

## Historical finding status

Existing root `design-qa.md` describes an earlier loading blocker and missing export. That document was not overwritten. The current type check passes and HTTP routes respond, but the historical dimension-rendering scenario was not replayed. Its visual acceptance remains unverified.
