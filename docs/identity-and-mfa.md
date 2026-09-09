# Identity and MFA deployment contract

The local development profile uses deterministic development users only. Production must replace them with an approved identity provider and set `REQUIRE_MFA=true` for the API process.

The request boundary then requires both a valid bearer session and an identity-provider-verified `x-mfa-verified: true` assertion. The production gateway must inject that assertion only after validating the provider session; clients must not be allowed to self-assert it through an untrusted public route.

Before production launch, implement OIDC or SAML SSO, MFA enrollment and recovery, session rotation, logout revocation, role/group mapping, service-account credentials, and provider-side audit retention. The current local gate is a safety control and integration contract, not a replacement for those identity-provider features.

The local API also supports an environment-provided `SERVICE_API_KEY` for service-account smoke testing. Production keys must come from a managed secret store, be scoped to one organization, rotated, revocable, rate-limited, and excluded from logs.

Development credentials are disabled automatically when `NODE_ENV=production` unless `ALLOW_DEV_AUTH=true` is explicitly set for a controlled migration window. That override must not be used for normal production operation.
