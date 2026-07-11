import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient player slain', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#setNpcPublicSlainAsPlayer', function() {
    itSendsAuthHeader({
      call: (token) => new CharacterClient().setNpcPublicSlainAsPlayer('demo', '2', token, true),
      url: '/games/demo/npcs/2.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ slain: true }),
    });

    it('PATCHes the plain NPC endpoint, not full.json', async function() {
      await new CharacterClient().setNpcPublicSlainAsPlayer('demo', '2', 'auth-token', false);

      const [url] = globalThis.fetch.calls.mostRecent().args;
      expect(url).toBe('/games/demo/npcs/2.json');
      expect(url).not.toContain('full.json');
    });

    it('sends only the slain field in the request body', async function() {
      await new CharacterClient().setNpcPublicSlainAsPlayer('demo', '2', 'auth-token', false);

      const [, options] = globalThis.fetch.calls.mostRecent().args;
      expect(options.body).toBe(JSON.stringify({ slain: false }));
    });
  });
});
