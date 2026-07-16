# Issue: Allow multiple option in next session poll

## Description
When creating the session date poll from the game session page (`/#/games/:game_slug/polls/:id` flow, triggered by the session's "Create Poll" action), the user has no way to choose whether the poll allows a single answer or multiple answers per voter.

## Problem
The generic poll creation form (`GamePollNew`) already renders a single/multiple radio selector and passes the chosen `type` to the backend. The session date poll creation flow, however, has no such control:
- Frontend: `CreateSessionPollModal` / `CreateSessionPollModalHelper` only collect a list of dates, with no type selector.
- Backend: `SessionPollCreateSerializer.create()` hardcodes `type=Poll.TYPE_SINGLE`, so a session date poll can never be created as multiple-choice.

The underlying voting mechanics already fully support multiple-choice polls (`PollVote` validation, `SinglePollVoteWriter`/`MultiplePollVoteWriter`, and the checkbox/radio vote UI in `PollOptionVoteInput`) — the gap is isolated to session date poll creation.

## Expected Behavior
When creating a session date poll, the user can pick whether voters may select a single date or multiple dates, the same way they can for a regular poll. The chosen type is sent to the backend and stored on the created `Poll`, and voting then behaves accordingly (single = radio, multiple = checkbox).

## Solution
- Add a single/multiple type selector to `CreateSessionPollModalHelper` (mirroring `GamePollNewHelper#renderTypeField`), defaulting the frontend selection to "multiple" since a session date poll commonly needs to gather several dates that work for the group.
- Extend `SessionPollCreateSerializer` to accept an optional `type` field (defaulting to `Poll.TYPE_MULTIPLE` if omitted, to match the new frontend default) instead of hardcoding `Poll.TYPE_SINGLE`, and use it in `create()`.

## Benefits
Session date polls gain feature parity with regular polls, letting organizers ask "which dates work" as a multi-select when more than one date may suit the group.
