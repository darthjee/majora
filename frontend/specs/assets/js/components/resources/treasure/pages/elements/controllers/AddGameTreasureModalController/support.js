export const buildTreasureClient = () => jasmine.createSpyObj('treasureClient', [
  'fetchMissingGameTreasuresPage', 'linkGameTreasure',
]);

export const buildResponse = (status, body, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
  headers: { get: (key) => headers[key] ?? null },
});
