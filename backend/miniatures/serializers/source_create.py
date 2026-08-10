"""Source create serializer for the miniatures app."""

import re

from rest_framework import serializers

from miniatures.models import Source

#: URL schemes rejected on `url`, case-insensitively, regardless of surrounding whitespace.
#:
#: `Source.url` is intentionally a free-text `CharField` with no full URL-format validation
#: (see the issue #1053 design), but the frontend renders it directly as an `<a href=...>`, so
#: dangerous schemes must still be denylisted to prevent stored-XSS-via-href.
DANGEROUS_URL_SCHEMES = ('javascript:', 'data:', 'vbscript:')

#: Matches ASCII tab, newline and carriage-return characters anywhere in the string.
#:
#: Per the WHATWG URL spec, browsers strip these characters from anywhere in a URL before
#: parsing it, so they must be stripped here too before the scheme denylist check, otherwise
#: a payload such as `"java\tscript:alert(1)"` would bypass `startswith` while still being
#: normalized and executed as `javascript:alert(1)` by the browser.
_CONTROL_CHARS_RE = re.compile(r'[\t\r\n]')


class SourceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new source, with `name` required and `url` optional."""

    class Meta:
        """Metadata for the SourceCreateSerializer."""

        model = Source
        fields = ['name', 'url']
        extra_kwargs = {
            'name': {'required': True},
            'url': {'required': False},
        }

    def validate_url(self, value):
        """Reject `url` values using a dangerous scheme (e.g. `javascript:`), case-insensitive."""
        normalized = _CONTROL_CHARS_RE.sub('', value).strip().lower()
        if normalized.startswith(DANGEROUS_URL_SCHEMES):
            raise serializers.ValidationError(
                'url_scheme_not_allowed', code='url_scheme_not_allowed',
            )
        return value
