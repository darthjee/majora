"""Views package for the miniatures app."""

from .collection_detail import collection_detail
from .collection_photo_upload import collection_photo_upload
from .collections_list import collections_list
from .source_detail import source_detail
from .source_photo_upload import source_photo_upload
from .sources_list import sources_list
from .stl_model_detail import stl_model_detail
from .stl_model_photo_upload import stl_model_photo_upload
from .stl_models_list import stl_models_list

__all__ = [
    'collection_detail',
    'collection_photo_upload',
    'collections_list',
    'source_detail',
    'source_photo_upload',
    'sources_list',
    'stl_models_list',
    'stl_model_detail',
    'stl_model_photo_upload',
]
