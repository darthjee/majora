import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient#fetchNpcsAll', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  itSendsAuthHeader({
    call: (token) => new CharacterClient().fetchNpcsAll('demo', token),
    url: '/games/demo/npcs/all.json',
    headers: { 'X-Skip-Cache': 'true' },
  });

  it('appends query params to the URL', async function() {
    await new CharacterClient().fetchNpcsAll('demo', 'abc123', { per_page: 6 });
    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/all.json?per_page=6', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Token abc123',
        'X-Skip-Cache': 'true',
      },
      body: undefined,
    });
  });
});
