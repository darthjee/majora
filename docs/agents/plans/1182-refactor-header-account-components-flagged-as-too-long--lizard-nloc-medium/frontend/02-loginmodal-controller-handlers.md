# LoginModal.jsx: move handler bulk onto LoginModalController

`LoginModal` (`frontend/assets/js/components/resources/account/LoginModal.jsx`, currently 51 NLOC) is handler-heavy the same way `Header.jsx` is. `LoginModalController` already owns most of the component's setters (`setUsername`, `setPassword`, `setIncorrect`, `setError`, `setRecoverySent`, `setAuthorizeStatus`) and already has its own `handleClear`/`handleSubmit`/`handleRecoverSubmit`/`handleAuthorizeSubmit`/`handleAuthorizeReset` methods — `mode`/`email` are the only state the component still manages locally, which is why `LoginModal.jsx` currently re-wraps several controller methods instead of calling them directly.

Move the handler bulk onto the controller, consistent with `01-header-effect-hook-and-handlers.md`'s controller-first direction:

- Extend `LoginModalController`'s constructor to also accept `setMode`/`setEmail`.
- Fold the component-local `handleClear` (today: `controller.handleClear()` + `setMode('login')` + `setEmail('')`) directly into the controller's existing `handleClear()` method, now that it owns `setMode`/`setEmail` too.
- Add `handleClose` (today: calls `handleClear()` then `onClose()`) as a controller method taking the component's `onClose` callback as an argument (the controller doesn't own `onClose`, so it stays a passed-in param rather than a constructor field, since it's specific to a single call site).
- Add event-guarded wrapper methods on the controller for `handleSubmit`/`handleRecoverSubmit`/`handleAuthorizeSubmit` (today: each component-local handler does the same `if (event && typeof event.preventDefault === 'function') { event.preventDefault(); }` guard before delegating to the controller's existing `username`/`password`-taking method) — dedupe the 3×-repeated guard into one private controller helper, e.g. `#preventDefault(event)`, used by all three wrappers.
- Add `handleRegisterClick` (today: `handleClose()` + `window.location.hash = '/users/register'`) and `handleModeChange` (today: `controller.handleAuthorizeReset()` + `setPassword('')` + `setIncorrect(false)` + `setError(false)` + `setMode(newMode)`) as controller methods.
- Trivial one-line handlers that just forward an event's value to a single setter (`onUsernameChange`, `onPasswordChange`, `onEmailChange`, `onForgotPasswordClick`, `onBackToLoginClick`) stay inline in `LoginModal.jsx` — they're not part of what pushes this method over the limit and moving them would add indirection without reducing NLOC meaningfully.

After this, `LoginModal.jsx` shrinks to: state declarations, the `poller` memo, controller instantiation (now passing `setMode`/`setEmail` too), the handful of trivial inline handlers above, and the delegate call to `LoginModalHelper.render`, wiring the controller's new methods directly (e.g. `onSubmit: (event) => controller.handleSubmit(event, username, password)`).

## Files to Change

- `frontend/assets/js/components/resources/account/controllers/LoginModalController.js` — constructor gains `setMode`/`setEmail`; `handleClear` extended to reset them; new methods `handleClose(onClose)`, `handleRegisterClick(onClose)`, `handleModeChange(newMode)`, and event-guarded wrappers for submit/recover/authorize-submit, plus the shared private `#preventDefault(event)` helper.
- `frontend/assets/js/components/resources/account/LoginModal.jsx` — remove the extracted handlers; wire the controller's new methods into the object passed to `LoginModalHelper.render`; keep the trivial one-line handlers listed above.
- `frontend/specs/assets/js/components/resources/account/controllers/LoginModalController/handleClearSpec.js` — update to also assert `setMode`/`setEmail` reset.
- `frontend/specs/assets/js/components/resources/account/controllers/LoginModalController/` — add new spec files for `handleClose`, `handleRegisterClick`, `handleModeChange`, and the submit/recover/authorize-submit event-guarded wrappers, following the folder's existing one-file-per-method convention (see `handleSubmitSpec.js`, `handleAuthorizeSubmitSpec.js` for style).
- `frontend/specs/assets/js/components/resources/account/LoginModalSpec.js` — no assertion changes expected (rendered-output regression signal); re-run to confirm.
