# Plan: Backend tests speed: make the two slow migration tests cheap

Issue: [1798-backend-tests-speed-make-the-two-slow-migration-tests-cheap.md](../../issues/1798-backend-tests-speed-make-the-two-slow-migration-tests-cheap.md)

## Overview
Make the two slow `games` migration tests (about 110s each) run in a few seconds by unapplying only the
migrations the backfill needs instead of rolling back more than 100 migrations, while still running
the real backfill migration and keeping the same test names and assertions.

See [backend.md](backend.md) for the full plan.
