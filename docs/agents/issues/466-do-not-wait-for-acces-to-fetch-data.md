# Issue: Do not wait for access to fetch data

## Description
When entering a page, the frontend waits for both `/access.json` and `/permissions.json` to resolve before rendering, using `AccessStore` — the central object that determines whether the current user has access to a page's data and whether they may edit it. This lingering delay happens even though `AccessStore` already treats fetch failures as deny-all.

## Problem
Page controllers (e.g. `CharacterController`, `GameController`, `TreasureController`) call `Promise.all` on `AccessStore.ensure*Access(...)` and `AccessStore.ensure*Permissions(...)` and only render once both requests settle. This means every page load lingers on two network round-trips before showing anything, even though the store could just as well start out assuming no access/permissions and correct itself once the real response arrives.

## Solution
- `AccessStore` should expose access and permissions synchronously with deny-all defaults (no roles, `can_edit: false`, etc.) immediately, without waiting for `/access.json` / `/permissions.json` to resolve, so pages can render right away assuming the user has no access.
- All `AccessStore` consumers (`CharacterController`, `GameController`, `TreasureController`, and any future ones) should stop gating their initial render behind `Promise.all` on these access/permission fetches.
- Once the real `/access.json` and `/permissions.json` responses arrive with the user's actual permissions, `AccessStore` should trigger a reload of the current route by reusing `AccessStore.syncForAuthChange()` — the same mechanism already used today when the user logs in or out — so the page re-syncs with the up-to-date access/permissions.

## Benefits
- Pages render immediately instead of lingering while waiting on `access.json`/`permissions.json`.
- Reuses the existing fail-closed defaults and the proven `syncForAuthChange` reload path instead of introducing new mechanisms.
