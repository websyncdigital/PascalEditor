# Stage 6 — founder demonstration

Use the separate **Stage 6 manual room acceptance** scene:

<http://127.0.0.1:3008/scene/f4b34c4a42c1>

It runs from the production build of this checkout using a new temporary test database. The normal port-3007 scene is preserved. Current status and evidence: [Stage 6 assessment](STAGE-6-MVP-EVALUATION.md).

## What this demonstration establishes

The Assistant can propose supported designs and explicit commands, ask for approval and save real editable scene changes. It runs in free deterministic **Mock mode**. It is not a general conversational designer yet. No paid model account is required for these checks.

The exact phrases “Move the chair away from the doorway” and “Make the lighting warmer” are unsupported in this mode. Test that they make no change, then use the explicit supported commands below. Do not present those substitutions as proof that the original phrases work. The same-slab movement fix now supports manually moved furniture with a valid floor reference when it stays wholly on that floor. Moving between supports, ground-pinned furniture, changing the height offset and pinned deletion remain unsupported. Continue with the existing table; do not remove its support link or replace it to bypass a refusal.

## Remaining checks — one batch

**Result, 2026-10-15:** T1–T5 passed for the defined scope. Founder screenshots/reports and independent saved API/SQLite/history verification are recorded in [the batch acceptance](STAGE-6-MVP-EVALUATION.md#2026-10-15--batched-manual-acceptance-closed-with-screenshot-and-saved-history-evidence). Final scene is version 42, hash `fffb02a7f1864a50f2a4e126c10f9d8457a445c768927625e56ae2537867b48a`; table position `[-5.4, 0, 4.908630767842986]`, Y rotation 45°, lamp On/intensity 1.5/#ffbb66. The level child order changed without changing membership. Intermediate move flags persisted in history and remain an open recovery issue. Do not rerun this completed batch unless a relevant fix or regression requires it.

At the founder's request, run this remaining batch without waiting for a chat reply between passing tests. The earlier room, chair, design, approved table move and approved warm-light application checks are already recorded; do not repeat their approvals. The founder confirmed the intermediate blue and subsequent warm light edits were both intentional.

Use the same disposable scene linked above. Baseline: version 26, 14 nodes, graph hash `c7be786851bc5ef595e6dc6f98eb563a32a5d3810baebd7903d76a9a89d0284b`. Coffee table `item_p52sqw099amvtmt2` is at `[-4.390608254204141, 0, 3.594072605174318]`, rotation Y approximately 90 degrees. Lamp `item_y3apzq25uyf0z5z7` is On, intensity 1.5, color `#ffbb66`.

| Test | Action | Pass condition |
| --- | --- | --- |
| T1 — Manual refinement/save | Select only the coffee table. Move it a small distance into clear floor space and rotate it slightly using normal controls. Press Ctrl+S and wait for saving to finish. Note its displayed position/rotation or take a reference screenshot. | The same real table moves/rotates and saves without error; other objects and the room remain unchanged. |
| T2 — Refresh | Refresh the same browser scene without further editing. | Table retains the T1 pose; chair, sofa, lamp, floor/wall finishes and warm illumination remain intact. |
| T3 — Reopen/editability | Close the scene tab, reopen the same URL, and select the table and then the lamp without editing. | The T1 pose persists, real models and editing controls appear, and the lamp remains On at intensity 1.5/color `#ffbb66`, visibly illuminating the room. |
| T4 — Unsupported furniture request | In Assistant enter `Move the chair away from the doorway` and click Preview change only. Do not approve anything. | A clarification/unsupported response appears and nothing moves or saves. This is safe handling of a known language gap, not successful interpretation. |
| T5 — Unsupported lighting request | Enter `Make the lighting warmer` and click Preview change only. Do not approve anything. | Nothing changes or saves. A clarification is expected; the existing misleading style-related clarification remains a documented UI/language defect. |

Stop the batch if an error, unexpected scene change or missing model occurs; record the failing test and exact message, and mark later tests not run. Otherwise leave the final scene unchanged and reply once with `T1 PASS, T2 PASS, T3 PASS, T4 PASS, T5 PASS` or actual failures. Codex will compare the saved API, read-only SQLite and revisions against the baseline and manual-edit revision. Intermediate visual observations are founder-reported; this batch does not claim an independently captured API snapshot immediately before each browser action.

## Original full walkthrough (reference)

1. Open the link above. Check that the scene name is **Stage 6 manual room acceptance** and the Assistant reports **Mock mode · no paid API calls**.
2. Show the room created with the ordinary **Rooms → Rectangle** tool. Its saved dimensions are 6 × 5 metres. The founder has already confirmed save, refresh and reopen; the version-2 API/database graph is unchanged.
3. In **Items**, insert one real **Dining Chair** near a corner with free space. Wait for the chair geometry/materials. Select it, move and rotate it with normal controls, and press **Ctrl+S**.
4. Let the agent capture its saved ID, asset, parent/support and transform. Refresh and reopen; verify that the same chair stays visible and editable. Do not accept a fallback box or permanent loading display.
5. Open the **Assistant** tab and enter `Design this living room in a Scandinavian style`.
6. Click **Preview change**. The saved room must remain unchanged while you read the alternatives. Compare furniture, finishes, light settings and warnings. Oak is unavailable; the current proposal offers supported light concrete. A manually pinned chair should be preserved.
7. Select one alternative and click **Approve selected layout** once. Wait for the saved-result message. Do not edit during execution.
8. Show the actual sofa, coffee table if included, and floor-lamp models. Select the furniture to show its normal editing controls. A generated picture is not the result being tested.
9. Inspect the floor finish, light walls and actual warm lamp illumination. If a material appears plain, check the display mode; report the observation instead of assuming the texture loaded.
10. Enter `Move the chair away from the doorway`. This unsupported request should not save a change. The exact feature remains a gap. Select the AI-created coffee table and use `move selected by 0.10 m on x` for the supported movement check instead.
11. Preview the explicit move and verify nothing moves yet. Review the table ID and proposed position from the current saved state. At version 23, its X is approximately −4.4906 and the proposed X is −4.3906 metres; the earlier −4.75 reference is stale. Wait for the saved-state check, then approve once when instructed and confirm movement and a saved result. If validation refuses the move, retain the error; do not force a raw patch.
12. Enter `Make the lighting warmer`. It should not change the scene; the current misleading style clarification is a recorded language/UI gap. Use `set lamp color to #ffbb66` for the supported light-color check.
13. Preview and approve the color change. Confirm a visible warm-color change and that the lamp remains On. Inspect its Lighting controls to see the saved color. If it is Off, separately preview and approve `turn lamp on`.
14. Select the coffee table and manually move/rotate it a small distance into free space using the normal editor controls. This tests that AI-created furniture remains manually editable.
15. Press **Ctrl+S**, check for save/conflict errors and pause so the agent can capture a final reference. Do not claim exact 0.10 m for this manual edit unless the control actually provides that value.
16. Refresh the same scene. Compare the table pose, chair, sofa, lamp, room, finishes and illumination with the reference.
17. Close the tab and reopen the same URL. Do not edit/save during the comparison.
18. Select the table again. Confirm that the final scene remains visible, editable and error-free. The agent compares scene identity, version, graph hash and relevant node fields with the captured reference, allowing only explained version changes.

For current acceptance use the remaining-checks batch above; the full walkthrough preserves the original procedure and is not a request to repeat completed mutations. A blocked tool, missing model or persistence mismatch is evidence to record, not a reason to replace the scene. Successful browser observations are founder-reported; API/database comparisons are independently recorded.

## Restart only if this isolated server stops

The server is already running. These commands are for recovery after confirming port 3008 is free; do not start a second process over an occupied port.

```powershell
Set-Location 'D:\PascalEditor\apps\editor'
$env:PASCAL_DB_PATH = 'C:\Users\HP\AppData\Local\Temp\pascal-stage6-qa-533b3284cbfe4ff8869191a6d602fcb7\benchmark-b999322e-0985-4fec-9c1e-f3d2251d6d68.db'
$env:PASCAL_AI_PROVIDER = 'mock'
bun run start -p 3008 -H 127.0.0.1
```

Keep this terminal running and reopen the same URL. This reuses the verified database and the existing production build. Do not reset/restore a database if the scene is unavailable; diagnose the actual launch/database identity first.

## Readiness limit

The supported local mock demonstration passed. Global test failures, unsupported natural-language examples, intermediate move-state persistence/recovery, broader support-transition limits, missing paid-provider validation and public-pilot authorization/proxy controls remain open. Review [the assessment](STAGE-6-MVP-EVALUATION.md) before declaring full Stage 6 MVP acceptance.
