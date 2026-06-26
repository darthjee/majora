# Issue: Extract common page component CharacterEdit

## Description
The page components `NpcCharacterEdit.jsx` and `PcCharacterEdit.jsx` are structurally identical in logic — every state variable, both `useEffect` calls, and the `handleSubmit` function are duplicated verbatim. The same duplication exists in their helper classes (`NpcCharacterEditHelper` / `PcCharacterEditHelper`) and controller classes (`NpcCharacterEditController` / `PcCharacterEditController`).

## Problem
Any change to the shared edit-page logic must be applied in multiple places (component, helper, controller), creating a maintenance burden and risk of divergence between the NPC and PC flows.

## Solution
1. Extract a shared `CharacterEdit` component (at `components/pages/shared/CharacterEdit.jsx`) that accepts the varying parts — `ControllerClass`, `getParamsFromHash`, and `EditHelper` — as props, replacing the duplicated logic in `NpcCharacterEdit` and `PcCharacterEdit`.
2. Extract a `BaseCharacterEditHelper` that accepts `idPrefix` and `i18nNamespace` as constructor arguments, providing all shared render methods generically, so `NpcCharacterEditHelper` and `PcCharacterEditHelper` can delegate to it or be removed.
3. Extract a `BaseCharacterEditController` holding the shared `submitForm`, `applyLoadedCharacter`, and `buildEffect` logic, with subclasses only providing the route segment, API method, and inner load controller.

## Benefits
- Single source of truth for the character edit page logic across component, helper, and controller layers.
- Future logic changes only need to be made once.
- Reduces risk of the NPC and PC edit flows diverging unintentionally.
