"""URL patterns for the miniatures app."""

from django.urls import path

from .. import views

urlpatterns = [
    path('miniatures.json', views.stl_models_list, name='miniatures-list'),
    path('miniatures/<int:stl_model_id>.json', views.stl_model_detail, name='miniatures-detail'),
]
