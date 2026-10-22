# Declare scopes on session and poll views

Add `@token_scopes(...)` (above `@api_view`) with the declarations from the table in
[backend.md](../backend.md), importing `token_scopes` from `games.decorators` (same import
style as the sibling views).

## Files to Change

- `backend/games/views/game_sessions/game_sessions_list.py`
- `backend/games/views/game_sessions/game_sessions_past.py`
- `backend/games/views/game_sessions/game_sessions_future.py`
- `backend/games/views/game_sessions/game_sessions_unscheduled.py`
- `backend/games/views/game_sessions/game_session_detail.py`
- `backend/games/views/game_sessions/session_messages_list.py`
- `backend/games/views/game_sessions/session_poll_create.py`
- `backend/games/views/polls/game_polls_list.py`
- `backend/games/views/polls/game_poll_detail.py`
- `backend/games/views/polls/game_poll_votes.py`
- `backend/games/views/polls/game_poll_close.py`
