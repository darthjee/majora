# App-wide error boundary

Add `frontend/assets/js/components/common/misc/AppErrorBoundary.jsx`, a class component
(`getDerivedStateFromError` + `componentDidCatch`, which `console.error`s the error and
component stack). On error it renders a Bootstrap alert with:

- `Translator.t('error_boundary.title')` and `Translator.t('error_boundary.message')`;
- a button labelled `Translator.t('error_boundary.reload')` that calls
  `globalThis.location.reload()` (injectable for specs).

No error details are shown to the user. Wrap the root tree with it: in `main.jsx`'s
`createAppElement()`, `<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>`.
Follow the project's controller/helper split if it applies to class components; keep it
minimal otherwise.

## Files to Change

- `frontend/assets/js/components/common/misc/AppErrorBoundary.jsx`: new.
- `frontend/assets/js/main.jsx`: wrap `<App />`.
- Jasmine specs: renders its children normally; a throwing child renders the fallback with the
  translated texts; the reload button calls the injected reload; the error is logged.
