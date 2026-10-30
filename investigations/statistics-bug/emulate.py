"""Replay navigation scenarios against the LOCAL stack and report the statistics they create.

Statistics bug investigation (Epic #1696, issue #1702). See README.md and
docs/agents/specs/statistics-bug/scripts.md.

Safety:

- local stack only: every base URL / host must be on `LOCAL_HOSTS`, with no override;
- `PROXY_SECRET` / `STATISTICS_SKIP_SECRET` come from the environment only and are never
  printed, logged or written;
- the `statistics:read` token lives in memory only;
- reports are written to the git-ignored `reports/` folder.

Standard library only.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from http.cookies import SimpleCookie

# ---------------------------------------------------------------------------
# Safety: local hosts only
# ---------------------------------------------------------------------------

LOCAL_HOSTS = frozenset({
    'localhost', '127.0.0.1',
    # compose service / container names of the local stack
    'majora_proxy', 'majora_app', 'proxy', 'backend',
})

DEFAULT_BASE_URL = 'http://majora_proxy'
DEFAULT_BACKEND_URL = 'http://majora_app:8080'
DEFAULT_HOST = 'localhost:3000'
DEFAULT_APPROVAL_URL = 'http://localhost:3000/#/account/authorization_requests'

STATISTICS_COOKIE = 'majora_statistics'
EXPORT_PATH = '/staff/statistics/export.json'
EXPORT_PER_PAGE = 100
AUTH_CREATE_PATH = '/users/authorization_requests.json'
AUTH_POLL_PATH = '/users/authorization_requests/{uuid}.json'
# Route patterns (as stored in the tracking columns) of the script's own requests.
SELF_ROUTES = frozenset({
    'users/authorization_requests.json',
    'users/authorization_requests/<uuid:uuid>.json',
    'staff/statistics/export.json',
})
# Export timestamps are whole seconds: the scenario window is widened by this much on
# each side before filtering sessions by `created_at`.
WINDOW_SLACK = timedelta(seconds=1)
USER_AGENT = 'majora-statistics-bug-emulate/1.0 (local investigation)'


class Refused(Exception):
    """Raised when the script must not run (non-local target, missing secret, ...)."""


class AuthorizationFailed(Exception):
    """Raised when the device authorization is denied, expired or otherwise unusable."""


def host_of(value):
    """Return the lowercase hostname of a URL or a `host[:port]` value."""
    if '://' not in value:
        value = f'http://{value}'
    return (urllib.parse.urlsplit(value).hostname or '').lower()


def ensure_local(label, value):
    """Refuse anything whose host is not on `LOCAL_HOSTS`. There is no override."""
    host = host_of(value)
    if host not in LOCAL_HOSTS:
        raise Refused(
            f'{label} host {host!r} is not a local host; emulate.py only runs against the '
            f'local stack ({", ".join(sorted(LOCAL_HOSTS))}).'
        )


# ---------------------------------------------------------------------------
# Secrets: environment only, never printed
# ---------------------------------------------------------------------------


class Secrets:
    """Reads the local secrets from the environment. Values never leave this object.

    `repr` / `str` never show a value; callers only get a value to put in a header.
    """

    PROXY = 'PROXY_SECRET'
    SKIP = 'STATISTICS_SKIP_SECRET'

    def __init__(self, environ=None):
        """Keep a reference to the environment (no value is copied eagerly)."""
        self._environ = os.environ if environ is None else environ

    def available(self, name):
        """Return whether `name` is set to a non-empty value."""
        return bool(self._environ.get(name))

    def require(self, name, purpose):
        """Return the value of `name`, or raise `Refused` naming it (never its value)."""
        value = self._environ.get(name)
        if not value:
            raise Refused(f'{name} is not set (needed for {purpose}); add it to the root .env.')
        return value

    def __repr__(self):
        """Never show values."""
        return '<Secrets (values hidden)>'

    __str__ = __repr__


# ---------------------------------------------------------------------------
# HTTP primitives
# ---------------------------------------------------------------------------


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Return redirects as responses instead of following them."""

    def redirect_request(self, *args, **kwargs):  # noqa: D102
        return None


_OPENER = urllib.request.build_opener(_NoRedirect)


