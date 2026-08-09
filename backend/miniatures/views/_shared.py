"""Private helpers shared across miniatures view modules."""

NOT_FOUND_RESPONSE_DATA = {'errors': {'detail': ['not_found']}}


def skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it.

    Required on every miniatures endpoint since none of them are `AllowAny` -- see
    `docs/agents/access-control/principles.md`'s `X-Skip-Cache` rule.
    """
    response['X-Skip-Cache'] = 'true'
    return response
