"""Shared archiving helper for the GameDocumentPage mutation endpoints (issue #1129).

Every create/update/trim/bump-version endpoint archives a page's pre-save `(order, version,
content)` into `GameDocumentPageHistory` before applying any change to it — this keeps the
archiving logic in one place instead of duplicating it across the four mutating view modules.
"""

from ...models import GameDocumentPageHistory


def archive_page(page):
    """Write a `GameDocumentPageHistory` snapshot of `page`'s current pre-save state."""
    GameDocumentPageHistory.objects.create(
        game_document=page.game_document,
        order=page.order,
        version=page.version,
        content=page.content,
    )
