# Issue: Fix navi paginated items configuration

## Description

Navi's `paginated_actions` configuration in `navi/` only sends `page={page}` to paginated requests. In production, the frontend always sends an explicit `per_page` too, read from the `per_page` response header of the initial (first-page) request. Because the CDN cache key is built from the full query string, Navi's warm requests (`?page={page}` only) never match what production actually requests (`?page={page}&per_page={per_page}`), so cache warming is ineffective for every paginated resource.

## Problem

Navi `<= 1.5.0` can only extract one dynamic value from an index response for pagination purposes: the total page count. There's no way to read an additional header (like `per_page`) from that same response and forward it into each paginated request — so today it would have to be hardcoded, which doesn't work here.

This is resolved upstream: `darthjee/navi#621` (tagged `Ready`, plan committed on branch `issue-621`) adds a `parameters` field to `paginated_actions`, targeted for Navi `v1.5.1`. It lets any path expression (`headers['...']`, `parsedBody...`) resolved against the same index response be threaded into every paginated request, alongside the page number. See `future-plan.md` at the root of the `darthjee/navi` repository for the full contract (merge precedence, error handling, examples) — this majora issue is planned directly against that contract.

`per_page` itself is genuinely dynamic, not a fixed constant: it comes from the backend's `Paginator` (`backend/games/paginator.py`), defaults to `Settings.pagination_size()` (env-configurable via `MAJORA_PAGINATION_SIZE`), and is always echoed back in the response's `per_page` header — this is why it must be read per-request via `parameters` rather than hardcoded in `navi_config.yaml`.

Per the v1.5.1 contract, if the `per_page` header is ever missing from a response, that one paginated action fails loudly (logged, dead-lettered) rather than silently omitting the parameter — there's no default-value fallback. That's acceptable here since the backend `Paginator` always sets `per_page` on every response.

## Expected Behavior

Every paginated request Navi issues should carry the same `per_page` value production actually uses, sourced from the `per_page` header of the triggering (first-page) response — across all paginated blocks in `navi/resources/*.yml` (treasures, games, pcs, npcs — 17 blocks total).

## Solution

**Depends on:** `darthjee/navi#621` (`parameters` support for `paginated_actions`) shipping as Navi `v1.5.1` first.

1. Bump the `navi-hey` version used in `.circleci/config.yml` to `>= 1.5.1`.
2. Update all 17 `paginated_actions` blocks across `navi/resources/{treasures,games,pcs,npcs}.yml` to add a `parameters` field (a sibling of `pagination`, not nested inside it) and extend each corresponding `paginated_*` URL template:

   ```yaml
   resources:
     treasures:
       - url: /treasures.json
         status: 200
         paginated_actions:
           - resource: paginated_treasures
             pagination:
               - pages: headers['pages']
               - page_key: page
               - zero_indexed: false
             parameters:
               per_page: headers['per_page']

     paginated_treasures:
       - url: /treasures.json?page={:page}&per_page={:per_page}
         status: 200
         ...
   ```

Verification is deferred to future work — no automated verification plan for this fix at this time.

## Benefits

Navi's cache-warming requests will match the query string production actually sends, so the CDN cache is correctly warmed for paginated resources instead of missing on every real request.
