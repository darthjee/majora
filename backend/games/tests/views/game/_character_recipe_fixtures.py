"""Shared fixtures for the PC/NPC character recipe view tests (issue #1447)."""

from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
    PlayerFactory,
    UserFactory,
)


class CharacterRecipeViewFixtures(TokenAuthRequestMixin):
    """Build a game with a DM, an owning player, a PC, an NPC and their recipe rows."""

    def setup_users(self):
        """Create the game, a DM, a PC-owning player and an unrelated user, with tokens."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.owner = UserFactory(username='owner')
        self.player = PlayerFactory(name='Bob', game=self.game, user=self.owner)
        self.owner_token = Token.objects.create(user=self.owner)
        self.other_user = UserFactory(username='other')
        PlayerFactory(name='Carl', game=self.game, user=self.other_user)
        self.other_token = Token.objects.create(user=self.other_user)
        self.pc = CharacterFactory(name='Aragorn', game=self.game, player=self.player, npc=False)
        self.npc = CharacterFactory(name='Gandalf', game=self.game, npc=True)

    def setup_recipes(self, character):
        """Link `character` to a visible, a masked-output, a hidden-recipe and a hidden row."""
        visible_item = GameCommonItemFactory(game=self.game, name='Healing Potion')
        self.hidden_item = GameCommonItemFactory(game=self.game, name='Poison', hidden=True)
        self.visible_row = self._link(character, 'Brew Potion', visible_item)
        self.masked_row = self._link(character, 'Distill Poison', self.hidden_item)
        self.secret_recipe_row = self._link(
            character, 'Secret Recipe', visible_item, recipe_hidden=True,
        )
        self.hidden_row = self._link(character, 'Hidden Brew', visible_item, row_hidden=True)

    def _link(self, character, name, output, recipe_hidden=False, row_hidden=False):
        """Create a recipe producing `output` and link it to `character`."""
        game_recipe = GameRecipeFactory(
            game=self.game, name=name, game_common_item=output, hidden=recipe_hidden,
        )
        return CharacterRecipeFactory(
            character=character, game_recipe=game_recipe, hidden=row_hidden,
        )

    def by_name(self, data):
        """Index a list response by entry name."""
        return {entry['name']: entry for entry in data}
