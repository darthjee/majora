"""Tests for the statistics cookie signing helpers."""

from statistics import cookies


class TestCookies:
    """Tests for `sign`/`unsign`."""

    def test_unsign_returns_the_signed_token(self):
        """Test that `unsign` recovers the original token from a signed value."""
        signed = cookies.sign('some-token')

        assert cookies.unsign(signed) == 'some-token'

    def test_unsign_returns_none_for_tampered_value(self):
        """Test that `unsign` returns `None` for a tampered signed value."""
        signed = cookies.sign('some-token')
        tampered = signed[:-1] + ('a' if signed[-1] != 'a' else 'b')

        assert cookies.unsign(tampered) is None

    def test_unsign_returns_none_for_garbage_value(self):
        """Test that `unsign` returns `None` for a value that was never signed."""
        assert cookies.unsign('not-a-signed-value') is None
