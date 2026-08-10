"""Views package for the miniatures app."""

from .source_detail import source_detail
from .source_photo_upload import source_photo_upload
from .sources_list import sources_list
from .stl_model_detail import stl_model_detail
from .stl_model_photo_upload import stl_model_photo_upload
from .stl_models_list import stl_models_list

__all__ = [
    'source_detail',
    'source_photo_upload',
    'sources_list',
    'stl_models_list',
    'stl_model_detail',
    'stl_model_photo_upload',
]
