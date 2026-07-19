"""Cache wrapper for the admin-or-staff boolean permission check."""

from .boolean_check_cache import _BooleanCheckCache


class AdminOrStaffCache(_BooleanCheckCache):
    """Cache whether a user is staff or a superuser, keyed by user id.

    Consumed by `require_staff` (`games.views.common`) and
    `_EditPermission._is_admin_or_player` (`games.permissions`).
    """

    CACHE_TYPE = 'admin_or_staff'

    @classmethod
    def is_admin_or_staff(cls, user):
        """Return whether `user` is staff or a superuser, using the shared memory cache."""
        return cls._get_or_compute(
            cls.CACHE_TYPE, user.id, lambda: user.is_staff or user.is_superuser
        )
