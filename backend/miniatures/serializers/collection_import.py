"""Collection import serializer for the crawler-import endpoint."""

from django.db import transaction
from rest_framework import serializers

from common.serializer_fields import http_url_field

from ._crawler_import_sync import CollectionSync, SourceSync


class CollectionImportSerializer(serializers.Serializer):
    """Serializer for the crawler-import endpoint's standalone upsert of a single `Collection`.

    Unlike `CollectionCreateSerializer`, this is a plain `Serializer` (not `ModelSerializer`):
    the upsert lookup key (`external_id`, falling back to `name`) varies per request and doesn't
    map onto DRF's `create()`/`update()` dispatch, so `save()` is overridden directly -- same
    reasoning as `StlModelImportSerializer`.

    After `save()`, `self.created` tells the caller (the import view) whether a new `Collection`
    was created (`True`, for a 201 response) or an existing one was updated (`False`, for 200).
    """

    name = serializers.CharField(max_length=200)
    external_id = serializers.CharField(max_length=200, required=False, allow_null=True)
    # No `UniqueValidator` (unlike `CollectionCreateSerializer.url`) -- a duplicate `url` is
    # exactly the upsert-match case here, not an error.
    url = http_url_field(max_length=200, required=False, allow_null=True, allow_blank=True)
    source_name = serializers.CharField(max_length=200)

    def save(self):
        """Resolve the `Source`, then upsert the `Collection` via `CollectionSync`.

        `update_existing=True` fills in `name`/`url` on a matched `Collection`, including a
        stub previously created via `stl_models/import.json`'s `collection_external_id`.
        """
        with transaction.atomic():
            source = SourceSync(name=self.validated_data['source_name']).resolve()
            sync = CollectionSync(
                source=source,
                external_id=self.validated_data.get('external_id'),
                name=self.validated_data['name'],
                url=self.validated_data.get('url'),
                update_existing=True,
            )
            self.instance = sync.resolve()
            self.created = sync.created
        return self.instance
