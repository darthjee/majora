"""Check the backend test files against the test isolation policy.

Epic #1785 (backend tests speed) moves shared-state handling into the root
``conftest.py``. This script parses every test file with ``ast`` and reports the
patterns the policy forbids, so they cannot come back unnoticed.

A violation can be allowed on a single line with a comment such as
``# test-policy: allow memory-cache-clear``; allowed lines are listed as opt-outs.

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
    """Return the sorted test files and conftests under ``testpaths`` plus the root conftest."""
    files = {ROOT_CONFTEST} if ROOT_CONFTEST.exists() else set()
    for testpath in testpaths:
        base = Path(testpath)
        files.update(base.rglob("*_test.py"))
        files.update(base.rglob("conftest.py"))
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


RULES = [memory_cache_clear_rule]


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
