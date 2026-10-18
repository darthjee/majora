"""URL patterns for the owner-side scoped API token endpoints."""

from django.urls import path

from accounts import views

urlpatterns = [
    path('account/api_tokens.json', views.api_tokens, name='account-api-tokens'),
    path(
        'account/api_tokens/options.json',
        views.api_token_options,
        name='account-api-token-options',
    ),
    path(
        'account/api_tokens/<int:token_id>.json',
        views.api_token,
        name='account-api-token',
    ),
]
