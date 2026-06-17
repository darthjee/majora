# Plan: Add list of PCs to game show page

Issue: [47_add_list_of_pcs_to_game_show_page.md](../../issues/47_add_list_of_pcs_to_game_show_page.md)

## Branch

`issue-47`

## Overview

Replace the "Player Characters" button on the game show page with an embedded preview of up to 6 PCs, reusing the existing character-card rendering with a small-size variant and no pagination. A generic `CharacterPreviewSection` component is introduced so the upcoming NPCs preview (tracked separately) can reuse it without duplicating layout logic.

## Agents involved

- [Frontend](frontend.md)
