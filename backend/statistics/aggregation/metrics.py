"""Pure metric helpers over plain lists (no DB).

Never `import statistics` here: this app's name shadows the stdlib module.
"""

from bisect import bisect_right


def count(values):
    """Return the number of values."""
    return len(values)


def unique(keys):
    """Return the number of distinct keys (e.g. visitor keys)."""
    return len(set(keys))


def average(values):
    """Return the arithmetic mean, or `None` on empty input."""
    if not values:
        return None
    return sum(values) / len(values)


def median(values):
    """Return the median (mean of the two middle values when even), or `None` on empty input."""
    if not values:
        return None
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def histogram(values, edges):
    """Return `[{'lower', 'upper', 'count'}]` bins for ascending `edges`; the last is open."""
    counts = [0] * len(edges)
    for value in values:
        counts[_bin_index(value, edges)] += 1
    return [_bin(edges, index, total) for index, total in enumerate(counts)]


def _bin_index(value, edges):
    """Return the bin of `value`; values below the first edge fall in the first bin."""
    return max(bisect_right(edges, value) - 1, 0)


def _bin(edges, index, total):
    """Return the serialized bin at `index`, with `upper=None` for the last one."""
    upper = edges[index + 1] if index + 1 < len(edges) else None
    return {'lower': edges[index], 'upper': upper, 'count': total}
