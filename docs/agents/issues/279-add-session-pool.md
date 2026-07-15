# Issue: Add session pool

## Description
Extend the poll feature (option types from #546, assumed already implemented) so a DM can start a "date poll" directly from an unscheduled game session, to help the group agree on the next session date without leaving the session page.

## Problem
There is currently no way to propose and vote on candidate dates for an unscheduled game session (one whose `date` is not set) from within the session page itself.

## Expected Behavior
- On the game session detail page (`/#/games/:game_slug/sessions/:id`), when the session has no `date`, a "Create Pool" button is shown, visible only to the DM (gated the same way as the page's existing Edit button, i.e. `session.can_edit`).
- Clicking it opens a modal containing a dynamic, growing list of date-picker option rows (same add/auto-append/remove pattern as the standalone New Poll form's options list), reusing the extensible, type-aware option components introduced in #546.
- The modal only collects dates; it does not collect a title or description.
- Submitting the modal creates a poll with: `option_type=date`, one `PollOption` per date entered, `type=Poll.TYPE_SINGLE` (one date wins), status `open`, a fixed default title, and a non-mandatory, polymorphic link to the originating session.
- The created poll behaves like any other poll: visible via `/#/games/:game_slug/polls/:id` and in the game's poll list, voted on the same way.
- Applying the poll's outcome back onto the session's `date` is out of scope for this issue.

## Endpoints
### `POST /games/:game_slug/sessions/:id/poll.json`
Creates a poll scoped to the session, with `option_type=date`. Accessible to the game's DM(s), players, and admins (same permission check as the existing poll endpoints) — intentionally broader than the DM-only button visibility on the frontend.

## Solution
- Backend: add a nullable, polymorphic relationship on `Poll` (`content_type`/`object_id`/`content_object` via Django's `GenericForeignKey`/`ContentType` framework), mirroring the existing `Link` model's implementation, so a poll can optionally be attached to a `GameSession` today and to other entity types later.
- Backend: new `POST /games/:game_slug/sessions/:id/poll.json` endpoint and serializer that creates a poll (`option_type=date`, `type=Poll.TYPE_SINGLE`, default title, one `PollOption` per submitted date) attached to the session, reusing the existing `PollPermission` check.
- Frontend: a DM-only "Create Pool" button on the session page (shown only when the session has no date), opening a modal (following the existing `MoneyEditModal` component/helper/controller pattern) with a dynamic date-options list, reusing the date-aware option-input component from #546.
- Frontend: a new client method posting to the new endpoint.

## Benefits
Lets a DM kick off a "pick our next session date" poll without leaving the session page, and establishes a reusable, polymorphic poll-attachment mechanism other entities can build on later.
