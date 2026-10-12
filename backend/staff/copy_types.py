"""Registry of the content types managed by the staff copies API.

Every copyable game-content type has one ordered `CopyType` entry here, declaring its URL slug
and the model the dispatch uses to look up a copy source. The registry order is the `types`
order of `GET /staff/copies.json` (the tab order of the copy page).

Each tab issue inserts its entry at the position the spec's tab table gives (`items`,
`common_items`, `recipes`, `documents`, `factions`, `possessions`), whatever order the tabs are
merged in. `games` and `links` are reserved: they are fixed URLs under `staff/copies/`, so no
copy type may use those slugs. The shared list/copy behavior lives in `staff.copy_type_base`.
This module is free of view/HTTP concerns.
"""

from .copy_type_base import CopyType, ModelCopyType
from .copy_types_common_items import CommonItemsCopyType
from .copy_types_documents import DocumentsCopyType
from .copy_types_factions import FactionsCopyType
from .copy_types_items import ItemsCopyType
from .copy_types_possessions import PossessionsCopyType
from .copy_types_recipes import RecipesCopyType

__all__ = ['COPY_TYPES', 'RESERVED_SLUGS', 'CopyType', 'ModelCopyType', 'find', 'slugs']

COPY_TYPES = (
    ItemsCopyType(),
    CommonItemsCopyType(),
    RecipesCopyType(),
    DocumentsCopyType(),
    FactionsCopyType(),
    PossessionsCopyType(),
)

RESERVED_SLUGS = frozenset({'games', 'links'})

_BY_SLUG = {copy_type.slug: copy_type for copy_type in COPY_TYPES}


def find(slug):
    """Return the registry entry for `slug`, or None when it is not a registered copy type."""
    return _BY_SLUG.get(slug)


def slugs():
    """Return the ordered list of copy-type slugs."""
    return [copy_type.slug for copy_type in COPY_TYPES]
