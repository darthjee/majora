# Nest the session in the task payload

Change `GameTaskListSerializer` so `session` is rendered as a nested `{id, title}` object, or `null` when unset. Add a small `GameTaskSessionSerializer` (fields `id`, `title`) under `games/serializers/games/tasks/` and use it as `session = GameTaskSessionSerializer(read_only=True)` in the list serializer. Export it from the serializers package like its siblings.

The create and update views already return `GameTaskListSerializer(task).data`, so their responses get the nested form automatically. Their input serializers stay unchanged: they still accept an integer id or `null`.

Tests: list, create, update and detail responses return `session: {id, title}` when set and `session: null` when not. Update any existing specs that assert `session` is a bare id.

## Files to Change
- `backend/games/serializers/games/tasks/game_task_session.py` — new nested read-only serializer (`id`, `title`).
- `backend/games/serializers/games/tasks/game_task_list.py` — use the nested serializer for `session`.
- `backend/games/serializers/__init__.py` (and the tasks sub-package `__init__`, if any) — export the new serializer.
- `backend/games/tests/...` (existing game task view/serializer specs) — assert the nested shape.
