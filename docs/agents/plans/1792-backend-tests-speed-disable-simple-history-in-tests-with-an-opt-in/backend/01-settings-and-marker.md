# Step 1: settings flag, marker and fixture

## 1.1 Confirm the library switch

Inside the `majora_tests` container, confirm how 3.13.0 decides whether to record:

```bash
docker-compose run --rm majora_tests sh -c 'grep -rn "SIMPLE_HISTORY_ENABLED\|def disable_history" \
  $(python -c "import simple_history,os;print(os.path.dirname(simple_history.__file__))")'
```

Expected: `HistoricalRecords.post_save` / `post_delete` read
`getattr(settings, "SIMPLE_HISTORY_ENABLED", True)` at signal time, so `override_settings`
works per test. If 3.13.0 reads it differently (for example cached at import), use the library's
own context manager (`simple_history.utils.disable_history`) instead, still without patching models.

## 1.2 Test settings

In `backend/majora_project/settings_test.py`, add with a comment pointing at #1792:

```python
SIMPLE_HISTORY_ENABLED = False
```

`settings.py` does not define it (the library default is `True`).

## 1.3 Register the marker

In `backend/pyproject.toml` under `[tool.pytest.ini_options]`:

```toml
markers = [
    "history: record django-simple-history rows for this test (off by default in tests, #1792)",
]
```

## 1.4 Autouse fixture

In `backend/conftest.py`, next to `clear_memory_cache`:

```python
@pytest.fixture(autouse=True)
def simple_history_recording(request):
    """Enable simple_history only for tests marked ``@pytest.mark.history`` (#1792)."""
    if request.node.get_closest_marker('history') is None:
        yield
        return
    from django.test import override_settings

    with override_settings(SIMPLE_HISTORY_ENABLED=True):
        yield
```

`get_closest_marker` sees class-level markers, so it works on pytest classes and on
`unittest.TestCase` subclasses (pytest still runs autouse fixtures for them). `override_settings`
restores the value on exit, so nothing leaks into the next test.

## 1.5 Mechanism tests

New `backend/common/tests/history_settings_test.py` (`@pytest.mark.django_db` where it saves):

- `settings.SIMPLE_HISTORY_ENABLED is False` under the test settings, and saving a versioned
  model (for example via `GameFactory`) adds no history row.
- With `@pytest.mark.history`, saving adds one history row.
- A test that runs right after a marked one (same class, defined after it) sees recording off again.
- A `TestCase` subclass marked `@pytest.mark.history` records history (covers the unittest path).
- The production settings module does not disable it: import `majora_project.settings` and assert
  `getattr(module, 'SIMPLE_HISTORY_ENABLED', True) is True`.
