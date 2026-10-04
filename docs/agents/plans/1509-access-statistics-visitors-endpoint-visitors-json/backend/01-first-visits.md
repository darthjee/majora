# Add FirstVisits lookup
Create `backend/statistics/aggregation/first_visits.py` with `class FirstVisits`. The constructor is `FirstVisits(user_ids, anonymous_session_ids)`, the same inputs as `ReturningVisitors`. `as_dict()` (or `build()`) returns `{visitor_key: first_started_at}`, where keys come from `VisitQuery.visitor_key`.

It makes two queries:
- **Users:** `Visit.objects.filter(session__user_id__in=user_ids).values('session__user_id').annotate(first=Min('started_at'))`, keyed `('user', id)`.
- **Anonymous sessions:** `Visit.objects.filter(session_id__in=ids, session__user__isnull=True).values('session_id').annotate(first=Min('started_at'))`, keyed `('session', id)`.

The class ignores the range and the domain / audience filters, and skips each query when its id set is empty.

Export it from `statistics/aggregation/__init__.py` if that fits the existing convention (`ReturningVisitors` is not exported, so importing from the module directly is fine too).

Tests in `backend/statistics/tests/aggregation/first_visits_test.py`:
- Users get the minimum `started_at` across all sessions and domains, including visits before any range.
- Anonymous sessions only.
- A logged-in session id passed as anonymous is not returned.
- Empty inputs make no query (`django_assert_num_queries(0)`), and one set empty makes one query.
- Unknown ids are absent from the result.

## Files to Change
- `backend/statistics/aggregation/first_visits.py`: new class.
- `backend/statistics/aggregation/__init__.py`: optional export.
- `backend/statistics/tests/aggregation/first_visits_test.py`: new tests.