@dataclass
class Response:
    """One HTTP exchange, with its send and arrival times."""

    method: str
    path: str
    status: int
    headers: dict
    set_cookies: list
    body: bytes
    sent_at: float
    arrived_at: float
    arrival_seq: int = 0
    label: str = ''

    def json(self):
        """Return the decoded JSON body, or `None`."""
        try:
            return json.loads(self.body.decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            return None

    def header(self, name, default=None):
        """Return a response header, case-insensitively."""
        return self.headers.get(name.lower(), default)


def send(base_url, method, path, headers=None, body=None, timeout=30):
    """Send one request and return a `Response` (4xx/5xx included, never raised)."""
    ensure_local('request', base_url)
    url = base_url.rstrip('/') + path
    data = None
    headers = dict(headers or {})
    headers.setdefault('User-Agent', USER_AGENT)
    headers.setdefault('Accept', 'application/json')
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        headers.setdefault('Content-Type', 'application/json')
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    sent_at = time.time()
    try:
        raw = _OPENER.open(request, timeout=timeout)
    except urllib.error.HTTPError as error:
        raw = error
    with raw:
        content = raw.read()
        status = raw.status if hasattr(raw, 'status') else raw.code
        message = raw.headers
    arrived_at = time.time()
    return Response(
        method=method, path=path, status=status,
        headers={key.lower(): value for key, value in message.items()},
        set_cookies=message.get_all('Set-Cookie') or [],
        body=content, sent_at=sent_at, arrived_at=arrived_at,
    )


# ---------------------------------------------------------------------------
# Browser: cookie jar applying Set-Cookie in response ARRIVAL order
# ---------------------------------------------------------------------------


class Browser:
    """A per-scenario browser: one cookie jar, `Set-Cookie` applied in arrival order.

    The `Cookie` header is a snapshot of the jar when the request is sent; the response's
    `Set-Cookie` is applied when it arrives, under a lock, in arrival order. In a parallel
    burst a slower response therefore overwrites a newer cookie, as in a browser
    (hypothesis 2c). Cookies are keyed by name only: the jar is host-agnostic on purpose, so
    the host-change scenario can send the same cookie to another host.
    """

    def __init__(self, config, secrets, name='browser'):
        """Start with an empty jar."""
        self.config = config
        self.secrets = secrets
        self.name = name
        self.cookies = {}
        self.responses = []
        self._lock = threading.Lock()
        self._seq = 0

    # -- jar ------------------------------------------------------------------

    def cookie_header(self):
        """Return the `Cookie` header for the current jar, or `None` when empty."""
        with self._lock:
            if not self.cookies:
                return None
            return '; '.join(f'{name}={value}' for name, value in self.cookies.items())

    def clear_cookies(self):
        """Forget every cookie (e.g. a new private window)."""
        with self._lock:
            self.cookies.clear()

    def _apply(self, response):
        """Apply `response`'s cookies and stamp its arrival sequence number."""
        with self._lock:
            self._seq += 1
            response.arrival_seq = self._seq
            for header in response.set_cookies:
                self._apply_one(header)
            self.responses.append(response)

    def _apply_one(self, header):
        """Apply one `Set-Cookie` header value (deletion when max-age<=0 or expired)."""
        parsed = SimpleCookie()
        try:
            parsed.load(header)
        except Exception:  # noqa: BLE001 - a malformed cookie is ignored, like a browser
            return
        for name, morsel in parsed.items():
            if _cookie_deleted(morsel):
                self.cookies.pop(name, None)
            else:
                self.cookies[name] = morsel.value

    # -- requests -------------------------------------------------------------

    def request(self, method, path, headers=None, body=None, host=None, target='proxy',
                label=''):
        """Send one request with the jar's cookies; apply its `Set-Cookie` on arrival."""
        all_headers = {'Host': host or self.config.host}
        cookie = self.cookie_header()
        if cookie:
            all_headers['Cookie'] = cookie
        all_headers.update(headers or {})
        base_url = self.config.base_url if target == 'proxy' else self.config.backend_url
        response = send(base_url, method, path, headers=all_headers, body=body)
        response.label = label or path
        self._apply(response)
        return response

    def burst(self, requests):
        """Fire `requests` (dicts of `request` kwargs) in parallel, released together.

        All requests take their `Cookie` snapshot before the release, like a page refresh
        firing its API calls at once. Returns the responses in arrival order.
        """
        if not requests:
            return []
        barrier = threading.Barrier(len(requests))
        cookie = self.cookie_header()

        def fire(spec):
            spec = dict(spec)
            headers = {'Host': spec.pop('host', None) or self.config.host}
            if cookie:
                headers['Cookie'] = cookie
            headers.update(spec.pop('headers', None) or {})
            target = spec.pop('target', 'proxy')
            label = spec.pop('label', '') or spec['path']
            base_url = self.config.base_url if target == 'proxy' else self.config.backend_url
            barrier.wait()
            response = send(base_url, spec.pop('method', 'GET'), spec.pop('path'),
                            headers=headers, body=spec.pop('body', None))
            response.label = label
            self._apply(response)
            return response

        with ThreadPoolExecutor(max_workers=len(requests)) as pool:
            responses = list(pool.map(fire, requests))
        return sorted(responses, key=lambda response: response.arrival_seq)


def _cookie_deleted(morsel):
    """Return whether a parsed cookie deletes itself (max-age <= 0 or expires in the past)."""
    max_age = morsel['max-age']
    if max_age != '':
        try:
            return int(max_age) <= 0
        except ValueError:
            return False
    expires = morsel['expires']
    if expires:
        try:
            moment = datetime.strptime(expires, '%a, %d %b %Y %H:%M:%S GMT')
        except ValueError:
            return False
        return moment.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc)
    return False


# ---------------------------------------------------------------------------
# The script's own requests: untracked (skip secret), token in memory
# ---------------------------------------------------------------------------


class SelfClient:
    """Sends the script's own requests: no cookie, always with the statistics skip header."""

    def __init__(self, config, secrets):
        """Require the skip secret up front: the script must never track itself."""
        self.config = config
        self._skip = secrets.require(Secrets.SKIP, "the script's own untracked requests")
        self._token = None

    def set_token(self, token):
        """Keep the scoped token in memory only."""
        self._token = token

    @property
    def has_token(self):
        """Return whether a token is held."""
        return self._token is not None

    def request(self, method, path, headers=None, body=None, authenticated=False):
        """Send an untracked request through the proxy."""
        all_headers = {'Host': self.config.host, 'X-Statistics-Skip-Secret': self._skip}
        if authenticated:
            all_headers['Authorization'] = f'Bearer {self._token}'
        all_headers.update(headers or {})
        return send(self.config.base_url, method, path, headers=all_headers, body=body)

    def __repr__(self):
        """Never show the secret or the token."""
        return '<SelfClient (secrets hidden)>'


