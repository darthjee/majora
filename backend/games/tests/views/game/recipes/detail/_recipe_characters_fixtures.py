"""Shared fixtures for the recipe → characters view tests (issue #1447)."""

from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameFactory,
    GameRecipeFactory,
    PlayerFactory,
    UserFactory,
)


class RecipeCharactersViewFixtures(TokenAuthRequestMixin):
    """Build a recipe known by PCs and NPCs, including hidden links and hidden/incognito NPCs."""

    def setup_recipe_characters(self):
        """Create the game, users, the recipe and its character links."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_user = UserFactory(username='dm_user')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player')
        PlayerFactory(game=self.game, user=self.player_user)
        self.player_token = Token.objects.create(user=self.player_user)
        self.recipe = GameRecipeFactory(game=self.game, name='Brew Potion')
        self.zed = self._know('Zed', npc=False)
        self.aragorn = self._know('Aragorn', npc=False)
        self.gandalf = self._know('Gandalf', npc=True)
        self.secret_link = self._know('Boromir', npc=False, link_hidden=True)
        self.hidden_npc = self._know('Sauron', npc=True, hidden=True)
        self.incognito_npc = self._know('Strider', npc=True, incognito=True)
        CharacterRecipeFactory(character=CharacterFactory(game=self.game, name='Other'))

    def _know(self, name, npc, link_hidden=False, **character_kwargs):
        """Create a character named `name` and link it to the fixture recipe."""
        character = CharacterFactory(game=self.game, name=name, npc=npc, **character_kwargs)
        CharacterRecipeFactory(character=character, game_recipe=self.recipe, hidden=link_hidden)
        return character
