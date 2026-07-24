export const buildClients = () => ({
  characterClient: jasmine.createSpyObj('characterClient', ['acquireItem', 'acquireItemAll']),
});

export const buildResponse = (status, body) => ({
  ok: status === 201,
  status,
  json: () => Promise.resolve(body),
});
