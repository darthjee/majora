import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#handleCharacterResponse', function() {
    it('returns the parsed JSON when the response is ok', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));
      const response = {
        ok: true,
        json: () => Promise.resolve({ id: 2, name: 'Hero' }),
      };

      const result = await controller.handleCharacterResponse(response);

      expect(result).toEqual({ id: 2, name: 'Hero' });
    });

    it('throws when the response is not ok', function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));
      const response = { ok: false };

      expect(() => controller.handleCharacterResponse(response)).toThrowError('Unable to load character.');
    });
  });
});
