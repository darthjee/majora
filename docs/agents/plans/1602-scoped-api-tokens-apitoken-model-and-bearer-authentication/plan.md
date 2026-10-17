# Plan: Scoped API tokens: ApiToken model and Bearer authentication

Issue: [1602-scoped-api-tokens-apitoken-model-and-bearer-authentication.md](../../issues/1602-scoped-api-tokens-apitoken-model-and-bearer-authentication.md)

## Overview

Add the `ApiToken` model, `mjr_` token generation and the `ApiTokenAuthentication` Bearer class
in `backend/accounts/`, wire it first in DRF settings, and revoke scoped tokens in the staff deny
view. Until #1603 lands, authenticated Bearer requests are refused with 403 `token_not_allowed`.

See [backend.md](backend.md) for the full plan.
