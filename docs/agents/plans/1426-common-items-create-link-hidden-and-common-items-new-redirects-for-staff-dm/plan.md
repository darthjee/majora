# Plan: Common Items: "Create" link hidden and /common_items/new redirects for staff/DM

Issue: [1426-common-items-create-link-hidden-and-common-items-new-redirects-for-staff-dm.md](../../issues/1426-common-items-create-link-hidden-and-common-items-new-redirects-for-staff-dm.md)

## Overview
Add the missing `can_create_common_item` flag to the game permissions response (the
`GamePermissionsSerializer` / `/permissions/game.json` output). The frontend already reads it,
but the backend never sends it. The change is backend config plus tests only.

See [backend.md](backend.md) for the full plan.
