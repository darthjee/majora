"""Scoped API token item serializer for the accounts app."""

from rest_framework import serializers

from accounts.models import ApiToken
from accounts.serializers.api_token.game_ref import ApiTokenGameSerializer

STATUS_ACTIVE = 'active'
STATUS_EXPIRED = 'expired'


class ApiTokenItemSerializer(serializers.ModelSerializer):
    """Serialize a token's metadata. Never emits the secret or its hash."""

    scopes = serializers.SerializerMethodField()
    games = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        """Metadata for the ApiTokenItemSerializer."""

        model = ApiToken
        fields = [
            'id', 'name', 'prefix', 'scopes', 'games', 'expires_at', 'last_used_at',
            'created_at', 'status',
        ]
        read_only_fields = fields

    def get_scopes(self, obj):
        """Return the stored scopes, sorted."""
        return sorted(obj.scopes or [])

    def get_games(self, obj):
        """Return the token's games as `{slug, name}` pairs, sorted by name."""
        games = sorted(obj.games.all(), key=lambda game: (game.name, game.game_slug))
        return ApiTokenGameSerializer(games, many=True).data

    def get_status(self, obj):
        """Return `expired` or `active`; a convenience field the UI may recompute."""
        return STATUS_EXPIRED if obj.is_expired() else STATUS_ACTIVE
