"""Reusable paginator for queryset-based API views."""

import math

from .settings import Settings


class Paginator:
    """Paginates a queryset based on query params from the request."""

    def __init__(self, request, queryset):
        """Initialise with the incoming request and the full queryset."""
        self.request = request
        self.queryset = queryset.order_by('id')

    def page(self):
        """Return the current page number parsed from the request, defaulting to 1."""
        return self._parse_int(self.request.GET.get('page'), default=1)

    def per_page(self):
        """Return the page size parsed from the request, defaulting to Settings.pagination_size."""
        return self._parse_int(
            self.request.GET.get('per_page'),
            default=Settings.pagination_size(),
        )

    def paginate(self):
        """Return (page_queryset, headers_dict) for the current page."""
        total = self.queryset.count()
        pages = self._total_pages(total)
        start, end = self._slice_bounds()
        return self.queryset[start:end], self._headers(total, pages)

    def _total_pages(self, total):
        """Return the total number of pages for *total* items."""
        if self.per_page() <= 0:
            return 1
        return max(1, math.ceil(total / self.per_page()))

    def _slice_bounds(self):
        """Return (start, end) indices for the current page slice."""
        start = (self.page() - 1) * self.per_page()
        end = start + self.per_page()
        return start, end

    def _headers(self, total, pages):
        """Build the pagination response headers dict."""
        return {
            'page': self.page(),
            'pages': pages,
            'per_page': self.per_page(),
            'total': total,
        }

    @staticmethod
    def _parse_int(value, default):
        """Parse *value* as a positive integer, falling back to *default*."""
        try:
            parsed = int(value)
            return parsed if parsed > 0 else default
        except (ValueError, TypeError):
            return default
