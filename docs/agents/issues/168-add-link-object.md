# Issue: Add link object

## Description
Refactor the `Link` model to be polymorphic using Django's `ContentType` framework (`GenericForeignKey`), so a single link object can be associated with either a `Game` or a `Character`. Scope: model and migration only — no serializer or view changes.

## Problem
The existing `Link` model only supports game-owned links via a direct `game` ForeignKey. Character links (issue #135) cannot reuse this model. A generic relation is needed so one model covers both cases.

## Expected Behavior
The `Link` model has `text`, `url`, `content_type` (FK to `ContentType`), and `object_id` (PositiveIntegerField) fields, with a `GenericForeignKey` named `content_object`. The `game` FK is removed. Existing link records are migrated: `content_type` is set to the `ContentType` for `Game` and `object_id` is copied from the old `game_id`.

## Solution
1. Update `source/games/models/link.py`: remove the `game` ForeignKey; add `content_type` (ForeignKey to `ContentType`), `object_id` (PositiveIntegerField), and a `GenericForeignKey('content_type', 'object_id')`.
2. Write a data + schema migration that:
   - Adds the new `content_type` and `object_id` columns.
   - Populates them for existing rows using the `ContentType` for `Game` and the existing `game_id` value.
   - Drops the old `game` FK column.

---

Tags: :shipit:
