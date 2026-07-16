"""Request middleware tracking one statistics `Session` per visitor."""

from django.conf import settings as django_settings

from statistics import cookies
from statistics.models import Session
from statistics.session_attachment import attach_user
from statistics.settings import Settings


class StatisticsSessionMiddleware:
    """Load/create a statistics `Session` per request and write its cookie back.

    Same `__init__(self, get_response)` / `__call__(self, request)` shape as
    `games.middleware.CacheControlMiddleware`.
    """

    def __init__(self, get_response):
        """Store the next middleware/view callable."""
        self.get_response = get_response

    def __call__(self, request):
        """Attach `request.statistics_session`, run the view, then write the session cookie."""
        ip = self._client_ip(request)
        request.statistics_session = self._load_or_create_session(request, ip)

        response = self.get_response(request)
        self._backfill_user(request)

        if not self._cookie_deleted_by_view(response):
            self._set_cookie(response, request.statistics_session)
        return response

    def _client_ip(self, request):
        """Return the trusted client IP, preferring `X-Forwarded-For` over `REMOTE_ADDR`."""
        return request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')

    def _load_or_create_session(self, request, ip):
        """Return the current request's session, reusing a valid cookie-borne one if possible."""
        session = self._session_from_cookie(request)

        if session is not None and session.ip == ip:
            session.save(update_fields=['last_seen_at'])
            return session

        user = request.user if request.user.is_authenticated else None
        return Session.objects.create(ip=ip, user=user)

    def _backfill_user(self, request):
        """Attach the DRF-resolved authenticated user to the session, if not already tied.

        DRF resolves `request.user` lazily while the view runs, and its `Request.user`
        setter writes the resolved value back onto the underlying `HttpRequest`. So by the
        time `self.get_response(request)` has returned, `request.user` here reflects the
        real authenticated user, even though it was unresolved (anonymous) before dispatch.

        Unlike the explicit `/login` flow, this generic backfill always rotates to a
        brand-new `Session` row rather than attaching in place, so an anonymous session
        lingering on a shared device is never silently claimed by whichever authenticated
        request happens to hit it first.
        """
        session = request.statistics_session
        if session.user_id is not None or not request.user.is_authenticated:
            return

        request.statistics_session = attach_user(session, request.user, always_rotate=True)

    def _session_from_cookie(self, request):
        """Return the `Session` referenced by the request's cookie, or `None` if invalid."""
        cookie_value = request.COOKIES.get(cookies.COOKIE_NAME)
        if cookie_value is None:
            return None

        token = cookies.unsign(cookie_value)
        if token is None:
            return None

        return Session.objects.filter(token=token).first()

    def _cookie_deleted_by_view(self, response):
        """Return whether the view already explicitly deleted the statistics cookie."""
        morsel = response.cookies.get(cookies.COOKIE_NAME)
        return morsel is not None and morsel['max-age'] == 0

    def _set_cookie(self, response, session):
        """Set the signed statistics cookie on `response` from `session`."""
        response.set_cookie(
            cookies.COOKIE_NAME,
            cookies.sign(session.token),
            max_age=Settings.cookie_max_age_seconds(),
            httponly=True,
            samesite='Lax',
            secure=django_settings.SESSION_COOKIE_SECURE,
        )
