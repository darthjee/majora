# Issue: Add Server Variable For Email URLs

## Description
Emails that contain links (e.g. password reset) and the staff "generate recovery link" action on `/#/staff/users` need a single, correctly-configured base URL for the deployed domain. A `FRONTEND_BASE_URL` environment variable already exists (`backend/majora_project/settings.py:120`) and is already reused by both flows via `build_recovery_url()` in `backend/games/views/password_reset/_shared.py`, but the URL is currently built with raw string concatenation (`f'{settings.FRONTEND_BASE_URL}/#/recover-password?token={token}'`), so it is not resilient to the different formats an operator might enter for the variable.

## Problem
- Production has shown `http://localhost:3000` in password-reset emails and on the staff users page because the deployed environment's `FRONTEND_BASE_URL` was not set to the real domain, and there is no dedicated, resilient way to build the URL from whatever format is entered. (`.env.prod` in this repo is a local, git-ignored file used only to pull data from production and is never committed — it is not the source of the real deployment's configuration, so it is out of scope for this issue.)
- There is no single documented place stating which environment variable controls this, making it easy to miss when configuring a deployment.

## Expected Behavior
A dedicated class builds the domain-qualified base URL from the configured variable, normalizing all of the following inputs to an equivalent, correctly-formed base (defaulting to `https://` when no scheme is given, and dropping any trailing `/` so paths like `/#/games` or `/#/recover-password` can be appended safely):

- `https://server.com:80`
- `https://server.com:80/`
- `https://server.com`
- `https://server.com/`
- `server.com` (defaults to `https://`)
- `server.com/` (defaults to `https://`)

Both the password-reset email and the `/#/staff/users` recovery-link action must use this same class/variable, so they never diverge. The issue and its PR must clearly state the name of the environment variable that controls the domain (`FRONTEND_BASE_URL`), so it can be set correctly wherever the real production environment is configured.

## Solution
- Introduce a dedicated URL-builder class that wraps the base-URL setting and performs the normalization described above.
- Update `build_recovery_url()` (`backend/games/views/password_reset/_shared.py`) to use it instead of raw string concatenation.
- Cover the class with unit tests for each of the input formats listed above.
- Document the `FRONTEND_BASE_URL` environment variable clearly (issue, PR, and `.env.dev.sample`) so it is set correctly wherever the real production deployment is configured. `.env.prod` is a local, git-ignored file (used only to pull data from production) and must not be touched or committed as part of this fix.

## Benefits
- Password-reset emails and the staff-facing recovery link always point to the real production domain once `FRONTEND_BASE_URL` is correctly configured wherever the deployment actually reads it.
- Misconfigured values for the domain variable (missing scheme, trailing slash, etc.) no longer produce broken links.
- Centralizing URL construction avoids future divergence between the email flow and the staff UI flow.
