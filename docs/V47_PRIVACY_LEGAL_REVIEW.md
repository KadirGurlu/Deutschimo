# V47 Privacy / KVKK / GDPR Foundation

This file is technical architecture, not legal advice and not final legal text.

V47 provides:
- consent storage,
- analytics opt-in/opt-out API,
- data-export foundation,
- two-step account deletion request,
- deletion feature flag disabled by default,
- PII-safe logging rules.

Before enabling account deletion and broad analytics in Production, legal/product review must define:
- Privacy Policy text
- Terms of Service
- cookie/analytics consent language
- lawful basis and retention periods
- support/legal retention exceptions
- formal scope of the data export
- whether any records must be anonymized rather than deleted

`V47_ACCOUNT_DELETION_ENABLED` must remain false until cascade and retention review is signed off.
