# Issue: Fix PhotoUploadHandler

## Description
`PhotoUploadHandler` (`proxy/extension/PhotoUploadHandler.php`) has a hardcoded default `$photosBasePath = '/var/www/html/photos'` in its constructor (line 36). The `build()` static factory method (line 49) does not pass a `photosBasePath` argument, so the default is always used regardless of where Tent is actually installed.

## Problem
In production the Tent proxy might be installed at a path other than `/var/www/html/`. When that happens, the photos directory is written to a hardcoded path that does not correspond to the actual installation location, causing uploads to land in the wrong place or to fail entirely.

## Expected Behavior
The `photos` base path should be derived at runtime from the actual location of Tent's entry point (`index.php`), so that photos are always written relative to wherever Tent is installed, regardless of the host filesystem layout.

## Solution
Update `PhotoUploadHandler::build()` to compute `photosBasePath` dynamically using PHP server variables (e.g. `$_SERVER['DOCUMENT_ROOT']` or `dirname($_SERVER['SCRIPT_FILENAME'])`) rather than relying on a hardcoded default. The resulting path should be `<tent-root>/photos`, mirroring the existing `/var/www/html/photos` convention but anchored to the real installation directory.
