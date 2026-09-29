"""Shared fixtures for the PC/NPC recipe available/acquire/remove view tests (issue #1459)."""

from rest_framework.authtoken.models import Token

from games.models import CharacterRecipe
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory, UserFactory
from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures

UNKNOWN_RECIPE_ID = 999999


class CharacterRecipeExchangeFixtures(CharacterRecipeViewFixtures):
    """Extend the character recipe fixtures with a catalog, other-game recipes and more users.

    The character already knows `Brew Potion`, `Distill Poison`, `Secret Recipe` (hidden
    GameRecipe) and `Hidden Brew` (hidden row). The not-yet-known catalog is `Fire Elixir`
    (visible), `Venom Draught` (hidden output) and `Forbidden Tonic` (hidden GameRecipe).
    """

    kind = None

    def setup_exchange(self):
        """Create users, the character's known rows, the catalog and another game's recipes.

        The fixture character is the PC or the NPC, depending on the subclass' `kind`.
        """
        self.setup_users()
        self.character = self.npc if self.kind == 'npc' else self.pc
        self.setup_recipes(self.character)
        self._setup_extra_users()
        self._setup_catalog()
        self._setup_other_game()

    def _setup_extra_users(self):
        """Create a staff user and a user who is not a member of the game, with tokens."""
        self.staff_user = UserFactory(username='staff_user', is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.outsider = UserFactory(username='outsider')
        self.outsider_token = Token.objects.create(user=self.outsider)

    def _setup_catalog(self):
        """Create the game recipes the character does not know yet."""
        item = GameCommonItemFactory(game=self.game, name='Elixir')
        self.catalog_recipe = self._recipe(self.game, 'Fire Elixir', item)
        self.masked_recipe = self._recipe(self.game, 'Venom Draught', self.hidden_item)
        self.hidden_recipe = self._recipe(self.game, 'Forbidden Tonic', item, hidden=True)

    def _setup_other_game(self):
        """Create a visible and a hidden recipe in another game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        item = GameCommonItemFactory(game=other_game, name='Foreign Item')
        self.other_game_recipe = self._recipe(other_game, 'Foreign Brew', item)
        self.other_game_hidden_recipe = self._recipe(other_game, 'Foreign Secret', item, True)

    @staticmethod
    def _recipe(game, name, output, hidden=False):
        """Create a GameRecipe in `game` producing `output`."""
        return GameRecipeFactory(game=game, name=name, game_common_item=output, hidden=hidden)

    def url(self, suffix, query=''):
        """Return the fixture character's `recipes/<suffix>` URL."""
        base = f'/games/test-game/{self.kind}s/{self.character.id}/recipes'
        return f'{base}/{suffix}{query}'

    def post_recipe(self, client, suffix, game_recipe, token=None):
        """POST `{game_recipe_id: game_recipe.id}` to the `recipes/<suffix>` endpoint."""
        payload = {'game_recipe_id': game_recipe.id}
        return self.post(client, self.url(suffix), payload, token=token)

    def post_recipe_id(self, client, suffix, game_recipe_id, token=None):
        """POST a raw `game_recipe_id` value to the `recipes/<suffix>` endpoint."""
        payload = {'game_recipe_id': game_recipe_id}
        return self.post(client, self.url(suffix), payload, token=token)

    def link_exists(self, game_recipe):
        """Return whether the fixture character is linked to `game_recipe`."""
        return CharacterRecipe.objects.filter(
            character=self.character, game_recipe=game_recipe,
        ).exists()

    def link_for(self, game_recipe):
        """Return the fixture character's CharacterRecipe row for `game_recipe`."""
        return CharacterRecipe.objects.get(character=self.character, game_recipe=game_recipe)

    def hide_character(self):
        """Mark the fixture character as hidden."""
        self.character.hidden = True
        self.character.save()
