# Issue: Security: fix broken nosemgrep suppression on poll writer write() calls

## Description
Codacy's Opengrep SAST rule `python.django.security.injection.request-data-write.request-data-write` keeps re-flagging `backend/games/views/polls/game_poll_votes.py:71` (`writer_cls.write(...)`), even though this exact call was already triaged as a false positive in #1163 — `writer_cls.write()` is an ORM-backed `PollVote` writer, not a file/stream write — and a follow-up fix in #1205 tried to correct the suppression once already.

Live check against Codacy's SRM dashboard confirms the finding (item `131528257673`, High priority, opened 2026-08-19, due 2026-10-18) is still open today (`OnTrack`, not `Ignored`/closed).

The equivalent `PollCloseWriter.write(...)` call in `backend/games/views/polls/game_poll_close.py` carries the identical broken annotation pair (added by the same #1205 commit). Codacy's dashboard shows no separate open finding for it yet, but it has the same latent gap and should be fixed alongside the votes call.

## Problem
Both call sites carry two `nosemgrep` annotations, and neither matches the rule id Codacy actually reports:

```python
try:
    # writer_cls.write(...) persists PollVote rows via the ORM — not a file/stream write;
    # see #1163
    # nosemgrep: Semgrep_python.django.security.injection.request-data-write.request-data-write
    votes = writer_cls.write(  # nosemgrep: python.django.security.injection.request-data-write
        poll, request.user, serializer.validated_data['option_ids'],
    )
```

(and the analogous pair around `PollCloseWriter.write(...)` in `game_poll_close.py`.)

- The inline comment on the `.write(` line uses `python.django.security.injection.request-data-write` — missing the doubled `.request-data-write` suffix Codacy's rule id actually has.
- The stand-alone comment line above it (added by #1205 as a workaround, using Codacy's catalog id with a `Semgrep_` prefix) uses `Semgrep_python.django.security.injection.request-data-write.request-data-write` — also not the exact rule id, and sits on its own line rather than on the flagged call itself.

## Expected Behavior
Codacy's next scan should stop reopening the already-triaged false positive on `game_poll_votes.py:71`, and should not newly flag the equivalent `game_poll_close.py` call either, without suppressing any other rule on those lines.

## Solution
In both `backend/games/views/polls/game_poll_votes.py` and `backend/games/views/polls/game_poll_close.py`:
- Correct the inline `nosemgrep` annotation on the `.write(` line to exactly match the rule id Codacy reports: `python.django.security.injection.request-data-write.request-data-write` (no `Semgrep_` prefix).
- Remove the now-redundant stand-alone `# nosemgrep: Semgrep_...` comment line above the call — the corrected inline annotation is the one nosemgrep/Opengrep actually honors.
- Keep the existing explanatory comment (`writer_cls.write(...) persists ... see #1163`).

Verify the `game_poll_votes.py` finding closes on the next Codacy analysis of the branch/PR.
