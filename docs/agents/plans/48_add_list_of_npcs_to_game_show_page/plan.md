# Plan: Add list of NPCs to game show page

Issue: [48_add_list_of_npcs_to_game_show_page.md](../../issues/48_add_list_of_npcs_to_game_show_page.md)

## Branch

`issue-48`

## Overview

Mirror the PCs preview section added in #47 for NPCs, reusing the existing `CharacterPreviewSection` component and `MAX_PREVIEW_CHARACTERS` constant. Fetch NPCs preview data in `GameController`, render the new section below the PCs section in `GameHelper`, and remove the now-redundant "Non-Player Characters" button.

## Agents involved

- [Frontend](frontend.md)
