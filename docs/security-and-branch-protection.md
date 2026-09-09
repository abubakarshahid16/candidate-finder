# Security checks and branch protection

## Pull-request checks

`.github/workflows/ci.yml` runs on pushes to `main`/`master` and on pull requests targeting those branches. It checks:

- `npm test`
- Node syntax for local API, worker, and auth modules
- `npm run lint`
- `npm run build`
- Docker Compose configuration using `.env.example`
- `npm audit --audit-level=high`
- Gitleaks secret scanning

Checks intentionally fail the workflow when they fail. Lint, audit, and security findings must be fixed or explicitly reviewed before merging; they are not hidden with `continue-on-error`.

## Recommended branch protection

Configure these rules for `main` (or the repository's default branch):

1. Require a pull request before merging.
2. Require at least one approving review.
3. Dismiss stale approvals when new commits are pushed.
4. Require all conversations to be resolved.
5. Require the `quality`, `dependency-audit`, and `secret-scan` status checks.
6. Require branches to be up to date before merging.
7. Block force pushes and branch deletion.
8. Restrict who can push directly to the protected branch.
9. Require signed commits if the organization policy supports it.
10. Enable GitHub secret scanning and push protection when available for the repository plan.

## Local development authentication warning

`DEV_AUTH_ENABLED=true` and the `example.test` users are for local development only. Never enable this mode in production. Production must use approved identity controls, real secret management, secure session handling, and an explicit security review. The static `dev-*-token` values must never be reused outside the local Compose profile.

## Dependency and secret hygiene

- Do not commit `.env`, API keys, candidate data, uploaded job descriptions, raw source pages, or credentials.
- Keep `.env.example` limited to safe placeholders.
- Review dependency audit results before upgrading packages.
- Do not bypass a failed secret scan by weakening patterns or deleting evidence.
- Use synthetic or permissioned fixtures in tests and screenshots.
