"""Tests for DomainGamesCache."""

import pytest
from django.test import RequestFactory, override_settings

from games.caches import DomainGamesCache
from games.tests.factories import GameDomainFactory, GameFactory
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestDomainGamesCacheGameLinkedToMultipleGroups:
    """Tests for a game linked to more than one GameDomainGroup."""

    def setup_method(self):
        """Set up two domains/groups and a game linked to both."""
        memory_cache.clear()
        self.first_domain = GameDomainFactory(domain='first.com')
        self.second_domain = GameDomainFactory(domain='second.com')
        self.game = GameFactory(
            game_domain_groups=[
                self.first_domain.game_domain_group,
                self.second_domain.game_domain_group,
            ]
        )

    def test_game_is_returned_under_both_domains(self):
        """Test that a game linked to two groups is returned under both groups' domains."""
        assert DomainGamesCache.game_ids_for_domain('first.com') == [self.game.id]
        assert DomainGamesCache.game_ids_for_domain('second.com') == [self.game.id]


@pytest.mark.django_db
class TestDomainGamesCacheGameIdsForDomain:
    """Tests for DomainGamesCache.game_ids_for_domain()."""

    def setup_method(self):
        """Set up a domain with games under its group, and clear the shared memory cache."""
        memory_cache.clear()
        self.game_domain = GameDomainFactory(domain='example.com')
        self.game = GameFactory(game_domain_groups=[self.game_domain.game_domain_group])
        self.other_game = GameFactory(game_domain_groups=[self.game_domain.game_domain_group])

    def test_returns_ids_of_games_under_the_matching_group(self):
        """Test that game ids under the matching GameDomainGroup are returned."""
        result = DomainGamesCache.game_ids_for_domain('example.com')
        assert sorted(result) == sorted([self.game.id, self.other_game.id])

    def test_is_case_insensitive(self):
        """Test that a differently-cased domain still matches the stored lowercase domain."""
        result = DomainGamesCache.game_ids_for_domain('Example.com')
        assert sorted(result) == sorted([self.game.id, self.other_game.id])

    def test_returns_empty_list_for_unknown_domain(self):
        """Test that a domain with no matching GameDomain resolves to an empty list."""
        assert DomainGamesCache.game_ids_for_domain('unknown.com') == []

    def test_serves_from_cache_on_hit_even_after_games_change(self):
        """Test that a cached result is served without re-checking the live games."""
        first = DomainGamesCache.game_ids_for_domain('example.com')

        self.game.delete()
        self.other_game.delete()

        second = DomainGamesCache.game_ids_for_domain('example.com')
        assert second == first

    def test_populates_the_cache_type_keyed_by_lowercased_domain(self):
        """Test that a cache miss stores the result under CACHE_TYPE keyed by lowercase."""
        DomainGamesCache.game_ids_for_domain('Example.com')
        cached = memory_cache.get(DomainGamesCache.CACHE_TYPE, 'example.com')
        assert sorted(cached) == sorted([self.game.id, self.other_game.id])


@pytest.mark.django_db
class TestDomainGamesCacheGameIdsForRequest:
    """Tests for DomainGamesCache.game_ids_for_request()."""

    def setup_method(self):
        """Set up a domain with a game under its group, and clear the shared memory cache."""
        memory_cache.clear()
        self.game_domain = GameDomainFactory(domain='example.com')
        self.game = GameFactory(game_domain_groups=[self.game_domain.game_domain_group])
        self.factory = RequestFactory()

    @override_settings(ALLOWED_HOSTS=['example.com'])
    def test_strips_port_before_delegating(self):
        """Test that a port in the request's host is stripped before the domain lookup."""
        request = self.factory.get('/', HTTP_HOST='example.com:8443')
        assert DomainGamesCache.game_ids_for_request(request) == [self.game.id]

    @override_settings(ALLOWED_HOSTS=['example.com'])
    def test_matches_result_of_calling_game_ids_for_domain_directly(self):
        """Test that the request-based entry point matches the domain-based one."""
        request = self.factory.get('/', HTTP_HOST='example.com:8443')
        expected = DomainGamesCache.game_ids_for_domain('example.com')
        assert DomainGamesCache.game_ids_for_request(request) == expected
