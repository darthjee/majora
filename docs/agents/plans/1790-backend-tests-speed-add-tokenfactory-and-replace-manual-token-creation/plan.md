# Plan: Backend tests speed: add TokenFactory and replace manual token creation

Issue: [1790-backend-tests-speed-add-tokenfactory-and-replace-manual-token-creation.md](../../issues/1790-backend-tests-speed-add-tokenfactory-and-replace-manual-token-creation.md)

## Overview

Add a `TokenFactory`, replace all 1,275 DRF `Token.objects.create` calls in the backend tests with it in one codemod PR (no behavior change), and add a `token-create` rule to `bin/check_test_policy.py`, whose scan widens to every `.py` file under the `testpaths`.

See [backend.md](backend.md) for the full plan.
