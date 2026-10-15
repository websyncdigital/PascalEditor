# Dependency assessment

## Verification performed

`bun install --frozen-lockfile` completed successfully: 787 installs across 927 packages, no changes. Existing dependencies were already installed; no additional package was required. The lockfile and package manifests were preserved.

| Component | Observed | Assessment |
| --- | --- | --- |
| Node.js | 22.14.0 | Meets documented minimum 20.9.0 |
| Bun | 1.4.3 | Meets setup minimum 1.3+; differs from packageManager preference 1.3.14 |
| Next.js | 16.3.0 | Matches root override |
| React / React DOM | 19.2.7 / 19.2.7 | Matching installed pair |
| Three.js | 0.186.0 | Matches root override |
| Root TypeScript | 6.0.3 | Matches root manifest |
| Windows Tailwind Oxide | 4.3.0 | Native package resolves |
| Windows Lightning CSS | 1.32.0 | Native package resolves |
| Windows Next SWC | 16.3.0 | Native package resolves |

The application started with 53 core node kinds and seven discovered plugins in its server log. A successful installation and startup do not establish the behavior of every plugin.

## Run locally

From `D:\PascalEditor`:

```powershell
bun install --frozen-lockfile
bun dev
```

The running background development process was started with root PID `13568`; process IDs are valid only for this session. The root dev command starts the editor on port 3002, IFC converter on port 3003, and package watchers. Do not start another copy while these ports are occupied.

Live stdout/stderr are stored in `C:\Users\HP\AppData\Local\Temp\pascal-qa-20261014`. Evidence files in this folder are snapshots, not live logs.

## Limits and follow-up

- Repeat failed tests with Bun 1.3.14 before attributing all behavior to repository code; this assessment used the already installed 1.4.3 runtime.
- `bunx` was not available on PATH in this session; `bun x` successfully ran the installed Biome executable.
- No dependency upgrades, vulnerability audit, or license audit were performed. Installation success is not a security certification.
