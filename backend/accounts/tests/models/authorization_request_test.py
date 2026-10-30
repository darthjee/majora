"""Tests for the AuthorizationRequest model."""

import threading
from datetime import timedelta

import pytest
from django.db import DataError, models
from django.test import TestCase
from django.utils import timezone

from accounts.models import AuthorizationRequest
from common.model_fields import EnumCharField
from common.tests.raw_status import update_status_raw
from games.tests.factories import UserFactory


class TestAuthorizationRequestCreateWithToken(TestCase):
    """Tests for AuthorizationRequest.create_with_token."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created requests."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_returns_an_instance_and_its_raw_token(self):
        """Test that a (instance, raw_token) pair is returned."""
        instance, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert isinstance(instance, AuthorizationRequest)
        assert isinstance(raw_token, str)
        assert raw_token

    def test_stores_only_a_hash_never_the_raw_token(self):
        """Test that the raw token never equals the stored token_hash, by plain equality."""
        instance, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.token_hash != raw_token

    def test_matches_token_is_true_for_the_original_raw_token(self):
        """Test that matches_token accepts the originally-issued raw token."""
        instance, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.matches_token(raw_token) is True

    def test_matches_token_is_false_for_a_different_token(self):
        """Test that matches_token rejects any other token string."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.matches_token('some-other-token') is False

    def test_sets_expires_at_one_hour_after_creation(self):
        """Test that expires_at is set to (approximately) created_at plus one hour.

        `created_at` (auto_now_add) and `expires_at` are computed from two independent
        `timezone.now()` calls a few microseconds apart, so exact equality isn't expected;
        a generous tolerance keeps this from being flaky while still catching a wrong offset.
        """
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        delta = instance.expires_at - (instance.created_at + timedelta(hours=1))
        assert abs(delta) < timedelta(seconds=5)

    def test_defaults_to_open_status(self):
        """Test that a freshly created request starts out open."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.status == AuthorizationRequest.STATUS_OPEN

    def test_allows_a_null_user(self):
        """Test that a request can be created without a matching user."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=None, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.user_id is None


class TestAuthorizationRequestIsExpired(TestCase):
    """Tests for AuthorizationRequest.is_expired."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created requests."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_is_false_before_expires_at(self):
        """Test that a request isn't expired before its expires_at."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.is_expired() is False

    def test_is_true_after_expires_at(self):
        """Test that a request is expired once past its expires_at."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        instance.expires_at = timezone.now() - timedelta(seconds=1)
        assert instance.is_expired() is True


class TestAuthorizationRequestMarkExpired(TestCase):
    """Tests for AuthorizationRequest.mark_expired."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created requests."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_persists_the_expired_status(self):
        """Test that mark_expired saves the expired status to the database."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        instance.mark_expired()
        instance.refresh_from_db()
        assert instance.status == AuthorizationRequest.STATUS_EXPIRED


class TestAuthorizationRequestTryTransitionApprovedToLogged(TestCase):
    """Tests for AuthorizationRequest.try_transition_approved_to_logged."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user to own created requests."""
        cls.user = UserFactory(username='alice', password='secret-password')

    def test_returns_true_and_persists_logged_when_currently_approved(self):
        """Test that an approved request transitions to logged, returning True."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        instance.status = AuthorizationRequest.STATUS_APPROVED
        instance.save(update_fields=['status'])

        assert instance.try_transition_approved_to_logged() is True
        assert instance.status == AuthorizationRequest.STATUS_LOGGED
        instance.refresh_from_db()
        assert instance.status == AuthorizationRequest.STATUS_LOGGED

    def test_returns_false_when_not_currently_approved(self):
        """Test that a non-approved request cannot win the transition."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        assert instance.try_transition_approved_to_logged() is False
        instance.refresh_from_db()
        assert instance.status == AuthorizationRequest.STATUS_OPEN


