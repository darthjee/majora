import { act } from 'react';
import { useContainer } from 'navi-hey/testing/dom.js';
import { mockFetchSuccess, mockFetchFailure } from 'navi-hey/testing/fetch.js';
import descriptors from '../../src/frontend/entry.js';

// NOTE: `mockFetchFailure(status)` (navi-hey/frontend-support/fetch.js in the
// darthjee/navi-hey-test image) only stubs `{ ok: false, status }` — it does
// not give the stubbed response a `.json()` method at all. EnqueuePage's
// submit handler therefore throws while trying to call `response.json()`,
// which is caught by its outer `catch (err)` branch instead of reading
// `body.error` from the route contract. The rendered error message is
// whatever `err.message` a "response.json is not a function" TypeError
// produces, not the route contract's literal text — so the assertions below
// only check that the error state rendered, not its exact wording.

describe('EnqueuePage', () => {
  const state = useContainer();

  it('exposes the /ext/lootstudios/enqueue descriptor', () => {
    const descriptor = descriptors.find((d) => d.path === '/ext/lootstudios/enqueue');
    expect(descriptor.text).toBe('Loot Enqueue');
  });

  describe('on a successful enqueue', () => {
    mockFetchSuccess({
      status: 'enqueued',
      slug: 'tidal-aberrations',
      namespace: 'enqueue_tidal-aberrations_uuid',
    });

    it('renders the input and button, then the confirmation on submit', async () => {
      const EnqueuePage = descriptors.find((d) => d.path === '/ext/lootstudios/enqueue').component;

      await act(async () => {
        state.root.render(<EnqueuePage />);
      });

      expect(state.container.querySelector('input')).not.toBeNull();
      expect(state.container.querySelector('button')).not.toBeNull();

      await act(async () => {
        state.container.querySelector('form').requestSubmit();
      });

      expect(state.container.textContent).toContain('tidal-aberrations');
      expect(state.container.textContent).toContain('enqueue_tidal-aberrations_uuid');
      expect(state.container.querySelector('.loot-enqueue-confirmation')).not.toBeNull();
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
