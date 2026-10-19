import { PermissionError } from '../../../src/core/errors/PermissionError.js';

describe('PermissionError', () => {
  const build = (body) => new PermissionError({ status: 403, method: 'GET', path: '/games/x/npcs/all.json', body });

  ['scope_missing', 'game_not_allowed', 'token_not_allowed'].forEach((code) => {
    it(`exposes ${code} as code`, () => {
      expect(build({ errors: { detail: [code] } }).code).toEqual(code);
    });
  });

  it('has a null code for a role denial', () => {
    expect(build({ detail: 'You do not have permission to perform this action.' }).code).toBeNull();
  });

  it('has a null code for an empty body', () => {
    expect(build('').code).toBeNull();
  });
});
