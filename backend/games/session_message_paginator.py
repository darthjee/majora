"""Cursor-style paginator for session messages, keyed by NEXT-ENTRY-ID."""

PAGE_SIZE = 20


class SessionMessagePaginator:
    """Paginates a GameSessionMessage queryset using an id cursor."""

    def __init__(self, request, queryset):
        """Initialise with the incoming request and the full (already-ordered) queryset."""
        self.request = request
        self.queryset = queryset

    def paginate(self):
        """Return (page, headers) for the current page."""
        queryset = self.queryset
        cursor = self._next_entry_id()
        if cursor is not None:
            queryset = queryset.filter(id__lte=cursor)
        page = list(queryset[:PAGE_SIZE])
        return page, self._headers(page)

    def _next_entry_id(self):
        """Return the `next-entry-id` query param as an int, or None if absent/invalid."""
        raw = self.request.GET.get('next-entry-id')
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def _headers(self, page):
        """Build the NEXT-ENTRY-ID header: the oldest message's id, or '' if none remain."""
        if not page or not self._has_more(page[-1]):
            return {'NEXT-ENTRY-ID': ''}
        return {'NEXT-ENTRY-ID': str(page[-1].id)}

    def _has_more(self, last_item):
        """Return whether messages older than `last_item` still exist."""
        return self.queryset.filter(id__lt=last_item.id).exists()
