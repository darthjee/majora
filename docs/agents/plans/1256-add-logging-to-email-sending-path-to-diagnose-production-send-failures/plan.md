# Plan: Add logging to email-sending path to diagnose production send failures

Issue: [1256-add-logging-to-email-sending-path-to-diagnose-production-send-failures.md](../../issues/1256-add-logging-to-email-sending-path-to-diagnose-production-send-failures.md)

## Overview

Add a Django `LOGGING` config plus targeted instrumentation of the shared
`_send_email` helper so a disabled `EMAILS_ENABLED` flag, a skipped send, or an
SMTP-level failure all show up in Render's log capture, instead of email
delivery problems being completely silent.

See [backend.md](backend.md) for the full plan.
