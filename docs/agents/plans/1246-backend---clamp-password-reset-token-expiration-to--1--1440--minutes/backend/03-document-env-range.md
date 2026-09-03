# Document the range in .env.dev.sample

Expand the existing `# Password reset settings` comment block above `MAJORA_PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` in `.env.dev.sample` to state the `[1, 1440]` (1 minute – 24 hours) valid range and that out-of-range values are clamped to the nearest bound rather than reset to the default.

## Files to Change

- `.env.dev.sample` — expand the `# Password reset settings` comment to document the `[1, 1440]` range and clamping behavior.
