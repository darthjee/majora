"""Cursor-style paginator for `CrawlerDebugEmission`, keyed by an ascending `id` cursor.

Deliberately its own class rather than a reuse of `games.paginator.Paginator` (page/per-page,
`.count()`-oriented) or `games.session_message_paginator.SessionMessagePaginator` (a `<=`
backward cursor) — this harness's `last_id` contract walks *forward*, oldest-first, per
`docs/agents/specs/crawler-test-harness.md`.
"""

PAGE_SIZE = 50
RETENTION_CAP = 200


class CrawlerDebugEmissionPaginator:
    """Paginates a `CrawlerDebugEmission` queryset forward from an optional `last_id` cursor."""

    def __init__(self, request, queryset):
        """Initialise with the incoming request and the full (already `id`-ordered) queryset."""
        self.request = request
        self.queryset = queryset

    def paginate(self):
        """Return the next page (a plain list), oldest-first, capped to `PAGE_SIZE`.

        Rows with `id > last_id` (or from the very start when `last_id` is absent). Raises
        `ValueError` if `last_id` is present but not parseable as an int, so the view can turn
        that into a `400` response.
        """
        queryset = self.queryset
        last_id = self._last_id()
        if last_id is not None:
            queryset = queryset.filter(id__gt=last_id)
        return list(queryset[:PAGE_SIZE])

    def _last_id(self):
        """Return the `last_id` query param as an int, or None if absent.

        Raises `ValueError` if `last_id` is present but not parseable as an int.
        """
        raw = self.request.GET.get('last_id')
        if raw is None:
            return None
        return int(raw)


def enforce_retention_cap(queryset, cap=RETENTION_CAP):
    """Delete the oldest rows of `queryset` beyond the newest `cap`, in one query.

    Runs on insert (not on read), keeping the "bounded log" spirit of a ring buffer despite
    being DB-backed. `queryset` should be the model's full (unfiltered) manager/queryset.
    """
    surviving_ids = queryset.order_by('-id').values_list('id', flat=True)[:cap]
    cutoff_id = min(surviving_ids, default=None)
    if cutoff_id is not None:
        queryset.filter(id__lt=cutoff_id).delete()
