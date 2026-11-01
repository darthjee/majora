"""Analyse the statistics export: group probable duplicate sessions and classify their cause.

Statistics bug investigation (Epic #1696, issue #1703). See README.md and
docs/agents/specs/statistics-bug/scripts.md.

Safety:

- read-only: the script only creates and polls a device-authorization request and pages
  sequentially through `GET /staff/statistics/export.json`; it makes no other request;
- targets: without `--production` every URL must be on `LOCAL_HOSTS`; with `--production`
  the only target is `STATISTICS_PROD_URL` from the environment (https only, never an
  argument value). Any other host is refused, with no override;
- `STATISTICS_SKIP_SECRET` is optional and only ever sent to local targets, never to
  production; `STATISTICS_PROD_URL` and every secret are never printed, logged or written;
- the `statistics:read` token lives in memory only and is never printed, logged or written;
  the script reminds the user to revoke it and does not revoke it itself;
- a denied or expired authorization, or a token rejected later, stops the run with no
  partial report;
- reports are written to the git-ignored `reports/` folder;
- validation mode (`--validate`) runs against the local stack only.

Standard library only. It re-implements the small HTTP / authorization / export helpers of
`emulate.py` (same shapes) instead of importing it: `python -I` keeps this folder off
`sys.path`, and production needs a different allowlist and no skip header.
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

# ---------------------------------------------------------------------------
# Safety: local hosts, or the configured production URL only
# ---------------------------------------------------------------------------

LOCAL_HOSTS = frozenset({
    'localhost', '127.0.0.1',
    # compose service / container names of the local stack
    'majora_proxy', 'majora_app', 'proxy', 'backend',
})

DEFAULT_BASE_URL = 'http://majora_proxy'
DEFAULT_HOST = 'localhost:3000'
DEFAULT_APPROVAL_URL = 'http://localhost:3000/#/account/authorization_requests'
APPROVAL_FRAGMENT = '/#/account/authorization_requests'
PROD_URL_VARIABLE = 'STATISTICS_PROD_URL'
DEFAULT_RACE_WINDOW = 2

EXPORT_PATH = '/staff/statistics/export.json'
EXPORT_PER_PAGE = 100
AUTH_CREATE_PATH = '/users/authorization_requests.json'
AUTH_POLL_PATH = '/users/authorization_requests/{uuid}.json'
# Route patterns (as stored in the tracking columns) of the script's own requests (same set
# as emulate.py). In production the authorization create / poll requests are tracked.
SELF_ROUTES = frozenset({
    'users/authorization_requests.json',
    'users/authorization_requests/<uuid:uuid>.json',
    'staff/statistics/export.json',
})
USER_AGENT = 'majora-statistics-bug-analyse/1.0 (investigation, read-only)'

# Exit codes (same as emulate.py, plus 1 for a validation mismatch).
EXIT_OK, EXIT_MISMATCH, EXIT_REFUSED, EXIT_AUTH, EXIT_NETWORK = 0, 1, 2, 3, 4


class Refused(Exception):
    """Raised when the script must not run (disallowed target, bad arguments, ...)."""


class AuthorizationFailed(Exception):
    """Raised when the authorization is denied or expired, or the token / export is refused."""


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
            f'{label} host {host!r} is not a local host; without --production analyse.py '
            f'only runs against the local stack ({", ".join(sorted(LOCAL_HOSTS))}).'
        )


@dataclass(frozen=True)
class Target:
    """The single set of hosts this run may talk to.

    Local: `LOCAL_HOSTS`. Production: exactly the host of `STATISTICS_PROD_URL`. The repr
    never shows the production host.
    """

    production: bool
    allowed: frozenset

    @classmethod
    def local(cls):
        """Return the local target (the local stack's host names)."""
        return cls(production=False, allowed=LOCAL_HOSTS)

    @classmethod
    def from_production_url(cls, url):
        """Return the production target for `url` (already checked to be https)."""
        return cls(production=True, allowed=frozenset({host_of(url)}))

    def check(self, label, value):
        """Refuse `value` unless its host is allowed for this run."""
        if not self.production:
            ensure_local(label, value)
            return
        if host_of(value) not in self.allowed:
            # Never name the production host: only say the URL is not the configured one.
            raise Refused(f'{label} is not the configured production URL; refused.')

    def __repr__(self):
        """Never show the production host."""
        return f'<Target {"production (host hidden)" if self.production else "local"}>'


def production_url(environ):
    """Return `STATISTICS_PROD_URL` from the environment, refusing a missing or non-https one."""
    value = (environ.get(PROD_URL_VARIABLE) or '').strip().rstrip('/')
    if not value:
        raise Refused(f'--production needs {PROD_URL_VARIABLE} in the root .env; it is not set.')
    parts = urllib.parse.urlsplit(value)
    if parts.scheme != 'https' or not parts.hostname:
        raise Refused(f'{PROD_URL_VARIABLE} must be an https URL; refused.')
    if parts.path not in ('', '/') or parts.query or parts.fragment:
        raise Refused(f'{PROD_URL_VARIABLE} must be a bare origin (https://host); refused.')
    return value


# ---------------------------------------------------------------------------
# Secrets: environment only, never printed
# ---------------------------------------------------------------------------


class Secrets:
    """Reads the secrets from the environment. Values never leave this object.

    `repr` / `str` never show a value; callers only get a value to put in a header.
    """

    SKIP = 'STATISTICS_SKIP_SECRET'

    def __init__(self, environ=None):
        """Keep a reference to the environment (no value is copied eagerly)."""
        self._environ = os.environ if environ is None else environ

    def available(self, name):
        """Return whether `name` is set to a non-empty value."""
        return bool(self._environ.get(name))

    def optional(self, name):
        """Return the value of `name`, or `None` when unset."""
        return self._environ.get(name) or None

    def __repr__(self):
        """Never show values."""
        return '<Secrets (values hidden)>'

    __str__ = __repr__


# ---------------------------------------------------------------------------
# HTTP primitives
# ---------------------------------------------------------------------------


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Return redirects as responses instead of following them (never leave the target)."""

    def redirect_request(self, *args, **kwargs):  # noqa: D102
        return None


_OPENER = urllib.request.build_opener(_NoRedirect)


@dataclass
class Response:
    """One HTTP exchange."""

    method: str
    path: str
    status: int
    headers: dict
    body: bytes

    def json(self):
        """Return the decoded JSON body, or `None`."""
        try:
            return json.loads(self.body.decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            return None

    def header(self, name, default=None):
        """Return a response header, case-insensitively."""
        return self.headers.get(name.lower(), default)


def send(target, base_url, method, path, headers=None, body=None, timeout=30):
    """Send one request to an allowed target; return a `Response` (4xx/5xx included)."""
    target.check('request', base_url)
    url = base_url.rstrip('/') + path
    data = None
    headers = dict(headers or {})
    headers.setdefault('User-Agent', USER_AGENT)
    headers.setdefault('Accept', 'application/json')
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        headers.setdefault('Content-Type', 'application/json')
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        raw = _OPENER.open(request, timeout=timeout)
    except urllib.error.HTTPError as error:
        raw = error
    with raw:
        content = raw.read()
        status = raw.status if hasattr(raw, 'status') else raw.code
        message = raw.headers
    return Response(
        method=method, path=path, status=status,
        headers={key.lower(): value for key, value in message.items()}, body=content,
    )


# ---------------------------------------------------------------------------
# The script's own requests: read-only, no cookie, token in memory
# ---------------------------------------------------------------------------


class Client:
    """Sends the script's own requests: no cookie, `GET` only except the authorization `POST`.

    Locally it adds `X-Statistics-Skip-Secret` when the secret is present; against production
    it never does (the secret never leaves the server there).
    """

    ALLOWED_POSTS = frozenset({AUTH_CREATE_PATH})

    def __init__(self, config, secrets):
        """Read the skip secret for local targets only."""
        self.config = config
        self._skip = None if config.production else secrets.optional(Secrets.SKIP)
        self._token = None

    @property
    def skips_tracking(self):
        """Return whether the requests carry the skip header (local with the secret only)."""
        return self._skip is not None

    def set_token(self, token):
        """Keep the scoped token in memory only."""
        self._token = token

    @property
    def has_token(self):
        """Return whether a token is held."""
        return self._token is not None

    def request(self, method, path, headers=None, body=None, authenticated=False):
        """Send one read-only request (the only write allowed is the authorization POST)."""
        if method != 'GET' and not (method == 'POST' and path in self.ALLOWED_POSTS):
            raise Refused(f'analyse.py is read-only: {method} {path.split("?")[0]} refused.')
        all_headers = {}
        if self.config.host:
            all_headers['Host'] = self.config.host
        if self._skip is not None:
            all_headers['X-Statistics-Skip-Secret'] = self._skip
        if authenticated:
            all_headers['Authorization'] = f'Bearer {self._token}'
        all_headers.update(headers or {})
        return send(self.config.target, self.config.base_url, method, path,
                    headers=all_headers, body=body)

    def __repr__(self):
        """Never show the secret or the token."""
        return '<Client (secrets hidden)>'


class DeviceAuthorization:
    """Gets a `statistics:read` scoped token through the device-authorization flow (#1708).

    It has no timeout of its own: it polls until the request is approved, denied or expires
    (1 hour after creation on the server).
    """

    POLL_INTERVAL_SECONDS = 3
    SCOPES = ['statistics:read']

    def __init__(self, client, config, out=sys.stdout):
        """Store the client."""
        self.client = client
        self.config = config
        self.out = out

    def obtain(self):
        """Create the request, print the approval link, poll; return the token (memory only)."""
        uuid, poll_secret, expires_at = self._create()
        where = 'production' if self.config.production else 'local'
        print(
            f'\nApprove the device authorization as the {where} staff user '
            f'{self.config.username!r} at:\n\n    {self.config.approval_url}\n\n'
            f'(waiting until {expires_at or "it expires"}; the request asks for '
            f'{", ".join(self.SCOPES)} only)\n',
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


class ExportReader:
    """Pages sequentially through `GET /staff/statistics/export.json` with the token.

    One request at a time, `per_page=100`, following the `pages` header. Any non-200
    response (a 401 `token_invalid` mid-run: revoked or expired) is `AuthorizationFailed`,
    so the run stops with no partial report.
    """

    def __init__(self, client, out=sys.stdout):
        """Store the authenticated client."""
        self.client = client
        self.out = out

    def sessions(self, from_date, to_date, tz='UTC', domain=None):
        """Return every session of the range, sorted by `id`."""
        rows = list(self._all_pages(from_date, to_date, tz, domain))
        return sorted(rows, key=lambda session: session['id'])

    def _all_pages(self, from_date, to_date, tz, domain):
        page, pages = 1, 1
        while page <= pages:
            params = {'from': from_date.isoformat(), 'to': to_date.isoformat(), 'tz': tz,
                      'page': page, 'per_page': EXPORT_PER_PAGE}
            if domain:
                params['domain'] = domain
            query = urllib.parse.urlencode(params)
            response = self.client.request('GET', f'{EXPORT_PATH}?{query}', authenticated=True)
            if response.status != 200:
                raise AuthorizationFailed(
                    f'export refused (HTTP {response.status}, '
                    f'{_error_code(response.json())})'
                )
            rows = response.json()
            if not isinstance(rows, list):
                raise AuthorizationFailed('export returned an unexpected payload')
            pages = int(response.header('pages', '1') or 1)
            print(f'  export page {page}/{pages}: {len(rows)} session(s)', file=self.out,
                  flush=True)
            yield from rows
            page += 1


# ---------------------------------------------------------------------------
# Self-tracking filter and ID reset detection
# ---------------------------------------------------------------------------


def split_self_sessions(sessions):
    """Return `(kept, self_check)`: sessions minus those opened by the script's own routes.

    In production the authorization create / poll requests are tracked (the bounded side
    effect); locally with the skip secret the counts must be 0.
    """
    own = [s for s in sessions if s.get('first_path') in SELF_ROUTES]
    kept = [s for s in sessions if s.get('first_path') not in SELF_ROUTES]
    own_visits = sum(
        1 for session in sessions for visit in session.get('visits') or []
        if visit.get('first_path') in SELF_ROUTES or visit.get('last_path') in SELF_ROUTES
    )
    return kept, {'self_sessions': len(own), 'self_visits': own_visits}


@dataclass
class Segment:
    """A run of sessions with no ID reset inside it (analysed separately)."""

    index: int
    sessions: list = field(default_factory=list)


def split_at_resets(sessions, race_window):
    """Split id-ordered `sessions` wherever ids and `created_at` disagree (a #1684 clear).

    A reset point is where, walking by `id`, `created_at` goes backwards by more than
    `race_window` seconds. Returns `(segments, warnings)`; a reset never fails the run.
    """
    segments, warnings = [], []
    current = Segment(index=0)
    previous_created, previous_raw = None, None
    for session in sessions:
        created = parse_iso(session.get('created_at'))
        if previous_created is not None and created is not None:
            gap = (previous_created - created).total_seconds()
            if gap > race_window:
                warnings.append({
                    'segment_before': current.index, 'segment_after': current.index + 1,
                    'created_at_before': previous_raw,
                    'created_at_after': session.get('created_at'),
                    'backwards_seconds': gap,
                })
                segments.append(current)
                current = Segment(index=current.index + 1)
        current.sessions.append(session)
        if created is not None:
            previous_created, previous_raw = created, session.get('created_at')
    if current.sessions or not segments:
        segments.append(current)
    return segments, warnings


# ---------------------------------------------------------------------------
# Grouping and classification (pure functions over exported session dicts)
# ---------------------------------------------------------------------------

HIGH, LOW = 'high', 'low'

RACE, LOGIN_ROTATION, IP_CHANGE, DOMAIN_CHANGE = 'race', 'login_rotation', 'ip_change', \
    'domain_change'
SINGLE_HIT_ORPHAN, LEGITIMATE, OTHER = 'single_hit_orphan', 'legitimate', 'other'
CAUSES = (RACE, LOGIN_ROTATION, IP_CHANGE, DOMAIN_CHANGE, SINGLE_HIT_ORPHAN, LEGITIMATE, OTHER)

COOKIE_REASONS = frozenset({'no_cookie', 'invalid_cookie', 'cookie_session_not_found'})
KNOWN_REASONS = COOKIE_REASONS | {'domain_changed', 'ip_changed', 'login_rotation'}
# Heuristic causes each creation reason is consistent with; anything else is a disagreement.
COMPATIBLE_CAUSES = {
    'no_cookie': frozenset({RACE, SINGLE_HIT_ORPHAN, LEGITIMATE}),
    'invalid_cookie': frozenset({RACE, SINGLE_HIT_ORPHAN, LEGITIMATE}),
    'cookie_session_not_found': frozenset({RACE, SINGLE_HIT_ORPHAN, LEGITIMATE}),
    'login_rotation': frozenset({LOGIN_ROTATION}),
    'ip_changed': frozenset({IP_CHANGE, LEGITIMATE}),
    'domain_changed': frozenset({DOMAIN_CHANGE}),
}
# The cause a creation reason stands for when the heuristic does not fit it.
REASON_CAUSE = {
    'no_cookie': OTHER,
    'invalid_cookie': OTHER,
    'cookie_session_not_found': LEGITIMATE,  # sessions removed by a statistics Clear (#1684)
    'login_rotation': LOGIN_ROTATION,
    'ip_changed': IP_CHANGE,
    'domain_changed': DOMAIN_CHANGE,
}
# A new session this long after the previous one's last activity is a fresh start (logout,
# cookie expiry, ...): the default visit inactivity (MAJORA_STATISTICS_VISIT_INACTIVITY_SECONDS).
LEGITIMATE_GAP_SECONDS = 30 * 60
UNRESOLVED_PATH = 'unresolved'
NAT_CAVEAT = ('Low-confidence groups join anonymous sessions by domain, IP and time only: '
              'unrelated visitors behind the same NAT can share an IP.')


def domain_key(session):
    """Return the session's domain id (`unknown` when it has none)."""
    domain = session.get('domain') or {}
    return domain.get('id', 'unknown') if isinstance(domain, dict) else domain


def created(session):
    """Return the session's `created_at` (whole seconds, UTC)."""
    return parse_iso(session.get('created_at'))


def order_key(session):
    """Sessions are ordered by `created_at`, then `id` within the same second."""
    return created(session), session['id']


def active_until(session):
    """Return the latest activity of `session` (its own or its visits' `last_seen_at`).

    `Session.last_seen_at` is throttled, so the visits' `last_seen_at` refine it.
    """
    moments = [parse_iso(session.get('last_seen_at')) or created(session)]
    moments += [parse_iso(v.get('last_seen_at')) for v in session.get('visits') or []
                if v.get('last_seen_at')]
    return max(moments)


def nearby_ip(first, second):
    """Return whether two IPs share an IPv4 /24 or an IPv6 /64."""
    try:
        a, b = ipaddress.ip_address(first or ''), ipaddress.ip_address(second or '')
    except ValueError:
        return False
    if a.version != b.version:
        return False
    prefix = 24 if a.version == 4 else 64
    return ipaddress.ip_network(f'{a}/{prefix}', strict=False) == \
        ipaddress.ip_network(f'{b}/{prefix}', strict=False)


def _seconds(later, earlier):
    return (later - earlier).total_seconds()


class _UnionFind:
    """Joins session indexes into groups, remembering whether any link was low confidence."""

    def __init__(self, size):
        self.parent = list(range(size))
        self.low = [False] * size

    def find(self, index):
        while self.parent[index] != index:
            self.parent[index] = self.parent[self.parent[index]]
            index = self.parent[index]
        return index

    def join(self, first, second, confidence):
        root_a, root_b = self.find(first), self.find(second)
        if root_a != root_b:
            self.parent[root_b] = root_a
            self.low[root_a] = self.low[root_a] or self.low[root_b]
            root_b = root_a
        if confidence == LOW:
            self.low[root_a] = True


@dataclass
class Extra:
    """One extra session of a group: its heuristic cause, its reason and the final cause."""

    session: dict
    sibling: dict
    heuristic: str
    reason: str
    cause: str
    pre_columns: bool
    disagreement: bool


@dataclass
class Group:
    """Sessions that probably belong to one visitor. The first one is the original."""

    confidence: str
    sessions: list
    extras: list = field(default_factory=list)

    @property
    def original(self):
        """Return the first session (by `created_at`, then `id`)."""
        return self.sessions[0]


@dataclass
class SegmentAnalysis:
    """The groups found in one segment (no ID reset inside it)."""

    index: int
    sessions: list
    groups: list

    @property
    def extras(self):
        """Return every extra session of the segment's groups."""
        return [extra for group in self.groups for extra in group.extras]


def _link_anonymous(sessions, uf, race_window):
    """Low confidence: anonymous sessions with the same domain and IP, close in time."""
    last = {}
    for index, session in enumerate(sessions):
        if session.get('user_id') is not None:
            continue
        key = (domain_key(session), session.get('ip'))
        previous = last.get(key)
        if previous is not None:
            other = sessions[previous]
            if (_seconds(created(session), created(other)) <= race_window
                    or created(session) <= active_until(other)):
                uf.join(previous, index, LOW)
        last[key] = index


def _link_users(sessions, uf):
    """High confidence: the same (non-null) `user_id`."""
    first = {}
    for index, session in enumerate(sessions):
        user = session.get('user_id')
        if user is None:
            continue
        if user in first:
            uf.join(first[user], index, HIGH)
        else:
            first[user] = index


def _latest_before(sessions, index, accept):
    """Return the index of the latest earlier session accepted by `accept`, or `None`."""
    for candidate in range(index - 1, -1, -1):
        if accept(sessions[candidate]):
            return candidate
    return None


def _reason_target(sessions, index, race_window):
    """Return the index of the session `sessions[index]` is linked to by its reason, or `None`."""
    session = sessions[index]
    reason = session.get('creation_reason')
    moment, domain, ip = created(session), domain_key(session), session.get('ip')
    window = timedelta(seconds=race_window)

    def active_nearby(other):
        return (domain_key(other) == domain and other.get('ip') != ip
                and nearby_ip(other.get('ip'), ip) and moment <= active_until(other) + window)

    def recent_other_ip(other):
        return (domain_key(other) == domain and other.get('ip') != ip
                and _seconds(moment, created(other)) <= race_window)

    def recent_other_domain(other):
        return (other.get('ip') == ip and domain_key(other) != domain
                and _seconds(moment, created(other)) <= race_window)

    def active_anonymous(other):
        return (other.get('user_id') is None and domain_key(other) == domain
                and other.get('ip') == ip and moment <= active_until(other) + window)

    if reason == 'ip_changed':
        target = _latest_before(sessions, index, active_nearby)
        return target if target is not None else _latest_before(sessions, index, recent_other_ip)
    if reason == 'domain_changed':
        return _latest_before(sessions, index, recent_other_domain)
    if session.get('user_id') is not None and (
            reason == 'login_rotation'
            or (reason is None and session.get('first_seen_logged') is not False)):
        # A login rotation: the anonymous session it rotated from, still active.
        return _latest_before(sessions, index, active_anonymous)
    return None


def _link_by_reason(sessions, uf, race_window):
    """Low confidence links read from `creation_reason` (and its pre-columns fallback)."""
    for index in range(len(sessions)):
        target = _reason_target(sessions, index, race_window)
        if target is not None:
            uf.join(target, index, LOW)


def group_sessions(sessions, race_window):
    """Return the groups (two sessions or more) of one segment's sessions."""
    ordered = sorted(sessions, key=order_key)
    uf = _UnionFind(len(ordered))
    _link_users(ordered, uf)
    _link_anonymous(ordered, uf, race_window)
    _link_by_reason(ordered, uf, race_window)
    members = {}
    for index in range(len(ordered)):
        members.setdefault(uf.find(index), []).append(ordered[index])
    groups = []
    for root, group_sessions_ in members.items():
        if len(group_sessions_) > 1:
            groups.append(Group(confidence=LOW if uf.low[root] else HIGH,
                                sessions=group_sessions_))
    return sorted(groups, key=lambda group: order_key(group.original))


def _only_unresolved(session):
    """Return whether every path of `session` is the `unresolved` marker (bot-like)."""
    paths = [session.get('first_path')] + [
        path for visit in session.get('visits') or []
        for path in (visit.get('first_path'), visit.get('last_path'))
    ]
    paths = [path for path in paths if path is not None]
    return bool(paths) and all(path == UNRESOLVED_PATH for path in paths)


def _single_hit(session):
    visits = session.get('visits') or []
    return len(visits) == 1 and visits[0].get('hits') == 1


def heuristic_cause(session, earlier, later, race_window):
    """Return the heuristic cause of an extra `session`.

    `earlier` are its group's sessions before it (closest last) and `later` those after it.
    """
    sibling = earlier[-1]
    moment = created(session)
    window = timedelta(seconds=race_window)
    if session.get('user_id') is not None and any(
            other.get('user_id') is None and moment <= active_until(other) + window
            for other in earlier):
        return LOGIN_ROTATION
    if (session.get('first_seen_logged') and sibling.get('user_id') is None
            and not sibling.get('first_seen_logged')):
        return LOGIN_ROTATION
    if all(_seconds(moment, active_until(other)) > LEGITIMATE_GAP_SECONDS for other in earlier):
        return LEGITIMATE  # a fresh start long after the visitor went quiet (logout, expiry)
    if domain_key(session) != domain_key(sibling):
        return DOMAIN_CHANGE
    if session.get('ip') != sibling.get('ip'):
        return IP_CHANGE
    if _only_unresolved(session):
        return LEGITIMATE
    if any(domain_key(other) == domain_key(session) and other.get('ip') == session.get('ip')
           and abs(_seconds(moment, created(other))) <= race_window
           for other in earlier + later):
        return RACE
    if _single_hit(session) and any(active_until(other) > active_until(session)
                                    for other in earlier + later):
        return SINGLE_HIT_ORPHAN
    return OTHER


def cross_check(heuristic, reason):
    """Return `(cause, disagreement)`: `creation_reason` is primary when set."""
    if reason is None:
        return heuristic, False
    if reason not in KNOWN_REASONS:
        return OTHER, True
    if heuristic in COMPATIBLE_CAUSES[reason]:
        return heuristic, False
    return REASON_CAUSE[reason], True


def classify_group(group, race_window):
    """Fill `group.extras`: every session after the original, classified."""
    group.extras = []
    for position in range(1, len(group.sessions)):
        session = group.sessions[position]
        earlier, later = group.sessions[:position], group.sessions[position + 1:]
        heuristic = heuristic_cause(session, earlier, later, race_window)
        reason = session.get('creation_reason')
        cause, disagreement = cross_check(heuristic, reason)
        group.extras.append(Extra(
            session=session, sibling=earlier[-1], heuristic=heuristic, reason=reason,
            cause=cause, pre_columns=reason is None, disagreement=disagreement,
        ))
    return group


def analyse_segment(segment, race_window):
    """Group and classify one segment's sessions."""
    groups = [classify_group(group, race_window)
              for group in group_sessions(segment.sessions, race_window)]
    return SegmentAnalysis(index=segment.index, sessions=segment.sessions, groups=groups)


def analyse_segments(segments, race_window):
    """Group and classify every segment separately (an ID reset never joins two segments)."""
    return [analyse_segment(segment, race_window) for segment in segments]


# ---------------------------------------------------------------------------
# Report: JSON + text in the git-ignored reports folder; console shows counts only
# ---------------------------------------------------------------------------

TOP_PATHS = 10
SAMPLES_PER_CAUSE = 5
SELF_SIDE_EFFECT_NOTE = (
    'Production: the authorization create / poll requests are tracked (the export route is '
    'not); the sessions they opened were removed from the analysis and are counted as self '
    'sessions (authorization side effect).'
)


def _iso(moment):
    return moment.isoformat().replace('+00:00', 'Z') if moment else None


def _count(values):
    """Return `{value: count}` sorted by count (descending), then value."""
    counts = {}
    for value in values:
        key = 'null' if value is None else str(value)
        counts[key] = counts.get(key, 0) + 1
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def _logged(session):
    return 'logged_in' if session.get('user_id') is not None else 'anonymous'


def top_paths(sessions):
    """Return the top `first_path` values per `creation_reason` (aggregated counts)."""
    per_reason = {}
    for session in sessions:
        per_reason.setdefault(session.get('creation_reason') or 'null', []).append(
            session.get('first_path'))
    return {reason: dict(list(_count(paths).items())[:TOP_PATHS])
            for reason, paths in sorted(per_reason.items())}


def session_entry(session):
    """Return the reported fields of one session (raw values: the report is git-ignored)."""
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


def extra_entry(extra):
    """Return the reported classification of one extra session."""
    return {'session_id': extra.session.get('id'), 'sibling_id': extra.sibling.get('id'),
            'heuristic': extra.heuristic, 'creation_reason': extra.reason,
            'cause': extra.cause, 'pre_columns': extra.pre_columns,
            'disagreement': extra.disagreement}


def group_entry(segment_index, group):
    """Return one sample group: its sessions (with visit paths) and its extras."""
    return {'segment': segment_index, 'confidence': group.confidence,
            'sessions': [session_entry(session) for session in group.sessions],
            'extras': [extra_entry(extra) for extra in group.extras]}


def summarize(analyses):
    """Return the counts and breakdowns over every segment (no raw value inside)."""
    sessions = [s for analysis in analyses for s in analysis.sessions]
    groups = [g for analysis in analyses for g in analysis.groups]
    extras = [e for analysis in analyses for e in analysis.extras]
    pre_columns = [s for s in sessions if s.get('creation_reason') is None]
    return {
        'totals': {
            'sessions': len(sessions),
            'groups': {'all': len(groups),
                       HIGH: sum(1 for g in groups if g.confidence == HIGH),
                       LOW: sum(1 for g in groups if g.confidence == LOW)},
            'extras': {'all': len(extras),
                       HIGH: sum(len(g.extras) for g in groups if g.confidence == HIGH),
                       LOW: sum(len(g.extras) for g in groups if g.confidence == LOW)},
            'disagreements': sum(1 for e in extras if e.disagreement),
        },
        'extras_per_cause': {cause: sum(1 for e in extras if e.cause == cause)
                             for cause in CAUSES},
        'extras_per_heuristic': {cause: sum(1 for e in extras if e.heuristic == cause)
                                 for cause in CAUSES},
        'sessions_per_creation_reason': _count(s.get('creation_reason') for s in sessions),
        'extras_per_creation_reason': _count(e.reason for e in extras),
        'sessions_per_domain': _count(domain_key(s) for s in sessions),
        'extras_per_domain': _count(domain_key(e.session) for e in extras),
        'sessions_per_login': _count(_logged(s) for s in sessions),
        'extras_per_login': _count(_logged(e.session) for e in extras),
        'sessions_per_first_seen_logged': _count(s.get('first_seen_logged') for s in sessions),
        'extras_per_first_seen_logged': _count(e.session.get('first_seen_logged')
                                               for e in extras),
        'top_first_paths_per_creation_reason': top_paths(sessions),
        'top_first_paths_of_extras_per_creation_reason': top_paths(e.session for e in extras),
        'pre_columns': {
            'sessions': len(pre_columns),
            'extras': sum(1 for e in extras if e.pre_columns),
            'extras_per_heuristic': _count(e.heuristic for e in extras if e.pre_columns),
        },
        'segments': [{'segment': a.index, 'sessions': len(a.sessions), 'groups': len(a.groups),
                      'extras': len(a.extras)} for a in analyses],
    }


def sample_groups(analyses):
    """Return up to `SAMPLES_PER_CAUSE` groups per cause (a group counts for each cause)."""
    samples = {cause: [] for cause in CAUSES}
    for analysis in analyses:
        for group in analysis.groups:
            for cause in dict.fromkeys(extra.cause for extra in group.extras):
                if len(samples[cause]) < SAMPLES_PER_CAUSE:
                    samples[cause].append(group_entry(analysis.index, group))
    return {cause: groups for cause, groups in samples.items() if groups}


def build_report(config, started, dataset, analyses):
    """Return the machine-readable report (raw values: local and git-ignored)."""
    extras = [e for analysis in analyses for e in analysis.extras]
    notes = [NAT_CAVEAT]
    if config.production:
        notes.append(SELF_SIDE_EFFECT_NOTE)
    return {
        'tool': 'investigations/statistics-bug/analyse.py',
        'issue': 1703,
        'started_at': _iso(started),
        'finished_at': _iso(datetime.now(timezone.utc)),
        'range': {'from': config.from_date.isoformat(), 'to': config.to_date.isoformat(),
                  'tz': config.tz, 'domain': config.domain},
        'target': 'production' if config.production else 'local',
        'race_window_seconds': config.race_window,
        'fetched_sessions': dataset.fetched,
        'self_sessions': {**dataset.self_check, 'skip_header_sent': dataset.skip_header_sent},
        'id_resets': dataset.reset_warnings,
        'summary': summarize(analyses),
        'disagreements': [extra_entry(e) for e in extras if e.disagreement],
        'pre_columns_extras': [extra_entry(e) for e in extras if e.pre_columns],
        'samples': sample_groups(analyses),
        'notes': notes,
    }


def _format_counts(counts):
    return ', '.join(f'{key}={value}' for key, value in counts.items() if value) or 'none'


def format_summary(report):
    """Return the console summary: counts and breakdowns only (no IP, id or sample)."""
    summary, totals = report['summary'], report['summary']['totals']
    rng = report['range']
    self_check = report['self_sessions']
    lines = [
        f'Statistics bug analysis — {report["started_at"]} ({report["target"]})',
        f'Range {rng["from"]}..{rng["to"]} tz={rng["tz"]}'
        + (f' domain={rng["domain"]}' if rng['domain'] else '')
        + f', race window {report["race_window_seconds"]:g}s',
        f'Sessions: {report["fetched_sessions"]} read, {self_check["self_sessions"]} self '
        f'session(s) removed (authorization side effect), {self_check["self_visits"]} visit(s) '
        f'on the script\'s own routes; {totals["sessions"]} analysed in '
        f'{len(summary["segments"])} segment(s)',
        f'Groups: {totals["groups"]["all"]} ({totals["groups"][HIGH]} high, '
        f'{totals["groups"][LOW]} low confidence); extras: {totals["extras"]["all"]} '
        f'({totals["extras"][HIGH]} high, {totals["extras"][LOW]} low)',
        f'ID resets: {len(report["id_resets"])}; disagreements: {totals["disagreements"]}; '
        f'pre-columns sessions: {summary["pre_columns"]["sessions"]} '
        f'({summary["pre_columns"]["extras"]} extra(s))',
        '',
        f'Extras per cause:              {_format_counts(summary["extras_per_cause"])}',
        f'Extras per heuristic:          {_format_counts(summary["extras_per_heuristic"])}',
        f'Sessions per creation_reason:  {_format_counts(summary["sessions_per_creation_reason"])}',
        f'Extras per creation_reason:    {_format_counts(summary["extras_per_creation_reason"])}',
        f'Sessions per domain id:        {_format_counts(summary["sessions_per_domain"])}',
        f'Extras per domain id:          {_format_counts(summary["extras_per_domain"])}',
        f'Sessions anonymous/logged:     {_format_counts(summary["sessions_per_login"])}',
        f'Extras anonymous/logged:       {_format_counts(summary["extras_per_login"])}',
        'Sessions per first_seen_logged: '
        f'{_format_counts(summary["sessions_per_first_seen_logged"])}',
        'Extras per first_seen_logged:   '
        f'{_format_counts(summary["extras_per_first_seen_logged"])}',
        f'Pre-columns extras per heuristic: '
        f'{_format_counts(summary["pre_columns"]["extras_per_heuristic"])}',
        '',
        f'Top first_path per creation_reason (top {TOP_PATHS}):',
    ]
    for reason, paths in summary['top_first_paths_per_creation_reason'].items():
        lines.append(f'  {reason}: {_format_counts(paths)}')
    lines.append('Top first_path of extras per creation_reason:')
    for reason, paths in summary['top_first_paths_of_extras_per_creation_reason'].items():
        lines.append(f'  {reason}: {_format_counts(paths)}')
    for warning in report['id_resets']:
        lines.append(f'warning: ID reset between segments {warning["segment_before"]} and '
                     f'{warning["segment_after"]}; analysed separately')
    lines += ['', *[f'note: {note}' for note in report['notes']]]
    return '\n'.join(lines)


def _format_session_raw(session):
    visits = '; '.join(f'{v["first_path"]} -> {v["last_path"]} ({v["hits"]} hit(s))'
                       for v in session['visits'])
    domain = (session['domain'] or {}).get('domain') if isinstance(session['domain'], dict) \
        else session['domain']
    return (f'      #{session["id"]} {session["created_at"]} ip={session["ip"]} '
            f'domain={domain} user={session["user_id"]} '
            f'reason={session["creation_reason"]} logged={session["first_seen_logged"]} '
            f'first_path={session["first_path"]} visits: {visits or "none"}')


def format_details(report):
    """Return the detailed part of the text report (raw values: file only, never console)."""
    lines = ['', 'Disagreements (heuristic vs creation_reason):']
    lines += [f'  session #{d["session_id"]}: heuristic={d["heuristic"]} '
              f'creation_reason={d["creation_reason"]} -> {d["cause"]}'
              for d in report['disagreements']] or ['  none']
    lines += ['', 'Pre-columns extras (heuristics only):']
    lines += [f'  session #{d["session_id"]}: {d["heuristic"]}'
              for d in report['pre_columns_extras']] or ['  none']
    lines += ['', f'Sample groups (up to {SAMPLES_PER_CAUSE} per cause):']
    for cause, groups in report['samples'].items():
        lines.append(f'  {cause}:')
        for group in groups:
            lines.append(f'    segment {group["segment"]}, {group["confidence"]} confidence, '
                         f'{len(group["sessions"])} session(s):')
            lines += [_format_session_raw(session) for session in group['sessions']]
    return '\n'.join(lines)


def mask_ip(value):
    """Mask an IP to `a.b.c.x` (IPv4) or its /64 plus `:x` (IPv6)."""
    try:
        address = ipaddress.ip_address(value or '')
    except ValueError:
        return 'x'
    if address.version == 4:
        return '.'.join(str(address).split('.')[:3] + ['x'])
    return ':'.join(address.exploded.split(':')[:4]) + ':x'


class Aliases:
    """Per-run aliases (`s-1`, `user-1`, `domain-1`, ...) for the anonymised summary."""

    def __init__(self):
        self._maps = {}

    def __call__(self, kind, value):
        if value is None:
            return 'none'
        mapping = self._maps.setdefault(kind, {})
        return mapping.setdefault(value, f'{kind}-{len(mapping) + 1}')


def format_anonymised(report):
    """Return a summary safe to paste in #1704 or a PR.

    Counts and breakdowns (domains aliased), then sample groups with masked IPs, per-run
    aliases for session / user / domain ids and no paths. Never a token or a URL.
    """
    alias = Aliases()
    summary, totals = report['summary'], report['summary']['totals']

    def domains(counts):
        return _format_counts({k if k == 'unknown' else alias('domain', k): v
                               for k, v in counts.items()})

    lines = [
        '--- anonymised summary (safe to paste) ---',
        f'target={report["target"]} range={report["range"]["from"]}..{report["range"]["to"]} '
        f'tz={report["range"]["tz"]} race_window={report["race_window_seconds"]:g}s',
        f'sessions={totals["sessions"]} self_sessions_removed='
        f'{report["self_sessions"]["self_sessions"]} id_resets={len(report["id_resets"])}',
        f'groups={totals["groups"]["all"]} (high={totals["groups"][HIGH]}, '
        f'low={totals["groups"][LOW]}) extras={totals["extras"]["all"]} '
        f'(high={totals["extras"][HIGH]}, low={totals["extras"][LOW]}) '
        f'disagreements={totals["disagreements"]} '
        f'pre_columns_sessions={summary["pre_columns"]["sessions"]}',
        f'extras per cause: {_format_counts(summary["extras_per_cause"])}',
        f'sessions per creation_reason: {_format_counts(summary["sessions_per_creation_reason"])}',
        f'extras per creation_reason: {_format_counts(summary["extras_per_creation_reason"])}',
        f'sessions per domain: {domains(summary["sessions_per_domain"])}',
        f'extras per domain: {domains(summary["extras_per_domain"])}',
        f'sessions anonymous/logged: {_format_counts(summary["sessions_per_login"])}',
        'sessions per first_seen_logged: '
        f'{_format_counts(summary["sessions_per_first_seen_logged"])}',
        'top first_path of extras per creation_reason (counts):',
    ]
    for reason, paths in summary['top_first_paths_of_extras_per_creation_reason'].items():
        lines.append(f'  {reason}: {_format_counts(paths)}')
    lines.append('sample groups (masked IPs, aliased ids, no paths):')
    for cause, groups in report['samples'].items():
        for group in groups:
            members = ', '.join(
                f'{alias("s", s["id"])}[{s["creation_reason"] or "null"} '
                f'ip={mask_ip(s["ip"])} user={alias("user", s["user_id"])} '
                f'visits={s["visit_count"]} hits={sum(v["hits"] or 0 for v in s["visits"])}]'
                for s in group['sessions'])
            lines.append(f'  {cause} ({group["confidence"]}): {members}')
    lines.append('--- end ---')
    return '\n'.join(lines)


def write_reports(report, text, reports_dir, prefix='analyse'):
    """Write `<prefix>-<timestamp>.json` and `.txt` in the git-ignored reports folder."""
    os.makedirs(reports_dir, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    json_path = os.path.join(reports_dir, f'{prefix}-{stamp}.json')
    text_path = os.path.join(reports_dir, f'{prefix}-{stamp}.txt')
    with open(json_path, 'w', encoding='utf-8') as handle:
        json.dump(report, handle, indent=2)
        handle.write('\n')
    with open(text_path, 'w', encoding='utf-8') as handle:
        handle.write(text + '\n')
    return json_path, text_path


# ---------------------------------------------------------------------------
# Validation mode: recover what emulate.py produced, on the LOCAL export
# ---------------------------------------------------------------------------

SKIPPED_STATUS = 'SKIPPED'


def load_emulate_report(path):
    """Load an `emulate.py` JSON report; refuse anything that does not look like one."""
    try:
        with open(path, encoding='utf-8') as handle:
            report = json.load(handle)
    except (OSError, ValueError) as error:
        raise Refused(f'cannot read the emulate report {path!r} ({error.__class__.__name__}).') \
            from error
    if not isinstance(report, dict) or not isinstance(report.get('scenarios'), list):
        raise Refused(f'{path!r} is not an emulate.py JSON report.')
    return report


def check_expectation(expected, actual):
    """Return the mismatches between `expected` (`exact` / `at_most`) and `actual` counts.

    Same rule as `emulate.py`: exact counts must match, upper bounds must hold, and any other
    reason must not appear.
    """
    exact, at_most = expected.get('exact') or {}, expected.get('at_most') or {}
    mismatches = []
    for reason, count in exact.items():
        if actual.get(reason, 0) != count:
            mismatches.append(f'{reason}: expected {count}, got {actual.get(reason, 0)}')
    for reason, bound in at_most.items():
        if actual.get(reason, 0) > bound:
            mismatches.append(f'{reason}: expected at most {bound}, got {actual[reason]}')
    allowed = set(exact) | set(at_most)
    for reason, count in actual.items():
        if reason not in allowed:
            mismatches.append(f'{reason}: expected 0, got {count}')
    return mismatches


def reason_counts(sessions):
    """Return `{creation_reason: count}`; `NULL` reasons are counted as `null`."""
    counts = {}
    for session in sessions:
        reason = session.get('creation_reason') or 'null'
        counts[reason] = counts.get(reason, 0) + 1
    return dict(sorted(counts.items()))


class WindowFetcher:
    """Fetches the local export once per day range and filters it by scenario window."""

    def __init__(self, reader):
        """Store the reader; pages of a day range are fetched once."""
        self.reader = reader
        self._cache = {}

    def sessions(self, start, end):
        """Return the sessions whose `created_at` falls in `[start, end]` (UTC), by `id`."""
        key = (start.date(), end.date())
        if key not in self._cache:
            self._cache[key] = self.reader.sessions(key[0], key[1], 'UTC')
        return [s for s in self._cache[key] if start <= created(s) <= end]


def validate_scenario(scenario, fetcher, config):
    """Analyse one scenario's window and compare it with what the scenario produced."""
    entry = {'name': scenario.get('name'), 'hypothesis': scenario.get('hypothesis')}
    if scenario.get('status') == SKIPPED_STATUS or not scenario.get('window'):
        return {**entry, 'status': SKIPPED_STATUS, 'problems': [],
                'skipped': scenario.get('skipped') or 'no window'}
    start = parse_iso(scenario['window']['filtered_from'])
    end = parse_iso(scenario['window']['filtered_to'])
    problems = []
    if start.date() < config.from_date or end.date() > config.to_date:
        problems.append('the scenario window is outside --from / --to')
    rows = fetcher.sessions(start, end)
    kept, self_check = split_self_sessions(rows)
    if fetcher.reader.client.skips_tracking and self_check['self_sessions']:
        problems.append(f'{self_check["self_sessions"]} session(s) opened by the script\'s own '
                        'routes (self-pollution)')
    segments, resets = split_at_resets(kept, config.race_window)
    analyses = analyse_segments(segments, config.race_window)

    expected_ids = sorted(s['id'] for s in scenario.get('sessions') or [])
    found_ids = sorted(s['id'] for s in kept)
    if found_ids != expected_ids:
        problems.append(f'sessions: analysed {len(found_ids)}, emulate reported '
                        f'{len(expected_ids)} (ids differ)')

    extras = [extra for analysis in analyses for extra in analysis.extras]
    groups = [group for analysis in analyses for group in analysis.groups]
    expected_extras = max(len(expected_ids) - 1, 0)
    if len(extras) != expected_extras:
        problems.append(f'duplicates: found {len(extras)} extra(s), the scenario produced '
                        f'{expected_extras}')
    if len(kept) > 1 and not (len(groups) == 1 and len(groups[0].sessions) == len(kept)):
        problems.append(f'grouping: the {len(kept)} sessions are not all in one group '
                        f'({len(groups)} group(s))')

    actual = reason_counts(kept)
    reason_mismatches = check_expectation(scenario.get('expected') or {}, actual)
    problems += [f'reason {mismatch}' for mismatch in reason_mismatches]
    disagreements = [extra_entry(extra) for extra in extras if extra.disagreement]
    problems += [f'disagreement: heuristic {d["heuristic"]} vs creation_reason '
                 f'{d["creation_reason"]}' for d in disagreements]
    if resets:
        problems.append(f'{len(resets)} ID reset(s) inside the window')
    return {
        **entry,
        'status': 'MATCH' if not problems else 'MISMATCH',
        'problems': problems,
        'emulate_status': scenario.get('status'),
        'expected_reasons': {'exact': (scenario.get('expected') or {}).get('exact') or {},
                             'at_most': (scenario.get('expected') or {}).get('at_most') or {}},
        'recovered_reasons': actual,
        'sessions': {'emulate': len(expected_ids), 'analysed': len(found_ids),
                     'self_removed': self_check['self_sessions']},
        'duplicates': {'produced': expected_extras, 'found': len(extras)},
        'groups': [{'confidence': g.confidence, 'size': len(g.sessions)} for g in groups],
        'causes': _count(extra.cause for extra in extras),
        'disagreements': disagreements,
    }


def validate(config, reader, emulate_report, started, out=sys.stdout):
    """Validate every scenario of `emulate_report`; return the validation report."""
    fetcher = WindowFetcher(reader)
    results = []
    for scenario in emulate_report['scenarios']:
        result = validate_scenario(scenario, fetcher, config)
        results.append(result)
        print(f'  - {result["name"]}: {result["status"].lower()}', file=out, flush=True)
    counts = {status: sum(1 for r in results if r['status'] == status)
              for status in ('MATCH', 'MISMATCH', SKIPPED_STATUS)}
    return {
        'tool': 'investigations/statistics-bug/analyse.py --validate',
        'issue': 1703,
        'started_at': _iso(started),
        'finished_at': _iso(datetime.now(timezone.utc)),
        'target': 'local',
        'emulate_report': {'started_at': emulate_report.get('started_at'),
                           'scenarios': len(emulate_report['scenarios'])},
        'race_window_seconds': config.race_window,
        'skip_header_sent': reader.client.skips_tracking,
        'summary': counts,
        'scenarios': results,
    }


def format_validation(report):
    """Return the per-scenario match / mismatch lines (counts and reasons only)."""
    lines = [f'Statistics bug analysis — validation against emulate.py '
             f'({report["emulate_report"]["started_at"]}, local stack)', '',
             f'{"scenario":38} {"hyp":4} {"status":9} duplicates  reasons recovered']
    for result in report['scenarios']:
        if result['status'] == SKIPPED_STATUS:
            lines.append(f'{result["name"]:38} {result["hypothesis"] or "-":4} '
                         f'{"skipped":9} ({result["skipped"]})')
            continue
        duplicates = f'{result["duplicates"]["found"]}/{result["duplicates"]["produced"]}'
        lines.append(f'{result["name"]:38} {result["hypothesis"] or "-":4} '
                     f'{result["status"].lower():9} {duplicates:11} '
                     f'{_format_counts(result["recovered_reasons"])}')
        if result['causes']:
            lines.append(f'{"":53}causes: {_format_counts(result["causes"])}')
        for problem in result['problems']:
            lines.append(f'{"":53}! {problem}')
    summary = report['summary']
    lines += ['', f'{summary["MATCH"]} match, {summary["MISMATCH"]} mismatch, '
                  f'{summary[SKIPPED_STATUS]} skipped (duplicates: found/produced).']
    return '\n'.join(lines)


def run_validation(config, secrets, out=sys.stdout):
    """Authorize once, validate every scenario, write `validate-<stamp>`; return the exit code."""
    emulate_report = load_emulate_report(config.validate_path)
    started = datetime.now(timezone.utc)
    _client, reader = authorize(config, secrets, out)
    try:
        print('Validating the emulate.py scenarios on the local export...', file=out, flush=True)
        report = validate(config, reader, emulate_report, started, out)
        text = format_validation(report)
        print('\n' + text, file=out, flush=True)
        for path in write_reports(report, text, config.reports_dir, prefix='validate'):
            print(f'Report written: {path}', file=out, flush=True)
    finally:
        remind_revoke(config, out)
    return EXIT_MISMATCH if report['summary']['MISMATCH'] else EXIT_OK


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


@dataclass
class Config:
    """Resolved, validated configuration. Its repr never shows the production URL."""

    base_url: str
    host: str
    approval_url: str
    username: str
    from_date: date
    to_date: date
    tz: str = 'UTC'
    domain: str = None
    race_window: float = DEFAULT_RACE_WINDOW
    validate_path: str = None
    reports_dir: str = 'reports'
    dry_run: bool = False
    anonymised: bool = False
    production: bool = False
    target: Target = None

    def __repr__(self):
        """Hide the URLs (the production one must never be printed)."""
        return (f'<Config {"production" if self.production else "local"} '
                f'{self.from_date}..{self.to_date} tz={self.tz} (URLs hidden)>')

    def validate(self):
        """Refuse any disallowed target or inconsistent argument. There is no override."""
        if self.from_date > self.to_date:
            raise Refused('--from must not be after --to.')
        if self.race_window <= 0:
            raise Refused('--race-window must be greater than 0.')
        if self.validate_path and self.production:
            raise Refused('--validate runs against the local stack only; it cannot be combined '
                          'with --production.')
        self.target.check('base URL', self.base_url)
        self.target.check('approval URL', self.approval_url)
        if self.host:
            self.target.check('Host header', self.host)
        return self


def _iso_date(value):
    """argparse type: a `YYYY-MM-DD` day."""
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f'{value!r} is not a YYYY-MM-DD date') from error


def build_parser(environ):
    """Return the argument parser (local defaults come from the environment)."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--from', dest='from_date', type=_iso_date, required=True,
                        help='first local day of the range (YYYY-MM-DD, required)')
    parser.add_argument('--to', dest='to_date', type=_iso_date, required=True,
                        help='last local day of the range (YYYY-MM-DD, required)')
    parser.add_argument('--tz', default='UTC', help='time zone of --from / --to (default UTC)')
    parser.add_argument('--domain', default=None,
                        help='optional Domain id (or "unknown") to restrict the export to')
    parser.add_argument('--production', action='store_true',
                        help=f'analyse production: the base URL is {PROD_URL_VARIABLE} from the '
                             'environment (https), never an argument')
    parser.add_argument('--base-url', default=None,
                        help='proxy base URL (local only; default MAJORA_BASE_URL or '
                             f'{DEFAULT_BASE_URL})')
    parser.add_argument('--host', default=None,
                        help='Host header sent to the local proxy (local only)')
    parser.add_argument('--username', default=environ.get('MAJORA_USERNAME', ''),
                        help='staff username (or e-mail) that approves the request')
    parser.add_argument('--race-window', type=float, default=DEFAULT_RACE_WINDOW,
                        help='parallel-race window in seconds (default 2)')
    parser.add_argument('--validate', dest='validate_path', default=None, metavar='REPORT',
                        help="an emulate.py JSON report: validate against each scenario's window "
                             '(local only)')
    parser.add_argument('--reports-dir', default='reports')
    parser.add_argument('--anonymised', action='store_true',
                        help='also print an anonymised summary (masked IPs, aliased ids, no '
                             'paths) safe to paste into an issue or a PR')
    parser.add_argument('--dry-run', action='store_true',
                        help='validate the configuration only; send nothing')
    return parser


def parse_args(argv=None, environ=None):
    """Build the `Config` from arguments, then the environment, then local defaults."""
    environ = os.environ if environ is None else environ
    args = build_parser(environ).parse_args(argv)
    common = {
        'username': args.username, 'from_date': args.from_date, 'to_date': args.to_date,
        'tz': args.tz, 'domain': args.domain, 'race_window': args.race_window,
        'validate_path': args.validate_path, 'reports_dir': args.reports_dir,
        'dry_run': args.dry_run, 'anonymised': args.anonymised,
        'production': args.production,
    }
    if args.production:
        if args.validate_path:
            raise Refused('--validate runs against the local stack only; it cannot be combined '
                          'with --production.')
        if args.base_url or args.host:
            raise Refused(f'--production takes its URL from {PROD_URL_VARIABLE} only; '
                          '--base-url / --host are refused.')
        url = production_url(environ)
        return Config(
            base_url=url, host=None, approval_url=url + APPROVAL_FRAGMENT,
            target=Target.from_production_url(url), **common,
        ).validate()
    return Config(
        base_url=args.base_url or environ.get('MAJORA_BASE_URL') or DEFAULT_BASE_URL,
        host=args.host or environ.get('MAJORA_HOST') or DEFAULT_HOST,
        approval_url=environ.get('MAJORA_APPROVAL_URL') or DEFAULT_APPROVAL_URL,
        target=Target.local(), **common,
    ).validate()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def describe_dry_run(config, secrets):
    """Return the dry-run summary (never the production URL or any secret value)."""
    if config.production:
        return ('Dry run: production target; production URL present: yes. '
                'The skip secret is never sent to production. Nothing sent.')
    mode = 'validation' if config.validate_path else 'analysis'
    return (f'Dry run: local {mode}; every URL is local. '
            f'{Secrets.SKIP} present: {"yes" if secrets.available(Secrets.SKIP) else "no"}. '
            'Nothing sent.')


def authorize(config, secrets, out=sys.stdout):
    """Return `(client, reader)`: a client holding a `statistics:read` token in memory."""
    if not config.username:
        raise Refused('no staff username: pass --username or set MAJORA_USERNAME.')
    client = Client(config, secrets)
    client.set_token(DeviceAuthorization(client, config, out).obtain())
    return client, ExportReader(client, out)


@dataclass
class Dataset:
    """The fetched range: the analysed sessions, split at ID resets, and the self check."""

    sessions: list
    segments: list
    reset_warnings: list
    self_check: dict
    fetched: int
    skip_header_sent: bool = False


def fetch(config, reader, from_date=None, to_date=None, out=sys.stdout):
    """Read the range sequentially, drop the script's own sessions, split at ID resets."""
    from_date = from_date or config.from_date
    to_date = to_date or config.to_date
    print(f'Reading the export {from_date}..{to_date} (tz {config.tz})...', file=out, flush=True)
    rows = reader.sessions(from_date, to_date, config.tz, config.domain)
    kept, self_check = split_self_sessions(rows)
    segments, warnings = split_at_resets(kept, config.race_window)
    for warning in warnings:
        print(f'  warning: ID reset between segments {warning["segment_before"]} and '
              f'{warning["segment_after"]} (created_at went back '
              f'{warning["backwards_seconds"]:.0f}s); analysed separately', file=out, flush=True)
    return Dataset(sessions=kept, segments=segments, reset_warnings=warnings,
                   self_check=self_check, fetched=len(rows),
                   skip_header_sent=reader.client.skips_tracking)


def remind_revoke(config, out=sys.stdout):
    """Remind the user to revoke the token (the script never revokes it)."""
    print('\nReminder: revoke the "Device authorization" token from your account page '
          f'({"production" if config.production else "local"} API tokens); analyse.py does not '
          'revoke it.', file=out, flush=True)


def run(config, secrets, out=sys.stdout):
    """Authorize, fetch, analyse and report (or validate). Returns the exit code."""
    if config.validate_path:
        return run_validation(config, secrets, out)
    started = datetime.now(timezone.utc)
    _client, reader = authorize(config, secrets, out)
    # Everything is fetched and analysed before anything is written: a token rejected
    # mid-run raises AuthorizationFailed and no partial report exists.
    try:
        dataset = fetch(config, reader, out=out)
        analyse_and_report(config, started, dataset, out)
    finally:
        remind_revoke(config, out)
    return EXIT_OK


def analyse_and_report(config, started, dataset, out=sys.stdout):
    """Analyse `dataset`, print the counts (and the anonymised summary), write the reports."""
    analyses = analyse_segments(dataset.segments, config.race_window)
    report = build_report(config, started, dataset, analyses)
    summary = format_summary(report)
    print('\n' + summary, file=out, flush=True)
    anonymised = format_anonymised(report)
    if config.anonymised:
        print('\n' + anonymised, file=out, flush=True)
    text = '\n'.join([summary, format_details(report), '', anonymised])
    for path in write_reports(report, text, config.reports_dir):
        print(f'Report written: {path}', file=out, flush=True)
    return report


def main(argv=None, environ=None):
    """Entry point."""
    environ = os.environ if environ is None else environ
    try:
        config = parse_args(argv, environ)
        secrets = Secrets(environ)
        if config.dry_run:
            print(describe_dry_run(config, secrets))
            return EXIT_OK
        return run(config, secrets)
    except Refused as error:
        print(f'Refused: {error}', file=sys.stderr)
        return EXIT_REFUSED
    except AuthorizationFailed as error:
        print(f'Authorization or export failed: {error}. No report written.', file=sys.stderr)
        return EXIT_AUTH
    except (urllib.error.URLError, OSError) as error:
        print(f'Run failed (network): {error.__class__.__name__}. No report written.',
              file=sys.stderr)
        return EXIT_NETWORK


if __name__ == '__main__':
    sys.exit(main())
