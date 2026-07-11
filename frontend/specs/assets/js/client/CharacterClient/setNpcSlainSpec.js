import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient slain', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#setNpcSlain', function() {
    itSendsAuthHeader({
      call: (token) => new CharacterClient().setNpcSlain('demo', '2', token, { slain: token !== null }),
      url: '/games/demo/npcs/2/full.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: (token) => JSON.stringify({ slain: token !== null }),
    });

    it('sends only the public_slain field when toggling the public state', async function() {
      await new CharacterClient().setNpcSlain('demo', '2', 'auth-token', { public_slain: true });

      const [, options] = globalThis.fetch.calls.mostRecent().args;
      expect(options.body).toBe(JSON.stringify({ public_slain: true }));
    });
  });
});