class DeviceAuthorization:
    """Gets a `statistics:read` scoped token through the device-authorization flow (#1708)."""

    POLL_INTERVAL_SECONDS = 3
    SCOPES = ['statistics:read']

    def __init__(self, client, config, out=sys.stdout):
        """Store the untracked client."""
        self.client = client
        self.config = config
        self.out = out

    def obtain(self):
        """Create the request, print the approval link, poll; return the token (memory only)."""
        uuid, poll_secret, expires_at = self._create()
        print(
            f'\nApprove the device authorization as the local staff user '
            f'{self.config.username!r} at:\n\n    {self.config.approval_url}\n\n'
            f'(waiting until {expires_at or "it expires"}; do not browse the local site '
            f'during the run)\n',
            file=self.out, flush=True,
        )
        return self._poll(uuid, poll_secret)

    def _create(self):
        response = self.client.request(
            'POST', AUTH_CREATE_PATH,
            body={'username': self.config.username, 'scopes': self.SCOPES},
        )
        payload = response.json() or {}
        if response.status != 201 or 'uuid' not in payload or 'token' not in payload:
            raise AuthorizationFailed(
                f'could not create the authorization request (HTTP {response.status}, '
                f'{_error_code(payload)})'
            )
        return payload['uuid'], payload['token'], payload.get('expiration')

    def _poll(self, uuid, poll_secret):
        path = AUTH_POLL_PATH.format(uuid=urllib.parse.quote(uuid))
        headers = {'X-Authorize-Token': poll_secret, 'X-Skip-Cache': 'true'}
        while True:
            response = self.client.request('GET', path, headers=headers)
            payload = response.json() or {}
            if response.status == 202 and payload.get('status') == 'approved':
                token = payload.get('token') or ''
                if not token.startswith('mjr_'):
                    raise AuthorizationFailed('the approval did not issue a scoped mjr_ token')
                print('Authorization approved; token kept in memory only.', file=self.out,
                      flush=True)
                return token
            if response.status == 200 and payload.get('status') == 'open':
                time.sleep(self.POLL_INTERVAL_SECONDS)
                continue
            if response.status == 422:
                raise AuthorizationFailed('the authorization request expired')
            if response.status == 403:
                raise AuthorizationFailed('the authorization request was denied or consumed')
            raise AuthorizationFailed(f'unexpected poll response (HTTP {response.status})')


def _error_code(payload):
    """Return a short, safe description of an error payload."""
    if isinstance(payload, dict):
        if 'error' in payload:
            return str(payload['error'])
        if 'errors' in payload:
            return json.dumps(payload['errors'])[:200]
    return 'no error code'


# ---------------------------------------------------------------------------
# Export reader
# ---------------------------------------------------------------------------


def parse_iso(value):
    """Parse an ISO 8601 UTC timestamp from the export."""
    if value is None:
        return None
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


@dataclass
class Window:
    """A scenario's time window (UTC)."""

    start: datetime
    end: datetime = None

    @classmethod
    def open_now(cls):
        """Start a window now."""
        return cls(start=datetime.now(timezone.utc))

    def close(self):
        """End the window now."""
        self.end = datetime.now(timezone.utc)
        return self

    def widened(self):
        """Return `(start, end)` widened by `WINDOW_SLACK` (whole-second export timestamps)."""
        start = self.start.replace(microsecond=0) - WINDOW_SLACK
        end = self.end.replace(microsecond=0) + WINDOW_SLACK
        return start, end


class ExportReader:
    """Pages sequentially through `GET /staff/statistics/export.json` with the token.

    The export filters by local day (`from` / `to`, `tz=UTC`); the sessions are then filtered
    by `created_at` inside the scenario window widened by `WINDOW_SLACK` on each side, since
    the export's timestamps are whole seconds.
    """

    def __init__(self, client):
        """Store the authenticated, untracked client."""
        self.client = client

    def sessions(self, window):
        """Return the sessions created inside `window` (widened), each with its visits."""
        start, end = window.widened()
        return [
            session for session in self._all_pages(start.date(), end.date())
            if start <= parse_iso(session['created_at']) <= end
        ]

    def _all_pages(self, from_date, to_date):
        page, pages = 1, 1
        while page <= pages:
            query = urllib.parse.urlencode({
                'from': from_date.isoformat(), 'to': to_date.isoformat(), 'tz': 'UTC',
                'page': page, 'per_page': EXPORT_PER_PAGE,
            })
            response = self.client.request('GET', f'{EXPORT_PATH}?{query}', authenticated=True)
            if response.status != 200:
                raise AuthorizationFailed(
                    f'export refused (HTTP {response.status}, '
                    f'{_error_code(response.json())})'
                )
            yield from response.json() or []
            pages = int(response.header('pages', '1') or 1)
            page += 1


def self_pollution_check(reader, window):
    """Return the result of checking that the script's own requests created no statistics.

    Looks, inside `window`, for sessions created by one of the script's own routes and for
    visits opened or last touched on one of them.
    """
    sessions = reader.sessions(window)
    polluted_sessions = [s for s in sessions if s.get('first_path') in SELF_ROUTES]
    polluted_visits = [
        visit for session in sessions for visit in session.get('visits', [])
        if visit.get('first_path') in SELF_ROUTES or visit.get('last_path') in SELF_ROUTES
    ]
    return {
        'window_sessions': len(sessions),
        'self_sessions': len(polluted_sessions),
        'self_visits': len(polluted_visits),
        'ok': not polluted_sessions and not polluted_visits,
    }


# ---------------------------------------------------------------------------
# Page request lists (from the frontend, see README "Refresh-burst request list")
# ---------------------------------------------------------------------------

SLUG = '<slug>'  # placeholder: the real slug is substituted at send time, never reported
SKIP_CACHE = {'X-Skip-Cache': 'true'}


