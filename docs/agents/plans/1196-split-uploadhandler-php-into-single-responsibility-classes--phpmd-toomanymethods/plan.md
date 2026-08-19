# Plan: Split UploadHandler.php into single-responsibility classes (PHPMD TooManyMethods)

Issue: [1196-split-uploadhandler-php-into-single-responsibility-classes--phpmd-toomanymethods.md](../../issues/1196-split-uploadhandler-php-into-single-responsibility-classes--phpmd-toomanymethods.md)

## Overview

Extract three type-parameterized collaborators from `proxy/extension/lib/handlers/UploadHandler.php` — `UploadContentValidator`, `UploadStatusClient`, and `UploadStorageResolver` — each built via a `forType('image'|'file')` factory, so the handler stops holding duplicate per-type instance pairs. This is entirely proxy-layer work.

See [proxy.md](proxy.md) for the full plan.
