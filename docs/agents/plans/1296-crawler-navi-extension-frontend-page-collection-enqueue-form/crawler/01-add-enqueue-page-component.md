# Add the EnqueuePage component

Create `EnqueuePage.jsx`, a controlled form with three render states:
idle/editing, a submit-confirmation message, and an error message. Unlike
`HelloPage.jsx` (which fetches on mount), this page only calls `fetch` on
submit, and only ever issues the one `POST`.

Component shape:

```jsx
import { useState } from 'react';
import './EnqueuePage.css';

export default function EnqueuePage () {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null); // { status: 'enqueued', slug, namespace } | { error: string } | null
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/ext/lootstudios/enqueue.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setResult(body);
      } else {
        setResult({ error: body.error || 'Enqueue failed' });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="loot-enqueue-form" onSubmit={handleSubmit}>
      <label htmlFor="loot-enqueue-url">Collection URL</label>
      <input
        id="loot-enqueue-url"
        type="text"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://app.lootstudios.com/bundle/<slug>/"
      />
      <button type="submit" disabled={submitting}>Enqueue</button>

      {result && !result.error && (
        <p className="loot-enqueue-confirmation">
          Enqueued {result.slug} (namespace {result.namespace})
        </p>
      )}
      {result && result.error && (
        <p className="loot-enqueue-error">{result.error}</p>
      )}
    </form>
  );
}
```

Notes on the shape above (adjust as needed while implementing, this is not
meant to be pasted verbatim):

- `response.ok` covers the `200` case; every other status (`400`/`404`/`502`)
  falls into the error branch and reads `body.error` per the route
  contract's table (`crawler.md`'s "Context" section). The `body.error ||
  'Enqueue failed'` fallback protects against a body that doesn't parse as
  JSON or doesn't carry an `error` field.
- A network-level failure (the `fetch` promise itself rejecting) is a
  separate `catch` branch reusing the same `error`-shaped `result`, so the
  render logic only ever needs to check one thing (`result.error`).
- No client-side URL format validation is added — the backend already
  validates and returns a precise `400` message on a malformed URL; keep
  this page thin and let the backend own that rule (do not duplicate the
  `BUNDLE_URL_PATTERN` regex from `enqueue.js`).
- `EnqueuePage.css` can be minimal (e.g. spacing/layout for the form and a
  distinct color for `.loot-enqueue-error` vs `.loot-enqueue-confirmation`)
  — this project has no existing CSS file to match a convention against, so
  keep it small and readable.

## Files to Change

- `crawler/navi-extension/src/frontend/EnqueuePage.jsx` (new) — the
  component above.
- `crawler/navi-extension/src/frontend/EnqueuePage.css` (new) — minimal
  layout/state styling for the form, confirmation, and error states.
