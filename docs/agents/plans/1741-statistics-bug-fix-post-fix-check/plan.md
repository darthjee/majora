# Plan: Statistics bug fix: post-fix check

Issue: [1741-statistics-bug-fix-post-fix-check.md](../../issues/1741-statistics-bug-fix-post-fix-check.md)

## Overview

Confirm that the duplicated-session pattern is gone after 1.6.0 and the removal of the direct
host's custom domain: a local `emulate.py` / `analyse.py --validate` run, then an `analyse-prod`
run over about a week of production data, and a *Post-fix check* section in `findings.md`. Run
interactively with the owner; the architect coordinates and does the investigator's work.

See [investigator.md](investigator.md) for the full plan.
