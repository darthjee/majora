"""Tests for the ResourcePermissionsResolver class."""

import pytest

from games.permissions.resource_resolver import ResourcePermissionsResolver
from games.permissions.roles import Roles
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory


@pytest.mark.django_db
class TestResourcePermissionsResolverRealIdentity:
    """Tests for ResourcePermissionsResolver.resolve() with a real user/game/pc."""

    def setup_method(self):
        """Set up a game, its DM, an owning player and PC."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.owner_user = UserFactory(username='owner_user', password='secret-password')
        self.owner_player = PlayerFactory(game=self.game, user=self.owner_user)
        self.pc = CharacterFactory(
            name='Hero', game=self.game, player=self.owner_player, npc=False,
        )

    def test_resolves_every_action_in_the_map(self):
        """Test that every configured action becomes a response-key boolean."""
        action_map = {'edit': 'can_edit', 'treasure_exchange': 'can_exchange_treasure'}
        resolver = ResourcePermissionsResolver(
            'game_pc', action_map, user=self.owner_user, game=self.game, pc=self.pc,
        )
        assert resolver.resolve() == {'can_edit': True, 'can_exchange_treasure': True}

    def test_denies_actions_the_real_user_may_not_perform(self):
        """Test that an action the user isn't allowed resolves to False."""
        action_map = {'photo_delete': 'can_delete_photo'}
        resolver = ResourcePermissionsResolver(
            'game_pc', action_map, user=self.owner_user, game=self.game, pc=self.pc,
        )
        assert resolver.resolve() == {'can_delete_photo': False}

    def test_dm_shortcut_grants_every_action(self):
        """Test that the game's DM gets every action True via the admin/dm shortcut."""
        action_map = {'edit': 'can_edit', 'photo_delete': 'can_delete_photo'}
        resolver = ResourcePermissionsResolver(
            'game_pc', action_map, user=self.dm_user, game=self.game, pc=self.pc,
        )
        assert resolver.resolve() == {'can_edit': True, 'can_delete_photo': True}


class TestResourcePermissionsResolverSimulatedRoles:
    """Tests for ResourcePermissionsResolver.resolve() with an injected Roles object."""

    def test_simulated_owner_resolves_owner_level_actions(self):
        """Test that a simulated owner role grants game_pc.edit."""
        roles = Roles.from_booleans(is_owner=True)
        resolver = ResourcePermissionsResolver('game_pc', {'edit': 'can_edit'}, roles=roles)
        assert resolver.resolve() == {'can_edit': True}

    def test_simulated_player_does_not_resolve_owner_level_actions(self):
        """Test that a simulated (non-owner) player role does not grant game_pc.edit."""
        roles = Roles.from_booleans(is_player=True)
        resolver = ResourcePermissionsResolver('game_pc', {'edit': 'can_edit'}, roles=roles)
        assert resolver.resolve() == {'can_edit': False}

    def test_returns_an_empty_hash_for_an_empty_action_map(self):
        """Test that resolve() returns an empty hash when the action map has no entries."""
        roles = Roles.from_booleans(is_superuser=True)
        resolver = ResourcePermissionsResolver('game_pc', {}, roles=roles)
        assert resolver.resolve() == {}
