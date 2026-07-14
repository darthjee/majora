"""Views for treasure-level endpoints."""

from .treasure_access import treasure_access
from .treasure_detail import treasure_detail
from .treasure_permissions import treasure_permissions
from .treasure_photo_upload import treasure_photo_upload
from .treasures_list import treasures_list

__all__ = [
    'treasures_list',
    'treasure_detail',
    'treasure_access',
    'treasure_permissions',
    'treasure_photo_upload',
]
