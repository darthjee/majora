# Model: expires_at / invalidated_at / is_valid() / HistoricalRecords

Add the two new columns to `PasswordResetToken`, rewrite `is_valid()` to use them, add the `HistoricalRecords` audit trail (matching `AuthorizationRequest`'s), and update both token-issuance call sites to set `expires_at` explicitly.

- `expires_at` — `models.DateTimeField(default=_default_expires_at)` where `_default_expires_at()` is a module-level function (needed because `default=` must be a callable, not a bound value) returning `timezone.now() + timedelta(minutes=Settings.password_reset_token_expiration_minutes())`. This keeps `expires_at` `NOT NULL` at the DB level while every existing `PasswordResetToken.objects.create(...)` call site across the codebase (this issue does not audit or touch them) keeps working unchanged.
- `invalidated_at` — `models.DateTimeField(null=True, blank=True)`.
- `is_valid()` becomes:

  ```python
  def is_valid(self):
      """Return True if the token has not been used, not invalidated, and not expired."""
      if self.used_at is not None or self.invalidated_at is not None:
          return False
      return timezone.now() <= self.expires_at
  ```

- Add `history = HistoricalRecords(app='versioning', user_db_constraint=False)` as the last field, following `accounts/models/authorization_request.py`'s placement/import (`from simple_history.models import HistoricalRecords`).
- In `accounts/views/password_reset/_shared.py`, both `_create_and_send_reset_token` and `get_or_create_recovery_token` currently call `PasswordResetToken.objects.create(user=user, token=token)`. Update both to pass `expires_at` explicitly:

  ```python
  created_at = timezone.now()
  PasswordResetToken.objects.create(
      user=user, token=token, expires_at=_expires_at(created_at),
  )
  ```

  Reuse (or factor out) a small `_expires_at(now)` helper in `_shared.py` — or the model's own `_default_expires_at()` — rather than duplicating the `timedelta(minutes=...)` arithmetic in three places (model, `_create_and_send_reset_token`, `get_or_create_recovery_token`). Prefer importing the model's helper if it stays at module scope in `password_reset_token.py`.

## Files to Change

- `backend/accounts/models/password_reset_token.py` — add `expires_at`/`invalidated_at` fields + `_default_expires_at()` helper, rewrite `is_valid()`, add `history = HistoricalRecords(...)`.
- `backend/accounts/views/password_reset/_shared.py` — set `expires_at` explicitly in `_create_and_send_reset_token` and `get_or_create_recovery_token`.
