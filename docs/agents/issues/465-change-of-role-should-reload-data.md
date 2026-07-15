# Issue: Change of role should reload data

## Description
The app has a "view as" feature that lets an admin/staff user simulate a role (`dm`, `player`, or `owner`) to preview how resources would be shown/editable for that role, without actually changing their real session. It is triggered from the header (`HeaderHelper.jsx`), opens `ViewAsModal`, and is saved via `ViewAsModalController.handleSave`, which calls `AccessStore.setFacade({enabled, roles})`.

## Problem
Today, saving a "view as" role change only refreshes `*Permissions` (`can_edit`) checks: `AccessStore.setFacade` resets and re-syncs the access-check descriptors for the current route (`AccessStore.syncForRoute`), re-fetching `can_edit` checks and re-rendering the components subscribed to those events via `AccessEvents`. It does not refresh any other role-dependent content on the page — e.g. identity/`*Access` checks, nav links, or other data not driven by the `AccessStore`/`AccessEvents` pub-sub — so the page does not fully reflect what the simulated role would actually see.

## Expected Behavior
Right after enabling/changing a simulated role via the "view as" feature, all role-dependent data on the current page should refresh in place so it reflects how that role would see it — not just `can_edit` permissions.

## Solution
Extend the existing `AccessStore`/`AccessEvents` pub-sub mechanism (the same one that already re-fetches `*Permissions` on `syncForRoute`) so it also covers the other role-dependent data currently left stale after a view-as change — e.g. identity/`*Access` checks and any other data reacting to the simulated role. This keeps the existing in-place refetch pattern rather than introducing a full browser `window.location.reload()`, which the codebase deliberately avoids elsewhere.
