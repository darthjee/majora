"""Check the backend test files against the test isolation policy.

Epic #1785 (backend tests speed) moves shared-state handling into the root
``conftest.py``. This script parses every test file with ``ast`` and reports the
patterns the policy forbids, so they cannot come back unnoticed. Every ``.py`` file under
the pytest ``testpaths`` is scanned (test files, conftests and helper modules), plus the root
``conftest.py``.

A violation can be allowed on a single line with a comment such as
``# test-policy: allow memory-cache-clear``; allowed lines are listed as opt-outs.

Two more rules: ``transaction-justification`` requires every transactional test
(``TransactionTestCase`` or ``django_db(transaction=True)``) to have a
``# transactional: <reason>`` comment directly above it, and ``scoped-db-fixture`` forbids
class/module/package/session fixtures that use ``django_db_blocker`` (their database writes are
not rolled back).

Exit codes: ``0`` clean (opt-outs are only printed), ``1`` violations, ``2``
configuration error. Output lines look like ``path:line: rule-id: message``.

It uses the standard library only.

Usage (inside CI or the ``majora_tests`` container, never on the host), from the
backend root::

    poetry run python bin/check_test_policy.py
"""

import ast
import io
import re
import sys
import tokenize
import tomllib
from pathlib import Path
from typing import NamedTuple

ROOT_CONFTEST = Path("conftest.py")
OPT_OUT_PATTERN = re.compile(r"#\s*test-policy:\s*allow\s+([\w\-,\s]+)")


class Violation(NamedTuple):
    """A policy violation found in a file."""

    path: str
    line: int
    rule: str
    message: str


def load_testpaths(pyproject):
    """Return the pytest ``testpaths`` from ``pyproject``, or ``None`` if missing."""
    try:
        with open(pyproject, "rb") as handle:
            data = tomllib.load(handle)
    except (OSError, tomllib.TOMLDecodeError):
        return None
    return data.get("tool", {}).get("pytest", {}).get("ini_options", {}).get("testpaths")


def iter_test_files(testpaths):
    """Return the sorted ``.py`` files under ``testpaths`` plus the root conftest."""
    files = {ROOT_CONFTEST} if ROOT_CONFTEST.exists() else set()
    for testpath in testpaths:
        base = Path(testpath)
        files.update(base.rglob("*.py"))
    return sorted(files)


def opt_outs(source):
    """Map line numbers to the set of rule ids allowed on that line."""
    allowed = {}
    try:
        tokens = list(tokenize.generate_tokens(io.StringIO(source).readline))
    except (tokenize.TokenError, SyntaxError):
        return allowed
    for token in tokens:
        match = OPT_OUT_PATTERN.search(token.string) if token.type == tokenize.COMMENT else None
        if match:
            rules = {rule.strip() for rule in match.group(1).split(",") if rule.strip()}
            allowed.setdefault(token.start[0], set()).update(rules)
    return allowed


def _ends_in_memory_cache(node):
    """Return whether ``node`` is ``memory_cache`` or an attribute chain ending in it."""
    if isinstance(node, ast.Name):
        return node.id == "memory_cache"
    return isinstance(node, ast.Attribute) and node.attr == "memory_cache"


def _is_memory_cache_clear(node):
    """Return whether ``node`` is a call to ``memory_cache.clear()``."""
    return (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "clear"
        and _ends_in_memory_cache(node.func.value)
    )


def memory_cache_clear_rule(tree, path):
    """Flag manual ``memory_cache.clear()`` calls; the autouse fixture clears it per test."""
    if Path(path) == ROOT_CONFTEST:
        return []
    message = "memory_cache.clear() is done by the autouse fixture in conftest.py"
    return [
        Violation(str(path), node.lineno, "memory-cache-clear", message)
        for node in ast.walk(tree)
        if _is_memory_cache_clear(node)
    ]


def _is_token_objects_create(node):
    """Return whether ``node`` is a call to ``Token.objects.create(...)``."""
    func = node.func if isinstance(node, ast.Call) else None
    manager = func.value if isinstance(func, ast.Attribute) and func.attr == "create" else None
    is_objects = isinstance(manager, ast.Attribute) and manager.attr == "objects"
    owner = manager.value if is_objects else None
    return isinstance(owner, ast.Name) and owner.id == "Token"


def token_create_rule(tree, path):
    """Flag ``Token.objects.create(...)`` calls; tests build tokens with ``TokenFactory``."""
    message = "use TokenFactory instead of Token.objects.create"
    return [
        Violation(str(path), node.lineno, "token-create", message)
        for node in ast.walk(tree)
        if _is_token_objects_create(node)
    ]


TRANSACTIONAL_COMMENT = re.compile(r"^#\s*transactional:\s*\S")
WIDE_SCOPES = {"class", "module", "package", "session"}