@dataclass(frozen=True)
class PageCall:
    """One API call a page fires, as the frontend sends it.

    `label` is the masked form used in reports. `backend` is False for calls Tent serves
    itself (static rules), which never reach Django and so never touch statistics.
    """

    method: str
    label: str
    headers: tuple = ()
    backend: bool = True

    def path(self, slug):
        """Return the real path for `slug`."""
        return self.label.replace(SLUG, urllib.parse.quote(slug, safe=''))


# Fired by every page load (app boot), in parallel:
APP_BOOT = (
    # AppController constructor -> AccessRouteConfigStore.load() -> AccessRouteConfigClient
    PageCall('GET', '/access-route-config.json'),
    # HeaderController.checkStatus() -> AuthClient#headerStatus (skip-cache endpoint)
    PageCall('GET', '/users/header_status.json', tuple(SKIP_CACHE.items())),
    # HeaderController.fetchDomainConfig() -> DomainClient#config (Tent static rule)
    PageCall('GET', '/domain/config.json', backend=False),
)
# Fired by the game page (#/games/<slug>):
GAME_PAGE = (
    # GameController -> RequestStore 'game' single -> GET /games/<slug>.json
    PageCall('GET', f'/games/{SLUG}.json'),
    # GameController#renderGame -> AccessStore.ensureGameAccess (`/access.json`: skip-cache)
    PageCall('GET', f'/games/{SLUG}/access.json', tuple(SKIP_CACHE.items())),
    # GameController#renderGame -> AccessStore.ensureGamePermissions (no role: skip-cache)
    PageCall('GET', '/permissions/game.json', tuple(SKIP_CACHE.items())),
)
# A refresh of a game page: every call above at once.
REFRESH_BURST = APP_BOOT + GAME_PAGE
# Games list page.
GAMES_LIST = (PageCall('GET', '/games.json'),)

# Mixed handlers (hypothesis 1): standard `.json` rule vs Tent custom handlers. Only
# anonymous requests that the backend refuses (4xx) or that are pure reads; the cache-clear
# route (`DELETE /staff/cache/disk.json`) is never called.
STANDARD_CALLS = (
    PageCall('GET', '/users/header_status.json', tuple(SKIP_CACHE.items())),
    PageCall('GET', f'/games/{SLUG}.json'),
)
CUSTOM_HANDLER_CALLS = (
    # rules/cache.php: CacheSizeHandler (read; anonymous is refused by the backend)
    PageCall('GET', '/staff/cache/size.json'),
    # rules/delete.php: DeleteHandler, anonymous, id 0 never exists -> 4xx, nothing deleted
    PageCall('DELETE', f'/games/{SLUG}/pcs/0/photos/0.json'),
    # rules/uploads.php: UploadHandler, anonymous, no file, id 0 -> 4xx, nothing stored
    PageCall('POST', '/uploads/image/0/submit'),
)

# IP change (hypothesis 3): documentation-only addresses (RFC 5737).
IP_A = '192.0.2.10'
IP_B = '198.51.100.20'
DOC_NETWORKS = ('192.0.2.', '198.51.100.', '203.0.113.')
# Host change (hypothesis 4): the same local proxy under two host names.
HOST_A = 'localhost:3000'
HOST_B = '127.0.0.1:3000'

# Pause between a scenario's setup and its window, and between scenarios, so the
# one-second window slack never captures another scenario's sessions.
GAP_SECONDS = 2.5


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------


@dataclass
class Expect:
    """Creation reasons a scenario expects inside its window.

    `exact`: reason -> exact count; `at_most`: reason -> upper bound. Any reason not listed
    must not appear. An empty `Expect()` means "no new session".
    """

    exact: dict = field(default_factory=dict)
    at_most: dict = field(default_factory=dict)
    text: str = ''


@dataclass
class Context:
    """What scenarios share: configuration, secrets, the untracked client, test data."""

    config: Config
    secrets: Secrets
    client: SelfClient
    game_slug: str = 'unknown-game'
    login_username: str = ''
    login_password: str = ''
    _login_token: str = None

    def __repr__(self):
        """Never show secrets, passwords or tokens."""
        return '<Context (secrets hidden)>'

    @property
    def can_login(self):
        """Return whether local test credentials are configured."""
        return bool(self.login_username and self.login_password)

    def side_login_token(self):
        """Return a login token obtained by an untracked request (memory only)."""
        if self._login_token is None:
            response = self.client.request(
                'POST', '/users/login.json', headers=SKIP_CACHE,
                body={'username': self.login_username, 'password': self.login_password},
            )
            token = (response.json() or {}).get('token')
            if response.status != 200 or not token:
                raise Refused(f'local test login failed (HTTP {response.status}).')
            self._login_token = token
        return self._login_token


@dataclass
class ScenarioResult:
    """What one scenario did: its window, its requests and any notes or skip reason."""

    name: str
    hypothesis: str
    expect: Expect
    window: Window = None
    responses: list = field(default_factory=list)
    notes: list = field(default_factory=list)
    skipped: str = None
    sessions: list = field(default_factory=list)


class Scenario:
    """Base scenario: optional setup (outside the window), then `run` inside the window."""

    name = ''
    hypothesis = '-'
    expect = Expect()

    def skip_reason(self, ctx):
        """Return why the scenario cannot run here, or `None`."""
        return None

    def setup(self, ctx, browser, result):
        """Prepare state (e.g. an existing cookie) before the window opens."""

    def run(self, ctx, browser, result):
        """Send the scenario's requests inside the window."""
        raise NotImplementedError

    def after(self, ctx, result):
        """Add notes once the window's sessions are known."""

    # -- helpers ----------------------------------------------------------------

    @staticmethod
    def visit(ctx, browser, calls, headers=None, host=None, target='proxy'):
        """Fire `calls` one after the other (sequential navigation)."""
        return [
            browser.request(call.method, call.path(ctx.game_slug),
                            headers={**dict(call.headers), **(headers or {})},
                            host=host, target=target, label=call.label)
            for call in calls
        ]

    @staticmethod
    def refresh(ctx, browser, calls, headers=None):
        """Fire `calls` at once (page refresh); responses come back in arrival order."""
        return browser.burst([
            {'method': call.method, 'path': call.path(ctx.game_slug), 'label': call.label,
             'headers': {**dict(call.headers), **(headers or {})}}
            for call in calls
        ])


