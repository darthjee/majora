# Issue: Fix admin access

## Description
The Django admin is returning a CSRF "Origin checking failed" error because the request's origin domain is not present in Django's trusted origins configuration.

## Problem
- Accessing the admin from `https://moria.ffavs.net` fails with: `Origin checking failed - https://moria.ffavs.net does not match any trusted origins.`
- Allowed domains/hosts (`CSRF_TRUSTED_ORIGINS` / `ALLOWED_HOSTS`) are not currently configurable per environment, so new or additional domains can't be trusted without a code change.

## Expected Behavior
- Admin (and other views) should be accessible from any domain that has been explicitly allowed via configuration.
- Allowed domains/hosts should be defined through an environment variable rather than hardcoded.

## Solution
- Add an environment variable (e.g. `CSRF_TRUSTED_ORIGINS` / `ALLOWED_HOSTS`) that lists all allowed domains/hosts.
- Wire this environment variable into Django settings so it populates `CSRF_TRUSTED_ORIGINS` and `ALLOWED_HOSTS`.
- Update deployment configuration/documentation to set this variable for each environment, including `https://moria.ffavs.net`.

## Benefits
- Restores admin access for trusted domains without requiring code changes.
- Makes allowed domains/hosts configurable per environment going forward.

---
See issue for details: https://github.com/darthjee/majora/issues/107
