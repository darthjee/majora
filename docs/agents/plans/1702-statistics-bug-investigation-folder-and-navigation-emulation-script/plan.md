# Plan: Statistics bug: investigation folder and navigation emulation script

Issue: [1702-statistics-bug-investigation-folder-and-navigation-emulation-script.md](../../issues/1702-statistics-bug-investigation-folder-and-navigation-emulation-script.md)

## Overview

Create `investigations/statistics-bug/` with `emulate.py`, a standalone script that replays
navigation scenarios against the local stack and reports the statistics sessions and visits each
scenario created, with their tracking columns, flagging unexpected creation reasons. Infra keeps
the folder out of markdownlint and Codacy. No application code changes.

## Agents involved

- [investigator](investigator.md)
- [infra](infra.md)

## Shared contracts

- **Folder path:** `investigations/statistics-bug/`. Infra excludes the glob
  `investigations/**`; the investigator puts every file of this issue under that folder.
- **No other shared surface:** the investigator never edits files outside the folder; infra
  never edits files inside it.