def _auth(token):
    """Return the frontend's authentication header for a legacy login token."""
    return {'Authorization': f'Token {token}'}


def _backend_calls(calls):
    return sum(1 for call in calls if call.backend)


class FirstVisit(Scenario):
    """A first visit with no cookie: the app boot then a game page, sequentially."""

    name = 'first_visit'
    expect = Expect(exact={'no_cookie': 1}, text='one no_cookie session')

    def run(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT + GAME_PAGE)


class SequentialNavigation(Scenario):
    """Navigation with an existing cookie: every request reuses the session."""

    name = 'sequential_navigation'
    expect = Expect(text='the same session reused; no new session')

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2])

    def run(self, ctx, browser, result):
        self.visit(ctx, browser, GAMES_LIST + GAME_PAGE + GAMES_LIST + GAME_PAGE)


class RefreshBurstNoCookie(Scenario):
    """Refresh of a game page with no cookie: every request races to create a session."""

    name = 'refresh_burst_no_cookie_anonymous'
    hypothesis = '2a'
    expect = Expect(
        exact={'no_cookie': _backend_calls(REFRESH_BURST)},
        text='one no_cookie session per parallel request reaching the backend',
    )

    def run(self, ctx, browser, result):
        self.refresh(ctx, browser, REFRESH_BURST)

    def after(self, ctx, result):
        setting = sum(1 for r in result.responses if r['set_statistics_cookie'])
        expected = _backend_calls(REFRESH_BURST)
        if setting < expected:
            result.notes.append(f'only {setting} of the {expected} backend-bound burst '
                                'responses set the statistics cookie (served from the Tent '
                                'cache, or not tracked?)')


class RefreshBurstWithCookie(Scenario):
    """Refresh of a game page carrying an existing anonymous cookie."""

    name = 'refresh_burst_with_cookie_anonymous'
    hypothesis = '2c'
    expect = Expect(text='the existing session reused; no new session')

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2])

    def run(self, ctx, browser, result):
        self.refresh(ctx, browser, REFRESH_BURST)
        # The next page load uses whatever cookie the last-arriving response left.
        self.visit(ctx, browser, APP_BOOT[:2])


class RefreshBurstLoggedIn(Scenario):
    """Refresh while logged in (frontend token) but carrying an anonymous cookie.

    The token comes from an untracked side login, so the jar keeps its anonymous statistics
    cookie, as when the frontend still holds a token after the cookie was reset. Each
    authenticated request of the burst may rotate that same anonymous session.
    """

    name = 'refresh_burst_with_cookie_logged_in'
    hypothesis = '2b'
    expect = Expect(at_most={'login_rotation': 1}, text='at most one login_rotation session')

    def skip_reason(self, ctx):
        if not ctx.can_login:
            return 'MAJORA_LOGIN_USERNAME / MAJORA_LOGIN_PASSWORD not set'
        return None

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2])
        ctx.side_login_token()

    def run(self, ctx, browser, result):
        headers = _auth(ctx.side_login_token())
        self.refresh(ctx, browser, REFRESH_BURST, headers=headers)
        self.visit(ctx, browser, APP_BOOT[:2], headers=headers)


class MixedHandlers(Scenario):
    """Standard-rule requests interleaved with Tent custom-handler requests, one cookie jar."""

    name = 'mixed_handlers'
    hypothesis = '1'
    expect = Expect(text='no new session (an ip_changed session confirms hypothesis 1)')

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, STANDARD_CALLS[:1])
        if not ctx.secrets.available(Secrets.PROXY):
            result.notes.append(
                'PROXY_SECRET is not set: if Tent and the backend also run without it, every '
                'request records the proxy IP, so this scenario cannot show an IP flip.'
            )

    def run(self, ctx, browser, result):
        for standard, custom in zip(STANDARD_CALLS * 2, CUSTOM_HANDLER_CALLS + ('',)):
            self.visit(ctx, browser, (standard,))
            if custom:
                self.visit(ctx, browser, (custom,))
        self.visit(ctx, browser, STANDARD_CALLS)


class LoginMidNavigation(Scenario):
    """Anonymous navigation, then a login in the same browser, then navigation logged in."""

    name = 'login_mid_navigation'
    hypothesis = '2b'
    expect = Expect(exact={'login_rotation': 1}, text='one login_rotation session')

    def skip_reason(self, ctx):
        if not ctx.can_login:
            return 'MAJORA_LOGIN_USERNAME / MAJORA_LOGIN_PASSWORD not set'
        return None

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT + GAME_PAGE)

    def run(self, ctx, browser, result):
        response = browser.request(
            'POST', '/users/login.json', headers=SKIP_CACHE, label='/users/login.json',
            body={'username': ctx.login_username, 'password': ctx.login_password},
        )
        token = (response.json() or {}).get('token')
        if response.status != 200 or not token:
            result.notes.append(f'login failed (HTTP {response.status})')
            return
        self.visit(ctx, browser, APP_BOOT + GAME_PAGE, headers=_auth(token))


