import { act } from 'react';
import { useContainer } from 'navi-hey/testing/dom.js';
import { mockFetchSuccess } from 'navi-hey/testing/fetch.js';
import descriptors from '../../src/frontend/entry.js';

describe('HelloPage', () => {
  const state = useContainer();
  mockFetchSuccess({ extension: 'navi-loot-extension', status: 'ok' });

  it('exposes the /ext/loot/hello descriptor', () => {
    expect(descriptors[0].path).toBe('/ext/loot/hello');
    expect(descriptors[0].text).toBe('Loot Hello');
  });

  it('renders the fetched hello status', async () => {
    const HelloPage = descriptors[0].component;

    await act(async () => {
      state.root.render(<HelloPage />);
    });

    expect(state.container.textContent).toContain('navi-loot-extension: ok');
  });
});
