# Plan: Statistics middleware creates a ghost anonymous Session for logged-in requests

Issue: [1480-statistics-middleware-creates-a-ghost-anonymous-session-for-logged-in-requests.md](../../issues/1480-statistics-middleware-creates-a-ghost-anonymous-session-for-logged-in-requests.md)

## Overview
Stop `StatisticsSessionMiddleware` from leaving a ghost anonymous `Session` row whenever a logged-in
request needs a new statistics session: sessions created during the current request get the user
attached in place, while pre-existing anonymous sessions keep rotating.

See [backend.md](backend.md) for the full plan.
