# Plan: User-controlled request data written into response in game_poll_votes

Issue: [1163-user-controlled-request-data-written-into-response-in-game-poll-votes.md](../../issues/1163-user-controlled-request-data-written-into-response-in-game-poll-votes.md)

## Overview

Confirmed Codacy/Opengrep false positive: the flagged `.write(...)` calls are domain `Writer.write(...)` classmethods that persist via the Django ORM, not file/stream I/O. Suppress both the originally flagged call in `game_poll_votes.py` and its twin in `game_poll_close.py` with an inline `nosemgrep` + justification comment.

See [backend.md](backend.md) for the full plan.
