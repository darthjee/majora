"""View for the public per-domain-group branding configuration endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from domains.models import Domain

DEFAULT_TITLE = 'Majora'
DEFAULT_SUB_TITLE = 'RPG'


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def config(request):
    """Return the requesting host's DomainGroup branding config, defaulting when unset.

    An unrecognized host, or a recognized DomainGroup with no DomainConfiguration row, both
    fall through to the same all-defaults response — never a 404. Cacheable: unlike
    `accounts`' `header_status`, this response isn't wrapped in `skip_cache`.
    """
    host = request.get_host().split(':')[0].lower()
    domain = Domain.objects.filter(domain=host).first()
    domain_configuration = _resolve_configuration(domain)
    return Response(_merge_with_defaults(domain_configuration))


def _resolve_configuration(domain):
    """Return domain's DomainGroup's DomainConfiguration, or None if either is missing."""
    return getattr(domain.domain_group, 'configuration', None) if domain else None


def _merge_with_defaults(domain_configuration):
    """Merge domain_configuration's fields over their effective defaults."""
    return {
        'favicon': domain_configuration.favicon if domain_configuration else None,
        'title': _field_or_default(domain_configuration, 'title', DEFAULT_TITLE),
        'sub_title': _field_or_default(domain_configuration, 'sub_title', DEFAULT_SUB_TITLE),
    }


def _field_or_default(domain_configuration, field, default):
    """Return domain_configuration's field value, falling back to default when unset."""
    value = getattr(domain_configuration, field, None) if domain_configuration else None
    return value if value is not None else default
