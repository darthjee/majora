# Render the widget on the session page

In `GameSessionHelper.render`, render `<SessionTasksWidget session={session} />` after the description paragraph and before `SessionMessagesHelper.render(...)`. The widget gates itself on `session.can_edit`, so the helper needs no extra condition. Update the JSDoc to mention `session.can_edit`.

`GameSession.jsx` needs no changes: the widget owns its state and effect, and `session` already carries the merged permissions from `GameSessionController`.

## Files to Change
- `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx`: render the widget between the description and the messages.
- `frontend/specs/assets/js/components/resources/game_session/pages/helpers/GameSessionHelperSpec.js`: assert that the tasks section is rendered (before the messages) when `can_edit` is true, and absent when it is false. Stub `RequestStore.ensure` so no real request is made.
