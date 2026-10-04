"""Tests for the common.secret_compare module."""

from common.secret_compare import secret_matches

SECRET = 'tent-secret'


class TestSecretMatches:
    """Tests for secret_matches()."""

    def test_matching_header(self):
        """Test that a header equal to the secret matches."""
        assert secret_matches(SECRET, SECRET) is True

    def test_wrong_header(self):
        """Test that a header different from the secret does not match."""
        assert secret_matches('guess', SECRET) is False

    def test_missing_header(self):
        """Test that a missing header never matches."""
        assert secret_matches(None, SECRET) is False

    def test_empty_secret(self):
        """Test that an empty secret never matches, even an empty header."""
        assert secret_matches('', '') is False

    def test_unset_secret_with_header(self):
        """Test that an unset secret never matches a sent header."""
        assert secret_matches(SECRET, '') is False

    def test_non_ascii_header_does_not_raise(self):
        """Test that a non-ASCII (latin-1 decoded) header returns False instead of raising."""
        assert secret_matches('\xe9', SECRET) is False

    def test_non_latin1_header_does_not_raise(self):
        """Test that a header outside latin-1 returns False instead of raising."""
        assert secret_matches('☃', SECRET) is False

    def test_non_ascii_secret_matches_its_wsgi_form(self):
        """Test that a UTF-8 secret matches the header WSGI decodes from its bytes as latin-1."""
        secret = 'caf\xe9'
        header = secret.encode('utf-8').decode('latin-1')
        assert secret_matches(header, secret) is True
