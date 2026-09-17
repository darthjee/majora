# Issue: Refactor: replace sed call with parameter expansion in bin/deploy_frontend.sh

## Description
Codacy's ShellCheck scan (`SC2001`, Performance, Warning severity) flags `bin/deploy_frontend.sh:23` — `echo "$SSH_PRIVATE_KEY" | sed -e "s/\\\\n/\n/g" > "$SSH_KEY_FILE_PATH"` — for using `sed` where bash parameter expansion would do the same substitution without spawning a subprocess.

## Problem
`run_generate_ssh_key_file()` in `bin/deploy_frontend.sh` receives `$SSH_PRIVATE_KEY` with literal `\n` escape sequences and pipes it through `echo | sed` to turn them into real newlines before writing the SSH key file used for deploy uploads. This is a simple string substitution that doesn't need an external `sed` process.

## Solution
Rewrite line 23 of `bin/deploy_frontend.sh` using bash parameter expansion instead of piping through `sed`, e.g. `SSH_KEY_FILE_CONTENT="${SSH_PRIVATE_KEY//\\n/$'\n'}"` written to `$SSH_KEY_FILE_PATH` (matching the original's trailing newline from `echo`). Owned by the infra agent (deployment scripts).

## Benefits
- Removes an unnecessary `sed` subprocess for a trivial substitution
- Clears the Codacy ShellCheck SC2001 finding for this file
