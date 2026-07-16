# Issue: Add poll closing button

## Description
Add a way for a game's DM(s) and admins to manually close an open poll from its detail page (`/#/games/:game_slug/polls/:id`), locking in a winning option so voting effectively ends.

## Problem
`Poll.status` already supports a `closed` value, but nothing in the product lets a DM actually reach it — there is no UI and no endpoint to end voting and record which option won.

## Expected Behavior
### Close button
- Shown on the poll detail page, visible and usable only to the game's DM(s) and admins (superusers) — not regular players, mirroring the DM/admin-only pattern used elsewhere (e.g. `Game.can_be_edited_by`).
- Applies to both `single` and `multiple` type polls alike; closing always resolves to exactly one winning option regardless of poll type.
- Only shown (or only enabled) while the poll's status is `open`; a poll that is already `closed`, or still `inactive`, cannot be closed.
- Clicking it opens a confirmation modal.

### Confirmation modal
Top to bottom, always:
- A confirmation message naming the poll's title.
- A bootstrap `switch` labeled "Override Decision" (default off).

**With "Override Decision" off:**
- The option with the most votes is shown with a pastel green background, as the option that will be recorded as the winner.
- If there is a tie for the most votes, the first tied option by id is treated as the winner (still pastel green) and an alert explains there was a tie and the other tied options will be ignored; those other tied options are listed with a pastel red background.
- Submitting in this state sends an empty payload; the backend computes the winner using this same rule.

**With "Override Decision" on:**
- All options are listed, each with a radio selector on the left so the DM/admin can explicitly choose the winner.
- Whichever option(s) currently have the most votes (i.e. would have won automatically) are highlighted with a pastel green background, as a hint — the DM/admin can still pick any option via the radio.
- Submitting in this state sends the radio-selected option id as the payload.

Either state has Submit (closes the poll) and Cancel (closes the modal without effect) actions.

### Endpoint
- New endpoint: `PATCH games/<game_slug>/polls/<poll_id>/close.json` (same URL family as the existing `games/<slug>/polls/<id>.json` and `.../votes.json` endpoints).
- Usable only by the game's DM(s) and admins.
- Returns an error, without changing anything, if the poll's status is not `open` (already `closed`, or still `inactive`).
- Empty payload: server computes the winning option using the tie-break rule above (highest votes, first by id on a tie), marks it selected, and marks the poll closed.
- Non-empty payload: body contains the selected option id chosen by the DM/admin (from the "Override Decision" flow); that option is marked selected and the poll is marked closed, without needing to match the highest-vote option.
- A new field on `PollOption` records which option was selected when its poll was closed.

### Voting after close
- The existing vote-casting endpoint (`PUT games/<slug>/polls/<id>/votes.json`) currently has no poll-status check at all — votes can be cast regardless of status. This issue adds one: once a poll's status is `closed`, that endpoint rejects further votes.

### Winner display
- Once a poll is closed, its detail page (the read-only options list shown for a non-open poll) visibly marks the selected/winning option, so the outcome remains visible to anyone viewing the poll afterward, not just at close-time in the modal.

### Out of scope
- The special handling for session-date polls (polls whose `content_object` is a game session) is not part of this issue.

## Benefits
- Gives DMs a clear, auditable way to end a poll and lock in a decision, instead of the result staying implicit in the raw vote counts.
- Handles ties deterministically by default, while still letting a DM override the automatic pick when judgement is needed.
- Closes the pre-existing gap where votes could be cast on a poll regardless of its status.
