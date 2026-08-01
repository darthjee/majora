"""Factories for `User` and `UserProfile`."""

import factory
from django.contrib.auth.models import User

from accounts.models import UserProfile


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for regular Django users, created via `create_user` for password hashing.

    Every user built here gets an `approved` `UserProfile` (mirroring the migration that
    backfills every pre-existing user to `approved`), so pre-existing tests built before
    `UserProfile.status` existed keep authenticating successfully by default. Tests that
    specifically exercise `pending`/`denied` behavior override the status explicitly, e.g.
    via `UserProfileFactory(user=user, status=UserProfile.STATUS_PENDING)`.
    """

    class Meta:
        """Factory configuration."""

        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    password = 'secret-password'

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create the user through `create_user`, then attach an approved profile."""
        manager = cls._get_manager(model_class)
        user = manager.create_user(*args, **kwargs)
        _ensure_approved_profile(user)
        return user


class SuperUserFactory(UserFactory):
    """Factory for superusers, created via `create_superuser` for password hashing."""

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create the user through `create_superuser`, then attach an approved profile."""
        manager = cls._get_manager(model_class)
        user = manager.create_superuser(*args, **kwargs)
        _ensure_approved_profile(user)
        return user


def _ensure_approved_profile(user):
    """Create an `approved` `UserProfile` for `user` if it doesn't already have one.

    Looks up/creates by `user_id` rather than `user` on purpose: passing the `user` instance
    itself into `get_or_create`/`create` makes Django cache the new profile as `user`'s
    reverse `.profile` relation (OneToOneField relations are cached bidirectionally on
    assignment). Since callers keep reusing that same `user` object afterwards (e.g. a test's
    `cls.user`, later updated via `UserProfileFactory`), that stale cache would silently
    shadow any later change made straight through the database.
    """
    UserProfile.objects.get_or_create(
        user_id=user.pk, defaults={'status': UserProfile.STATUS_APPROVED},
    )


class UserProfileFactory(factory.django.DjangoModelFactory):
    """Factory for UserProfile, defaulting display_name to its linked user's username.

    Uses `update_or_create` (rather than a plain insert) because `UserFactory` already
    attaches an approved profile to every user it builds, so an explicit
    `UserProfileFactory(user=user, ...)` call updates that existing row instead of
    colliding with it on the `user` OneToOneField's uniqueness constraint.
    """

    class Meta:
        """Factory configuration."""

        model = UserProfile

    user = factory.SubFactory(UserFactory)
    display_name = factory.LazyAttribute(lambda o: o.user.username)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Update the user's existing profile (if any) rather than always inserting one.

        Looks up/creates by `user_id` (see `_ensure_approved_profile`'s docstring) so this
        never leaves a stale `.profile` cached on the `user` instance the caller passed in.
        """
        manager = cls._get_manager(model_class)
        user = kwargs.pop('user')
        profile, _ = manager.update_or_create(user_id=user.pk, defaults=kwargs)
        return profile
