"""Scoped API token create serializer for the accounts app."""

from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail

from accounts.api_tokens import may_hold_staff_scopes, reachable_games
from accounts.models import ApiToken
from accounts.scopes import SCOPES, STAFF_ONLY_SCOPES
from accounts.serializers.api_token.item import ApiTokenItemSerializer
from accounts.serializers.api_token.strict_fields import StrictFieldsMixin
from games.models import Game

NAME_MAX_LENGTH = 100
SCOPE_MAX_LENGTH = 64
GAMES_MAX_COUNT = 100
GAME_SLUG_MAX_LENGTH = Game._meta.get_field('game_slug').max_length


def error(code):
    """Return an `ErrorDetail` whose message is its code."""
    return ErrorDetail(code, code=code)


def has_duplicates(values):
    """Return whether `values` holds the same entry more than once."""
    return len(set(values)) != len(values)


class ApiTokenCreateSerializer(StrictFieldsMixin, serializers.Serializer):
    """Validate a token creation request; `context['user']` is always the owner."""

    name = serializers.CharField(max_length=NAME_MAX_LENGTH, trim_whitespace=True)
    scopes = serializers.ListField(
        child=serializers.CharField(max_length=SCOPE_MAX_LENGTH),
        allow_empty=False,
        max_length=len(SCOPES),
    )
    games = serializers.ListField(
        child=serializers.CharField(max_length=GAME_SLUG_MAX_LENGTH),
        required=False,
        default=list,
        max_length=GAMES_MAX_COUNT,
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True, default=None)

    def validate_scopes(self, value):
        """Reject unknown scopes, staff-only scopes for non-staff owners and duplicates."""
        errors = []
        if any(scope not in SCOPES for scope in value):
            errors.append(error('invalid_scope'))
        if self._has_forbidden_staff_scope(value):
            errors.append(error('scope_staff_only'))
        if has_duplicates(value):
            errors.append(error('duplicate_scope'))
        if errors:
            raise serializers.ValidationError(errors)
        return value

    def validate_games(self, value):
        """Resolve the slugs to reachable games, rejecting duplicates and unreachable ones."""
        if has_duplicates(value):
            raise serializers.ValidationError([error('duplicate_game')])
        games = list(reachable_games(self._user()).filter(game_slug__in=value))
        if len(games) != len(value):
            raise serializers.ValidationError([error('game_not_reachable')])
        return games

    def validate_expires_at(self, value):
        """Reject an expiry that is not strictly in the future."""
        if value is not None and value <= timezone.now():
            raise serializers.ValidationError([error('expires_in_past')])
        return value

    def create(self, validated_data):
        """Create the token for the owner, keeping its plain value for `created_data`."""
        api_token, self.plain_token = ApiToken.objects.create_token(
            owner=self._user(), **validated_data,
        )
        return api_token

    def created_data(self):
        """Return the token item plus the full token: the only payload ever carrying it."""
        return {**ApiTokenItemSerializer(self.instance).data, 'token': self.plain_token}

    def _has_forbidden_staff_scope(self, scopes):
        """Return whether `scopes` holds a staff-only scope the owner may not be granted."""
        if STAFF_ONLY_SCOPES.isdisjoint(scopes):
            return False
        return not may_hold_staff_scopes(self._user())

    def _user(self):
        """Return the owner taken from the serializer context."""
        return self.context['user']
