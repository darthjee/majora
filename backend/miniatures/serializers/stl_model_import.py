"""StlModel import serializer for the crawler-import endpoint."""

from django.db import transaction
from rest_framework import serializers

from common.serializer_fields import http_url_field
from games.models.base_link import BaseLink
from miniatures.models import StlModel, StlModelLink

from ._crawler_import_sync import CollectionSync, SourceSync
from ._tags_sync import TagsSync, validate_tag_lengths, validate_tags_count

#: Scalar `StlModel` fields this serializer may create or partially update straight from
#: `validated_data` -- everything else the payload carries (`tags`, `source_name`,
#: `collection_*`) is either synced separately or not stored directly on `StlModel`.
_STL_MODEL_FIELDS = ('name', 'external_id', 'url')


class StlModelImportSerializer(serializers.Serializer):
    """Serializer for the crawler-import endpoint's upsert of a single `StlModel`.

    Unlike `StlModelCreateSerializer`, this is a plain `Serializer` (not `ModelSerializer`):
    the upsert lookup key (`external_id`, falling back to `url`) varies per request and doesn't
    map onto DRF's `create()`/`update()` dispatch, so `save()` is overridden directly. Newly
    created items always default to `type=StlModel.TYPE_OTHER`, leaving `size` and the
    `StlModelRace`/`StlModelRole` join rows unset -- the crawler has no opinion on either.

    After `save()`, `self.created` tells the caller (the import view) whether a new `StlModel`
    was created (`True`, for a 201 response) or an existing one was updated (`False`, for 200).
    """

    name = serializers.CharField(max_length=200)
    external_id = serializers.CharField(max_length=200, required=False, allow_null=True)
    # No `UniqueValidator` (unlike `StlModelCreateSerializer.url`) -- a duplicate `url` is
    # exactly the upsert-match case here, not an error.
    url = http_url_field(max_length=200, required=False, allow_null=True, allow_blank=True)
    source_name = serializers.CharField(max_length=200)
    collection_name = serializers.CharField(max_length=200, required=False, allow_null=True)
    collection_external_id = serializers.CharField(
        max_length=200, required=False, allow_null=True,
    )
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    def validate_tags(self, value):
        """Reject a `tags` list exceeding `MAX_TAGS` entries or containing an over-long tag."""
        validate_tag_lengths(value)
        return validate_tags_count(value)

    def save(self):
        """Resolve Source/Collection, upsert the `StlModel`, and (re)link it to both + the url.

        Wrapped in a single transaction so a mid-import failure rolls back the whole upsert
        instead of leaving the `StlModel` linked to only some of its resolved
        `Source`/`Collection`/tags/link.
        """
        with transaction.atomic():
            source = SourceSync(name=self.validated_data['source_name']).resolve()
            collection = self._resolve_collection(source)
            self.instance = self._upsert_stl_model()
            self._attach(source, collection)
            TagsSync(self.instance, self.validated_data.get('tags', [])).apply()
            self._sync_link()
        return self.instance

    def _resolve_collection(self, source):
        """Resolve the `Collection` via `CollectionSync`, or `None` if neither field was sent."""
        name = self.validated_data.get('collection_name')
        external_id = self.validated_data.get('collection_external_id')
        if not name and not external_id:
            return None
        return CollectionSync(source=source, external_id=external_id, name=name).resolve()

    def _upsert_stl_model(self):
        """Find an existing `StlModel` to update, or create a new one, from `validated_data`.

        Sets `self.created` so the caller can tell which of the two happened.
        """
        instance = self._find_stl_model()
        fields = self._stl_model_fields()
        self.created = instance is None
        if instance is None:
            return StlModel.objects.create(type=StlModel.TYPE_OTHER, **fields)
        for key, value in fields.items():
            setattr(instance, key, value)
        instance.save(update_fields=list(fields))
        return instance

    def _stl_model_fields(self):
        """Return the subset of `validated_data` sent for `_STL_MODEL_FIELDS`."""
        return {
            key: self.validated_data[key]
            for key in _STL_MODEL_FIELDS
            if key in self.validated_data
        }

    def _find_stl_model(self):
        """Look up an existing `StlModel` by `external_id` first, then by `url`."""
        external_id = self.validated_data.get('external_id')
        if external_id:
            instance = StlModel.objects.filter(external_id=external_id).first()
            if instance is not None:
                return instance
        url = self.validated_data.get('url')
        if url:
            return StlModel.objects.filter(url=url).first()
        return None

    def _attach(self, source, collection):
        """Add the resolved `source`/`collection` to the `StlModel`'s M2Ms."""
        self.instance.sources.add(source)
        if collection is not None:
            self.instance.collections.add(collection)

    def _sync_link(self):
        """Create-or-update the `lootstudio` `StlModelLink` pointing at the sent `url`."""
        url = self.validated_data.get('url')
        if not url:
            return
        link, created = StlModelLink.objects.get_or_create(
            stl_model=self.instance, link_type=BaseLink.LINK_TYPE_LOOTSTUDIO,
            defaults={'url': url, 'text': self.instance.name},
        )
        if not created and link.url != url:
            link.url = url
            link.save(update_fields=['url'])
