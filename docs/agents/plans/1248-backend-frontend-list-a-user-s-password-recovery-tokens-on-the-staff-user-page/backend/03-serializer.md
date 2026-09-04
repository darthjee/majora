# Serializer

New `staff/serializers/staff_recovery_token.py`, following `staff/serializers/staff_user_list.py`'s shape (a `ModelSerializer` with an explicit `fields` allowlist and a couple of computed/derived fields).

```python
"""Staff recovery-token serializer for the games app."""

from rest_framework import serializers

from accounts.models import PasswordResetToken


class StaffRecoveryTokenSerializer(serializers.ModelSerializer):
    """Serializer for staff-facing recovery-token list items. Never emits the raw token."""

    status = serializers.SerializerMethodField()
    token_preview = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the StaffRecoveryTokenSerializer."""

        model = PasswordResetToken
        fields = [
            'id', 'status', 'created_at', 'expires_at', 'used_at', 'invalidated_at',
            'token_preview',
        ]

    def get_status(self, obj):
        """Return the row's status: used > revoked > expired > valid (convenience only —
        the frontend recomputes this from the timestamps rather than trusting it)."""
        if obj.used_at is not None:
            return 'used'
        if obj.invalidated_at is not None:
            return 'revoked'
        if not obj.is_valid():
            return 'expired'
        return 'valid'

    def get_token_preview(self, obj):
        """Return the last 6 characters of the token, for human cross-reference only."""
        return obj.token[-6:]
```

Note `get_status` calling `obj.is_valid()` after already checking `used_at`/`invalidated_at` re-derives the same two checks internally — acceptable (cheap, no query), but if it reads awkwardly, inline the `now <= expires_at` comparison directly instead of round-tripping through `is_valid()`.

## Files to Change

- `backend/staff/serializers/staff_recovery_token.py` — new.
- `backend/staff/serializers/__init__.py` — export `StaffRecoveryTokenSerializer`, matching the existing exports for `StaffUserListSerializer` etc.
