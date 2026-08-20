# Verify the test suite

Confirm the split introduced no behavior change: run the existing integration test suite covering these endpoints and fix any import error or route breakage it surfaces (e.g. a missed call site from Step 3), without changing test files themselves — this is a pure refactor, so failures indicate a mistake in the split, not a test that needs updating.

## Files to Change

- No production files expected to change here — this step is verification only. If a test failure reveals a missed/incorrect import from Steps 1-3, fix it in the offending file from those steps rather than here.
