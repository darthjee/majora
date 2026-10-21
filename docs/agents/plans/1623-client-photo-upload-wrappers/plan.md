# Plan: Client: photo upload wrappers

Issue: [1623-client-photo-upload-wrappers.md](../../issues/1623-client-photo-upload-wrappers.md)

## Overview

Add photo uploads (two-step init + submit), set-as-main and character photo deletion to the
client resource wrappers, with the small `HttpClient` extension the `.json`-less submit path
needs. All the work is in `client/` and its docs.

See [client.md](client.md) for the full plan.
