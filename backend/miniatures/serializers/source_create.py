"""Source create serializer for the miniatures app."""

from rest_framework import serializers

from miniatures.models import Source

#: URL schemes rejected on `url`, case-insensitively, regardless of surrounding whitespace.
#:
#: `Source.url` is intentionally a free-text `CharField` with no full URL-format validation
#: (see the issue #1053 design), but the frontend renders it directly as an `<a href=...>`, so
#: dangerous schemes must still be denylisted to prevent stored-XSS-via-href.
DANGEROUS_URL_SCHEMES = ('javascript:', 'data:', 'vbscript:')


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
        if value.strip().lower().startswith(DANGEROUS_URL_SCHEMES):
            raise serializers.ValidationError(
                'url_scheme_not_allowed', code='url_scheme_not_allowed',
            )
        return value
