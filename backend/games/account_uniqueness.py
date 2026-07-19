"""Shared account-uniqueness query helpers, used by registration and account updates.

Kept outside `games.views`/`games.serializers` (both of which eagerly import their full
package contents from `__init__.py`) so it can be imported from either side without
triggering a circular import.
"""

from django.contrib.auth.models import User

from games.models import UserProfile


def username_taken(name, exclude_pk=None):
    """Return whether `name` is already used as a User's username.

    Excludes the user identified by `exclude_pk`, if given.
    """
    queryset = User.objects.filter(username=name)
    if exclude_pk is not None:
        queryset = queryset.exclude(pk=exclude_pk)
    return queryset.exists()


def display_name_taken(display_name, exclude_user=None):
    """Return whether `display_name` is already used by a UserProfile.

    Excludes the profile owned by `exclude_user`, if given.
    """
    queryset = UserProfile.objects.filter(display_name=display_name)
    if exclude_user is not None:
        queryset = queryset.exclude(user=exclude_user)
    return queryset.exists()


def email_taken(email, exclude_pk=None):
    """Return whether `email` is already used as a User's email.

    Excludes the user identified by `exclude_pk`, if given.
    """
    queryset = User.objects.filter(email=email)
    if exclude_pk is not None:
        queryset = queryset.exclude(pk=exclude_pk)
    return queryset.exists()
