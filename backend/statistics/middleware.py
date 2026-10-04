"""Request middleware tracking one statistics `Session` per visitor."""

from datetime import timedelta

from django.conf import settings as django_settings
from django.utils import timezone

from common.client_ip import client_ip
from common.secret_compare import secret_matches
from domains.models import Domain
from statistics import cookies
from statistics.models import Session
from statistics.session_attachment import attach_user
from statistics.settings import Settings
from statistics.visit_tracking import track_visit


class StatisticsSessionMiddleware:
    """Load/create a statistics `Session` per request and write its cookie back.

    Same `__init__(self, get_response)` / `__call__(self, request)` shape as
    `games.middleware.CacheControlMiddleware`.
    """

    def __init__(self, get_response):
        """Store the next middleware/view callable."""
        self.get_response = get_response

    def __call__(self, request):
        """Attach `request.statistics_session`, track its visit, run the view, write the cookie."""
        request.statistics_session_created = None
        if self._skip_requested(request):
            request.statistics_session = None
            return self.get_response(request)

        ip = client_ip(request)
        domain = self._domain_for_request(request)
        request.statistics_session = self._load_or_create_session(request, ip, domain)
        self._track_visit(request)

        response = self.get_response(request)
        self._backfill_user(request)

        if not self._cookie_deleted_by_view(response):
            self._set_cookie(response, request.statistics_session)
        return response

    def _skip_requested(self, request):
        """Return whether this request carries a valid statistics-skip header."""
        header = request.META.get('HTTP_X_STATISTICS_SKIP_SECRET')
        return secret_matches(header, Settings.skip_secret())

    def _domain_for_request(self, request):
        """Return the `Domain` matching the request's host, or `None` if unrecognized."""
        host = request.get_host().split(':')[0].lower()
        return Domain.objects.filter(domain=host).first()

    def _load_or_create_session(self, request, ip, domain):
        """Return the current request's session, reusing a valid cookie-borne one if possible."""
        session = self._session_from_cookie(request, domain)
        domain_id = domain.id if domain is not None else None

        if session is not None and session.ip == ip and session.domain_id == domain_id:
            self._touch_session(session)
            return session

        user = request.user if request.user.is_authenticated else None
        created = Session.objects.create(ip=ip, user=user, domain=domain)
        request.statistics_session_created = created
        return created

    def _touch_session(self, session):
        """Write `session.last_seen_at` only when stale beyond the configured touch interval.

        `Visit` carries per-request activity, so the session row is throttled to keep the
        per-request write cost at about one row.
        """
        interval = timedelta(seconds=Settings.session_touch_interval_seconds())
        if timezone.now() - session.last_seen_at >= interval:
            session.save(update_fields=['last_seen_at'])

    def _track_visit(self, request):
        """Attribute this request to a `Visit` of the resolved session, before the view runs.

        Running before dispatch means a login request counts on the pre-rotation session.
        """
        session = request.statistics_session
        track_visit(session, new_session=self._created_during_request(request, session))

    def _backfill_user(self, request):
        """Attach the DRF-resolved authenticated user to the session, if not already tied.

        DRF resolves `request.user` lazily while the view runs, and its `Request.user`
        setter writes the resolved value back onto the underlying `HttpRequest`. So by the
        time `self.get_response(request)` has returned, `request.user` here reflects the
        real authenticated user, even though it was unresolved (anonymous) before dispatch.

        A session created during this very request cannot belong to anyone else, so the
        user is attached to it in place (no anonymous ghost row is left behind). A session
        that pre-existed the request is instead always rotated to a brand-new `Session`
        row, so an anonymous session lingering on a shared device is never silently
        claimed by whichever authenticated request happens to hit it first.

        Visits are never moved on rotation: this request's visit stays on the original
        session, and the rotated session opens its first visit on the next request carrying
        its cookie. An in-place attach keeps the visit on the same session.
        """
        session = request.statistics_session
        if session is None:
            return
        if session.user_id is not None or not request.user.is_authenticated:
            return

        always_rotate = not self._created_during_request(request, session)
        request.statistics_session = attach_user(
            session, request.user, always_rotate=always_rotate
        )

    def _created_during_request(self, request, session):
        """Return whether `session` is the very row this middleware created for `request`."""
        return session is request.statistics_session_created

    def _session_from_cookie(self, request, domain):
        """Return the `Session` referenced by the request's cookie, or `None` if invalid."""
        cookie_value = request.COOKIES.get(cookies.COOKIE_NAME)
        if cookie_value is None:
            return None

        token = cookies.unsign(cookie_value)
        if token is None:
            return None

        return Session.objects.filter(token=token, domain=domain).first()

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
