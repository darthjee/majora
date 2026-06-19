# Contributing

## Commit Guidelines

- **Atomic and Unitary:** Each commit must represent a single logical change.
  *Example:*
  - Good: `Add slug generation to Game.save`
  - Bad: `Add slug generation and refactor serializers`
- **No Unrelated Changes:** Do not mix unrelated changes in the same commit.
- **Separate Refactoring:** Whenever possible, separate refactoring commits from new feature or bugfix commits.

## Pull Requests

- **Descriptive Summary:** Every PR must include a clear and descriptive summary of its purpose and changes.
- **PR Description Files:** If a description cannot be provided directly in the PR, generate a file with the PR description (e.g., `docs/agents/issues/<pr_number>_description.md`), but do not commit this file.

## Definition of Done for PRs

A PR is considered complete when:

- The stated objective has been achieved.
- All tests are passing.
- Linting passes without errors.
- Code coverage is as high as reasonably possible.
- Code is not overly complex:
  - Classes/modules and methods should have clear, focused responsibilities.
  - If a class or function is taking on too many responsibilities, refactor to simplify.
  - Functions and methods should be small and do exactly one thing. If one is growing, extract parts into private helper methods or separate classes.
  - *Example (Python):*
    ```python
    # Good: each method does one thing
    class GameImporter:
        def fetch_payload(self): ...
        def process_payload(self, payload): ...

    # Bad: method does too much
    class GameImporter:
        def run(self):
            payload = self.fetch_payload()
            self.process_payload(payload)
            self.send_metrics()
            self.cleanup()
    ```
  - This requirement applies primarily to source code. For specs/tests, refactor only if there is excessive duplication.

### CI Checks

Before a PR is considered complete, all CI checks relevant to the modified parts of the project must pass locally. CI is defined in `.circleci/config.yml`; the table below maps each top-level folder to its CircleCI job(s) and the equivalent local commands.

| Modified folder | CI job(s) | Local commands |
|------------------|-----------|-----------------|
| `source/` | `pytest`, `checks` | `cd source && poetry run pytest --cov` and `poetry run ruff check .` |
| `frontend/` | `jasmine`, `frontend-checks` | `cd frontend && npm run coverage` and `npm run lint` |
| `.circleci/`, `scripts/`, `dockerfiles/`, `docker-compose.yml`, `prod_proxy_config/` | `upload_proxy_files`, `upload_fe_files`, `link_photos`, `build-and-release`, `release`, `warm-up-cache` | No local equivalent — these run only on tagged releases. Verify changes by reading the job definitions in `.circleci/config.yml`. |

If a new top-level folder is added in the future, its corresponding test and check jobs must be added to `.circleci/config.yml` and to this table before merging changes to that folder.

This same process must be followed when **planning how to resolve an issue**: include a final step in the plan that identifies the affected folders and lists the CI commands to run before opening a PR.

## Code Organization

### Backend (`source/`)

- **Views are thin:** business logic belongs in models or serializers, not in `views/`.
- **One concern per module:** the `games` app already separates `models.py`, `serializers.py`, `views/`, `paginator.py` — keep new code in the module that matches its concern rather than growing one file.
- **Method order:** within a class, public methods should be declared before private/helper methods (prefixed with `_`).
  *Example:*
  ```python
  # Good: public methods first, private helpers last
  class GameSerializer:
      def to_representation(self, instance):
          return self._build_payload(instance)

      def _build_payload(self, instance): ...

  # Bad: private helpers mixed in with or before public methods
  class GameSerializer:
      def _build_payload(self, instance): ...

      def to_representation(self, instance): ...
  ```
- **File naming:** modules use `snake_case.py`; test files mirror the module under test with a `_test.py` suffix (e.g. `models_test.py`, `views_test.py`), following pytest-django convention already used in `source/games/tests/`.

### Frontend (`frontend/`)

- **Components are PascalCase:** one component per file, file name matches the component (e.g. `GameCard.jsx` for `function GameCard()`).
- **Specs mirror source:** `frontend/specs/` mirrors the structure of `frontend/assets/js/`, with `_spec.js` suffix (e.g. `GameCard_spec.js`).
- See [frontend.md](frontend.md) for the full component architecture and conventions.

## Dependency Injection

Classes and functions must receive their dependencies (data, configuration, collaborators) as constructor/function arguments rather than reaching out on their own to read environment variables, query the database directly inside a serializer, or import global state.

This makes code independently testable: tests instantiate the class or call the function with the data they need, without monkeypatching globals.

*Example (Python):*
```python
# Good: function receives the queryset, easy to test with any data
def serialize_games(games_queryset):
    return GameSerializer(games_queryset, many=True).data

# Bad: function reaches into the database itself
def serialize_games():
    games = Game.objects.all()  # not easy to test in isolation
    return GameSerializer(games, many=True).data
```

This principle applies to backend views/serializers and frontend components/hooks alike — if a unit needs data, it should receive it as a parameter or prop rather than fetching it implicitly.

## Refactoring Guidelines

When refactoring, aim to:

- **Reduce Code Duplication:**
  *Example:* Move repeated setup code in tests to a factory function/fixture.
  ```python
  # Good
  def build_game(**attrs):
      return Game(name="Curse of Strahd", **attrs)

  # In tests:
  game = build_game(name="Other Game")

  # Bad
  game = Game(name="Other Game")
  # ...repeated in many test files
  ```
- **Extract Shared Logic:** When the same logic appears in multiple views or serializers, extract it into a shared helper, model method, or mixin rather than duplicating it.
- **Keep Tests Readable:** Prefer clear, explicit test setup over clever abstractions that obscure what is being tested.
