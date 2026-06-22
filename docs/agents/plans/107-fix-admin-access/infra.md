# Infra Plan: Fix admin access

Main plan: [plan.md](plan.md)

## Shared contracts

- Declares the `CSRF_TRUSTED_ORIGINS` env var in the dev sample env file, documenting that it takes a comma-separated list of full origins **including scheme** — the value `backend`'s `settings.py` will read.

## Implementation Steps

### Step 1 — Document `CSRF_TRUSTED_ORIGINS` in `.env.dev.sample`
Add a line right after `ALLOWED_HOSTS=localhost,127.0.0.1` in `.env.dev.sample`:

```
CSRF_TRUSTED_ORIGINS=http://localhost:3030
```

This mirrors the existing dev port (`majora_app` is exposed on `3030`) and shows the required scheme-inclusive format so anyone copying the sample for a new environment (e.g. adding `https://moria.ffavs.net`) sees the right pattern.

## Files to Change
- `.env.dev.sample` — document the new `CSRF_TRUSTED_ORIGINS` variable next to `ALLOWED_HOSTS`.

## Notes
- No `.env.prod.sample` exists in this repo to update; production environment variables for this var should be set directly wherever the production `.env.prod` file is managed (outside this repo), using the same comma-separated, scheme-inclusive format.
