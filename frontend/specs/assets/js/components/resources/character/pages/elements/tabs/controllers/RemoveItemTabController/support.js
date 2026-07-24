export const buildResponse = (status, body) => ({
  ok: status === 204,
  status,
  json: () => Promise.resolve(body),
});
