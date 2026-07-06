export const buildClients = () => ({
  characterClient: jasmine.createSpyObj('characterClient', [
    'fetchPcTreasuresPage', 'fetchNpcTreasuresPage',
    'acquirePcTreasure', 'sellPcTreasure', 'acquireNpcTreasure', 'sellNpcTreasure',
  ]),
  treasureClient: jasmine.createSpyObj('treasureClient', ['fetchGameTreasuresPage']),
});

export const buildResponse = (status, body, headers = {}) => ({
  ok: status === 200,
  status,
  json: () => Promise.resolve(body),
  headers: { get: (key) => headers[key] ?? null },
});
