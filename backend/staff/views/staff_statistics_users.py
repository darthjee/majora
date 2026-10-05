"""View returning the logged-in users ranking of the access statistics, staff/superuser only."""

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.paginator import Paginator
from games.views.common import require_staff
from statistics.aggregation import UsersRanking

from ._staff_statistics_shared import parse_sort, parse_statistics_filters


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_users(request):
    """Return the paginated ranking of logged-in users by visit metrics."""
    error_response = require_staff(request)
    if error_response:
        return error_response
    sort, sort_errors = parse_sort(request, UsersRanking.SORT_KEYS, UsersRanking.DEFAULT_SORT)
    filters, error_response = parse_statistics_filters(request, sort_errors)
    if error_response:
        return error_response
    page, headers = Paginator(request, UsersRanking(filters, sort).build()).paginate()
    return Response(_UserIdentities(page).merge(), headers=headers)


class _UserIdentities:
    """Prepends the user identity keys to a page of ranking rows, with one `User` query."""

    def __init__(self, rows):
        """Store the page rows."""
        self._rows = list(rows)

    def merge(self):
        """Return the rows with identity keys first, skipping users deleted since the ranking."""
        users = self._users()
        return [
            {**self._identity(users[row['id']]), **row}
            for row in self._rows
            if row['id'] in users
        ]

    def _users(self):
        """Return the page's users by id, skipping the query for an empty page."""
        if not self._rows:
            return {}
        ids = [row['id'] for row in self._rows]
        return User.objects.select_related('profile').in_bulk(ids)

    @classmethod
    def _identity(cls, user):
        """Return the identity keys of `user`, with the staff users list key names."""
        return {
            'id': user.id,
            'name': user.username,
            'display_name': cls._display_name(user),
            'email': user.email,
        }

    @staticmethod
    def _display_name(user):
        """Return the profile's display name, or `None` when blank or without a profile."""
        try:
            return user.profile.display_name or None
        except ObjectDoesNotExist:
            return None
