export const buildResponse = (ok, status = ok ? 201 : 400) => ({
  ok,
  status,
  json: () => Promise.resolve({}),
});
