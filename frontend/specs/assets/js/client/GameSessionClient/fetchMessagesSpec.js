import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameSessionClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchMessages', function() {
    itSendsAuthHeader({
      call: (token) => new GameSessionClient().fetchMessages('demo', 42, token),
      url: '/games/demo/sessions/42/messages.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });

    it('appends a next-entry-id query param when given a cursor', async function() {
      await new GameSessionClient().fetchMessages('demo', 42, 'tok-abc', 7);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/games/demo/sessions/42/messages.json?next-entry-id=7',
        jasmine.objectContaining({ method: 'GET' }),
      );
    });

    it('omits the query param when there is no cursor', async function() {
      await new GameSessionClient().fetchMessages('demo', 42, 'tok-abc');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/games/demo/sessions/42/messages.json',
        jasmine.objectContaining({ method: 'GET' }),
      );
    });

    it('sends X-Skip-Cache even when a next-entry-id cursor is present', async function() {
      await new GameSessionClient().fetchMessages('demo', 42, 'tok-abc', 7);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/games/demo/sessions/42/messages.json?next-entry-id=7',
        jasmine.objectContaining({
          method: 'GET',
          headers: jasmine.objectContaining({ 'X-Skip-Cache': 'true' }),
        }),
      );
    });
  });
});
