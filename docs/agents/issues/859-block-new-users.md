# Issue: Block new users

## Scenario
Currently, any new user can register, create a game, and immediately start uploading images.

## Problem
Malicious users could exploit open registration to upload inappropriate content (e.g. porn) or otherwise abuse the site, which has no revenue or dedicated team to moderate such abuse.

## Solution
Introduce a user approval workflow. Users have a status: `approved`, `denied`, or `pending`. New registrations start as `pending`. Admin and staff users can approve or deny pending users.

## Implementation

### Migration
- Existing users (including all current staff/admins) are set to `approved`, so nobody currently using the site loses access.

### Frontend
#### Page `/#/staff/users`
- Show the user's status with colors: approved = green, denied = red, pending = yellow
- Add a "display name" column
- Add filters: by status, and a single combined text filter across name, display name, and email

#### Pending user experience
- A `pending` user can still log in (a session/token is issued), but the permission system treats them as logged out for everything else.
- The frontend shows a dedicated "your account is awaiting approval" state for pending users, instead of a login error.

### Endpoints
#### Existing: register endpoint
- Marks the new user as `pending`

#### Existing: login-related endpoints (including password recovery)
- Return 403 if the user is `denied`
- Continue to succeed for `pending` users (see "Pending user experience" above)

#### Existing: request authorization endpoints
- Return 403 if the user is `denied`

#### Existing: `/staff/users.json`
- Also returns `status` and `display_name`
- Supports filtering by:
  - `status` query parameter
  - a single query parameter that ORs across name, display name, and email

#### New: `POST /staff/users/approve.json`
- Restricted to admin/staff, like the other `/staff/*` endpoints (401 if unauthenticated, 403 otherwise)
- Returns 422 if the user is not currently `pending`
- Marks the user as `approved`
- No notification is sent to the user

#### New: `POST /staff/users/deny.json`
- Restricted to admin/staff, like the other `/staff/*` endpoints (401 if unauthenticated, 403 otherwise)
- Marks the user as `denied`, regardless of current status (also usable to ban existing users)
- Destroys the user's tokens, invalidating any existing token/cookie access
- No notification is sent to the user

### Permission system
A user who is not `approved` is treated as not logged in.
