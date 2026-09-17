# Plan: Refactor: replace sed call with parameter expansion in bin/deploy_frontend.sh

Issue: [1360-refactor-replace-sed-call-with-parameter-expansion-in-bin-deploy-frontend-sh.md](../../issues/1360-refactor-replace-sed-call-with-parameter-expansion-in-bin-deploy-frontend-sh.md)

## Overview

Replace the `echo | sed` pipeline in `bin/deploy_frontend.sh` with bash parameter expansion, per Codacy's ShellCheck `SC2001` finding.

See [infra.md](infra.md) for the full plan.
