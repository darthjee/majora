"""Tests for the `Session` model."""

import pytest

from domains.tests.factories import DomainFactory
from games.tests.factories import UserFactory
from statistics.models import Session


@pytest.mark.django_db
class TestSession:
    """Tests for the `Session` model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.user = UserFactory(username='alice')
        self.domain = DomainFactory(domain='example.com')

    def test_token_is_auto_generated(self):
        """Test that a token is generated automatically when not provided."""
        session = Session.objects.create(ip='127.0.0.1')

        assert session.token

    def test_token_is_unique(self):
        """Test that two sessions never share a token."""
        first = Session.objects.create(ip='127.0.0.1')
        second = Session.objects.create(ip='127.0.0.1')

        assert first.token != second.token

    def test_user_is_nullable(self):
        """Test that a session can represent an anonymous visitor (`user` is `None`)."""
        session = Session.objects.create(ip='127.0.0.1')

        assert session.user_id is None

    def test_user_can_be_set(self):
        """Test that a session can be tied to a logged-in user."""
        session = Session.objects.create(ip='127.0.0.1', user=self.user)

        assert session.user_id == self.user.id

    def test_deleting_user_sets_session_user_to_none(self):
        """Test that deleting the linked `User` sets `user` to `None` instead of deleting."""
        session = Session.objects.create(ip='127.0.0.1', user=self.user)

        self.user.delete()
        session.refresh_from_db()

        assert session.user_id is None
        assert Session.objects.filter(id=session.id).exists()

    def test_domain_is_nullable(self):
        """Test that a session can represent a visit on an unrecognized domain (`None`)."""
        session = Session.objects.create(ip='127.0.0.1')

        assert session.domain_id is None

    def test_domain_can_be_set(self):
        """Test that a session can be tied to a registered `Domain`."""
        session = Session.objects.create(ip='127.0.0.1', domain=self.domain)

        assert session.domain_id == self.domain.id

    def test_deleting_domain_sets_session_domain_to_none(self):
        """Test that deleting the linked `Domain` sets `domain` to `None` instead of deleting."""
        session = Session.objects.create(ip='127.0.0.1', domain=self.domain)

        self.domain.delete()
        session.refresh_from_db()

        assert session.domain_id is None
        assert Session.objects.filter(id=session.id).exists()
