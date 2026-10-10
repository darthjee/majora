# Refactor: replace sed call with parameter expansion in bin/deploy_frontend.sh

## Context

Codacy's ShellCheck scan (`SC2001`, Performance, Warning severity) flags `bin/deploy_frontend.sh:23` — `echo "$SSH_PRIVATE_KEY" | sed -e "s/\\\n/\n/g" > "$SSH_KEY_FILE_PATH"` — suggesting `${variable//search/replace}` instead of piping through `sed`, avoiding an unnecessary subprocess for a simple string substitution.

## What needs to be done

Infra: rewrite the flagged line in `bin/deploy_frontend.sh:23` using bash parameter expansion (`${SSH_PRIVATE_KEY//\\n/$'\n'}` or equivalent) instead of piping through `sed`, and verify the deploy script still correctly reconstructs the SSH key file.

## Acceptance criteria

- [ ] Line 23 of bin/deploy_frontend.sh uses parameter expansion instead of `sed`
- [ ] The deploy script still produces an identical `$SSH_KEY_FILE_PATH` output for a sample multi-line key
- [ ] Codacy's ShellCheck `SC2001` finding clears for this file
