"""Views package for the miniatures app."""

from .stl_model_detail import stl_model_detail
from .stl_models_list import stl_models_list

__all__ = [
    'stl_models_list',
    'stl_model_detail',
]
