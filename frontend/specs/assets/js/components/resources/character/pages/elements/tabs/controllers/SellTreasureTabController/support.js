export const buildClients = () => ({
  characterClient: jasmine.createSpyObj('characterClient', ['sellTreasure']),
});

export const buildResponse = (status, body) => ({
  ok: status === 200,
  status,
  json: () => Promise.resolve(body),
});
