# Shrink Header
`Header` (`Header.jsx:28`) is 53 lines and needs to lose at least 3. Most of its body is the 11 `useState` declarations plus the large `HeaderHelper.render` state object.

Suggested extraction: move the `useState` declarations into a new `useHeaderState` hook in `hooks/`, returning the values and their setters (or a `{ state, setters }` pair), and have `Header` pass those straight to `useHeaderControllers`. The lazy initializers (`new HeaderController().getRoute()`, `AccessStore.getGameAccess(...)`, `AccessStore.getFacade().enabled`) and `DEFAULT_DOMAIN_CONFIG` move with them unchanged. Alternatively, build the render-state object (including the `canViewAs || Boolean(gameAccess.is_dm)` derivation) in a small pure function on `HeaderHelper`.

Add a spec for whatever new function or hook is introduced.

## Files to Change
- `frontend/assets/js/components/common/header/Header.jsx` — replace the extracted code with calls to the new hook/helper.
- `frontend/assets/js/components/common/header/hooks/useHeaderState.js` — new hook (or `helpers/HeaderHelper.jsx` if the render-state builder is chosen instead).
- `frontend/specs/assets/js/components/common/header/hooks/useHeaderStateSpec.js` — new spec for the extraction.
