"""URL patterns for the StlModel resource."""

from django.urls import path

from .. import views

urlpatterns = [
    path('miniatures/stl_models.json', views.stl_models_list, name='miniatures-list'),
    path(
        'miniatures/stl_models/<int:stl_model_id>.json',
        views.stl_model_detail,
        name='miniatures-detail',
    ),
]