class IpChange(Scenario):
    """The client IP changes mid-navigation (sent straight to the backend).

    Tent's `SetClientIpMiddleware` overwrites `X-Forwarded-For`, so these requests go to the
    backend directly with `X-Proxy-Secret` and an `X-Forwarded-For` from the RFC 5737
    documentation ranges.
    """

    name = 'ip_change'
    hypothesis = '3'
    expect = Expect(exact={'ip_changed': 1}, text='one ip_changed session')

    def skip_reason(self, ctx):
        if not ctx.secrets.available(Secrets.PROXY):
            return 'PROXY_SECRET not set (it must match the backend\'s)'
        return None

    def _headers(self, ctx, ip):
        return {'X-Proxy-Secret': ctx.secrets.require(Secrets.PROXY, 'the IP change scenario'),
                'X-Forwarded-For': ip}

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2], headers=self._headers(ctx, IP_A),
                   target='backend')

    def run(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2], headers=self._headers(ctx, IP_A),
                   target='backend')
        self.visit(ctx, browser, APP_BOOT[:2] + GAME_PAGE, headers=self._headers(ctx, IP_B),
                   target='backend')

    def after(self, ctx, result):
        if result.sessions and not any(
            (s.get('ip') or '').startswith(DOC_NETWORKS) for s in result.sessions
        ):
            result.notes.append('no session carries a documentation IP: the backend did not '
                                'trust X-Forwarded-For (PROXY_SECRET mismatch?)')


class HostChange(Scenario):
    """The same cookie sent to the local proxy under two host names.

    Django sets the statistics cookie host-only (no `Domain`), so a browser would not send it
    from `localhost` to `127.0.0.1`. The jar carries it on purpose, emulating a cookie that
    reaches another host of the same site (e.g. a `www.` variant).
    """

    name = 'host_change'
    hypothesis = '4'
    expect = Expect(exact={'domain_changed': 1}, text='one domain_changed session')

    def setup(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2], host=HOST_A)
        result.notes.append('the cookie is carried to the second host on purpose '
                            '(a browser would not send a host-only cookie there)')

    def run(self, ctx, browser, result):
        self.visit(ctx, browser, APP_BOOT[:2], host=HOST_A)
        self.visit(ctx, browser, APP_BOOT[:2] + GAME_PAGE, host=HOST_B)

    def after(self, ctx, result):
        reasons = {s.get('creation_reason') for s in result.sessions}
        if 'domain_changed' not in reasons and all(
            (s.get('domain') or {}).get('id') == 'unknown' for s in result.sessions
        ):
            result.notes.append('every session has an unknown domain: register localhost or '
                                '127.0.0.1 as a local Domain, otherwise both hosts resolve to '
                                'no domain and the session is reused')


SCENARIOS = (
    FirstVisit(),
    SequentialNavigation(),
    RefreshBurstNoCookie(),
    RefreshBurstWithCookie(),
    RefreshBurstLoggedIn(),
    MixedHandlers(),
    LoginMidNavigation(),
    IpChange(),
    HostChange(),
)


def summarize_response(response, origin):
    """Return the reportable facts of one response (masked path, no cookie values)."""
    return {
        'request': f'{response.method} {response.label}',
        'status': response.status,
        'arrival_order': response.arrival_seq,
        'sent_ms': round((response.sent_at - origin) * 1000),
        'arrived_ms': round((response.arrived_at - origin) * 1000),
        'set_statistics_cookie': any(
            header.split('=', 1)[0].strip() == STATISTICS_COOKIE
            for header in response.set_cookies
        ),
        'cache': response.header('x-cache') or response.header('x-tent-cache'),
    }


def run_scenario(ctx, scenario, out=sys.stdout):
    """Run one scenario with a fresh browser; return its `ScenarioResult` (no sessions yet)."""
    result = ScenarioResult(scenario.name, scenario.hypothesis, scenario.expect)
    result.skipped = scenario.skip_reason(ctx)
    if result.skipped:
        print(f'- {scenario.name}: skipped ({result.skipped})', file=out, flush=True)
        return result
    browser = Browser(ctx.config, ctx.secrets, name=scenario.name)
    scenario.setup(ctx, browser, result)
    time.sleep(GAP_SECONDS)
    setup_count = len(browser.responses)
    result.window = Window.open_now()
    origin = time.time()
    scenario.run(ctx, browser, result)
    result.window.close()
    result.responses = [
        summarize_response(response, origin) for response in browser.responses[setup_count:]
    ]
    print(f'- {scenario.name}: {len(result.responses)} request(s) sent', file=out, flush=True)
    time.sleep(GAP_SECONDS)
    return result


def discover_game_slug(ctx):
    """Return a local game slug (`MAJORA_GAME_SLUG`, else the first listed game)."""
    slug = os.environ.get('MAJORA_GAME_SLUG')
    if slug:
        return slug
    response = ctx.client.request('GET', '/games.json', headers=SKIP_CACHE)
    games = response.json() if response.status == 200 else None
    if isinstance(games, list) and games and games[0].get('slug'):
        return games[0]['slug']
    return 'unknown-game'


def select_scenarios(names):
    """Return the scenarios named in `names` (all when empty); refuse unknown names."""
    unknown = set(names) - {s.name for s in SCENARIOS}
    if unknown:
        raise Refused(f'unknown scenario(s): {", ".join(sorted(unknown))}')
    return [s for s in SCENARIOS if not names or s.name in names]


def run_scenarios(ctx, reader, out=sys.stdout):
    """Run the selected scenarios sequentially, exporting each window right after it."""
    selected = select_scenarios(ctx.config.scenarios)
    print(f'Running {len(selected)} scenario(s) against the local stack...', file=out, flush=True)
    results = []
    for scenario in selected:
        result = run_scenario(ctx, scenario, out)
        if not result.skipped:
            result.sessions = reader.sessions(result.window)
            scenario.after(ctx, result)
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Report: expected vs actual creation reasons
# ---------------------------------------------------------------------------

