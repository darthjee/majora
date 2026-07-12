export const ACCESS_DEFAULT = {
  username: null,
  is_superuser: null,
  is_staff: null,
  is_dm: null,
  is_player: false,
  is_owner: false,
};

/**
 * @description Builds a fake `Response`-shaped object for mocking the access endpoints.
 * @param {object} body - JSON body the mocked response resolves to.
 * @param {boolean} [ok] - Whether the response is "ok".
 * @returns {{ok: boolean, json: Function}} A fake Response object.
 */
export function fakeResponse(body, ok = true) {
  return { ok, json: () => Promise.resolve(body) };
}
