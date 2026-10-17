# Auto-revoke in the staff deny view

In `backend/staff/views/staff_user_deny.py`, add `ApiToken.objects.filter(owner=user).delete()`
right next to the existing `Token.objects.filter(user=user).delete()`. No signal, no `save()`
override; the approve view never revokes.

Extend `backend/staff/tests/staff_user_deny_test.py`: denying a user deletes all of their
`ApiToken` rows (and leaves other users' tokens alone), together with the DRF token.

## Files to Change

- `backend/staff/views/staff_user_deny.py` — delete the user's scoped tokens.
- `backend/staff/tests/staff_user_deny_test.py` — auto-revoke test.
