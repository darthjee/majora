"""End-to-end tests for the `@token_scopes` declarations of the item views (issue #1635)."""

import pytest

from games.tests.factories import GameItemFactory

from ._entity_token_scopes_behavior import (
    EntityScopedTokenMixin,
    GamesBehavior,
    OtherCredentialsBehavior,
    OwnerIntersectionBehavior,
    PublicReadsBehavior,
    RestrictedReadsBehavior,
    WritesBehavior,
)


class ItemScopedTokenMixin(EntityScopedTokenMixin):
    """Entity fixtures for the item family."""

    family = 'items'
    permissions_name = 'game_item'
    factory = staticmethod(GameItemFactory)


@pytest.mark.django_db
class TestItemTokenScopesPublicReads(ItemScopedTokenMixin, PublicReadsBehavior):
    """Plain item reads accept a token without any scope."""


@pytest.mark.django_db
class TestItemTokenScopesRestrictedReads(ItemScopedTokenMixin, RestrictedReadsBehavior):
    """items/all.json and items/<id>/full.json need `items:read`."""


@pytest.mark.django_db
class TestItemTokenScopesWrites(ItemScopedTokenMixin, WritesBehavior):
    """Item writes need `items:write`."""


@pytest.mark.django_db
class TestItemTokenScopesGames(ItemScopedTokenMixin, GamesBehavior):
    """A token limited to some games is only accepted on those games."""


@pytest.mark.django_db
class TestItemTokenScopesOwnerIntersection(ItemScopedTokenMixin, OwnerIntersectionBehavior):
    """A token never grants more than its owner's role allows."""


@pytest.mark.django_db
class TestItemTokenScopesOtherCredentials(ItemScopedTokenMixin, OtherCredentialsBehavior):
    """Session and legacy `Token` requests are unaffected by scope declarations."""
