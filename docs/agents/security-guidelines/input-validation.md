# Input Validation

- Serializer fields must declare explicit types (e.g. `CharField`, `IntegerField`) and include validators where appropriate (e.g. `max_length`, `min_value`).
- Avoid `SerializerMethodField` that executes complex logic without input validation on data derived from the request.
- File upload fields (if added in future) must validate MIME type, file extension, and maximum size server-side — never rely solely on client-supplied `Content-Type`.
- Query parameters used for filtering or ordering must be validated against an allowlist of accepted field names; reject unknown parameter names with a `400` response.
