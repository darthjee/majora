"""The distinct visitor counts of a set of visitor keys."""

from . import metrics

_KIND = 0
_ANONYMOUS_KIND = 'session'
_LOGGED_IN_KIND = 'user'


class VisitorCounts:
    """Counts distinct visitor keys: unique, new vs returning, and anonymous vs logged-in."""

    def __init__(self, keys, is_new):
        """Store the distinct visitor keys and the predicate telling new keys apart."""
        self._keys = set(keys)
        self._is_new = is_new

    def as_dict(self):
        """Return the `unique` / `new` / `returning` / `anonymous` / `logged_in` counts."""
        unique_visitors = metrics.unique(self._keys)
        new_visitors = self._count(self._is_new)
        return {
            'unique_visitors': unique_visitors,
            'new_visitors': new_visitors,
            'returning_visitors': unique_visitors - new_visitors,
            'anonymous': self._count_kind(_ANONYMOUS_KIND),
            'logged_in': self._count_kind(_LOGGED_IN_KIND),
        }

    def _count(self, predicate):
        """Return the number of keys matching `predicate`."""
        return metrics.count([key for key in self._keys if predicate(key)])

    def _count_kind(self, kind):
        """Return the number of keys of `kind` (`'session'` or `'user'`)."""
        return self._count(lambda key: key[_KIND] == kind)