MATCH, MISMATCH, SKIPPED = 'MATCH', 'MISMATCH', 'SKIPPED'


def reason_counts(sessions):
    """Return `{creation_reason: count}`; `NULL` reasons are counted as `null`."""
    counts = {}
    for session in sessions:
        reason = session.get('creation_reason') or 'null'
        counts[reason] = counts.get(reason, 0) + 1
    return dict(sorted(counts.items()))


def check_expectation(expect, actual):
    """Return the list of mismatches between `expect` and the `actual` reason counts."""
    mismatches = []
    for reason, count in expect.exact.items():
        if actual.get(reason, 0) != count:
            mismatches.append(f'{reason}: expected {count}, got {actual.get(reason, 0)}')
    for reason, bound in expect.at_most.items():
        if actual.get(reason, 0) > bound:
            mismatches.append(f'{reason}: expected at most {bound}, got {actual[reason]}')
    allowed = set(expect.exact) | set(expect.at_most)
    for reason, count in actual.items():
        if reason not in allowed:
            mismatches.append(f'{reason}: expected 0, got {count}')
    return mismatches


def _iso(moment):
    return moment.isoformat().replace('+00:00', 'Z') if moment else None


def session_entry(session):
    """Return the reported fields of one exported session (no token: the export has none)."""
    visits = session.get('visits') or []
    return {
        'id': session.get('id'),
        'ip': session.get('ip'),
        'domain': session.get('domain'),
        'user_id': session.get('user_id'),
        'created_at': session.get('created_at'),
        'last_seen_at': session.get('last_seen_at'),
        'creation_reason': session.get('creation_reason'),
        'first_path': session.get('first_path'),
        'first_seen_logged': session.get('first_seen_logged'),
        'visit_count': len(visits),
        'visits_truncated': session.get('visits_truncated'),
        'visits': [
            {key: visit.get(key) for key in
             ('started_at', 'last_seen_at', 'hits', 'first_path', 'last_path')}
            for visit in visits
        ],
    }


def scenario_entry(result):
    """Return the report entry of one scenario."""
    entry = {
        'name': result.name,
        'hypothesis': result.hypothesis,
        'expected': {'text': result.expect.text, 'exact': result.expect.exact,
                     'at_most': result.expect.at_most},
        'notes': list(result.notes),
    }
    if result.skipped:
        return {**entry, 'status': SKIPPED, 'skipped': result.skipped}
    actual = reason_counts(result.sessions)
    mismatches = check_expectation(result.expect, actual)
    start, end = result.window.widened()
    return {
        **entry,
        'status': MISMATCH if mismatches else MATCH,
        'actual': actual,
        'mismatches': mismatches,
        'window': {'start': _iso(result.window.start), 'end': _iso(result.window.end),
                   'filtered_from': _iso(start), 'filtered_to': _iso(end)},
        'requests': result.responses,
        'sessions': [session_entry(session) for session in result.sessions],
    }


def build_report(config, started, auth_check, run_check, results):
    """Return the machine-readable report (input for validating `analyse.py`, #1703)."""
    scenarios = [scenario_entry(result) for result in results]
    return {
        'tool': 'investigations/statistics-bug/emulate.py',
        'issue': 1702,
        'started_at': _iso(started),
        'finished_at': _iso(datetime.now(timezone.utc)),
        'target': {'base_url': config.base_url, 'backend_url': config.backend_url,
                   'host': config.host},
        'window_slack_seconds': WINDOW_SLACK.total_seconds(),
        'self_pollution': {'authorization': auth_check, 'run': run_check},
        'summary': {status: sum(1 for s in scenarios if s['status'] == status)
                    for status in (MATCH, MISMATCH, SKIPPED)},
        'scenarios': scenarios,
    }


def _format_counts(counts):
    return ', '.join(f'{reason}={count}' for reason, count in counts.items()) or 'none'


def format_text(report):
    """Return the text summary (no IPs, ids, tokens or secrets)."""
    auth = report['self_pollution']['authorization']
    run_check = report['self_pollution']['run']
    lines = [
        f'Statistics bug emulation — {report["started_at"]} (local stack)',
        f'Self-pollution: authorization {"ok" if auth["ok"] else "FAILED"}, '
        f'run {"ok" if run_check["ok"] else "FAILED"} '
        f'({run_check["self_sessions"]} session(s) / {run_check["self_visits"]} visit(s) '
        'on the script\'s own routes)',
        '',
        f'{"scenario":38} {"hyp":4} {"status":9} expected -> actual',
    ]
    for scenario in report['scenarios']:
        expected = scenario['expected']['text']
        if scenario['status'] == SKIPPED:
            actual = f'(skipped: {scenario["skipped"]})'
        else:
            actual = _format_counts(scenario['actual'])
        lines.append(f'{scenario["name"]:38} {scenario["hypothesis"]:4} '
                     f'{scenario["status"]:9} {expected} -> {actual}')
        for mismatch in scenario.get('mismatches', []):
            lines.append(f'{"":53}! {mismatch}')
        for session in scenario.get('sessions', []):
            lines.append(
                f'{"":53}- {session["creation_reason"] or "null"} '
                f'first_path={session["first_path"]} logged={session["first_seen_logged"]} '
                f'visits={session["visit_count"]}'
            )
        for note in scenario['notes']:
            lines.append(f'{"":53}note: {note}')
    summary = report['summary']
    lines += ['', f'{summary[MATCH]} match, {summary[MISMATCH]} mismatch, '
                  f'{summary[SKIPPED]} skipped. Mismatches are findings, not failures.']
    return '\n'.join(lines)


