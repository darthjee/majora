# Plan: Refactor proxy test method flagged as too long (Lizard nloc-medium)

Issue: [1168-refactor-proxy-test-method-flagged-as-too-long--lizard-nloc-medium.md](../../issues/1168-refactor-proxy-test-method-flagged-as-too-long--lizard-nloc-medium.md)

## Overview

Extract the duplicated "mock two forwarded `request()` calls, then assert the response" block out of `UploadHandlerTest::testOnlyAllowListedHeadersAreForwardedToBackend` (53 NLOC, over the 50 limit) into shared helper(s), reused across the other test methods in the same file that repeat the same shape.

See [proxy.md](proxy.md) for the full plan.
