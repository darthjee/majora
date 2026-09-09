# Add the view and route

New view `backend/miniatures/views/collection_import.py`, mirroring `backend/miniatures/views/stl_model_import.py` exactly (same auth: `@api_view(['POST'])`, `@permission_classes([IsAuthenticated])`, `require_staff(request)`, `validated_or_error`, `skip_cache`):

```python
"""View for the crawler-import endpoint: upserts a single Collection."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from games.views.common import require_staff, validated_or_error

from ..serializers import CollectionDetailSerializer, CollectionImportSerializer
from ._shared import skip_cache


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def collection_import(request):
    """Upsert a single Collection from a crawler-import payload (staff-only).

    Returns 201 (with detail data) when a new `Collection` was created, 200 when an existing
    one was matched (and possibly updated) instead.
    """
    error_response = require_staff(request)
    if error_response:
        return skip_cache(error_response)

    serializer = CollectionImportSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return skip_cache(error_response)

    collection = serializer.save()
    detail = CollectionDetailSerializer(collection)
    status = 201 if serializer.created else 200
    return skip_cache(Response(detail.data, status=status))
```

Register it:

- `backend/miniatures/views/__init__.py` — add `from .collection_import import collection_import` and `'collection_import'` to `__all__`, next to `collection_detail`/`collection_photo_upload`/`collections_list`.
- `backend/miniatures/urls/collections.py` — add a new `path('miniatures/collections/import.json', views.collection_import, name='miniatures-collections-import')` entry, placed after the `collections/<int:collection_id>.json` detail route and before the `photo_upload.json` route (mirrors where `stl_models/import.json` sits relative to STL Models' CRUD/photo-upload routes in `backend/miniatures/urls/stl_models.py`).

## Files to Change

- `backend/miniatures/views/collection_import.py` — new file, `collection_import` view.
- `backend/miniatures/views/__init__.py` — export the new view.
- `backend/miniatures/urls/collections.py` — add the `collections/import.json` route.
