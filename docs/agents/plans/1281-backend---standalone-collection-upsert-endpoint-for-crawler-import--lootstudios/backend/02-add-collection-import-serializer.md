# Add CollectionImportSerializer

New plain `serializers.Serializer` (not `ModelSerializer`, same reasoning as `StlModelImportSerializer`: the upsert lookup key varies per request) for the `collections/import.json` request body.

Fields:

- `name = serializers.CharField(max_length=200)` — required, matching `Collection.name`'s `max_length` and `StlModelImportSerializer.name`'s convention.
- `external_id = serializers.CharField(max_length=200, required=False, allow_null=True)` — same shape as `StlModelImportSerializer.external_id`.
- `url = http_url_field(max_length=200, required=False, allow_null=True, allow_blank=True)` — reuse `common.serializer_fields.http_url_field`, same as `StlModelImportSerializer.url`. No `UniqueValidator` — a duplicate `url` is a legitimate upsert-match case, not a validation error (same comment as `StlModelImportSerializer.url`).
- `source_name = serializers.CharField(max_length=200)` — required, same as `StlModelImportSerializer.source_name`.

`save()`:

```python
def save(self):
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
```

`update_existing=True` is what makes this endpoint (unlike `stl_models/import.json`'s internal `CollectionSync` call) fill in `name`/`url` on a matched stub — see step 01.

Register the new serializer alongside the others:

- `backend/miniatures/serializers/__init__.py` — add `from miniatures.serializers.collection_import import CollectionImportSerializer` and `'CollectionImportSerializer'` to `__all__`, next to the existing `CollectionCreateSerializer`/`CollectionDetailSerializer`/`CollectionListSerializer`/`StlModelImportSerializer` entries.

## Files to Change

- `backend/miniatures/serializers/collection_import.py` — new file, `CollectionImportSerializer`.
- `backend/miniatures/serializers/__init__.py` — export the new serializer.
