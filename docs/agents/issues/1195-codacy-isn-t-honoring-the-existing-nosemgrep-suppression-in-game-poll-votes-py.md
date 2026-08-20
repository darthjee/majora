# Issue: Codacy isn't honoring the existing nosemgrep suppression in game_poll_votes.py

Sub-issue of #1193.

## Description

`backend/games/views/polls/game_poll_votes.py:70` already carries an inline `# nosemgrep: python.django.security.injection.request-data-write` suppression and an explanatory comment (added in #1163, commit 7ff1bdb08), but Codacy's Security dashboard still lists the finding as open (High priority, OnTrack, `itemSourceId: 131528257673`).

## Problem

```python
# writer_cls.write(...) persists PollVote rows via the ORM — not a file/stream write;
# see #1163
votes = writer_cls.write(  # nosemgrep: python.django.security.injection.request-data-write
    poll, request.user, serializer.validated_data['option_ids'],
)
```

`writer_cls.write(...)` persists `PollVote` rows via the Django ORM — it is not a file/stream write, so the `request-data-write` rule (surfaced in Codacy via its Opengrep/Semgrep integration) is a false positive here. The inline `# nosemgrep: ...` comment should suppress it, but it doesn't.

Confirmed via the Codacy MCP tools while discussing this issue:

- The prior open finding for this line (itemSourceId 131515331487, opened 2026-07-16, before the suppression existed) was closed at 2026-08-19T04:29:50Z — the exact moment Codacy re-scanned commit 7ff1bdb08 (which added the suppression comment). At that same instant, a new open finding (itemSourceId 131528257673) appeared for the shifted line. In other words, Codacy re-flagged the call as open on the very scan that introduced the nosemgrep comment, which is strong evidence the comment is not being honored at all (rather than, say, a stale/cached dashboard entry).
- Codacy's own catalog (`codacy_list_repository_tool_patterns` for the Opengrep tool) lists this rule's internal pattern id as `Semgrep_python.django.security.injection.request-data-write.request-data-write` — not the bare `python.django.security.injection.request-data-write` used in the inline comment. Native Semgrep/Opengrep suppression comments normally reference the rule's own `id:` field (which would be the bare form), but since Codacy wraps/re-IDs rules for its own catalog, it's worth confirming which form (if either) its specific integration actually parses out of `nosemgrep` comments.
- This repo has no other `nosemgrep` usage to check against: the only other occurrence, `backend/games/views/polls/game_poll_close.py:34` (`PollCloseWriter.write(...)`), added in the same commit, has no corresponding entry (open or closed) in Codacy's SRM history at all — so it isn't a reliable control case for whether suppression works here; it may simply never have matched the rule's pattern in the first place (e.g. a class reference vs. a variable-bound reference).

## Expected Behavior

Codacy stops reporting this finding as open, without weakening the suppression's documentation value.

## Solution

Investigate why the inline `nosemgrep` comment isn't being honored by Codacy's scan, in order of preference:

1. Confirm the comment syntax/placement matches what Codacy's Opengrep integration expects — in particular, try the exact catalog pattern id (`Semgrep_python.django.security.injection.request-data-write.request-data-write`) in place of, or in addition to, the bare rule id, since that's the id Codacy's own pattern list uses for this rule. Re-run Codacy analysis (or `codacy_cli_analyze`) after any comment change and confirm the finding actually closes before moving to the next option.
2. If no comment syntax closes the finding, add an explicit exclude for this pattern/path in `.codacy.yml` (see the existing `exclude_paths` entries under other engines as a reference; there is currently no `opengrep`/`semgrep` engine key in that file).
3. As a last resort, mark the finding as a false positive directly in the Codacy dashboard (it has a `falsePositiveThreshold` of 80, same mechanism used elsewhere in this repo).

Once a fix is confirmed to close the finding on `game_poll_votes.py:70`, apply the same fix to `game_poll_close.py:34` (`PollCloseWriter.write(...)`) too — it carries the identical suppression comment, added in the same commit, and shares the same latent bug even though Codacy hasn't flagged it yet.

## Benefits

Removes one more Overdue/OnTrack false positive from the Security dashboard, closes the same latent gap at `game_poll_close.py:34` before it ever gets flagged, and — more importantly — establishes whether inline suppressions are reliable in this repo's Codacy setup, which affects sub-issue A of #1193 (spawned from this issue) as well.
