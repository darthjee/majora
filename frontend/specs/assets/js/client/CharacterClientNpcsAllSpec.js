import CharacterClient from '../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient#fetchNpcsAll', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  it('sends the auth token when present', async function() {
    await new CharacterClient().fetchNpcsAll('demo', 'abc123');
    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/all.json', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Token abc123',
        'X-Skip-Cache': 'true',
      },
      body: undefined,
    });
  });

  it('omits the Authorization header when there is no token', async function() {
    await new CharacterClient().fetchNpcsAll('demo', null);
    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/all.json', {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    });
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
