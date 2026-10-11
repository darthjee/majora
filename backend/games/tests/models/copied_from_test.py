"""Tests for the `copied_from` provenance FK on the six copyable game models."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameCommonItemFactory,
    GameDocumentFactory,
    GameFactionFactory,
    GameFactory,
    GameItemFactory,
    GamePossessionFactory,
    GameRecipeFactory,
    SuperUserFactory,
)

COPYABLE_FACTORIES = [
    GameItemFactory,
    GameCommonItemFactory,
    GameRecipeFactory,
    GameDocumentFactory,
    GameFactionFactory,
    GamePossessionFactory,
]


@pytest.mark.django_db
@pytest.mark.parametrize('factory', COPYABLE_FACTORIES)
class TestCopiedFrom:
    """Tests for the `copied_from` FK, parametrized over every copyable model."""

    def setup_method(self):
        """Set up a source game and a target game."""
        self.source_game = GameFactory(name='Source', game_slug='source')
        self.target_game = GameFactory(name='Target', game_slug='target')

    def _source_and_copy(self, factory):
        """Create a source row and a copy of it in the target game."""
        source = factory(game=self.source_game)
        copy = factory(game=self.target_game, copied_from=source)
        return source, copy

    def test_copied_from_defaults_to_null(self, factory):
        """Test that `copied_from` is null by default."""
        row = factory(game=self.source_game)
        assert row.copied_from is None

    def test_copy_can_point_to_row_of_another_game(self, factory):
        """Test that a row can point to a row of another game."""
        source, copy = self._source_and_copy(factory)
        copy.refresh_from_db()
        assert copy.copied_from == source
        assert list(source.copies.all()) == [copy]

    def test_deleting_source_nulls_copied_from(self, factory):
        """Test that deleting the source nulls the copy's `copied_from` and keeps the copy."""
        source, copy = self._source_and_copy(factory)
        source.delete()
        copy.refresh_from_db()
        assert copy.copied_from is None

    def test_deleting_source_game_nulls_copied_from(self, factory):
        """Test that deleting the source's game nulls the copy's `copied_from`."""
        _, copy = self._source_and_copy(factory)
        self.source_game.delete()
        copy.refresh_from_db()
        assert copy.copied_from is None

    def test_nulling_creates_no_history_entry_on_copy(self, factory):
        """Test that nulling `copied_from` on delete creates no historical record on the copy."""
        source, copy = self._source_and_copy(factory)
        count = copy.history.count()
        source.delete()
        assert copy.history.count() == count


@pytest.mark.django_db
class TestCopiedFromNotExposed(TokenAuthRequestMixin):
    """Tests that game item responses never expose `copied_from`."""

    def setup_method(self):
        """Set up a copied item and a superuser token."""
        source = GameItemFactory(game=GameFactory(name='Source', game_slug='source'))
        self.game = GameFactory(name='Target', game_slug='target')
        self.item = GameItemFactory(game=self.game, copied_from=source)
        self.token = Token.objects.create(user=SuperUserFactory(username='admin'))

    def _data(self, client, url):
        """Return the decoded JSON body of a GET on `url` as the superuser."""
        response = self.get(client, url, token=self.token)
        assert response.status_code == 200
        return json.loads(response.content)

    def test_regular_response_omits_copied_from(self, client):
        """Test that the regular item detail does not contain `copied_from`."""
        data = self._data(client, f'/games/target/items/{self.item.id}.json')
        assert 'copied_from' not in data

    def test_restricted_response_omits_copied_from(self, client):
        """Test that the restricted item detail does not contain `copied_from`."""
        data = self._data(client, f'/games/target/items/{self.item.id}/full.json')
        assert 'copied_from' not in data
