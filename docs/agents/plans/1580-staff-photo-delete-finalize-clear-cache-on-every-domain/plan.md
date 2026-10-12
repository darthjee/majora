# Plan: Staff photo delete/finalize: clear cache on every domain

Issue: [1580-staff-photo-delete-finalize-clear-cache-on-every-domain.md](../../issues/1580-staff-photo-delete-finalize-clear-cache-on-every-domain.md)

## Overview

Switch `DeleteHandler` and `UploadHandler` to the cross-domain mode of `ResponseCacheClearer` (`forRoot()`, added in #1570), so that the `X-Cache-Clear` paths from staff photo delete and staff upload finalize are cleared in every `domain_*` cache folder and in the cache root. The prod rules then pass `$cacheFolder` instead of the per-domain folder.

See [proxy.md](proxy.md) for the full plan.
