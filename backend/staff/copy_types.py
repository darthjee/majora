"""Registry of the content types managed by the staff copies API.

Every copyable game-content type has one ordered `CopyType` entry here, declaring its URL slug
and the model the dispatch uses to look up a copy source. The registry order is the `types`
order of `GET /staff/copies.json` (the tab order of the copy page).

The registry ships empty: each tab issue inserts its entry at the position the spec's tab table
gives (`items`, `common_items`, `recipes`, `documents`, `factions`, `possessions`), whatever
order the tabs are merged in. `games` and `links` are reserved: they are fixed URLs under
`staff/copies/`, so no copy type may use those slugs. This module is free of view/HTTP concerns.
"""


class CopyType:
    """One copyable content type: its URL slug, its model, and its list/copy behavior."""

    def __init__(self, slug, model):
        """Store the copy type's URL slug and the model its sources are looked up in."""
        self.slug = slug
        self.model = model

    def find_source(self, source_id):
        """Return the source row with `source_id` (its `game` selected), or None."""
        return self.model.objects.select_related('game').filter(pk=source_id).first()

    def list(self, request, from_game, to_game):
        """Return the tab's paginated `Response` of `from_game`'s entities."""
        raise NotImplementedError

    def copy(self, request, source, target_game):
        """Copy `source` into `target_game` and return the `Response`."""
        raise NotImplementedError


COPY_TYPES = ()

RESERVED_SLUGS = frozenset({'games', 'links'})

_BY_SLUG = {copy_type.slug: copy_type for copy_type in COPY_TYPES}


def find(slug):
    """Return the registry entry for `slug`, or None when it is not a registered copy type."""
    return _BY_SLUG.get(slug)


def slugs():
    """Return the ordered list of copy-type slugs."""
    return [copy_type.slug for copy_type in COPY_TYPES]
