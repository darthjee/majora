"""Tests for the ApiTokenRenameSerializer."""

import pytest

from accounts.models import ApiToken
from accounts.serializers import ApiTokenRenameSerializer
from games.tests.factories import UserFactory


@pytest.mark.django_db
class TestApiTokenRenameSerializer:
    """Tests for ApiTokenRenameSerializer."""

    def setup_method(self):
        """Set up a token to rename."""
        self.api_token, _ = ApiToken.objects.create_token(UserFactory(), 'Bot', ['npcs:read'])

    def _serializer(self, data):
        """Build a rename serializer for the token."""
        return ApiTokenRenameSerializer(self.api_token, data=data)

    def _errors(self, serializer):
        """Validate `serializer` and return its error codes, keyed by field."""
        assert not serializer.is_valid()
        return {
            field: [detail.code for detail in details]
            for field, details in serializer.errors.items()
        }

    def test_rename(self):
        """Test that a valid name is trimmed and saved."""
        serializer = self._serializer({'name': '  Renamed  '})
        assert serializer.is_valid()
        serializer.save()
        self.api_token.refresh_from_db()
        assert self.api_token.name == 'Renamed'

    def test_name_required(self):
        """Test that a missing name gives required."""
        assert self._errors(self._serializer({})) == {'name': ['required']}

    def test_name_blank(self):
        """Test that a blank name gives blank."""
        assert self._errors(self._serializer({'name': ' '})) == {'name': ['blank']}

    def test_name_max_length(self):
        """Test that a name over 100 characters gives max_length."""
        errors = self._errors(self._serializer({'name': 'a' * 101}))
        assert errors == {'name': ['max_length']}

    @pytest.mark.parametrize('field', ['scopes', 'games', 'expires_at', 'owner', 'prefix'])
    def test_other_field_not_editable(self, field):
        """Test that any field other than name gives not_editable, keyed by the field."""
        errors = self._errors(self._serializer({'name': 'Renamed', field: 'x'}))
        assert errors == {field: ['not_editable']}

    def test_not_editable_reported_with_name_error(self):
        """Test that not_editable is reported together with a name error."""
        errors = self._errors(self._serializer({'name': '', 'scopes': []}))
        assert errors == {'name': ['blank'], 'scopes': ['not_editable']}
