"""Request middleware tracking one statistics `Session` per visitor."""

from datetime import timedelta

from django.conf import settings as django_settings
from django.utils import timezone

from common.client_ip import client_ip
from common.secret_compare import secret_matches
from domains.models import Domain
from statistics import cookies
from statistics.models import Session
from statistics.route_pattern import UNRESOLVED, route_pattern
from statistics.session_attachment import attach_user
from statistics.settings import Settings
from statistics.visit_tracking import track_visit


class StatisticsSessionMiddleware:
    """Load/create a statistics `Session` per request and write its cookie back.

    Same `__init__(self, get_response)` / `__call__(self, request)` shape as
    `games.middleware.CacheControlMiddleware`. A request is not tracked (no session lookup, no
    visit, no cookie) when its path is exactly one of `UNTRACKED_PATHS` (never a prefix), when
    it carries a valid statistics-skip header, or when its path matches no route.
    """

    # The raw statistics export reads the data this middleware writes: tracking its own
    # requests would pollute the data being exported.
    UNTRACKED_PATHS = frozenset({'/staff/statistics/export.json'})

    def __init__(self, get_response):
        """Store the next middleware/view callable."""
        self.get_response = get_response

    def __call__(self, request):
        """Attach `request.statistics_session`, track its visit, run the view, write the cookie."""
        request.statistics_session_created = None
        request.statistics_route = None
        if self._skip_requested(request):
            request.statistics_session = None
            return self.get_response(request)

        ip = client_ip(request)
        domain = self._domain_for_request(request)
        request.statistics_session = self._load_or_create_session(request, ip, domain)
        self._track_visit(request, ip)

        response = self.get_response(request)
        self._backfill_user(request)

        if not self._cookie_deleted_by_view(response):
            self._set_cookie(response, request.statistics_session)
        return response

    def _skip_requested(self, request):
        """Return whether this request is exempt from tracking.

        Exempt: an exact untracked path, a valid skip header, or a path matching no route. The
        route is only computed (and stored on `request.statistics_route`) for the last check.
        """
        if self._untracked_path(request) or self._skip_header(request):
            return True
        return self._unresolved_route(request)

    def _unresolved_route(self, request):
        """Store the request's route pattern and return whether it matches no route."""
        request.statistics_route = route_pattern(request)
        return request.statistics_route == UNRESOLVED

    def _untracked_path(self, request):
        """Return whether the request path is exactly one of `UNTRACKED_PATHS`."""
        return request.path_info in self.UNTRACKED_PATHS

    def _skip_header(self, request):
        """Return whether this request carries a valid statistics-skip header."""
        header = request.META.get('HTTP_X_STATISTICS_SKIP_SECRET')
        return secret_matches(header, Settings.skip_secret())

    def _domain_for_request(self, request):
        """Return the `Domain` matching the request's host, or `None` if unrecognized."""
        host = request.get_host().split(':')[0].lower()
        return Domain.objects.filter(domain=host).first()

    def _load_or_create_session(self, request, ip, domain):
        """Return the current request's session, reusing a valid cookie-borne one if possible.

        A cookie session of the same domain is reused whatever the client IP (the per-IP
        session boundary is given up on purpose); the IP change is recorded on the session
        (`Session.ip` is the last seen IP) and on the visit (`first_ip` / `last_ip`).
        """
        session, reason = self._session_from_cookie(request)
        domain_id = domain.id if domain is not None else None

        if session is not None and session.domain_id == domain_id:
            self._touch_session(session, ip)
            return session

        reason = reason or Session.CreationReason.DOMAIN_CHANGED
        return self._create_session(request, ip, domain, reason)

    def _create_session(self, request, ip, domain, reason):
        """Create the request's session in a single `INSERT`, recording why and where."""
        user = request.user if request.user.is_authenticated else None
        created = Session.objects.create(
            ip=ip, user=user, domain=domain, creation_reason=reason,
            first_path=request.statistics_route, first_seen_logged=user is not None,
        )
        request.statistics_session_created = created
        return created

    def _touch_session(self, session, ip):
        """Write the reused session's changed IP and stale `last_seen_at` in one `UPDATE`.

        `Visit` carries per-request activity, so `last_seen_at` is throttled to the configured
        touch interval, and `ip` is only written when it differs from the stored one: normal
        traffic (same IP, touch not due) writes nothing. Concurrent IP updates are last write
        wins. A filtered `UPDATE` is used so a session deleted after being loaded (e.g. by a
        statistics clear) is tolerated: it matches no rows and nothing raises.
        """
        fields = self._session_changes(session, ip)
        if not fields:
            return

        Session.objects.filter(pk=session.pk).update(**fields)
        for name, value in fields.items():
            setattr(session, name, value)

    def _session_changes(self, session, ip):
        """Return the session fields to write: a changed `ip` and/or a due `last_seen_at`."""
        fields = {}
        if session.ip != ip:
            fields['ip'] = ip
        now = timezone.now()
        if now - session.last_seen_at >= self._touch_interval():
            fields['last_seen_at'] = now
        return fields

    def _touch_interval(self):
        """Return the configured minimum delay between two `last_seen_at` writes."""
        return timedelta(seconds=Settings.session_touch_interval_seconds())

    def _track_visit(self, request, ip):
        """Attribute this request to a `Visit` of the resolved session, before the view runs.

        Running before dispatch means a login request counts on the pre-rotation session.
        """
        session = request.statistics_session
        track_visit(
            session, new_session=self._created_during_request(request, session),
            path=request.statistics_route, ip=ip,
        )

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

        created_in_request = self._created_during_request(request, session)
        request.statistics_session = attach_user(
            session, request.user, always_rotate=not created_in_request,
            created_in_request=created_in_request, first_path=request.statistics_route,
        )

    def _created_during_request(self, request, session):
        """Return whether `session` is the very row this middleware created for `request`."""
        return session is request.statistics_session_created

    def _session_from_cookie(self, request):
        """Return `(session, reason)` for the request's cookie.

        `session` is the row referenced by the cookie's token (any domain: the token is
        unique, so this is a single query) or `None`; `reason` is the creation reason when no
        row was found, else `None`.
        """
        cookie_value = request.COOKIES.get(cookies.COOKIE_NAME)
        if cookie_value is None:
            return None, Session.CreationReason.NO_COOKIE

        token = cookies.unsign(cookie_value)
        if token is None:
            return None, Session.CreationReason.INVALID_COOKIE

        session = Session.objects.filter(token=token).first()
        if session is None:
            return None, Session.CreationReason.COOKIE_SESSION_NOT_FOUND
        return session, None

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
