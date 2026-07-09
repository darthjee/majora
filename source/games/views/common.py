"""Shared helpers used across view modules (auth, validation, pagination, access)."""

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from ..paginator import Paginator

UNAUTHENTICATED_RESPONSE_DATA = {'errors': {'detail': ['authentication required']}}


def require_authenticated(request):
    """Return a 401 Response if `request.user` is missing/unauthenticated, else None."""
    if not request.user or not request.user.is_authenticated:
        return Response(UNAUTHENTICATED_RESPONSE_DATA, status=401)
    return None


def require_staff(request):
    """Return a 401/403 Response if `request.user` may not access staff endpoints, else None."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'errors': {'detail': ['not allowed']}}, status=403)
    return None


def validated_or_error(serializer):
    """Validate `serializer`; return a 400 `{'errors': ...}` Response on failure, else None."""
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)
    return None


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
        return None, Response({'errors': exc.detail}, status=400)


def detail_or_update(
    request, obj, permission_cls, update_serializer_cls, detail_serializer_cls, detail_context=None
):
    """Handle the shared GET-detail / PATCH-update pattern for a single object."""
    if request.method == 'PATCH':
        return _update(
            request, obj, permission_cls, update_serializer_cls, detail_serializer_cls,
            detail_context,
        )
    return _serialize_detail(obj, detail_serializer_cls, detail_context)


def _update(request, obj, permission_cls, update_serializer_cls, detail_serializer_cls,
            detail_context):
    """Validate permissions and payload, persist the update, then return the detail Response."""
    error_response = permission_cls.check(request, obj)
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


def access_response(serializer_cls, obj, request, context_extra=None):
    """Build the shared "access" Response: serialize `obj` and skip caching."""
    context = {'request': request}
    if context_extra:
        context.update(context_extra)
    serializer = serializer_cls(obj, context=context)
    response = Response(serializer.data)
    response['X-Skip-Cache'] = 'true'
    return response
