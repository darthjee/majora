# User (Account)

A **User** is a Django authentication account (`django.contrib.auth.models.User`). A
`User` may be linked to at most one `Player` record per game (through the `Player.user`
FK).

A `User` is **not** scoped to any single game — unlike `Character` and `Player`, a `User`
is a global identity. It has a `username` (the real, unique login
credential; also editable as first/last name via `first_name`/`last_name`) plus a
`UserProfile.display_name` (unique, public-facing name shown to other users wherever a
user's name is displayed to a general audience, e.g. session message authors and poll
voters). Only the user themselves (`/#/my_account`) and staff (`/#/staff/users`) can see
the real `username`; `display_name` never exposes the login credential.

