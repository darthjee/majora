export const buildClients = () => ({
  characterClient: jasmine.createSpyObj('characterClient', [
    'fetchTreasuresPage', 'acquireTreasure', 'sellTreasure',
  ]),
  treasureClient: jasmine.createSpyObj('treasureClient', ['fetchGameTreasuresPage']),
});

export const buildResponse = (status, body, headers = {}) => ({
  ok: status === 200,
  status,
  json: () => Promise.resolve(body),
  headers: { get: (key) => headers[key] ?? null },
});
