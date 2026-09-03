# Issue: Backend — clamp password reset token expiration to [1, 1440] minutes

## Context

Parent tracking issue: #1244 (Password Recovery Token Management Overhaul).

Password-reset token expiration is read via `Settings.password_reset_token_expiration_minutes()` in `backend/games/settings.py`:

```python
@staticmethod
def password_reset_token_expiration_minutes():
    return env_int('MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30)
```

`env_int` already handles unset / non-numeric / empty gracefully (falls back to 30, covered by `backend/games/tests/settings_test.py`). The real gap: **no bounds** — `=0` or negative makes every token instantly invalid; a very large value makes tokens effectively immortal.

## What needs to be done

- **Clamp the result to `[1, 1440]` minutes** (1 minute – 24 hours) inside `Settings.password_reset_token_expiration_minutes()`. Values below/above are pulled to the nearest bound — **not** reset to the default.
- **Keep the setting in `games.settings.Settings`** — consistent with the other entries there (pagination, uploads, cache-control); avoids an import ripple across `password_reset_token.py` / `accounts/views/password_reset/_shared.py` / `staff/views/staff_user_recovery_link.py`.
- **Docs:** expand the existing `# Password reset settings` comment block in `.env.dev.sample` to state the `[1, 1440]` range and the clamping behaviour. No new doc file.
- **Tests:** add cases for below-floor, above-ceiling, and both boundary values, alongside the existing `settings_test.py` cases.

### Out of scope

The "config changes retroactively re-date live tokens" concern is **not** addressed here — it is resolved by the `expires_at`-materialised-at-issuance change in the token-listing sub-issue. This sub-issue is bounds + docs only.

## Alternative solutions considered

Clamping silently (no log/warning on out-of-range values) was chosen over:

- **Raise/reject at startup** — rejected: this accessor is read on every token creation/validation, not just at boot, so a bad env value would break password reset entirely rather than degrading gracefully. Inconsistent with the existing philosophy of `env_int`, which never raises on bad input.
- **Clamp + log a warning** — rejected: no established pattern in this codebase for startup/settings warnings; adding one is unnecessary scope for this fix.
- **Fall back to default instead of clamping** — already ruled out above (out-of-range values are pulled to the nearest bound, not reset to 30).

Silent clamping keeps the same "never raise, degrade gracefully" behavior `env_int` already has for non-numeric/empty values.

## Edge cases

`env_int` (`backend/majora_project/env.py`) only falls back to the default on `ValueError`/`TypeError` from `int(...)` — anything that parses as an int (including negatives and zero) reaches the clamp:

- Negative values and `0` clamp up to `1`.
- Very large values clamp down to `1440`.
- Exact boundaries (`1`, `1440`) pass through unchanged.
- Decimal-looking strings (e.g. `"30.5"`) fail `int()` parsing and resolve via the existing default fallback (30) of `env_int` — they never reach the clamp.
- Whitespace-padded numeric strings (e.g. `" 30 "`) are already tolerated by `int()` — unaffected by this change.

Implementation is a plain `max(1, min(1440, value))`-style clamp applied to the return value of `env_int`; no special-casing needed beyond that.

## Security considerations

`[1, 1440]` (1 min – 24h) is inherited as-is from the parent tracking issue (#1244); not re-litigated here. Notes:

- The ceiling (24h) is generous for a password-reset token compared to common guidance (15–60 min), but the threat model is operator misconfiguration (an admin-set env var), not attacker-controlled input — the clamp is a safety net against accidental extreme values, not a hard security boundary on token lifetime.
- The floor (1 min) is an availability/UX concern (users may not act in time), not a security one.
- Since the env var was previously unbounded, clamping is strictly a security improvement — never a regression.
- Whether the ceiling should be tightened further is a scope question for the parent issue #1244, not this sub-issue.

## Responsible agent

`backend`

## Dependencies

None. Independent of every other #1244 sub-issue; can land any time.

## Acceptance criteria

- [ ] `Settings.password_reset_token_expiration_minutes()` clamps its return value to `[1, 1440]`, still defaults to 30
- [ ] Out-of-range env values are pulled to the nearest bound, not reset to the default
- [ ] `settings_test.py` covers below-floor, above-ceiling, and both boundary values
- [ ] `.env.dev.sample` documents the `[1, 1440]` range and clamping behaviour
