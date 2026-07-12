"""Tests for the Character model."""

import pytest
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError

from games.models import Character
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestCharacter:
    """Tests for the Character model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Test Player')

    def test_character_creation(self):
        """Test that a character can be created with required fields."""
        character = CharacterFactory(name='Aragorn', game=self.game)
        assert character.name == 'Aragorn'
        assert character.game == self.game

    def test_character_npc_defaults_to_true(self):
        """Test that npc defaults to True on new characters."""
        character = CharacterFactory(name='Gandalf', game=self.game)
        assert character.npc is True

    def test_character_is_npc_when_no_player(self):
        """Test that a character without a player is an NPC."""
        character = CharacterFactory(name='Gandalf', game=self.game)
        assert character.is_pc is False

    def test_character_is_pc_when_npc_false(self):
        """Test that is_pc returns True when npc is False."""
        character = CharacterFactory(name='Frodo', game=self.game, npc=False)
        assert character.is_pc is True

    def test_character_is_pc_when_player_set(self):
        """Test that a character with a player is a PC."""
        character = CharacterFactory(
            name='Frodo', game=self.game, player=self.player, npc=False
        )
        assert character.is_pc is True

    def test_character_optional_fields(self):
        """Test that a character can have optional fields set."""
        character = CharacterFactory(
            name='Legolas',
            game=self.game,
            role='Ranger',
            public_description='An elf ranger from Mirkwood.',
            private_description='A spy sent by Thranduil.',
        )
        assert character.role == 'Ranger'
        assert 'elf ranger' in character.public_description
        assert character.private_description == 'A spy sent by Thranduil.'

    def test_public_description_defaults_to_empty_string(self):
        """Test that public_description defaults to an empty string."""
        character = CharacterFactory(name='Mystery', game=self.game)
        assert character.public_description == ''

    def test_private_description_defaults_to_empty_string(self):
        """Test that private_description defaults to an empty string."""
        character = CharacterFactory(name='Mystery', game=self.game)
        assert character.private_description == ''

    def test_role_can_be_null(self):
        """Test that role can be set to None."""
        character = CharacterFactory(
            name='Mystery NPC', game=self.game, role=None
        )
        character.refresh_from_db()
        assert character.role is None

    def test_allegiance_defaults_to_neutral(self):
        """Test that allegiance defaults to 'neutral' on new characters."""
        character = CharacterFactory(name='Gimli', game=self.game)
        assert character.allegiance == Character.ALLEGIANCE_NEUTRAL

    def test_public_allegiance_defaults_to_neutral(self):
        """Test that public_allegiance defaults to 'neutral' on new characters."""
        character = CharacterFactory(name='Gimli', game=self.game)
        assert character.public_allegiance == Character.ALLEGIANCE_NEUTRAL

    def test_slain_defaults_to_false(self):
        """Test that slain defaults to False on new characters."""
        character = CharacterFactory(name='Gimli', game=self.game)
        assert character.slain is False

    def test_public_slain_defaults_to_false(self):
        """Test that public_slain defaults to False on new characters."""
        character = CharacterFactory(name='Gimli', game=self.game)
        assert character.public_slain is False

    def test_money_defaults_to_zero(self):
        """Test that money defaults to 0 on new characters."""
        character = CharacterFactory(name='Gimli', game=self.game)
        assert character.money == 0

    def test_money_can_be_set(self):
        """Test that money can be set to a positive value."""
        character = CharacterFactory(name='Gimli', game=self.game, money=150)
        assert character.money == 150

    def test_negative_money_fails_validation(self):
        """Test that a negative money value fails full_clean validation."""
        character = Character(name='Gimli', game=self.game, money=-1)
        with pytest.raises(ValidationError):
            character.full_clean()

    def test_character_str(self):
        """Test string representation of a character."""
        character = Character(name='Gimli', game=self.game)
        assert str(character) == 'Gimli'

    def test_can_be_edited_by_returns_false_for_anonymous_user(self):
        """Test that an anonymous (None) user cannot edit a character."""
        character = CharacterFactory(name='Frodo', game=self.game, player=self.player)
        assert character.can_be_edited_by(None) is False

    def test_can_be_edited_by_returns_false_for_unauthenticated_user(self):
        """Test that an unauthenticated user cannot edit a character."""
        character = CharacterFactory(name='Frodo', game=self.game, player=self.player)
        anonymous_user = AnonymousUser()
        assert character.can_be_edited_by(anonymous_user) is False

    def test_can_be_edited_by_returns_true_for_superuser(self):
        """Test that a superuser can edit any character."""
        character = CharacterFactory(name='Frodo', game=self.game)
        superuser = SuperUserFactory(username='admin', password='secret-password')
        assert character.can_be_edited_by(superuser) is True

    def test_can_be_edited_by_returns_true_for_matching_player_user(self):
        """Test that the user linked to the character's player can edit it."""
        user = UserFactory(username='owner', password='secret-password')
        self.player.user = user
        self.player.save()
        character = CharacterFactory(name='Frodo', game=self.game, player=self.player)
        assert character.can_be_edited_by(user) is True

    def test_can_be_edited_by_returns_false_for_unrelated_user(self):
        """Test that a user not linked to the character's player cannot edit it."""
        owner = UserFactory(username='owner', password='secret-password')
        self.player.user = owner
        self.player.save()
        other_user = UserFactory(username='other', password='secret-password')
        character = CharacterFactory(name='Frodo', game=self.game, player=self.player)
        assert character.can_be_edited_by(other_user) is False

    def test_can_be_edited_by_returns_false_when_no_player(self):
        """Test that a character without a player cannot be edited by a non-superuser."""
        user = UserFactory(username='someone', password='secret-password')
        character = CharacterFactory(name='Gandalf', game=self.game)
        assert character.can_be_edited_by(user) is False

    def test_can_be_edited_by_returns_true_for_game_master(self):
        """Test that a DM of the character's game can edit the character."""
        dm_user = UserFactory(username='dm', password='secret-password')
        GameMasterFactory(game=self.game, user=dm_user)
        character = CharacterFactory(name='Frodo', game=self.game)
        assert character.can_be_edited_by(dm_user) is True

    def test_can_be_edited_by_returns_false_for_dm_of_different_game(self):
        """Test that a DM of a different game cannot edit the character."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        dm_user = UserFactory(username='dm', password='secret-password')
        GameMasterFactory(game=other_game, user=dm_user)
        character = CharacterFactory(name='Frodo', game=self.game)
        assert character.can_be_edited_by(dm_user) is False

    def test_editors_includes_player_user(self):
        """Test that the editors queryset includes the character's player's user."""
        user = UserFactory(username='player_user', password='secret-password')
        self.player.user = user
        self.player.save()
        character = CharacterFactory(name='Frodo', game=self.game, player=self.player)
        assert user in character.editors

    def test_editors_includes_game_masters(self):
        """Test that the editors queryset includes all DM users of the game."""
        dm1 = UserFactory(username='dm1', password='secret-password')
        dm2 = UserFactory(username='dm2', password='secret-password')
        GameMasterFactory(game=self.game, user=dm1)
        GameMasterFactory(game=self.game, user=dm2)
        character = CharacterFactory(name='Frodo', game=self.game)
        assert dm1 in character.editors
        assert dm2 in character.editors

    def test_editors_excludes_unrelated_users(self):
        """Test that the editors queryset does not include unrelated users."""
        unrelated = UserFactory(username='nobody', password='secret-password')
        character = CharacterFactory(name='Frodo', game=self.game)
        assert unrelated not in character.editors

    def test_editors_is_empty_when_no_player_and_no_dms(self):
        """Test that editors is empty for a character with no player and no DMs."""
        character = CharacterFactory(name='Gandalf', game=self.game)
        assert character.editors.count() == 0

    def test_is_editor_returns_true_for_player_user(self):
        """Test that the player's linked user is an editor."""
        user = UserFactory(username='player_user', password='secret-password')
        self.player.user = user
        self.player.save()
        character = CharacterFactory(name='Frodo', game=self.game, player=self.player)
        assert character.is_editor(user) is True

    def test_is_editor_returns_true_for_game_master(self):
        """Test that a DM of the game is an editor."""
        dm_user = UserFactory(username='dm', password='secret-password')
        GameMasterFactory(game=self.game, user=dm_user)
        character = CharacterFactory(name='Frodo', game=self.game)
        assert character.is_editor(dm_user) is True

    def test_is_editor_returns_false_for_unrelated_user(self):
        """Test that an unrelated user is not an editor."""
        unrelated = UserFactory(username='nobody', password='secret-password')
        character = CharacterFactory(name='Frodo', game=self.game)
        assert character.is_editor(unrelated) is False

    def test_is_editor_returns_false_for_superuser(self):
        """Test that superusers are not in editors (access is implicit via can_be_edited_by)."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        character = CharacterFactory(name='Frodo', game=self.game)
        assert character.is_editor(superuser) is False


@pytest.mark.django_db
class TestCharacterCanBeEditedByRoles:
    """Tests for Character.can_be_edited_by_roles()."""

    def setup_method(self):
        """Set up a game for testing."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_superuser_role_can_edit_pc(self):
        """Test that the superuser role may edit a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        assert pc.can_be_edited_by_roles(is_superuser=True, is_dm=False, is_owner=False) is True

    def test_dm_role_can_edit_pc(self):
        """Test that the dm role may edit a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        assert pc.can_be_edited_by_roles(is_superuser=False, is_dm=True, is_owner=False) is True

    def test_owner_role_can_edit_pc(self):
        """Test that the owner role may edit a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        assert pc.can_be_edited_by_roles(is_superuser=False, is_dm=False, is_owner=True) is True

    def test_no_roles_cannot_edit_pc(self):
        """Test that no matching role may not edit a PC."""
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        assert pc.can_be_edited_by_roles(is_superuser=False, is_dm=False, is_owner=False) is False

    def test_superuser_role_can_edit_npc(self):
        """Test that the superuser role may edit an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        assert npc.can_be_edited_by_roles(is_superuser=True, is_dm=False, is_owner=False) is True

    def test_dm_role_can_edit_npc(self):
        """Test that the dm role may edit an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        assert npc.can_be_edited_by_roles(is_superuser=False, is_dm=True, is_owner=False) is True

    def test_owner_role_is_a_no_op_for_npc(self):
        """Test that the owner role never flips can_edit to True for an NPC."""
        npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        assert npc.can_be_edited_by_roles(is_superuser=False, is_dm=False, is_owner=True) is False
