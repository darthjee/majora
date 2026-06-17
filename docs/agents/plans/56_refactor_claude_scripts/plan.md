# Plan: Refactor claude scripts

Issue: [56_refactor_claude_scripts.md](../issues/56_refactor_claude_scripts.md)

## Branch

`issue-56`

## Overview

Split the responsibilities currently crammed into `.claude/scripts/majora_issue.sh` into focused scripts (issue/plan file naming, GitHub sync, metadata, commit templating, branch management, PR lifecycle/monitoring), backed by a small shared helper library. `majora_issue.sh` itself is kept as the single dispatcher entrypoint — it sources the new scripts as function libraries and routes each existing command to the right function — so no skill file in `.claude/commands/` needs to change and the CLI surface (`bash .claude/scripts/majora_issue.sh <command> ...`) stays identical.

## Agents involved

- [Infra](infra.md)
