import PlayerClient from '../../../../assets/js/client/PlayerClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../support/fetchMock.js';

describe('PlayerClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#fetchPlayer', function() {
    itSendsAuthHeader({
      call: (token) => new PlayerClient().fetchPlayer('demo', 42, token),
      url: '/games/demo/players/42.json',
      token: 'tok-abc',
    });
  });

  describe('#fetchConversations', function() {
    itSendsAuthHeader({
      call: (token) => new PlayerClient().fetchConversations('demo', 42, token),
      url: '/games/demo/conversations.json?player_id=42',
      token: 'tok-abc',
    });

    it('merges the player_id param into the given pagination params', async function() {
      await new PlayerClient().fetchConversations('demo', 42, null, new URLSearchParams({ page: '2' }));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/games/demo/conversations.json?page=2&player_id=42',
        jasmine.any(Object),
      );
    });

    it('defaults to no extra pagination params', async function() {
      await new PlayerClient().fetchConversations('demo', 42, null);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/games/demo/conversations.json?player_id=42',
        jasmine.any(Object),
      );
    });
  });
});
