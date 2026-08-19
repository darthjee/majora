# Issue: User-controlled request data written into response in game_poll_votes

## Description

Codacy (via its Opengrep tool) flags the rule `Semgrep_python.django.security.injection.request-data-write.request-data-write` on `backend/games/views/polls/game_poll_votes.py:68`, where user-controlled request data is passed into a `.write(...)` call. The rule's actual intent, per Codacy's own rule description, is to catch request data written to **disk files** — e.g. attacker-forced log rolling or disk-space exhaustion — not general output writes.

## Problem

The flagged call is `writer_cls.write(poll, request.user, serializer.validated_data['option_ids'])`, where `writer_cls` is `SinglePollVoteWriter`/`MultiplePollVoteWriter` (`backend/games/poll_vote_writer.py`). Its `write` classmethod is a domain method that validates and persists `PollVote` rows via the Django ORM — there is no file, socket, or response stream on this path at all. Two independent reasons rule this out as a real vulnerability, not just "ORM is safe":

1. **Naming collision, not I/O** — `Writer.write(...)` means "persist" in this codebase's convention, not "emit output."
2. **Type barrier upfront** — `option_ids` is declared as `serializers.ListField(child=serializers.IntegerField(), allow_empty=True)` in `PollVoteWriteSerializer`. Any non-integer payload is rejected with a 400 by DRF before `writer_cls.write(...)` is ever called, and `_validate_option_ids_belong_to_poll` further restricts the ints to ids that belong to the poll. No attacker-chosen string content can reach the writer, the DB, or the response body via this field.

The response itself is also a JSON API response, not an HTML template, so even a string reaching a JSON field would not execute client-side without a separate, unrelated DOM-injection bug elsewhere.

A near-identical shape exists at `backend/games/views/polls/game_poll_close.py:32` (`PollCloseWriter.write(poll, option_id=request.data.get('option_id'))`) — same false-positive pattern, not yet flagged by Codacy.

## Expected Behavior

The finding is suppressed at both call sites with a documented justification, so it stops appearing in Codacy's security dashboard without masking any other `write`-related finding, and a future reader can see why the suppression is safe without needing to open Codacy.

## Solution

Suppress via an inline Semgrep/Opengrep comment (Codacy's Opengrep tool honors the same `# nosemgrep: <rule-id>` syntax), plus a plain-English justification comment, at both call sites:

```python
# writer_cls.write(...) persists PollVote rows via the ORM — not a file/stream write; see #1163
votes = writer_cls.write(  # nosemgrep: python.django.security.injection.request-data-write
    poll, request.user, serializer.validated_data['option_ids'],
)
```

and the equivalent comment pair in `game_poll_close.py:32` for `PollCloseWriter.write(...)`.

This repo has no prior suppression precedent (`nosemgrep` appears nowhere under `backend/`; the last several Codacy-driven issues — #1158, #1156, #1162, #1159, #1153 — were all closed with actual code fixes). If the inline comment isn't honored by this repo's Codacy project configuration after the next scan, fall back to marking the finding `Ignored` directly in the Codacy dashboard (confirmed to be a supported status via the Codacy API).

**Testing**: after adding the comments, re-run Codacy analysis (or `codacy_cli_analyze`) on the branch and confirm the `request-data-write` finding on `game_poll_votes.py:68` closes and no new findings appear on the added lines. No behavioral test is needed since this is a suppression of a false positive, not a code-behavior change.

## Benefits

- Clears a High-severity Codacy finding that is not a real vulnerability, without weakening the underlying rule for genuine file-write cases elsewhere.
- Documents, inline and in the issue, exactly why this specific `write` call is safe — useful the next time this rule (or a reviewer) flags a similar domain `Writer.write(...)` method.
- Establishes this repo's first suppression precedent, with a documented mechanism and fallback, rather than each future false positive re-deriving the same investigation.
