import routes from '../../src/backend/hello.js';

describe('hello backend extension', () => {
  it('declares GET /ext/loot/hello.json', () => {
    const [route] = routes;
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/ext/loot/hello.json');
  });

  it('writes a JSON hello payload', () => {
    let body;
    const response = { json: (payload) => { body = payload; } };
    new routes[0].handler({}, response).handle();
    expect(body.extension).toBe('navi-loot-extension');
    expect(body.status).toBe('ok');
  });
});
