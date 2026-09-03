# Plan: Backend — rename PasswordResetToken table to accounts_passwordresettoken

Issue: [1245-backend-rename-passwordresettoken-table-to-accounts-passwordresettoken.md](../../issues/1245-backend-rename-passwordresettoken-table-to-accounts-passwordresettoken.md)

## Overview

Rename the physical MySQL table backing `PasswordResetToken` from `games_passwordresettoken`
to `accounts_passwordresettoken` (the `accounts` app-label default) with one new
`SeparateDatabaseAndState` migration, drop the now-pointless `Meta.db_table` override, add
migration coverage, and fix one stale line of architecture documentation. Pure lift-and-shift:
no schema columns, no data migration.

All work is within the `backend` agent's scope.

See [backend.md](backend.md) for the full plan.
