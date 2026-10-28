# Unique visitors count aggregation

Add `UniqueVisitorsCount(filters)` with a `count()` method returning the number of unique
visitors of the visits started in the window, as one SQL aggregate.

```python
VisitQuery(filters).queryset().aggregate(
    users=Count('session__user_id', distinct=True),
    anonymous=Count('session_id', distinct=True, filter=Q(session__user_id__isnull=True)),
)
```

It returns `users + anonymous`. This matches `VisitQuery.visitor_key`: a logged-in visitor is
keyed by user and an anonymous one by session, and the two namespaces never collide. No rows
are loaded into Python.

Unit tests cover:

- an empty window, which counts 0;
- one user with several sessions, counted once;
- several anonymous sessions, each counted once;
- a user id numerically equal to an anonymous session id, still counted as two visitors;
- visits outside `[start_utc, end_utc)`, which are excluded;
- `django_assert_num_queries(1)`.

## Files to Change

- `backend/statistics/aggregation/unique_visitors_count.py` — new `UniqueVisitorsCount`.
- `backend/statistics/aggregation/__init__.py` — export it and mention it in the docstring.
- `backend/statistics/tests/aggregation/unique_visitors_count_test.py` — new tests.
