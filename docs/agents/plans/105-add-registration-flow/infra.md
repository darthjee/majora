# Infra Plan: Add registration flow

Main plan: [plan.md](plan.md)

## Shared contracts

Declares the `EMAILS_ENABLED` environment variable consumed by [backend.md](backend.md)'s
`Settings.emails_enabled()`.

## Implementation Steps

### Step 1 — Register `EMAILS_ENABLED` in the dev env sample

Add to `.env.dev.sample`, in the existing "Email settings" block, alongside
`DJANGO_EMAIL_BACKEND`/`DJANGO_DEFAULT_FROM_EMAIL`:

```
EMAILS_ENABLED=false
```

Defaulting to `false` keeps local dev safe (no accidental sends through the console backend or a
misconfigured SMTP backend), matching the issue's "blocked by default" requirement.

## Files to Change
- `.env.dev.sample` — add `EMAILS_ENABLED=false`.

## Notes
- The real `.env` file is untracked/local-only; no action needed there — developers copy
  `.env.dev.sample` and can flip the value themselves.
- No `docker-compose.yml` change needed: backend services already load the whole `.env` file via
  `env_file: .env`, so the new variable is picked up automatically.
