# Deutschimo V39.1 — Technical Hardening

V39.1 is intentionally a technical release. It does not add or remove learning
features and does not change the V39 Listening Laboratory product behavior.

## Scope

### 1. GitHub Actions runtime modernization

All tracked workflow files are scanned and legacy:

- `actions/checkout@v4` / `@v5`
- `actions/setup-node@v4` / `@v5` / `@v6`

references are upgraded to the repository's current runtime baseline:

- `actions/checkout@v6`
- `actions/setup-node@v7`

The objective is to eliminate the GitHub Actions Node 20 deprecation warnings
that were visible during V37–V39 staging runs.

### 2. Dedicated V39.1 technical health gate

`.github/workflows/v39-1-technical-health.yml` checks:

- pinned Node/npm toolchain
- lockfile consistency
- strict CI environment configuration
- V39 backward compatibility
- V39.1 validator
- isolated PostgreSQL 16
- migration baseline
- migration idempotency
- schema drift
- release security checks
- database boundaries
- ESLint
- TypeScript
- Next.js production build

The workflow never points to the Production or Preview Neon database.

### 3. Version/lockfile discipline

`package.json` and `package-lock.json` move together from `39.0.0` to `39.1.0`.

### 4. Line-ending policy

`.gitattributes` defines LF for source/configuration files and CRLF only for
Windows launcher files. This prevents recurring LF/CRLF warnings from becoming
a source of noisy diffs.

### 5. Dependency maintenance

Dependabot checks npm and GitHub Actions dependencies monthly. It only opens
pull requests; it does not automatically merge dependency upgrades.

### 6. Local hotfix backup protection

`.github/workflows/_local-backups/` is ignored so a local emergency workflow
backup cannot accidentally be committed.

## Explicitly unchanged

- V39 Listening Laboratory behavior
- V38 Smart Review 3.0 behavior
- V37 Mastery Engine behavior
- Prisma data model
- Production/Preview database contents
- authentication behavior
- course content
- user progress
