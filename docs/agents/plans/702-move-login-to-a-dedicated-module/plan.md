# Plan: Move login to a dedicated module

Issue: [702-move-login-to-a-dedicated-module.md](../../issues/702-move-login-to-a-dedicated-module.md)

## Overview

Extract all account/authentication code that currently lives inside the `games` Django app
into a new, dedicated `accounts` app (backend), and consolidate the frontend's login UI into
the existing `components/resources/account/` module. This is a pure relocation: no URL path,
request/response payload, or behavior changes — only where the code lives changes.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

There is no new contract to coordinate: every `/users/*.json` endpoint (`login`, `logout`,
`register`, `status`, `test-email`, `recover`, `reset-password`, `language`, `account`) keeps
its exact current path, method, request payload, and response shape. The frontend's
`AuthClient` does not need any change beyond what `frontend.md` describes (moving
`LoginModal`'s files, not its API calls). Backend and frontend work here can proceed fully
independently and be reviewed/merged separately if needed.
