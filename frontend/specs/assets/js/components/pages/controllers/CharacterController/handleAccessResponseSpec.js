import { buildController } from './support.js';

describe('CharacterController', function() {
  describe('#handleAccessResponse', function() {
    it('overlays can_edit onto the character when the response is ok', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));
      const accessResponse = {
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      };

      const result = await controller.handleAccessResponse(accessResponse, { id: 2 });

      expect(result).toEqual({ id: 2, can_edit: true });
    });

    it('returns the original character when the response is not ok', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'));
      const accessResponse = { ok: false };

      const result = await controller.handleAccessResponse(accessResponse, { id: 2, can_edit: false });

      expect(result).toEqual({ id: 2, can_edit: false });
    });
  });
});
