# Add the frontend spec

Create `enqueue_page_spec.jsx`, mirroring `hello_page_spec.jsx`'s shape
(`useContainer` + `mockFetchSuccess`/`mockFetchFailure` + rendering via the
`entry.js` descriptor), extended to cover both the confirmation and error
render states and a real form submission.

```jsx
import { act } from 'react';
import { useContainer } from 'navi-hey/testing/dom.js';
import { mockFetchSuccess, mockFetchFailure } from 'navi-hey/testing/fetch.js';
import descriptors from '../../src/frontend/entry.js';

describe('EnqueuePage', () => {
  const state = useContainer();

  it('exposes the /ext/lootstudios/enqueue descriptor', () => {
    const descriptor = descriptors.find((d) => d.path === '/ext/lootstudios/enqueue');
    expect(descriptor.text).toBe('Loot Enqueue');
  });

  describe('on a successful enqueue', () => {
    mockFetchSuccess({ status: 'enqueued', slug: 'tidal-aberrations', namespace: 'enqueue_tidal-aberrations_uuid' });

    it('renders the input and button, then the confirmation on submit', async () => {
      const EnqueuePage = descriptors.find((d) => d.path === '/ext/lootstudios/enqueue').component;

      await act(async () => {
        state.root.render(<EnqueuePage />);
      });

      expect(state.container.querySelector('input')).not.toBeNull();
      expect(state.container.querySelector('button')).not.toBeNull();

      // fill and submit — see note below on driving the form.
      await act(async () => {
        state.container.querySelector('form').requestSubmit();
      });

      expect(state.container.textContent).toContain('tidal-aberrations');
    });
  });

  describe('on a failed enqueue', () => {
    mockFetchFailure(400);

    it('renders the error state', async () => {
      const EnqueuePage = descriptors.find((d) => d.path === '/ext/lootstudios/enqueue').component;

      await act(async () => {
        state.root.render(<EnqueuePage />);
      });

      await act(async () => {
        state.container.querySelector('form').requestSubmit();
      });

      expect(state.container.querySelector('.loot-enqueue-error')).not.toBeNull();
    });
  });
});
```

This is illustrative, not final — adjust once `mockFetchFailure`'s real
body-shaping behavior is confirmed (see `crawler.md`'s Notes section):

- If `mockFetchFailure(status)` produces a body carrying the route
  contract's real `{ error: '...' }` shape, assert the exact message text
  (`'url must be an https://app.lootstudios.com/bundle/<slug>/ URL'` for the
  `400` case) instead of just the presence of `.loot-enqueue-error`.
- If it does not (e.g. empty body), keep the assertion to "the error state
  rendered" as above, and add a one-line comment in the spec explaining why
  the exact text isn't asserted.
- Driving the submit: `state.container.querySelector('form').requestSubmit()`
  is one option; if the test double's jsdom environment doesn't support
  `requestSubmit`, dispatch a `submit` Event on the form node instead, or
  simulate a click on the button — whichever the existing
  `navi-hey/testing/dom.js` container setup supports (check other Navi
  extension examples/specs, if any exist in the pulled test image, via
  `docker compose run --rm extension_tests sh`).

## Files to Change

- `crawler/navi-extension/tests/frontend/enqueue_page_spec.jsx` (new) — the
  spec above, adjusted per the notes.
