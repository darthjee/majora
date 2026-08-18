# Security Guidelines

This document is the authoritative checklist used by the `security` agent to review changes in the Majora project. It covers vulnerability patterns relevant to the Django backend (`backend/`) and the Tent proxy. To reduce agent context size this guidance has been split into focused pages. Use the links below to open the relevant section.

Area pages:

- [Authentication](./security-guidelines/authentication.md)
- [Injection Risks](./security-guidelines/injection.md)
- [Insecure Headers](./security-guidelines/insecure-headers.md)
- [Exposed Secrets](./security-guidelines/exposed-secrets.md)
- [CSRF](./security-guidelines/csrf.md)
- [Proxy Rules](./security-guidelines/proxy-rules.md)
- [Input Validation](./security-guidelines/input-validation.md)
- [Mass Assignment / Field-Level Update Authorization](./security-guidelines/mass-assignment.md)
