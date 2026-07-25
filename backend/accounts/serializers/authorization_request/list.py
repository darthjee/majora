"""Authorization-request list serializer for the accounts app."""

from rest_framework import serializers

from accounts.models import AuthorizationRequest


class AuthorizationRequestListSerializer(serializers.ModelSerializer):
    """Serializer for a caller's own authorization requests, safe for account-page listing.

    Deliberately excludes `id`, `token_hash`, and `user`: `id`/`user` are never exposed by
    convention, and `token_hash` is a hashed bearer credential that must never leave the
    server, even hashed.
    """

    class Meta:
        """Metadata for the AuthorizationRequestListSerializer."""

        model = AuthorizationRequest
        fields = ['uuid', 'created_at', 'status', 'ip', 'browser']
