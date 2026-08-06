export const buildResponse = (ok, acquired, status = ok ? 200 : 400) => ({
  ok,
  status,
  json: () => Promise.resolve({ acquired }),
});
