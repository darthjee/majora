"""Source create serializer for the miniatures app."""

import re

from rest_framework import serializers

from miniatures.models import Source

#: URL schemes allowed on `url`.
#:
#: `Source.url` is intentionally a free-text `CharField` with no full URL-format validation
#: (see the issue #1053 design), but the frontend renders it directly as an `<a href=...>`, so
#: only known-safe schemes are allowed through, mirroring the http/https convention used by
#: `games.models.base_link.BaseLink.url` for external links. Values with no scheme at all
#: (bare domains, relative paths, plain text) are left untouched.
ALLOWED_URL_SCHEMES = {'http', 'https'}

#: Matches ASCII C0 control characters (`\x00`-`\x1f`) and the space character, anywhere in
#: the string.
#:
#: Per the WHATWG URL spec, browsers strip these characters from anywhere in a URL before
#: parsing it, so they must be stripped here too before inspecting the scheme, otherwise a
#: payload such as `"\x01javascript:alert(1)"` or `"java\tscript:alert(1)"` would evade
#: detection while still being normalized and executed by the browser.
_CONTROL_CHARS_RE = re.compile(r'[\x00-\x20]')

#: Matches a URI scheme prefix per the standard scheme grammar (e.g. `https:`, `javascript:`).
_SCHEME_RE = re.compile(r'^([a-z][a-z0-9+.\-]*):')


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
        """Reject `url` values whose scheme, if any, is not in the allowlist."""
        normalized = _CONTROL_CHARS_RE.sub('', value).lower()
        match = _SCHEME_RE.match(normalized)
        if match and match.group(1) not in ALLOWED_URL_SCHEMES:
            raise serializers.ValidationError(
                'url_scheme_not_allowed', code='url_scheme_not_allowed',
            )
        return value
