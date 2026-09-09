"""Per-`type` entry-count summary of the CrawlerDebugEmission debug-harness table."""

from django.db.models import Count

from .models import CrawlerDebugEmission


class CrawlerDebugEmissionSummary:
    """Builds the `{type: count}` summary of recorded crawler debug emissions."""

    def as_dict(self):
        """Return a dict mapping each distinct `type` to its row count (``{}`` when empty)."""
        rows = (
            CrawlerDebugEmission.objects
            .values('type')
            .order_by()  # drop Meta.ordering=['id'] so it isn't added to GROUP BY
            .annotate(count=Count('id'))
        )
        return {row['type']: row['count'] for row in rows}
