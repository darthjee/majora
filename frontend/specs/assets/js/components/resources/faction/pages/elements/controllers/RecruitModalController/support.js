export const buildResponse = (ok, status = ok ? 200 : 400) => ({
  ok,
  status,
  json: () => Promise.resolve({}),
});
