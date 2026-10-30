"""Authorization-request scopes serializer for the accounts app."""

from rest_framework import serializers

from accounts.scopes import SCOPES
from accounts.serializers.api_token.create import SCOPE_MAX_LENGTH, error, has_duplicates


class AuthorizationRequestScopesSerializer(serializers.Serializer):
    """Validate the optional `scopes` a device-authorization request asks for.

    The creation endpoint is unauthenticated, so this is the only guard on the stored
    values: only known catalogue scopes, without duplicates, are accepted. Staff-only
    scopes are not checked here (the requester is anonymous); approval checks them.
    """

    scopes = serializers.ListField(
        child=serializers.CharField(max_length=SCOPE_MAX_LENGTH),
        max_length=len(SCOPES),
        required=False,
        allow_empty=True,
        default=list,
    )

    def validate_scopes(self, value):
        """Reject unknown and duplicated scopes."""
        errors = []
        if any(scope not in SCOPES for scope in value):
            errors.append(error('invalid_scope'))
        if has_duplicates(value):
            errors.append(error('duplicate_scope'))
        if errors:
            raise serializers.ValidationError(errors)
        return value
