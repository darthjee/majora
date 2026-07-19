"""Mixin adding a `hidden` field to a list serializer's DM-only `*All` variant."""

from rest_framework import serializers


class HiddenFieldMixin(serializers.Serializer):
    """Add a `hidden` `SerializerMethodField`, resolved through `resolve_hidden`.

    A subclass must still extend its base `Meta.fields` with `'hidden'`; the default
    `resolve_hidden` returns `obj.hidden` (for models where `hidden` is a plain field, e.g.
    `CharacterItem`/`GameItem`) — override it where `hidden` must instead be resolved from
    context (e.g. a `Treasure`'s per-game `GameTreasure.hidden`).
    """

    hidden = serializers.SerializerMethodField()

    def get_hidden(self, obj):
        """Return whether `obj` is hidden, delegating to `resolve_hidden`."""
        return self.resolve_hidden(obj)

    def resolve_hidden(self, obj):
        """Return whether `obj` is hidden; default assumes a plain `hidden` model field."""
        return obj.hidden
