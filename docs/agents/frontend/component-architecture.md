## Component Architecture

Every non-trivial component is split into three layers.

### Component (`.jsx`)

The React component. Responsible for:

- Declaring state with `useState`
- Wiring effects with `useEffect`, delegating all logic to the controller
- Delegating all rendering to the helper

Stays lean — no business logic, no inline JSX beyond top-level conditionals. Declares state,
instantiates the controller, wires its effect, and delegates rendering to the helper based
on `loading`/`error`/success state (see `resources/game/pages/Games.jsx` for a reference
example).

### Controller (`.js` in `controllers/`)

A plain JS class, extending `BasePageController` (`components/common/base/controllers/BasePageController.js`).
Responsible for:

- Data fetching via the API client
- Building `useEffect` callbacks (`buildEffect()`)
- Preventing state updates after unmount (`buildSafeSetter()` from `BasePageController`)

No JSX. Receives state setters and an optional injected client in the constructor (see
`resources/game/pages/controllers/GamesController.js` for a reference example).

### Helper (`.jsx` in `helpers/`)

A static class. All methods are `static renderXxx()` returning JSX. No state, no side
effects (see `resources/game/pages/helpers/GamesHelper.jsx` for a reference example).


## Avoiding Inline JSX Conditionals

Render helpers should not mix conditional logic with large chunks of markup directly inline.
Pick one of these four extraction patterns, depending on what the condition guards:

1. **Condition wrapping a large block of HTML** — extract a dedicated component that receives
   the relevant attributes, so the call site becomes `{canEdit && <EditableSomething ... />}`.
   See `resources/character/pages/elements/CharacterInfo.jsx` / `common/cards/CardAvatar.jsx` for
   examples of components with conditional behaviour at their root.
2. **Condition wrapping a non-trivial existing component** — use
   `components/common/misc/ConditionalComponent.jsx`, which takes a `render` boolean prop and
   renders its `children` when true, `null` otherwise. The call site becomes
   `<ConditionalComponent render={canEdit}>...</ConditionalComponent>`. See
   `resources/game/pages/helpers/GameHelper.jsx`, `resources/character/pages/helpers/CharacterHelper.jsx`,
   `resources/character/pages/helpers/GameCharactersHelper.jsx`, and
   `resources/staff_user/pages/helpers/StaffUsersHelper.jsx` (`#renderRecoveryAction`) for
   concrete usages.
3. **Too many chained conditions** — extract the boolean expression into a named
   helper/controller method (e.g. `shouldRender()`) so the JSX reads
   `{shouldRender() && <SomeComponent />}`, instead of chaining several `&&` checks inline.
4. **Large inline markup without a natural component boundary** — extract a private
   `static renderXxx()` helper method following the existing convention in `helpers/*.jsx`
   (e.g. `CharacterHelper.#renderPrivateDescription`, `StaffUsersHelper.#renderRecoveryAction`),
   instead of writing the markup inline.