def write_reports(report, text, reports_dir):
    """Write `emulate-<timestamp>.json` and `.txt` in the git-ignored reports folder."""
    os.makedirs(reports_dir, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    json_path = os.path.join(reports_dir, f'emulate-{stamp}.json')
    text_path = os.path.join(reports_dir, f'emulate-{stamp}.txt')
    with open(json_path, 'w', encoding='utf-8') as handle:
        json.dump(report, handle, indent=2)
        handle.write('\n')
    with open(text_path, 'w', encoding='utf-8') as handle:
        handle.write(text + '\n')
    return json_path, text_path


# ---------------------------------------------------------------------------
# Configuration and entry point
# ---------------------------------------------------------------------------


@dataclass
class Config:
    """Resolved, validated configuration."""

    base_url: str
    backend_url: str
    host: str
    approval_url: str
    username: str
    reports_dir: str
    scenarios: list = field(default_factory=list)
    dry_run: bool = False

    def validate(self):
        """Refuse any non-local target. There is no override flag."""
        ensure_local('base URL', self.base_url)
        ensure_local('backend URL', self.backend_url)
        ensure_local('Host header', self.host)
        ensure_local('approval URL', self.approval_url)
        return self


def parse_args(argv=None, environ=None):
    """Build the `Config` from arguments, then the environment, then local defaults."""
    environ = os.environ if environ is None else environ
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--base-url', default=environ.get('MAJORA_BASE_URL', DEFAULT_BASE_URL),
                        help='proxy base URL (local only)')
    parser.add_argument('--backend-url',
                        default=environ.get('MAJORA_BACKEND_URL', DEFAULT_BACKEND_URL),
                        help='backend base URL (local only)')
    parser.add_argument('--host', default=environ.get('MAJORA_HOST', DEFAULT_HOST),
                        help='Host header of the emulated browser (local only)')
    parser.add_argument('--approval-url',
                        default=environ.get('MAJORA_APPROVAL_URL', DEFAULT_APPROVAL_URL),
                        help='local page where the staff user approves the request')
    parser.add_argument('--username', default=environ.get('MAJORA_USERNAME', ''),
                        help='local staff username (or e-mail) that approves the request')
    parser.add_argument('--reports-dir', default='reports')
    parser.add_argument('--scenario', action='append', default=[],
                        help='run only this scenario (repeatable)')
    parser.add_argument('--dry-run', action='store_true',
                        help='validate configuration and secrets only; send nothing')
    args = parser.parse_args(argv)
    return Config(
        base_url=args.base_url, backend_url=args.backend_url, host=args.host,
        approval_url=args.approval_url, username=args.username,
        reports_dir=args.reports_dir, scenarios=args.scenario, dry_run=args.dry_run,
    ).validate()


def authorize(config, secrets):
    """Return `(client, reader, self_check)`: an authorized client and the pollution check."""
    if not config.username:
        raise Refused('no local staff username: pass --username or set MAJORA_USERNAME.')
    client = SelfClient(config, secrets)
    window = Window.open_now()
    client.set_token(DeviceAuthorization(client, config).obtain())
    window.close()
    reader = ExportReader(client)
    return client, reader, self_pollution_check(reader, window)


def build_context(config, secrets, client):
    """Return the scenarios' shared context (test credentials from the environment only)."""
    ctx = Context(
        config=config, secrets=secrets, client=client,
        login_username=os.environ.get('MAJORA_LOGIN_USERNAME', ''),
        login_password=os.environ.get('MAJORA_LOGIN_PASSWORD', ''),
    )
    ctx.game_slug = discover_game_slug(ctx)
    return ctx


def run(config, secrets, out=sys.stdout):
    """Authorize, run every scenario (exporting its window right after it), report."""
    started = datetime.now(timezone.utc)
    client, reader, auth_check = authorize(config, secrets)
    print(f'Self-pollution check (authorization): {"ok" if auth_check["ok"] else "FAILED"}',
          file=out, flush=True)
    ctx = build_context(config, secrets, client)
    run_window = Window.open_now()
    results = run_scenarios(ctx, reader, out)
    run_window.close()
    run_check = self_pollution_check(reader, run_window)
    report = build_report(config, started, auth_check, run_check, results)
    text = format_text(report)
    print('\n' + text, file=out, flush=True)
    for path in write_reports(report, text, config.reports_dir):
        print(f'Report written: {path}', file=out, flush=True)
    return report


def main(argv=None):
    """Entry point."""
    try:
        config = parse_args(argv)
        secrets = Secrets()
        SelfClient(config, secrets)  # fails early when the skip secret is missing
        select_scenarios(config.scenarios)  # fails early on an unknown scenario name
        if config.dry_run:
            print('Dry run: configuration is local-only and the skip secret is present. '
                  f'{Secrets.PROXY} present: {secrets.available(Secrets.PROXY)}.')
            return 0
        run(config, secrets)
        # Mismatches are findings, not failures: a completed run exits 0.
        return 0
    except Refused as error:
        print(f'Refused: {error}', file=sys.stderr)
        return 2
    except AuthorizationFailed as error:
        print(f'Authorization or export failed: {error}. No report written.', file=sys.stderr)
        return 3
    except (urllib.error.URLError, OSError) as error:
        print(f'Run failed (is the local stack up?): {error.__class__.__name__}: '
              f'{getattr(error, "reason", error)}. No report written.', file=sys.stderr)
        return 4


if __name__ == '__main__':
    sys.exit(main())
