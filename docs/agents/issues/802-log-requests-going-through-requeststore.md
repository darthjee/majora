# Issue: Log requests going through RequestStore

## Description
Several components fetch data through `RequestStore` (specifically `RequestStore.ensure({ resource, quantityType, params, query })`), but it isn't confirmed whether every component that needs data actually goes through it consistently.

## Problem
There is no visibility into which components trigger requests via `RequestStore`, or with which resource type. This makes it hard to confirm that all components are using `RequestStore` consistently, and makes it harder to reason about component behavior around data fetching.

## Expected Behavior
Every call into `RequestStore` logs, at `debug` level via `MajoraLogger`, the name of the component that triggered the request and, when applicable, the resource type involved (e.g. `pc`, `npc`, `game`, etc.) — both when the request starts, and again when it settles (attaching the result or error).

For example:
- The index/show pages for games, NPCs, PCs, etc. are components that carry a resource type, which configures what/how they load data.
- On `/#/games/:game_slug/npcs`, the list is rendered by a shared component that is reused for both PCs and NPCs, differing only by resource type — both cases must be distinguishable in the logs.

## Solution
Introduce a new class, `RequestStoreLogging`, responsible for building the log payload and sending it to `MajoraLogger.debug`. This mirrors the existing `AccessStoreLogging` pattern already used for access-store calls, but also logs at call start (not only on completion).

Every caller of `RequestStore` will need to pass along a component name (the class/controller name, e.g. `CharacterController`, `GameController`) identifying the caller and, when the caller has a resource type, that resource type as well, so both can be attached to the log.

## Benefits
Better visibility into which components are (or aren't) going through `RequestStore` for data fetching, and with what resource type — helping confirm consistent usage across components and aiding future debugging of component behavior.
