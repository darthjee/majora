"""Tests for `statistics.aggregation.visitor_counts.VisitorCounts`."""

from statistics.aggregation.visitor_counts import VisitorCounts


class TestVisitorCounts:
    """Tests for `VisitorCounts.as_dict()`."""

    def test_counts_distinct_keys_by_kind_and_newness(self):
        """Test the distinct, new / returning and anonymous / logged-in counts."""
        keys = [('user', 1), ('user', 1), ('session', 7), ('session', 8)]
        counts = VisitorCounts(keys, lambda key: key == ('session', 7)).as_dict()
        assert counts == {
            'unique_visitors': 3,
            'new_visitors': 1,
            'returning_visitors': 2,
            'anonymous': 2,
            'logged_in': 1,
        }

    def test_empty(self):
        """Test that no keys yield zeros."""
        assert VisitorCounts([], lambda key: True).as_dict() == {
            'unique_visitors': 0,
            'new_visitors': 0,
            'returning_visitors': 0,
            'anonymous': 0,
            'logged_in': 0,
        }
