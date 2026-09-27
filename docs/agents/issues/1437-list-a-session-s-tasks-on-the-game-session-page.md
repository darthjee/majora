# Issue: List a session's tasks on the game session page

## Description
Follow-up to #1432, which is merged. Game tasks can now be assigned to a session, and the game tasks list endpoint accepts a `session=<id>` filter. The game session page (`GameSession.jsx`) should list the tasks linked to that session, so the DM can see a session's prep from the session itself.

## Problem
- The session page shows the title, date, description and messages, but nothing about the DM's prep tasks for that session.
- To see a session's tasks, the DM has to open the Tasks page and filter by session by hand.

## Expected Behavior
- On the game session page, users who can edit the game (`session.can_edit`, the same flag the Tasks page uses) see a **Tasks** section, placed after the description and before the messages.
- The section lists the first 5 tasks whose `session` is this session, in the endpoint's default order (by id, the same as the Tasks page).
- Each task shows its short description and a completion checkbox. The DM can toggle completion inline, the same way as on the Tasks page.
- Clicking a task opens the existing `TaskDetailModal`. Saving there refreshes the list.
- When the session has more tasks than are shown, a **See all** link opens the Tasks page filtered by this session (`#/games/<slug>/tasks?session=<id>`, which `TaskFilters` already reads from the hash). The link can also always be shown.
- When the session has no tasks, a short empty-state message is shown.
- Users who are not DMs see nothing: no section, and no request to the tasks endpoint.

## Solution
### Frontend
- Add a self-fetching `SessionTasksWidget({session})`, with its own controller and helper, following the `OpenPollsWidget` pattern. It is gated on `session.can_edit`, skips its effect and renders nothing when not visible, and loads after the session like the messages section does.
- Fetch through `RequestStore.ensure({resource: 'task', quantityType: 'collection', params: {gameSlug}, query: {session: id, per_page: 5}})`. Use the `total` from the pagination to decide whether to show **See all**. Do not embed tasks in the session serializer, because the session detail endpoint is public and cached by Navi while the tasks endpoint is `@restricted`.
- Reuse `TaskDetailModal` with `buildSaveEditHandler`, and the completion toggle logic from `GameTasksController#handleToggleCompleted`. Extract the task row rendering shared with `GameTasksHelper` instead of duplicating it.
- Add translations for the new labels in every language under `frontend/assets/i18n/`.
- Add Jasmine specs for the widget (hidden for non-DMs, list, empty state, See all, toggle, modal).

### Backend / Cache
- No changes are expected. The endpoint, its `session` filter and pagination already exist, and tasks are `@restricted` (they send `X-Skip-Cache`), so neither Navi nor the proxy needs changes.

### Out of scope
- Creating a task pre-assigned to the session from the session page is tracked in #1439.

## Benefits
- The DM sees and checks off a session's prep directly from the session page, with one click to the full filtered list.
