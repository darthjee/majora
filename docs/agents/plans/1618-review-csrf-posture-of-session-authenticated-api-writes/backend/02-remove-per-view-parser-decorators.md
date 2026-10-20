# Remove the per-view JSON-only decorators

The project-wide default makes `@parser_classes([JSONParser])` redundant. Remove the decorator
and the now-unused `parser_classes` / `JSONParser` imports from the token views. Keep the
existing tests asserting that a form-encoded body gets `415` on these endpoints
(`accounts/tests/api_tokens/list_create_test.py`, `detail_test.py`) — they now exercise the
project-wide rule and must still pass unchanged.

## Files to Change

- `backend/accounts/views/api_tokens/options.py` — drop the decorator and imports.
- `backend/accounts/views/api_tokens/list_create.py` — drop the decorator and imports.
- `backend/accounts/views/api_tokens/detail.py` — drop the decorator and imports.
- `backend/staff/views/staff_user_api_token_delete.py` — drop the decorator and imports.
- `backend/staff/views/staff_user_api_tokens.py` — drop the decorator and imports.
