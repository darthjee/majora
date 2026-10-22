"""End-to-end tests for the `@token_scopes` declarations of the possession views (issue #1635)."""

import pytest

from games.tests.factories import GamePossessionFactory

from ._entity_token_scopes_behavior import (
    EntityScopedTokenMixin,
    GamesBehavior,
    OtherCredentialsBehavior,
    OwnerIntersectionBehavior,
    PublicReadsBehavior,
    RestrictedReadsBehavior,
    WritesBehavior,
)


class PossessionScopedTokenMixin(EntityScopedTokenMixin):
    """Entity fixtures for the possession family."""

    family = 'possessions'
    permissions_name = 'game_possession'
    factory = staticmethod(GamePossessionFactory)


@pytest.mark.django_db
class TestPossessionTokenScopesPublicReads(PossessionScopedTokenMixin, PublicReadsBehavior):
    """Plain possession reads accept a token without any scope."""


@pytest.mark.django_db
class TestPossessionTokenScopesRestrictedReads(PossessionScopedTokenMixin, RestrictedReadsBehavior):
    """possessions/all.json and possessions/<id>/full.json need `possessions:read`."""


@pytest.mark.django_db
class TestPossessionTokenScopesWrites(PossessionScopedTokenMixin, WritesBehavior):
    """Possession writes need `possessions:write`."""


@pytest.mark.django_db
class TestPossessionTokenScopesGames(PossessionScopedTokenMixin, GamesBehavior):
    """A token limited to some games is only accepted on those games."""


@pytest.mark.django_db
class TestPossessionTokenScopesOwnerIntersection(
    PossessionScopedTokenMixin, OwnerIntersectionBehavior,
):
    """A token never grants more than its owner's role allows."""


@pytest.mark.django_db
class TestPossessionTokenScopesOtherCredentials(
    PossessionScopedTokenMixin, OtherCredentialsBehavior,
):
    """Session and legacy `Token` requests are unaffected by scope declarations."""
