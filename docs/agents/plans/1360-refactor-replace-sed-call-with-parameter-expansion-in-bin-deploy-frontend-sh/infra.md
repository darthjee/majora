# Plan: Refactor: replace sed call with parameter expansion in bin/deploy_frontend.sh

Issue: [1360-refactor-replace-sed-call-with-parameter-expansion-in-bin-deploy-frontend-sh.md](../../issues/1360-refactor-replace-sed-call-with-parameter-expansion-in-bin-deploy-frontend-sh.md)

## Overview

Replace the `echo | sed` pipeline in `run_generate_ssh_key_file()` (`bin/deploy_frontend.sh:23`) with bash parameter expansion, removing an unnecessary subprocess flagged by Codacy's ShellCheck (`SC2001`) while producing byte-identical output for the SSH key file.

## Context

`run_generate_ssh_key_file()` converts literal `\n` escape sequences embedded in the `$SSH_PRIVATE_KEY` CI secret into real newlines before writing `$SSH_KEY_FILE_PATH`, which every subsequent `ssh`/`rsync` call in the script (`$SSH_COMMAND`) relies on. No local shellcheck/lint job exists for `bin/` scripts in this repo — Codacy's ShellCheck scan runs in the cloud — so this file's only line is the target; there is nothing else to touch.

## Implementation Steps

### Step 1 — Replace the sed pipeline with parameter expansion

Rewrite `bin/deploy_frontend.sh:23` to use `${SSH_PRIVATE_KEY//\\n/$'\n'}` (or an equivalent parameter expansion) instead of `echo "$SSH_PRIVATE_KEY" | sed -e "s/\\\n/\n/g"`, preserving the trailing newline `echo` currently appends after the substitution, e.g.:

```bash
printf '%s\n' "${SSH_PRIVATE_KEY//\\n/$'\n'}" > "$SSH_KEY_FILE_PATH"
```

### Step 2 — Verify identical output

Manually exercise `run_generate_ssh_key_file` with a sample multi-line key containing literal `\n` sequences (e.g. `SSH_PRIVATE_KEY=$'line1\\nline2\\nline3'`), diff the resulting `$SSH_KEY_FILE_PATH` against the pre-change output for the same input, and confirm they're byte-identical (including the trailing newline and file permissions from `chmod 600`).

## Files to Change

- `bin/deploy_frontend.sh` — replace the `sed` pipeline on line 23 with bash parameter expansion.

## Notes

- No CI job runs shellcheck locally; Codacy's cloud scan is the only place the `SC2001` finding clearing will be visible.
- No product/access-control or security review needed: no endpoints, permissions, or user-facing behavior change — this is a shell-script internals refactor.
