"""Tests for GET /account/api_tokens/options.json."""

import pytest

from accounts.scopes import SCOPES, STAFF_ONLY_SCOPES
from accounts.tests.api_tokens.support import session_client
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)

OPTIONS_URL = '/account/api_tokens/options.json'


@pytest.mark.django_db
class TestApiTokenOptions:
    """Tests for GET /account/api_tokens/options.json."""

    def setup_method(self):
        """Set up games where a member is DM, player and PC owner, plus one they miss."""
        self.user = UserFactory()
        self.dm_game = GameFactory(name='Delta', game_slug='delta')
        self.player_game = GameFactory(name='Bravo', game_slug='bravo')
        self.pc_game = GameFactory(name='Charlie', game_slug='charlie')
        self.other_game = GameFactory(name='Alpha', game_slug='alpha')
        PlayerFactory(game=self.dm_game, user=self.user, is_dm=True)
        PlayerFactory(game=self.player_game, user=self.user)
        player = PlayerFactory(game=self.pc_game, user=self.user)
        CharacterFactory(game=self.pc_game, player=player, npc=False)

    def _get(self, user):
        """GET the options as `user` through a session."""
        return session_client(user).get(OPTIONS_URL)

    def test_member_scopes_skip_staff_only(self):
        """Test that a non-staff caller gets the sorted catalogue without staff-only scopes."""
        expected = sorted(set(SCOPES) - STAFF_ONLY_SCOPES)
        assert self._get(self.user).json()['scopes'] == expected

    def test_member_scopes_lack_statistics_read(self):
        """Test that a non-staff caller is not offered statistics:read."""
        assert 'statistics:read' not in self._get(self.user).json()['scopes']

    def test_staff_scopes_are_full_sorted_catalogue(self):
        """Test that a staff caller gets the full catalogue, sorted."""
        staff = UserFactory(is_staff=True)
        assert self._get(staff).json()['scopes'] == sorted(SCOPES)

    def test_superuser_scopes_include_statistics_read(self):
        """Test that a superuser is offered statistics:read."""
        assert 'statistics:read' in self._get(SuperUserFactory()).json()['scopes']

    def test_member_games(self):
        """Test that a member gets their DM, player and PC-owner games, sorted by name."""
        data = self._get(self.user).json()
        assert data['games'] == [
            {'slug': 'bravo', 'name': 'Bravo'},
            {'slug': 'charlie', 'name': 'Charlie'},
            {'slug': 'delta', 'name': 'Delta'},
        ]
        assert data['all_games'] is False

    def test_superuser_gets_every_game(self):
        """Test that a superuser gets every game with all_games true."""
        data = self._get(SuperUserFactory()).json()
        assert [game['slug'] for game in data['games']] == ['alpha', 'bravo', 'charlie', 'delta']
        assert data['all_games'] is True

    def test_plain_staff_gets_member_games_only(self):
        """Test that a plain staff user gets their member games only."""
        staff = UserFactory(is_staff=True)
        PlayerFactory(game=self.other_game, user=staff)
        data = self._get(staff).json()
        assert data['games'] == [{'slug': 'alpha', 'name': 'Alpha'}]
        assert data['all_games'] is False

    def test_skip_cache_header(self):
        """Test that the response carries X-Skip-Cache: true."""
        assert self._get(self.user)['X-Skip-Cache'] == 'true'
