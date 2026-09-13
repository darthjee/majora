# Backend Plan: Security: fix broken nosemgrep suppression on poll writer write() calls

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Fix the suppression in `game_poll_votes.py`
In `backend/games/views/polls/game_poll_votes.py`, on the `writer_cls.write(` call (currently around line 71):
- Change the inline `# nosemgrep: python.django.security.injection.request-data-write` comment to the exact rule id Codacy reports: `# nosemgrep: python.django.security.injection.request-data-write.request-data-write`.
- Delete the stand-alone `# nosemgrep: Semgrep_python.django.security.injection.request-data-write.request-data-write` comment line above the call — it never matched and is now redundant.
- Keep the existing explanatory comment (`writer_cls.write(...) persists PollVote rows via the ORM — not a file/stream write; see #1163`).
- Watch the resulting inline comment's line length against the repo's lint line-length limit (this is why #1205 originally split the annotation onto its own line); wrap or shorten if `ruff check .` flags it.

### Step 2 — Fix the identical suppression in `game_poll_close.py`
Apply the same three changes to the analogous `PollCloseWriter.write(` call in `backend/games/views/polls/game_poll_close.py` (currently around line 34): corrected inline rule id, removed stand-alone comment line, explanatory comment kept.

## Files to Change
- `backend/games/views/polls/game_poll_votes.py` — correct the `nosemgrep` rule id on the `writer_cls.write(` call and remove the redundant stand-alone comment line.
- `backend/games/views/polls/game_poll_close.py` — same fix for the `PollCloseWriter.write(` call.

## CI Checks
- `backend`: `poetry run ruff check .` (CI job: `checks`) — confirm the corrected inline comment doesn't exceed the line-length limit.
- `backend`: `poetry run pytest games/tests/views/polls/` (CI job: `pytest_views_rest`) — confirm no behavioral change; these are comment-only edits.

## Notes
- This is a comment-only change with no behavioral impact.
- Whether the fix actually clears the Codacy finding (item `131528257673`) can only be confirmed after Codacy re-scans the pushed branch/PR — not verifiable from the implementation environment itself.
