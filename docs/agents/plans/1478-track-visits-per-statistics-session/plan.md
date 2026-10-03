# Plan: Track visits per statistics session

Issue: [1478-track-visits-per-statistics-session.md](../../issues/1478-track-visits-per-statistics-session.md)

## Overview

Add a `statistics.Visit` model under `statistics.Session`, opened/extended by
`StatisticsSessionMiddleware` per a configurable inactivity window, with exact `hits` via an
atomic update and a throttled `Session.last_seen_at` write. Also update the access statistics
spec and add the missing `statistics` access-control page.

See [backend.md](backend.md) for the full plan.
