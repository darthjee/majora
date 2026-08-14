"""Shared, cross-app serializer field builders."""

from django.core.validators import URLValidator
from rest_framework import serializers

#: Restricts a URL field to `http`/`https` schemes, matching the model-level restriction
#: applied to `games.models.BaseLink.url`, `miniatures.models.Collection.url`, and
#: `miniatures.models.Source.url` (added by issue #1108) to prevent e.g. `ftp://`/`ftps://`
#: URLs from being stored.
HTTP_URL_VALIDATOR = URLValidator(schemes=['http', 'https'])


def http_url_field(**kwargs):
    """Return a `serializers.URLField` restricted to `http`/`https` schemes.

    DRF's `ModelSerializer` auto-field-mapping silently drops any `URLValidator` found in a
    model field's `validators=[...]` when building the corresponding `URLField`, because
    `URLField` already attaches its own default `URLValidator()` (which additionally allows
    `ftp`/`ftps`). Serializers must re-declare `url` explicitly via this helper for the
    model-level http/https-only restriction to actually run at `is_valid()` time.
    """
    validators = kwargs.pop('validators', [])
    return serializers.URLField(validators=[HTTP_URL_VALIDATOR, *validators], **kwargs)