def _is_transaction_test_case_base(base):
    """Return whether ``base`` is ``TransactionTestCase`` or an attribute ending in it."""
    name = base.id if isinstance(base, ast.Name) else getattr(base, "attr", None)
    return name == "TransactionTestCase"


def _is_attr_call(node, attr):
    """Return whether ``node`` is a call to ``attr`` or ``<something>.attr``."""
    if not isinstance(node, ast.Call):
        return False
    func = node.func
    name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", None)
    return name == attr


def _keyword_constant(call, name):
    """Return the constant value of keyword ``name`` in ``call``, or ``None``."""
    for keyword in call.keywords:
        if keyword.arg == name and isinstance(keyword.value, ast.Constant):
            return keyword.value.value
    return None


def _is_transactional_decorator(decorator):
    """Return whether ``decorator`` is ``django_db(transaction=True)``."""
    is_django_db = _is_attr_call(decorator, "django_db")
    return is_django_db and _keyword_constant(decorator, "transaction") is True


def _is_transactional_site(node):
    """Return whether a class or function is a transactional test."""
    if isinstance(node, ast.ClassDef) and any(
        _is_transaction_test_case_base(base) for base in node.bases
    ):
        return True
    return any(_is_transactional_decorator(decorator) for decorator in node.decorator_list)


def _anchor_line(node):
    """Return the first decorator line of ``node``, or its own line without decorators."""
    decorators = node.decorator_list
    return decorators[0].lineno if decorators else node.lineno


def transaction_justification_rule(tree, path):
    """Flag transactional tests without a ``# transactional: <reason>`` comment above them."""
    lines = Path(path).read_text().splitlines()
    message = "transactional test needs a '# transactional: <reason>' comment directly above it"
    sites = (
        node
        for node in ast.walk(tree)
        if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef))
        and _is_transactional_site(node)
    )
    violations = []
    for node in sites:
        anchor = _anchor_line(node)
        above = lines[anchor - 2].strip() if anchor >= 2 else ""
        if not TRANSACTIONAL_COMMENT.match(above):
            violations.append(Violation(str(path), anchor, "transaction-justification", message))
    return violations


def _wide_fixture_decorator(node):
    """Return the ``fixture`` decorator with a class/module/package/session scope, if any."""
    for decorator in node.decorator_list:
        if not _is_attr_call(decorator, "fixture"):
            continue
        if _keyword_constant(decorator, "scope") in WIDE_SCOPES:
            return decorator
    return None


def _uses_db_blocker(node):
    """Return whether a function takes or references ``django_db_blocker``."""
    arguments = node.args.posonlyargs + node.args.args + node.args.kwonlyargs
    if any(argument.arg == "django_db_blocker" for argument in arguments):
        return True
    return any(
        isinstance(child, ast.Name) and child.id == "django_db_blocker" for child in ast.walk(node)
    )


def scoped_db_fixture_rule(tree, path):
    """Flag wide-scoped fixtures that use ``django_db_blocker`` (writes are not rolled back)."""
    message = (
        "fixtures scoped to class/module/package/session must not write to the database; "
        "use setUpTestData"
    )
    violations = []
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        decorator = _wide_fixture_decorator(node)
        if decorator is not None and _uses_db_blocker(node):
            violations.append(Violation(str(path), decorator.lineno, "scoped-db-fixture", message))
    return violations


RULES = [
    memory_cache_clear_rule,
    token_create_rule,
    transaction_justification_rule,
    scoped_db_fixture_rule,
]


def _split(found, allowed):
    """Split ``found`` violations into (violations, opt-outs) using the allowed lines."""
    violations, honoured = [], []
    for violation in found:
        target = honoured if violation.rule in allowed.get(violation.line, ()) else violations
        target.append(violation)
    return violations, honoured


def check_file(path):
    """Return ``(violations, opt_outs)`` for one file."""
    source = Path(path).read_text()
    try:
        tree = ast.parse(source)
    except SyntaxError as error:
        return [Violation(str(path), error.lineno or 0, "syntax", str(error))], []
    found = [violation for rule in RULES for violation in rule(tree, path)]
    return _split(found, opt_outs(source))


def _format(violation, opt_out):
    """Format a violation or opt-out as an output line."""
    text = "allowed (opt-out)" if opt_out else violation.message
    return f"{violation.path}:{violation.line}: {violation.rule}: {text}"


def main():
    """Run every rule over the test files and return the exit code."""
    testpaths = load_testpaths("pyproject.toml")
    if not testpaths:
        print("check_test_policy: no testpaths found in ./pyproject.toml", file=sys.stderr)
        return 2
    files = iter_test_files(testpaths)
    violations, allowed = [], []
    for path in files:
        found, honoured = check_file(path)
        violations += found
        allowed += honoured
    for violation in violations:
        print(_format(violation, False))
    for violation in allowed:
        print(_format(violation, True))
    print(f"{len(files)} files checked, {len(violations)} violations, {len(allowed)} opt-outs")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
