# Plan: Statistics bug: production data analysis script

Issue: [1703-statistics-bug-production-data-analysis-script.md](../../issues/1703-statistics-bug-production-data-analysis-script.md)

## Overview

Add `investigations/statistics-bug/analyse.py`. It is a read-only analysis of the statistics
export:

- it gets a `statistics:read` token through device authorization;
- it pages through the export sequentially;
- it groups the sessions that probably belong to the same visitor and classifies each extra
  session;
- it writes a git-ignored text and JSON report.

The script first proves itself with `--validate` against `emulate.py`'s report on local data.
The production run itself belongs to #1704.

See [investigator.md](investigator.md) for the full plan.
