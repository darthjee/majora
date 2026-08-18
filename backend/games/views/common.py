"""Shared helpers used across view modules (auth, validation, pagination, access)."""

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from common.auth_checks import unauthenticated_response
from permissions import EndpointPermission

from ..caches import AdminOrStaffCache
from ..paginator import Paginator
from ..serializers import HiddenFieldSerializer


def _error_codes(errors):
    """Recursively replace ErrorDetail messages with their `.code`, preserving structure."""
    if isinstance(errors, dict):
        return {key: _error_codes(value) for key, value in errors.items()}
    if isinstance(errors, list):
        return [_error_codes(item) for item in errors]
    return getattr(errors, 'code', errors)


def check_game_edit(request, game):
    """Return an error Response if `request.user` may not edit `game`, else None.

    Shared by the many DM/superuser-only (`game`/`restricted`/`edit`) endpoints scoped to a
    whole game (items/documents/treasures catalogs, photo uploads, etc).
    """
    return EndpointPermission(request.user, game=game).check(
        request, 'game', 'restricted', 'edit',
    )


def require_authenticated(request):
    """Return a 401 Response if `request.user` is missing/unauthenticated, else None."""
    return unauthenticated_response(request)


def require_staff(request):
    """Return a 401/403 Response if `request.user` may not access staff endpoints, else None."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response
    if not AdminOrStaffCache.is_admin_or_staff(request.user):
        return Response({'errors': {'detail': ['not_allowed']}}, status=403)
    return None


def validated_or_error(serializer):
    """Validate `serializer`; return a 400 `{'errors': ...}` Response on failure, else None."""
    if not serializer.is_valid():
        return Response({'errors': _error_codes(serializer.errors)}, status=400)
    return None


def validate_with_hidden_field(serializer, data):
    """Validate `serializer` and a companion `HiddenFieldSerializer(data=data)` together.

    Returns a `(hidden_serializer, error_response)` tuple: `error_response` is `None` only
    when both `serializer` and the returned `hidden_serializer` are valid, in which case
    `hidden_serializer.validated_data` holds the optional `hidden` field, alongside
    `serializer.validated_data`.
    """
    error_response = validated_or_error(serializer)
    if error_response:
        return None, error_response

    hidden_serializer = HiddenFieldSerializer(data=data)
    error_response = validated_or_error(hidden_serializer)
    if error_response:
        return None, error_response

    return hidden_serializer, None


def save_or_error(serializer, **kwargs):
    """Save `serializer`, catching a save-time `ValidationError`.

    Some serializers (e.g. `CharacterUpdateSerializer`/`CharacterCreateSerializer`, syncing
    their nested `links`) can only detect certain errors inside `save()`, after `is_valid()`
    already passed. Returns a `(instance, error_response)` tuple; `error_response` is `None`
    on success, in which case `instance` is the saved object. On failure, `instance` is `None`
    and `error_response` is a 400 `{'errors': ...}` Response, consistent with `validated_or_error`.
    """
    try:
        return serializer.save(**kwargs), None
    except ValidationError as exc:
        return None, Response({'errors': _error_codes(exc.detail)}, status=400)


def detail_or_update(
    request, obj, permission_check, update_serializer_cls, detail_serializer_cls,
    detail_context=None,
):
    """Handle the shared GET-detail / PATCH-update pattern for a single object.

    `permission_check` is a callable `(request, obj) -> Response|None` (e.g.
    `EndpointPermission(...).check`), returning an error Response when the PATCH is not
    authorized, else `None`.
    """
    if request.method == 'PATCH':
        return _update(
            request, obj, permission_check, update_serializer_cls, detail_serializer_cls,
            detail_context,
        )
    return _serialize_detail(obj, detail_serializer_cls, detail_context)


def _update(request, obj, permission_check, update_serializer_cls, detail_serializer_cls,
            detail_context):
    """Validate permissions and payload, persist the update, then return the detail Response."""
    error_response = permission_check(request, obj)
    if error_response:
        return error_response

    serializer = update_serializer_cls(obj, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    _, error_response = save_or_error(serializer)
    if error_response:
        return error_response
    return _serialize_detail(obj, detail_serializer_cls, detail_context)


def _serialize_detail(obj, detail_serializer_cls, detail_context):
    """Serialize `obj` with `detail_serializer_cls`, honoring an optional context."""
    if detail_context is None:
        serializer = detail_serializer_cls(obj)
    else:
        serializer = detail_serializer_cls(obj, context=detail_context)
    return Response(serializer.data)


def paginated_list_response(request, queryset, list_serializer_cls, context=None):
    """Paginate `queryset`, serialize it with `list_serializer_cls`, and return a Response.

    `context`, when given, is forwarded to the serializer constructor.
    """
    page, headers = Paginator(request, queryset).paginate()
    if context is None:
        serializer = list_serializer_cls(page, many=True)
    else:
        serializer = list_serializer_cls(page, many=True, context=context)
    return Response(serializer.data, headers=headers)


def hidden_gate_response(entity, owner, request):
    """Return a 404 Response (with X-Skip-Cache) if `entity` is hidden and `owner` isn't editable.

    Shared by any path-scoped entity that must 404 (rather than reveal via a permission-denied
    response) when hidden to a requester who cannot edit `owner` — e.g. a `Character` gating on
    itself, or a `GameTreasure` gating on its `Game`.
    """
    is_hidden = entity is not None and entity.hidden
    if is_hidden and not owner.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None


def access_response(serializer_cls, obj, request, context_extra=None):
    """Build the shared "access" Response: serialize `obj` and skip caching."""
    context = {'request': request}
    if context_extra:
        context.update(context_extra)
    serializer = serializer_cls(obj, context=context)
    response = Response(serializer.data)
    response['X-Skip-Cache'] = 'true'
    return response


def parse_role_booleans(request):
    """Parse the `role` query param(s) into simulated-identity booleans.

    Reads `request.query_params.getlist('role')`, handling both `?role=dm` and repeated
    `?role=dm&role=player`. Recognizes `dm`, `player`, `owner`, `superuser`, `staff`, `logged`;
    each influences some `can_be_edited_by_roles`-shaped computation (`staff` first became
    meaningful via `UIPermission`'s role-simulated `?role=` path, issue #714;
    `player` via the same path, issue #864) — unrecognized values are
    tolerated with no 400, same convention already used by `?public_allegiance=`/
    `?public_slain=` elsewhere in this codebase. Always returns a full booleans dict, every key
    defaulting to `False` when its role isn't present (including when no `role` param was sent
    at all) — `permissions.json` is a pure function of the query string in every case.
    """
    roles = request.query_params.getlist('role')
    return {
        'is_superuser': 'superuser' in roles,
        'is_dm': 'dm' in roles,
        'is_owner': 'owner' in roles,
        'is_staff': 'staff' in roles,
        'is_player': 'player' in roles,
        'is_logged': 'logged' in roles,
    }


def permissions_response(serializer_cls, obj, request, role_booleans, context_extra=None):
    """Build the shared "permissions" Response: serialize `obj`, honoring the cache contract.

    The result is identity-independent and cacheable regardless of the real caller's own auth
    state. Callers of this helper live under the `/permissions/` path prefix, which
    `CacheControlMiddleware` recognizes to force the public/anonymous cache tier even when the
    real requester happens to be authenticated — no per-response header is needed here.
    """
    context = {'request': request, 'roles': role_booleans}
    if context_extra:
        context.update(context_extra)
    serializer = serializer_cls(obj, context=context)
    return Response(serializer.data)
