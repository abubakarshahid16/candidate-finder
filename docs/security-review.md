# Security, privacy, fairness, and source-compliance review

## Verified controls

- Authentication is required for protected API routes.
- Organization identifiers are checked before returning reviews, sources, jobs, and audit events.
- Candidate deletion requires organization-management permission and emits an audit event.
- ATS scoring rejects age, date of birth, gender, nationality, religion, race, health, and equivalent protected fields.
- Provider ingestion blocks private hosts, credentials in URLs, unsupported protocols, redirects, oversized responses, and unsupported content types.
- Source URL, retrieval timestamp, content hash, extraction method, and coverage status remain attached to ingested claims.
- Public-profile ingestion is user-supplied and rule-based; direct LinkedIn scraping is not implemented.
- Unknown location, relocation, remote, and authorization values remain unknown rather than inferred.

## Required production sign-off

- Replace development authentication with a reviewed identity provider, MFA, session rotation, and account recovery.
- Confirm provider terms and permitted-use agreements for every production source.
- Run an independent privacy/legal review for retention, deletion, and data-subject requests.
- Run authorization, dependency, secret, source-compliance, and fairness assessments against production configuration.
- Review false-positive/false-negative ATS outcomes with human recruiters before enabling automated ranking at scale.

## Decision

The local-first MVP controls are implemented and covered by automated tests. Production launch remains conditional on the sign-off items above.
