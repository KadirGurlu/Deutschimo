# V47 Web + Mobile API Strategy

V31 already introduced `/api/v1`, request IDs, API envelopes, devices, idempotency and a platform-auth abstraction. V47 preserves these decisions.

## Contract
New V47 API endpoints use:
`{ "data": ..., "error": null }`
or
`{ "data": null, "error": { "code": "...", "message": "..." } }`

Private responses use `Cache-Control: no-store`.

## Versioning
Do not migrate every legacy route simply to make the version number larger. New native-mobile contracts should prefer `/api/v1`. Breaking changes require either additive fields or a new API version.

## Authentication
Current web cookie/session authentication remains. Native bearer/refresh-token authentication is not introduced by V47. The platform-auth abstraction remains the future integration point.

## Compatibility
Mobile clients can update slowly. Server changes should be additive whenever possible and should continue to publish minimum/compatible client versions through the bootstrap/release contract.
