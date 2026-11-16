"""Summarize a pytest JUnit XML report by test file and by directory.

``pytest --durations`` only lists single tests. Epic #1785 (backend tests speed)
needs totals per test file and per directory, e.g. the share of ``pytest_all``
taken by the transactional test files, and #1788 uses the same totals to check
that the CI jobs are balanced. This script sums the ``time`` of every
``testcase`` and writes two Markdown tables sorted by total time.

It uses the standard library only and never fails on test outcomes (skipped,
failed and errored tests are counted like any other); it exits non-zero only
when the input is missing or unreadable.

Usage (inside CI or the ``majora_tests`` container, never on the host)::

    poetry run python bin/junit_summary.py test-reports/junit.xml \\
        test-reports/durations-by-file.md
"""

import argparse
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import PurePosixPath


def testcase_file(case):
    """Return the test file of a ``testcase``, from ``file`` or ``classname``."""
    path = case.get("file")
    if path:
        return path
    parts = (case.get("classname") or "").split(".")
    if parts and parts[-1][:1].isupper():
        parts = parts[:-1]
    if not parts or parts == [""]:
        return "(unknown)"
    return "/".join(parts) + ".py"


def read_report(path):
    """Parse the JUnit XML and return (testcases, testsuite wall time or None)."""
    root = ET.parse(path).getroot()
    suites = [root] if root.tag == "testsuite" else root.findall("testsuite")
    wall = sum(float(suite.get("time") or 0) for suite in suites) if suites else None
    return root.iter("testcase"), wall


def aggregate(cases):
    """Sum tests and time per file and per parent directory."""
    by_file = defaultdict(lambda: [0, 0.0])
    by_dir = defaultdict(lambda: [0, 0.0])
    for case in cases:
        path = testcase_file(case)
        seconds = float(case.get("time") or 0)
        for key, table in ((path, by_file), (str(PurePosixPath(path).parent), by_dir)):
            table[key][0] += 1
            table[key][1] += seconds
    return by_file, by_dir


def table(title, label, rows, total):
    """Render one Markdown table sorted by total time, descending."""
    lines = [
        f"## {title}",
        "",
        f"| {label} | Tests | Total (s) | Share | Avg per test (s) |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for key, (count, seconds) in sorted(rows.items(), key=lambda item: -item[1][1]):
        share = 100 * seconds / total if total else 0.0
        lines.append(
            f"| `{key}` | {count} | {seconds:.2f} | {share:.1f}% | {seconds / count:.3f} |"
        )
    return lines


def summarize(by_file, by_dir, wall):
    """Build the full Markdown report."""
    tests = sum(count for count, _ in by_file.values())
    total = sum(seconds for _, seconds in by_file.values())
    header = f"Tests: {tests} | Sum of test times: {total:.2f}s"
    if wall is not None:
        header += f" | Test suite wall time: {wall:.2f}s"
    lines = ["# Durations by file", "", header, ""]
    lines += table("Per file", "File", by_file, total) + [""]
    lines += table("Per directory", "Directory", by_dir, total)
    return "\n".join(lines) + "\n"


def main(argv=None):
    """Read the JUnit XML given on the command line and write the summary."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("junit", help="pytest JUnit XML report")
    parser.add_argument("output", help="Markdown file to write")
    args = parser.parse_args(argv)
    try:
        cases, wall = read_report(args.junit)
        by_file, by_dir = aggregate(cases)
    except (OSError, ET.ParseError, ValueError) as error:
        print(f"junit_summary: cannot read {args.junit}: {error}", file=sys.stderr)
        return 1
    with open(args.output, "w", encoding="utf-8") as output:
        output.write(summarize(by_file, by_dir, wall))
    return 0


if __name__ == "__main__":
    sys.exit(main())
