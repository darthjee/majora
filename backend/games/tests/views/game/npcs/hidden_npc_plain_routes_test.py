"""Regression tests: no plain (AllowAny) NPC GET serves a hidden NPC, editors included."""

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterDocumentFactory,
    CharacterFactionFactory,
    CharacterFactory,
    CharacterItemFactory,
    CharacterPossessionFactory,
    CharacterRecipeFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)

NPC_PREFIX = '/games/test-game/npcs/{npc}'

PLAIN_NPC_GET_ROUTES = [
    NPC_PREFIX + '.json',
    NPC_PREFIX + '/photos.json',
    NPC_PREFIX + '/items.json',
    NPC_PREFIX + '/documents.json',
    NPC_PREFIX + '/factions.json',
    NPC_PREFIX + '/possessions.json',
    NPC_PREFIX + '/recipes.json',
    NPC_PREFIX + '/treasures.json',
    NPC_PREFIX + '/items/{character_item}.json',
    NPC_PREFIX + '/documents/{character_document}.json',
    NPC_PREFIX + '/factions/{character_faction}.json',
    NPC_PREFIX + '/possessions/{character_possession}.json',
    NPC_PREFIX + '/recipes/{character_recipe}.json',
    NPC_PREFIX + '/items/available.json',
    NPC_PREFIX + '/documents/available.json',
    NPC_PREFIX + '/factions/available.json',
    NPC_PREFIX + '/possessions/available.json',
    NPC_PREFIX + '/recipes/available.json',
    NPC_PREFIX + '/documents/{character_document}/files.json',
    NPC_PREFIX + '/documents/{character_document}/photos.json',
    '/games/test-game/items/{game_item}/npcs/{npc}/summary.json',
    '/games/test-game/treasures/{treasure}/npcs/{npc}/summary.json',
    '/games/test-game/documents/{game_document}/npcs/{npc}/summary.json',
    '/games/test-game/factions/{game_faction}/npcs/{npc}/summary.json',
]

ROLES = ['anonymous', 'player', 'dm', 'superuser']


@pytest.mark.django_db
class TestHiddenNpcPlainRoutes(TokenAuthRequestMixin):
    """Every plain NPC GET 404s a hidden NPC for every caller (issue #1616)."""

    def setup_method(self):
        """Set up a game, one user per role, and a hidden NPC holding one of everything."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.npc = CharacterFactory(name='Secret NPC', game=self.game, npc=True, hidden=True)
        self.tokens = self._build_tokens()
        self.ids = self._build_holdings()

    def _build_tokens(self):
        """Return a token (or None for anonymous) per role name."""
        player = UserFactory(username='player', password='secret-password')
        PlayerFactory(game=self.game, user=player)
        dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=dm_user, is_dm=True)
        superuser = SuperUserFactory(username='admin', password='secret-password')
        return {
            'anonymous': None,
            'player': Token.objects.create(user=player),
            'dm': Token.objects.create(user=dm_user),
            'superuser': Token.objects.create(user=superuser),
        }

    def _build_holdings(self):
        """Create one held entity of each kind on the NPC and return the URL ids."""
        CharacterPhoto.objects.create(path='photos/secret.png', character=self.npc, ready=True)
        item = CharacterItemFactory(character=self.npc, game_item__game=self.game)
        document = CharacterDocumentFactory(character=self.npc, game_document__game=self.game)
        faction = CharacterFactionFactory(character=self.npc, game_faction__game=self.game)
        possession = CharacterPossessionFactory(
            character=self.npc, game_possession__game=self.game,
        )
        recipe = CharacterRecipeFactory(character=self.npc)
        treasure = TreasureFactory(name='Secret Idol', value=10, game=self.game)
        return {
            'npc': self.npc.id,
            'character_item': item.id,
            'character_document': document.id,
            'character_faction': faction.id,
            'character_possession': possession.id,
            'character_recipe': recipe.id,
            'game_item': item.game_item_id,
            'game_document': document.game_document_id,
            'game_faction': faction.game_faction_id,
            'treasure': treasure.id,
        }

    def _get(self, client, route, role):
        """Issue a GET to `route` (formatted with the fixture ids) as `role`."""
        return self.get(client, route.format(**self.ids), token=self.tokens[role])

    @pytest.mark.parametrize('role', ROLES)
    @pytest.mark.parametrize('route', PLAIN_NPC_GET_ROUTES)
    def test_hidden_npc_returns_404(self, client, route, role):
        """Test that a plain GET on a hidden NPC returns 404 with X-Skip-Cache for any role."""
        response = self._get(client, route, role)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    @pytest.mark.parametrize('route', PLAIN_NPC_GET_ROUTES)
    def test_visible_npc_returns_200_for_dm(self, client, route):
        """Test that the same plain GET succeeds once the NPC is no longer hidden."""
        self.npc.hidden = False
        self.npc.save()
        response = self._get(client, route, 'dm')
        assert response.status_code == 200
