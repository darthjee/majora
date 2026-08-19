# Backend Plan: User-controlled request data written into response in game_poll_votes

Main plan: [plan.md](plan.md)

## Overview

Suppress a confirmed Codacy/Opengrep false positive (`Semgrep_python.django.security.injection.request-data-write.request-data-write`) at two call sites where a domain `Writer.write(...)` classmethod is mistaken by the rule for a file-write sink. No behavior changes — inline `nosemgrep` + justification comments only.

## Implementation Steps

### Step 1 — Suppress the flagged call in `game_poll_votes.py`

In `backend/games/views/polls/game_poll_votes.py`, at the `writer_cls.write(...)` call (currently line 68), add a justification comment above it and a `# nosemgrep: python.django.security.injection.request-data-write` comment on the call itself:

```python
# writer_cls.write(...) persists PollVote rows via the ORM — not a file/stream write; see #1163
votes = writer_cls.write(  # nosemgrep: python.django.security.injection.request-data-write
    poll, request.user, serializer.validated_data['option_ids'],
)
```

### Step 2 — Suppress the twin case in `game_poll_close.py`

In `backend/games/views/polls/game_poll_close.py`, at the `PollCloseWriter.write(...)` call (currently line 32), apply the same pattern — same rule id, adapted justification wording:

```python
# PollCloseWriter.write(...) persists the poll's winning option via the ORM — not a file/stream write; see #1163
PollCloseWriter.write(  # nosemgrep: python.django.security.injection.request-data-write
    poll, option_id=request.data.get('option_id'),
)
```

Note the call currently reads `PollCloseWriter.write(poll, option_id=request.data.get('option_id'))` on one line — reformat to multi-line only as needed to attach the trailing comment cleanly to the `.write(` line itself (the comment must sit on the same line as the flagged call for `nosemgrep` to match it).

### Step 3 — Verify against Codacy

After committing, re-run Codacy analysis on the branch (CLI: `codacy_cli_analyze`, or wait for the next cloud scan) and confirm:
- The existing open finding on `game_poll_votes.py:68` closes.
- No new finding appears on `game_poll_close.py:32` (preempting the flag) or on either comment line itself.

If the `nosemgrep` comment isn't honored by this repo's Codacy project configuration (no prior precedent exists to confirm either way), fall back to marking the finding `Ignored` directly in the Codacy dashboard — this is a supported status, confirmed via the Codacy API, but is a manual step outside this repo's git history.

## Files to Change

- `backend/games/views/polls/game_poll_votes.py` — add justification + `nosemgrep` comment at the `writer_cls.write(...)` call.
- `backend/games/views/polls/game_poll_close.py` — add justification + `nosemgrep` comment at the `PollCloseWriter.write(...)` call.

## CI Checks

- `backend`: `poetry run ruff check .` (CI job: `checks`) — confirm the added comments don't trip lint (e.g. line length).
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`) — existing tests for both views (`games/tests/views/polls/game_poll_votes_test.py`, `games/tests/views/polls/game_poll_close_test.py`) should pass unchanged, confirming no behavioral regression from a comment-only change.

## Notes

- This is a suppression of a confirmed false positive, not a code-behavior fix — no new tests are needed, and none of the existing tests are expected to change.
- Root-cause detail (why this is safe): `writer_cls.write(...)`/`PollCloseWriter.write(...)` are domain classmethods that persist via the Django ORM, not file/stream I/O, which is what the Opengrep rule actually guards against (per Codacy's own rule description: request data written to disk files — log rolling, disk-space DoS). For the votes endpoint specifically, `option_ids` is additionally type-locked to integers by `PollVoteWriteSerializer` before the writer is ever called, so no attacker-chosen string content can reach persistence via that field regardless of the naming collision.
- No prior `nosemgrep` suppression exists anywhere in `backend/` — this is the first, so the exact comment placement here becomes the reference for any future false positive of this shape.
