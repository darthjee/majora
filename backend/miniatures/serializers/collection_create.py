"""Collection create serializer for the miniatures app."""

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from common.serializer_fields import http_url_field
from miniatures.models import Collection, Source


class CollectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new collection, with `name` required and `url` optional.

    `source_id` is optional and, when given, sets `Collection.source` to that `Source`; when
    omitted, the collection starts with `source=None`.
    """

    source_id = serializers.PrimaryKeyRelatedField(
        source='source', queryset=Source.objects.all(), required=False, allow_null=True,
    )
    # Declared explicitly (rather than left to auto-mapping) so the http/https-only
    # `URLValidator` actually runs at `is_valid()` time -- see `common.serializer_fields`.
    # The explicit `UniqueValidator` replaces the one DRF would otherwise auto-attach from
    # `Collection.url`'s `unique=True`, which auto-mapping would also stop adding once the
    # field is declared explicitly.
    url = http_url_field(
        max_length=200, required=False, allow_null=True, allow_blank=True,
        validators=[UniqueValidator(queryset=Collection.objects.all())],
    )

    class Meta:
        """Metadata for the CollectionCreateSerializer."""

        model = Collection
        fields = ['name', 'url', 'source_id']
        extra_kwargs = {
            'name': {'required': True},
        }
