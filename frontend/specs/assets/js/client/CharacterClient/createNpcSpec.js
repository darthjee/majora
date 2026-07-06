import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient#createNpc', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  it('sends the fields and auth token when present', async function() {
    const client = new CharacterClient();

    await client.createNpc('demo', 'abc123', { name: 'Goblin King' });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Token abc123',
        'X-Skip-Cache': 'true',
      },
      body: JSON.stringify({ name: 'Goblin King' }),
    });
  });

  it('omits the Authorization header when there is no token', async function() {
    const client = new CharacterClient();

    await client.createNpc('demo', null, { name: 'Goblin King' });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs.json', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Skip-Cache': 'true',
      },
      body: JSON.stringify({ name: 'Goblin King' }),
    });
  });
});
