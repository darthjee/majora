# Plan: Add game_slug to characters response

Issue: [46_add_game_slug_to_characters_response.md](../../issues/46_add_game_slug_to_characters_response.md)

## Branch

`issue-46`

## Overview

Add a `game_slug` field to the character serializers so every character response (list and detail, PCs and NPCs) includes the slug of the game it belongs to.

## Agents involved

- [Backend](backend.md)

## Shared contracts

- `CharacterListSerializer` and `CharacterDetailSerializer` output now include `"game_slug": "<slug>"`, sourced from `character.game.game_slug`. No frontend work requested in this issue.
