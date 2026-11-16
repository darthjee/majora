# Plan: Backend tests speed: make the UserProfile write in UserFactory optional

Issue: [1791-backend-tests-speed-make-the-userprofile-write-in-userfactory-optional.md](../../issues/1791-backend-tests-speed-make-the-userprofile-write-in-userfactory-optional.md)

## Overview

Add a `with_profile` opt-out to `UserFactory` (default: approved profile, unchanged), apply it in the hot view test modules to users that never authenticate, and record the measured effect.

See [backend.md](backend.md) for the full plan.
