"""Reusable paginator for queryset-based API views."""

import math

from .settings import Settings


class Paginator:
    """Paginates a queryset based on query params from the request."""

    def __init__(self, request, queryset):
        """Initialise with the incoming request and the full queryset."""
        self.request = request
        self.queryset = queryset

    def paginate(self):
        """Return (page_queryset, headers_dict) for the current page."""
        start, end = self._slice_bounds()
        return self.queryset[start:end], self._headers()

    def _request_page(self):
        """Return the raw page query param string from the request."""
        return self.request.GET.get('page')

    def _page(self):
        """Return the current page number, defaulting to 1."""
        return self._parse_int(self._request_page(), default=1)

    def _request_per_page(self):
        """Return the raw per_page query param string from the request."""
        return self.request.GET.get('per_page')

    def _per_page(self):
        """Return the page size, defaulting to Settings.pagination_size."""
        return self._parse_int(self._request_per_page(), default=Settings.pagination_size())

    def _total(self):
        """Return the total item count, memoizing the result after the first call."""
        if not hasattr(self, '_total_cache'):
            self._total_cache = self.queryset.count()
        return self._total_cache

    def _pages(self):
        """Return the total number of pages, memoizing the result."""
        if not hasattr(self, '_pages_cache'):
            if self._per_page() <= 0:
                self._pages_cache = 1
            else:
                self._pages_cache = max(1, math.ceil(self._total() / self._per_page()))
        return self._pages_cache

    def _slice_bounds(self):
        """Return (start, end) indices for the current page slice."""
        start = (self._page() - 1) * self._per_page()
        end = start + self._per_page()
        return start, end

    def _headers(self):
        """Build the pagination response headers dict."""
        return {
            'page': self._page(),
            'pages': self._pages(),
            'per_page': self._per_page(),
            'total': self._total(),
        }

    @staticmethod
    def _parse_int(value, default):
        """Parse *value* as a positive integer, falling back to *default*."""
        try:
            parsed = int(value)
            return parsed if parsed > 0 else default
        except (ValueError, TypeError):
            return default
