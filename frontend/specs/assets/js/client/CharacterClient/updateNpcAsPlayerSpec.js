import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient player NPC update', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#updateNpcAsPlayer', function() {
    const fields = { public_description: 'A brave hero', allegiance: 'ally', slain: false, links: [] };

    itSendsAuthHeader({
      call: (token) => new CharacterClient().updateNpcAsPlayer('demo', '2', token, fields),
      url: '/games/demo/npcs/2.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify(fields),
    });

    it('PATCHes the plain NPC endpoint, not full.json', async function() {
      await new CharacterClient().updateNpcAsPlayer('demo', '2', 'auth-token', fields);

      const [url] = globalThis.fetch.calls.mostRecent().args;
      expect(url).toBe('/games/demo/npcs/2.json');
      expect(url).not.toContain('full.json');
    });

    it('sends the given fields as the request body, unchanged', async function() {
      await new CharacterClient().updateNpcAsPlayer('demo', '2', 'auth-token', fields);

      const [, options] = globalThis.fetch.calls.mostRecent().args;
      expect(options.body).toBe(JSON.stringify(fields));
    });
  });
});
