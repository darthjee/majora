"""Shared builder for the common "game with a DM" setup used across the test suite.

The builder is meant for `setUpTestData`, for example `cls.base = build_base_game()`, so the
rows are created once per class and rolled back by `TestCase`. It must never back a fixture
scoped to a class, module or session: those writes are not rolled back between tests.

It always registers the `testserver` domain. `Domain.domain` is unique, so a test that also
creates `testserver` must use `base.domain` instead.
"""

from dataclasses import dataclass

from django.contrib.auth.models import User

from domains.models import Domain
from domains.tests.factories.domain import DomainFactory
from games.models import Game, Player
from games.tests.factories.game import GameFactory, PlayerFactory
from games.tests.factories.user import UserFactory


@dataclass(frozen=True)
class BaseGame:
    """A game in the `testserver` domain together with its DM user and player."""

    game: Game
    dm_user: User
    dm_player: Player
    domain: Domain


def build_base_game(*, game_name='Test Game', game_slug=None, dm_username=None, **game_overrides):
    """Create a `testserver` domain, a game in its group and a DM player, and return them."""
    domain = DomainFactory(domain='testserver')
    game = _build_game(domain, game_name, game_slug, game_overrides)
    dm_user = UserFactory(**({'username': dm_username} if dm_username else {}))
    dm_player = PlayerFactory(game=game, user=dm_user, is_dm=True)
    return BaseGame(game=game, dm_user=dm_user, dm_player=dm_player, domain=domain)


def _build_game(domain, name, slug, overrides):
    """Create the game inside the domain's group, using the factory slug when none is given."""
    if slug is not None:
        overrides = {**overrides, 'game_slug': slug}
    return GameFactory(name=name, game_domain_groups=[domain.domain_group], **overrides)
