# Extract Header's controller/effect wiring into a hook

`Header` (`frontend/assets/js/components/common/header/Header.jsx:29`, 58 lines) already delegates two of its effects to hooks (`useHeaderAuthEffect`, `useDomainConfigEffect`, both under `./hooks/`), but still inlines: constructing all three controllers (`HeaderController`, `HeaderViewAsController`, `HeaderGameAccessController`, currently lines 43–58), the game-access effect (`useEffect(() => gameAccessController.buildEffect(route.gameSlug)(), ...)`, lines 64–66), and the domain-config-fetch effect (`useEffect(() => { controller.fetchDomainConfig(); }, [])`, lines 68–70).

Add a new hook, `hooks/useHeaderControllers.js`, following the existing `useDomainConfigEffect.js` shape (a plain, separately-testable function plus a thin `useEffect`/`useMemo`-wrapping default export). It should:

- Take the same setters `Header` currently passes into `new HeaderController(...)`, plus `setCanViewAs`, `setShowViewAsModal`, `setGameAccess`, and `route.gameSlug`.
- Build and memoize the three controllers.
- Wire the game-access effect and the domain-config-fetch effect internally (both currently one-line arrow bodies — keep them exactly as-is, just relocated).
- Return `{ controller, viewAsController, gameAccessController }`.

`Header` then becomes: keep its 13 `useState` declarations and the `useHeaderAuthEffect`/`useDomainConfigEffect` calls as-is, call the new hook once for the three controllers, and keep the final `return` unchanged.

## Files to Change

- `frontend/assets/js/components/common/header/hooks/useHeaderControllers.js` — new hook, per above.
- `frontend/assets/js/components/common/header/Header.jsx` — replace inline controller construction and the two relocated effects with a single call to `useHeaderControllers`.
