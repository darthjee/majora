# Issue: Add "Crawler" entry to the admin/staff nav menu

## Description

The Navi/Enqueue crawler UI lives at `/#/staff/crawler` (`StaffCrawler.jsx`, routed via `HashRouteResolver.js`), but no link to it exists anywhere in the app's navigation.

## Problem

The Admin dropdown in `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` only exposes two `adminItem(...)` entries — `staff/users` and `staff/dashboard`:

```js
adminItem('staff-users', 'staff/users', 'header.nav_staff_users'),
adminItem('staff-dashboard', 'staff/dashboard', 'header.nav_staff_dashboard'),
```

There is no equivalent entry for `staff/crawler`, so staff/superusers can only reach the crawler page by typing the URL directly — it is undiscoverable through normal navigation.

## Expected Behavior

Staff/superusers should see a "Crawler" entry in the Admin dropdown, next to "Staff Users" and "Staff Dashboard", that navigates to `/#/staff/crawler`. Non-staff/non-superuser users should not see it, matching the existing `IS_ADMIN` gating.

## Solution

- **Frontend**: add an `adminItem('staff-crawler', 'staff/crawler', 'header.nav_staff_crawler')` entry to `NAV_LINK_REGISTRY` in `HeaderNavHelper.jsx`, right after the existing `staff-dashboard` entry, gated by the same `IS_ADMIN` (superuser-or-staff) check.
- **i18n**: add `header.nav_staff_crawler` to both `en` and `pt` locale files (`common.yaml`), following the existing `nav_staff_users: Users` / `nav_staff_dashboard: Dashboard` pattern — label text `Crawler` (en) / matching translation (pt), not "Staff Crawler", since the item already sits inside the "Admin" dropdown.
- **Tests**: update the `HeaderNavHelper` spec to assert the new entry renders, links to `#/staff/crawler`, and is gated by `IS_ADMIN` like its siblings.

**Done when:** a "Crawler" entry appears in the Admin dropdown for staff/superusers only, links to `/#/staff/crawler`, has translations in both locales, and is covered by a passing spec.

## Benefits

- Staff/superusers can discover and reach the crawler Enqueue UI without needing to know or be told the direct URL.
- Keeps the Admin dropdown consistent — every staff-facing page gets a corresponding nav entry.
