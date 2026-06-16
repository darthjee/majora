"""Reusable paginator for queryset-based API views."""

import math

from .settings import Settings


class Paginator:
    """Paginates a queryset based on query params from the request."""

    def __init__(self, request, queryset):
        """Initialise with the incoming request and the full queryset."""
        self.request = request
        self.queryset = queryset

    def request_page(self):
        """Return the raw page query param string from the request."""
        return self.request.GET.get('page')

    def page(self):
        """Return the current page number, defaulting to 1."""
        return self._parse_int(self.request_page(), default=1)

    def request_per_page(self):
        """Return the raw per_page query param string from the request."""
        return self.request.GET.get('per_page')

    def per_page(self):
        """Return the page size, defaulting to Settings.pagination_size."""
        return self._parse_int(self.request_per_page(), default=Settings.pagination_size())

    def total(self):
        """Return the total item count, memoizing the result after the first call."""
        if not hasattr(self, '_total'):
            self._total = self.queryset.count()
        return self._total

    def pages(self):
        """Return the total number of pages, memoizing the result."""
        if not hasattr(self, '_pages'):
            if self.per_page() <= 0:
                self._pages = 1
            else:
                self._pages = max(1, math.ceil(self.total() / self.per_page()))
        return self._pages

    def paginate(self):
        """Return (page_queryset, headers_dict) for the current page."""
        start, end = self._slice_bounds()
        return self.queryset[start:end], self._headers()

    def _slice_bounds(self):
        """Return (start, end) indices for the current page slice."""
        start = (self.page() - 1) * self.per_page()
        end = start + self.per_page()
        return start, end

    def _headers(self):
        """Build the pagination response headers dict."""
        return {
            'page': self.page(),
            'pages': self.pages(),
            'per_page': self.per_page(),
            'total': self.total(),
        }

    @staticmethod
    def _parse_int(value, default):
        """Parse *value* as a positive integer, falling back to *default*."""
        try:
            parsed = int(value)
            return parsed if parsed > 0 else default
        except (ValueError, TypeError):
            return default
