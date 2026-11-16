# 01 — Add TokenFactory

Add `games/tests/factories/token.py` with `TokenFactory`, a `factory.django.DjangoModelFactory`
for `rest_framework.authtoken.models.Token`:

- `user = factory.SubFactory(UserFactory)` (so an approved user by default).
- No `key` declaration: the model generates it on save, as `Token.objects.create` does today.
- A docstring in the style of the other factories.

Export it from `games/tests/factories/__init__.py` (import and `__all__`, alphabetical).

## Files to Change

- `backend/games/tests/factories/token.py` — new `TokenFactory`.
- `backend/games/tests/factories/__init__.py` — import and export it.
