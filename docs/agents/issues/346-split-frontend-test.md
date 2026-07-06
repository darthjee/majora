# Split frontend test

## Context

In the frontend test suite, several spec files test a class or module with more than one method (or more than one distinct scenario/concern) entirely within a single `*Spec.js` file. Many of these files have grown past 200-300 lines (e.g. `PcCharacterControllerSpec.js`, `CharacterHelperSpec.js`, `HeaderControllerSpec.js`, `TreasureClientSpec.js`, `AuthClientSpec.js`), making them harder to navigate and maintain.

Large spec files mix the tests for several unrelated methods, or several unrelated scenarios/contexts of the same method, together in one file. Finding the tests relevant to a single concern requires scrolling through unrelated setup and assertions, and future changes to a single method are more likely to produce large, hard-to-review diffs.

## What needs to be done

Break up spec files that test more than one method (or more than one distinct scenario for a single method) into a folder named after the class, with one spec file per concern inside it:

- Frontend: For classes with several independently-testable methods (e.g. `TreasureClient`, `AuthClient`, which already have clear `describe('#methodName', ...)` boundaries), create a folder named after the class (e.g. `TreasureClient/`) replacing the single `TreasureClientSpec.js` file, with one file per method inside it (e.g. `TreasureClient/fetchTreasureSpec.js`, `TreasureClient/createTreasureSpec.js`).
- Frontend: For classes/controllers that effectively test a single method through many flat scenarios (e.g. `PcCharacterControllerSpec.js`), group the scenarios by logical concern/context and split each group into its own file within the class-named folder (e.g. `PcCharacterController/tokenHandlingSpec.js`, `PcCharacterController/fullDetailFetchSpec.js`), instead of splitting by method name.
- Frontend: Shared setup/helpers used across the split files (e.g. a shared `buildEffectController` helper) should stay reusable across the files in the folder rather than being duplicated in each one.

This should be applied across the full set of existing spec files that qualify (test more than one method or more than one distinct scenario), not just a couple of examples.

Benefits: smaller, more focused spec files that are easier to navigate; changes to a single method/scenario produce smaller, more reviewable diffs; the convention gives contributors a clear pattern to follow for new spec files going forward.

## Acceptance criteria

- [ ] Spec files that test more than one method, or more than one distinct scenario for a single method, are split into a folder named after the class/module, with one file per method or per scenario group.
- [ ] Shared setup/helpers used across the split files remain reusable (not duplicated) within the folder.
- [ ] All resulting spec files pass the existing Jasmine test suite.
- [ ] The split is applied across the full set of existing qualifying spec files, not just isolated examples.

Tags: :shipit:
