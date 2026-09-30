# Plan: Register GameCommonItem in the Django admin

Issue: [1456-register-gamecommonitem-in-the-django-admin.md](../../issues/1456-register-gamecommonitem-in-the-django-admin.md)

## Overview
Backend-only change. Register `GameCommonItem` and `GameCommonItemPhoto` in the `games` admin and expose both
models' historical records in the read-only versioning admin. Admin tests cover the changelist and
delete-confirmation pages.

See [backend.md](backend.md) for the full plan.
