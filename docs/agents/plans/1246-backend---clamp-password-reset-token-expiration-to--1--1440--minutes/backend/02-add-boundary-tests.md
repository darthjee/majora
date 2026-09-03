# Add boundary test coverage

Extend `TestSettingsPasswordResetTokenExpirationMinutes` in `backend/games/tests/settings_test.py` with cases for the new clamping behavior, following the existing `monkeypatch.setenv` style used by the other tests in that class:

- Below-floor: env value `0` (and/or a negative value like `-5`) clamps up to `1`.
- Above-ceiling: env value above `1440` (e.g. `99999`) clamps down to `1440`.
- Lower boundary: env value exactly `1` passes through unchanged.
- Upper boundary: env value exactly `1440` passes through unchanged.

## Files to Change

- `backend/games/tests/settings_test.py` — add the four boundary test cases above to `TestSettingsPasswordResetTokenExpirationMinutes`.
