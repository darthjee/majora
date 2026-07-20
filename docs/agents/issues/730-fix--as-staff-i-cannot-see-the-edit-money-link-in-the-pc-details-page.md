# Issue: Fix: As staff I cannot see the edit money link in the PC details page

## Description
On a PC (player character) details page (e.g. `/@/games/<game_slug>/pcs/<id>`), a staff user should be able to see an "Edit" link next to the money component in the left-side column, allowing them to open the edit-money modal. Currently, staff cannot see this link.

## Problem
Staff users (Django `is_staff` accounts, not scoped to a specific game) do not see the "Edit" link under the money breakdown in the `CharacterMoney` component on the PC details page. The money amounts themselves still render correctly — only the "Edit" link/button is missing — even though the backend already grants staff blanket money-edit access: `CharacterMoneyEditPermission.is_allowed` (`backend/games/permissions.py`) returns `True` for any `user.is_staff`, regardless of the specific game. This blocks staff from opening the edit-money modal for a PC from this page. Confirmed still reproducible on the current `main`.

## Expected Behavior
When a staff user views a PC's details page, the money component's "Edit" link should be visible and clickable, opening `MoneyEditModal` just as it does for the PC's owning player, a game master, or a superuser.

## Solution
To be investigated further during planning. Statically, the permission chain reads as correct end to end: `CharacterMoneyEditPermission.is_allowed` (`backend/games/permissions.py:117-130`) returns `True` unconditionally for any `user.is_staff` → `CharacterDetailSerializer.get_can_edit_money` (`backend/games/serializers/characters/character_detail.py:57-61`) passes `request.user` straight into it → the `canEditMoney` gate in `CharacterMoneyHelper.render` (`frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx:35-46`) shows the "Edit" link whenever `character.can_edit_money` is truthy, independent of the money breakdown itself (consistent with amounts rendering fine while only the link is missing). Since the bug is confirmed reproducible, the actual defect is likely not in this chain's logic but in what `request.user`/`character.can_edit_money` actually resolves to for the reported staff account on this specific request — worth checking with a live repro (exact game/character/account, and server-side logging of `request.user.is_staff` and the serialized `can_edit_money` value) rather than assuming a code-level logic error in the files above.

## Benefits
Staff can manage a PC's money directly from the PC details page without an alternate path, matching the access staff already have on other edit affordances (e.g. the photo-upload control).
