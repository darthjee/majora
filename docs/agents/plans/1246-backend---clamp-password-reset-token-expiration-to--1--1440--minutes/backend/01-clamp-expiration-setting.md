# Clamp the expiration setting

Update `Settings.password_reset_token_expiration_minutes()` in `backend/games/settings.py` to clamp the value returned by `env_int` to `[1, 1440]` (1 minute – 24 hours) using a plain `max(1, min(1440, value))`-style expression. The default of 30 (passed to `env_int` when the env var is unset/invalid) already falls within this range, so no change is needed there. Out-of-range values are pulled to the nearest bound, never reset to the default.

## Files to Change

- `backend/games/settings.py` — wrap the existing `env_int('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30)` call in a `[1, 1440]` clamp inside `password_reset_token_expiration_minutes()`.
