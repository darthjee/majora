# Plan: Refactor Header/Account components flagged as too long (Lizard nloc-medium)

Issue: [1182-refactor-header-account-components-flagged-as-too-long--lizard-nloc-medium.md](../issues/1182-refactor-header-account-components-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

Pure structural refactor of 3 frontend files still over Codacy's Lizard 50-NLOC-per-method limit (`Header.jsx`, `LoginModal.jsx`, `MyAccountHelper.jsx`) — the 4th originally-flagged occurrence, `HeaderHelper#renderAuthControl`, was already resolved by #1186. No behavior change; existing specs are the regression signal.

See [frontend.md](frontend.md) for the full plan.