@pytest.mark.django_db(transaction=True)
class TestAuthorizationRequestConcurrentTransition:
    """Tests exercising try_transition_approved_to_logged under real concurrency."""

    def test_only_one_of_two_concurrent_callers_wins(self):
        """Test that of two simultaneous transition attempts on the same row, only one wins."""
        user = UserFactory(username='alice', password='secret-password')
        instance, _ = AuthorizationRequest.create_with_token(
            user=user, ip='1.2.3.4', browser='test-agent',
        )
        instance.status = AuthorizationRequest.STATUS_APPROVED
        instance.save(update_fields=['status'])

        results = []
        barrier = threading.Barrier(2)

        def _attempt_transition():
            """Wait for both threads to be ready, then attempt the atomic transition."""
            barrier.wait()
            local_instance = AuthorizationRequest.objects.get(pk=instance.pk)
            results.append(local_instance.try_transition_approved_to_logged())

        threads = [threading.Thread(target=_attempt_transition) for _ in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        assert sorted(results) == [False, True]


class TestAuthorizationRequestHistoryStatusField:
    """Tests for the historical model's status field (issue #1626)."""

    def setup_method(self):
        """Set up the historical status field."""
        self.field = AuthorizationRequest.history.model._meta.get_field('status')

    def test_history_status_is_a_plain_char_field(self):
        """Test that the history status is a CharField and not an EnumCharField."""
        assert isinstance(self.field, models.CharField)
        assert not isinstance(self.field, EnumCharField)

    def test_history_status_keeps_choices(self):
        """Test that the history status keeps the model's choices."""
        assert self.field.choices == AuthorizationRequest.STATUS_CHOICES


class TestAuthorizationRequestStatusColumn(TestCase):
    """Tests that the database itself enforces AuthorizationRequest.status (issue #1626)."""

    @classmethod
    def setUpTestData(cls):
        """Set up a request to hand-edit."""
        cls.instance, _ = AuthorizationRequest.create_with_token(
            user=UserFactory(), ip='1.2.3.4', browser='test-agent',
        )

    def test_database_rejects_an_unknown_status(self):
        """Test that a raw UPDATE to an unknown status is rejected by the database."""
        with pytest.raises(DataError):
            update_status_raw(self.instance, 'bogus')

    def test_database_accepts_a_known_status(self):
        """Test that a raw UPDATE to a declared status is stored (the hand-approve case)."""
        update_status_raw(self.instance, AuthorizationRequest.STATUS_APPROVED)
        self.instance.refresh_from_db()
        assert self.instance.status == AuthorizationRequest.STATUS_APPROVED


@pytest.mark.django_db
class TestAuthorizationRequestScopes:
    """Tests for AuthorizationRequest.scopes and is_scoped."""

    def setup_method(self):
        """Set up a user to own created requests."""
        self.user = UserFactory(username='alice', password='secret-password')

    def _create(self, **kwargs):
        """Create a request for the user with the given extra arguments."""
        instance, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent', **kwargs,
        )
        return instance

    def test_defaults_to_empty_scopes(self):
        """Test that a request created without scopes stores an empty list."""
        instance = self._create()
        instance.refresh_from_db()
        assert instance.scopes == []

    def test_stores_the_given_scopes(self):
        """Test that create_with_token persists the given scopes."""
        instance = self._create(scopes=['statistics:read'])
        instance.refresh_from_db()
        assert instance.scopes == ['statistics:read']

    def test_is_scoped_is_false_without_scopes(self):
        """Test that a request without scopes is not scoped."""
        assert self._create().is_scoped() is False

    def test_is_scoped_is_false_for_empty_scopes(self):
        """Test that a request with an empty scopes list is not scoped."""
        assert self._create(scopes=[]).is_scoped() is False

    def test_is_scoped_is_true_with_scopes(self):
        """Test that a request with scopes is scoped."""
        assert self._create(scopes=['statistics:read']).is_scoped() is True
