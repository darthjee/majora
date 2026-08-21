# Plan: Fix dropdown select

Issue: [1220-fix-ropdown-select.md](../../issues/1220-fix-ropdown-select.md)

## Overview

Cap the local-constant mode of `ResourcePickerSearch` (`filterConstantResults`) to a maximum of 5 displayed entries via a new internal `MAX_CONSTANT_RESULTS` constant, leaving the API-backed mode and all consumer pages untouched.

See [frontend.md](frontend.md) for the full plan.
