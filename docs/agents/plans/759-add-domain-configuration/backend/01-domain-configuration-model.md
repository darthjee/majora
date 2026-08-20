# `DomainConfiguration` model

Add a new model to `backend/domains/models.py`, one configuration per `DomainGroup`:

```python
class DomainConfiguration(models.Model):
    domain_group = models.OneToOneField(
        DomainGroup, on_delete=models.CASCADE, related_name='configuration'
    )
    favicon = models.CharField(max_length=200, null=True, blank=True, default=None)
    title = models.CharField(max_length=200, null=True, blank=True, default=None)
    sub_title = models.CharField(max_length=200, null=True, blank=True, default=None)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)
```

`null=True` on the `CharField`s is intentional (deviates from the usual `blank=''`-only convention in this codebase) — it's required to distinguish "no override, use default" (`null`) from "explicitly blank" (`""`) from "explicit value," per the issue's merge semantics. The three attributes' effective defaults (`null` for favicon, `"Majora"`/`"RPG"` for title/sub_title) belong in the endpoint's merge logic (step 03), not on the model.

Register `DomainConfiguration` in `backend/domains/admin.py` alongside the existing `Domain`/`DomainGroup` registrations.

Generate and run the schema migration (`python manage.py makemigrations domains`).

## Files to Change

- `backend/domains/models.py` — add `DomainConfiguration`
- `backend/domains/admin.py` — register `DomainConfiguration`
- `backend/domains/migrations/000X_domainconfiguration.py` — generated schema migration
