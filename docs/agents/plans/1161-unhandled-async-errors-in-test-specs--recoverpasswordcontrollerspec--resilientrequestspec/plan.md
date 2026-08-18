# Plan: Unhandled async errors in test specs (RecoverPasswordControllerSpec, ResilientRequestSpec)

Issue: [1161-unhandled-async-errors-in-test-specs--recoverpasswordcontrollerspec--resilientrequestspec.md](../../issues/1161-unhandled-async-errors-in-test-specs--recoverpasswordcontrollerspec--resilientrequestspec.md)

## Overview

Wrap the single `await Promise.resolve();` inside each spec file's local `flushMicrotasks` helper in a `try`/`catch`, so Codacy's `security-node/detect-unhandled-async-errors` rule stops flagging it. Test-only change, no behavior or timing change.

See [frontend.md](frontend.md) for the full plan.
