# Plan: Add GameRecipe model and read endpoints

Issue: [1445-add-gamerecipe-model-and-read-endpoints.md](../../issues/1445-add-gamerecipe-model-and-read-endpoints.md)

## Overview

Add the `GameRecipe` model (no photo) and its six read endpoints: plain / `all` index and plain /
`full` detail under `/games/<slug>/recipes`, plus plain / `all` index under
`/games/<slug>/common_items/<id>/recipes`. Output items are masked when hidden, and a category
filter is added. Also add the matching access-control and product docs. Backend only.

See [backend.md](backend.md) for the full plan.
