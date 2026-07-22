export const buildClients = () => ({
  characterClient: jasmine.createSpyObj('characterClient', [
    'fetchTreasuresPage', 'acquireTreasure', 'acquireTreasureAll', 'sellTreasure',
  ]),
});

export const buildResponse = (status, body, headers = {}) => ({
  ok: status === 200,
  status,
  json: () => Promise.resolve(body),
  headers: { get: (key) => headers[key] ?? null },
});
