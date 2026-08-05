"""Tests for the PermissionsBuilder class."""

import pytest

from games.permissions.builder import PermissionsBuilder
from games.permissions.roles import Roles
from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory, UserFactory


@pytest.mark.django_db
class TestPermissionsBuilderRealIdentity:
    """Tests for PermissionsBuilder.build() with a real user/game/pc."""

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

    def test_merges_every_resource_in_the_page_config(self):
        """Test that build() merges every resource entry of a multi-resource page."""
        builder = PermissionsBuilder(
            page_key='character_pc', user=self.owner_user, game=self.game, pc=self.pc,
        )
        result = builder.build()
        assert result == {
            'can_edit': True,
            'can_exchange_treasure': True,
            'can_set_profile_photo': True,
            'can_delete_photo': False,
            'can_create_item': True,
            'can_upload_item_photo': True,
        }

    def test_single_resource_page_returns_its_keys_only(self):
        """Test that build() returns exactly the game page's six response keys."""
        builder = PermissionsBuilder(page_key='game', user=self.dm_user, game=self.game)
        assert builder.build() == {
            'can_edit': True,
            'can_edit_regular': True,
            'can_create_item': True,
            'can_create_document': True,
            'can_edit_session': True,
            'can_create_npc': True,
        }


class TestPermissionsBuilderSimulatedRoles:
    """Tests for PermissionsBuilder.build() with an injected Roles override."""

    def test_simulated_roles_are_honored_across_every_resource(self):
        """Test that a simulated dm role grants every resource's actions on the npc page."""
        roles = Roles.from_booleans(is_dm=True)
        builder = PermissionsBuilder(page_key='character_npc', roles=roles)
        result = builder.build()
        assert all(result.values())

    def test_simulated_roles_with_no_matching_role_denies_everything(self):
        """Test that a fully-False simulated Roles denies every action on the game page."""
        roles = Roles.from_booleans()
        builder = PermissionsBuilder(page_key='game', roles=roles)
        result = builder.build()
        assert not any(result.values())
