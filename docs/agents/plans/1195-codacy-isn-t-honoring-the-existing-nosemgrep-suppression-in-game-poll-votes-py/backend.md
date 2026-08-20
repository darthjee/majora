# Backend Plan: Codacy isn't honoring the existing nosemgrep suppression in game_poll_votes.py

Main plan: [plan.md](plan.md)

## Context

`backend/games/views/polls/game_poll_votes.py:70` already carries:

```python
votes = writer_cls.write(  # nosemgrep: python.django.security.injection.request-data-write
    poll, request.user, serializer.validated_data['option_ids'],
)
```

Codacy's Security dashboard still lists this as an open High-priority finding (`itemSourceId: 131528257673`). While discussing this issue, `codacy_list_repository_tool_patterns` (Opengrep tool) showed the finding's actual catalog pattern id is `Semgrep_python.django.security.injection.request-data-write.request-data-write` — not the bare `python.django.security.injection.request-data-write` currently used in the comment. There is also concrete evidence the suppression never worked: the prior open finding for this line closed at the exact same instant (2026-08-19T04:29:50Z) a new one opened for the shifted line — i.e. Codacy re-flagged the call on the very scan that introduced the `nosemgrep` comment.

`backend/games/views/polls/game_poll_close.py:34` (`PollCloseWriter.write(...)`) carries an identical suppression comment, added in the same commit (7ff1bdb08), but is not currently flagged by Codacy — it isn't a reliable control case (may never have matched the rule's pattern), but shares the same latent risk and should get the same fix once confirmed.

## Implementation Steps

### Step 1 — Find and apply a suppression that Codacy actually honors, on game_poll_votes.py

Try, in order of preference, stopping as soon as one closes the finding:

1. Change the inline comment on `game_poll_votes.py:70` to use the full Codacy catalog pattern id (`# nosemgrep: Semgrep_python.django.security.injection.request-data-write.request-data-write`), in place of or alongside the current bare id. Commit/push to a branch and re-run Codacy analysis (`codacy_cli_analyze`, or push and check the dashboard) to confirm the finding actually closes before considering this done.
2. If no comment variant closes the finding, add an explicit exclude for this pattern/path under a new `opengrep` (or `semgrep`, whichever matches Codacy's engine key for this tool) entry in `.codacy.yml` at the repo root, following the existing `exclude_paths` shape used for `duplication`/`bandit`/`phpmd`/`phpcs`.
3. As a last resort, mark the finding as a false positive directly in the Codacy dashboard (`falsePositiveThreshold` is already 80 for this repo).

Keep the existing plain-English justification comment (`# writer_cls.write(...) persists PollVote rows via the ORM...`) above the call untouched — only the suppression mechanism itself changes.

### Step 2 — Apply the confirmed fix to game_poll_close.py too

Once Step 1's fix is confirmed to close the `game_poll_votes.py` finding, apply the same suppression change to `game_poll_close.py:34` (`PollCloseWriter.write(...)`), which carries the identical comment and the same latent gap. If Step 1 landed on option 2 or 3 (a `.codacy.yml` exclude or a dashboard false-positive mark) instead of a working inline comment, apply that same mechanism here too rather than leaving a now-known-broken inline comment in place.

## Files to Change

- `backend/games/views/polls/game_poll_votes.py` — update the `nosemgrep` suppression on line 70 to whichever form Step 1 confirms actually works.
- `backend/games/views/polls/game_poll_close.py` — apply the same confirmed suppression mechanism to line 34.
- `.codacy.yml` — only if Step 1 falls through to the `exclude_paths` option.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/polls/` (CI job: `pytest_views_rest`) — no behavioral change is expected, but run the existing suite for `game_poll_votes_test.py` and `game_poll_close_test.py` to confirm nothing regresses.
- `backend`: `poetry run ruff check .` (CI job: `checks`) — confirm the edited comment doesn't trip any lint rule.

## Notes

- This is a false-positive suppression, not a behavior change — no new tests are needed, only confirmation via Codacy that the finding closes.
- Codacy analysis only reflects pushed commits, so the "finding closes" check in Step 1 can only be confirmed after pushing to the PR branch, not from local `codacy_cli_analyze` alone if that tool doesn't have live SRM/dashboard access — cross-check the live dashboard (`codacy_search_repository_srm_items`, `itemSourceId: 131528257673`) if needed.
