"""Tests for the common.query_filters module."""

import pytest
from django.contrib.auth.models import User
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from common.query_filters import filter_by_name
from games.tests.factories import UserFactory
from miniatures.models import Source
from miniatures.tests.factories import SourceFactory


def _request(name=None):
    """Build a fake DRF Request, optionally carrying a `name` query param."""
    factory = APIRequestFactory()
    query = {'name': name} if name is not None else {}
    return Request(factory.get('/fake/', query))


@pytest.mark.django_db
class TestFilterByName:
    """Tests for filter_by_name."""

    def setup_method(self):
        """Set up a few users with distinct usernames to filter by."""
        self.dragon = UserFactory(username='dragon-rider')
        self.goblin = UserFactory(username='goblin-slayer')

    def test_returns_unchanged_queryset_when_name_param_absent(self):
        """Test that the queryset is returned unchanged when no `name` param is present."""
        queryset = User.objects.all()
        result = filter_by_name(_request(), queryset, field='username')
        assert set(result) == set(queryset)

    def test_returns_unchanged_queryset_when_name_param_blank(self):
        """Test that the queryset is returned unchanged when `name` is blank."""
        queryset = User.objects.all()
        result = filter_by_name(_request(''), queryset, field='username')
        assert set(result) == set(queryset)

    def test_filters_by_name_icontains_case_insensitively(self):
        """Test that a real substring filters the given field, case-insensitively."""
        queryset = User.objects.all()
        result = filter_by_name(_request('DRAGON'), queryset, field='username')
        assert list(result) == [self.dragon]

    def test_defaults_to_filtering_the_name_field(self):
        """Test that the default `field` argument is `name`."""
        SourceFactory(name='MyMiniFactory')
        other = SourceFactory(name='Thingiverse')

        result = filter_by_name(_request('mini'), Source.objects.all())

        assert list(result) == [Source.objects.get(name='MyMiniFactory')]
        assert other not in result
