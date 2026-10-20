# Plan: Review CSRF posture of session-authenticated API writes

Issue: [1618-review-csrf-posture-of-session-authenticated-api-writes.md](../../issues/1618-review-csrf-posture-of-session-authenticated-api-writes.md)

## Overview

Make the REST API accept JSON request bodies only, project-wide, so a same-site HTML form POST
can no longer perform a session-authenticated write, remove the now-redundant per-view
`@parser_classes([JSONParser])` decorators, and document the decided CSRF posture.

See [backend.md](backend.md) for the full plan.
