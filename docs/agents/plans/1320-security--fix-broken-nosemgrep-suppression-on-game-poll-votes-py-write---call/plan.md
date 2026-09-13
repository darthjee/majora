# Plan: Security: fix broken nosemgrep suppression on poll writer write() calls

Issue: [1320-security--fix-broken-nosemgrep-suppression-on-game-poll-votes-py-write---call.md](../../issues/1320-security--fix-broken-nosemgrep-suppression-on-game-poll-votes-py-write---call.md)

## Overview
Correct the mismatched `nosemgrep` rule id on the two poll-writer `.write(...)` calls (`game_poll_votes.py`, `game_poll_close.py`) so Codacy's Opengrep scan actually honors the existing false-positive triage from #1163, instead of continuing to reopen it.

See [backend.md](backend.md) for the full plan.
