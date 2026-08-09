"""Tests for the 0005 data migration lowercasing username/email for all existing users."""

import importlib

from django.test import TestCase

from games.tests.factories import UserFactory
from games.tests.migration_state import historical_apps

_migration = importlib.import_module('accounts.migrations.0005_lowercase_username_email')


class TestLowercaseUsernameEmailMigration(TestCase):
    """Tests for the username/email lowercasing performed by the 0005 data migration."""

    @classmethod
    def setUpClass(cls):
        """Resolve the historical `apps` registry, as of this migration, once per class."""
        super().setUpClass()
        cls.apps = historical_apps('accounts', '0005_lowercase_username_email')

    def test_lowercases_a_mixed_case_username_and_email(self):
        """Test that a mixed-case username/email is lowercased."""
        user = UserFactory(
            username='Alice', password='secret-password', email='Alice@Example.com',
        )

        _migration._lowercase_username_email(self.apps, None)

        user.refresh_from_db()
        assert user.username == 'alice'
        assert user.email == 'alice@example.com'

    def test_leaves_an_already_lowercase_username_and_email_untouched(self):
        """Test that an already-lowercase username/email is not modified."""
        user = UserFactory(
            username='bob', password='secret-password', email='bob@example.com',
        )

        _migration._lowercase_username_email(self.apps, None)

        user.refresh_from_db()
        assert user.username == 'bob'
        assert user.email == 'bob@example.com'

    def test_reverse_migration_is_a_noop(self):
        """Test that the reverse migration does not change any data."""
        # Domain kept lowercase from the start: `User.objects.create_user` already
        # lowercases the domain part of the email via Django's own `normalize_email`,
        # independently of this migration, so a mixed-case domain here wouldn't actually
        # exercise "untouched by the reverse migration".
        user = UserFactory(
            username='Carol', password='secret-password', email='Carol@example.com',
        )

        _migration._noop_reverse(self.apps, None)

        user.refresh_from_db()
        assert user.username == 'Carol'
        assert user.email == 'Carol@example.com'

