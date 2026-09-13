# Plan: Security: dedupe flushMicrotasks spec helper and justify its unhandled-async-errors finding

Issue: [1322-security-dedupe-flushmicrotasks-spec-helper-and-justify-its-unhandled-async-errors-finding.md](../../issues/1322-security-dedupe-flushmicrotasks-spec-helper-and-justify-its-unhandled-async-errors-finding.md)

## Overview

Extract the `flushMicrotasks` helper — currently duplicated verbatim across two spec files — into `frontend/specs/support/`, and add one documented ESLint suppression for `security-node/detect-unhandled-async-errors` there instead of two.

See [frontend.md](frontend.md) for the full plan.
