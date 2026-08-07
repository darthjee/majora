"""URL patterns for the accounts app, concatenated from per-resource modules."""

from . import auth, authorization_requests, password_reset

urlpatterns = auth.urlpatterns + password_reset.urlpatterns + authorization_requests.urlpatterns
