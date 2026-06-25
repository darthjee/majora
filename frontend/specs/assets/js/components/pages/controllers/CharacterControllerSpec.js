import CharacterController
  from '../../../../../../assets/js/components/pages/controllers/CharacterController.js';

/**
 * Minimal concrete subclass used to exercise CharacterController logic.
 * The abstract fetch hooks are implemented as plain methods so Jasmine
 * can spy on them.
 */
class StubCharacterController extends CharacterController {
  constructor(setCharacter, setLoading, setError, paramsFromHash, characterClient) {
    super(setCharacter, setLoading, setError, null, paramsFromHash, characterClient);
  }

  fetchCharacter(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: false });
  }

  fetchCharacterFull(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: false });
  }

  fetchCharacterAccess(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: false });
  }
}

describe('CharacterController', function() {
  const safeSet = (setter, value) => setter(value);

  const buildController = (setCharacter, overrides = {}) => {
    const controller = new StubCharacterController(
      setCharacter,
      () => {},
      () => {},
      () => ({ game_slug: 'demo', character_id: '2' }),
      null,
    );

    if (overrides.fetchCharacter) {
      spyOn(controller, 'fetchCharacter').and.callFake(overrides.fetchCharacter);
    }
    if (overrides.fetchCharacterFull) {
      spyOn(controller, 'fetchCharacterFull').and.callFake(overrides.fetchCharacterFull);
    }
    if (overrides.fetchCharacterAccess) {
      spyOn(controller, 'fetchCharacterAccess').and.callFake(overrides.fetchCharacterAccess);
    }

    return controller;
  };

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

  describe('#mergePrivateDescription', function() {
    it('merges the private description into the character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);
      const fullResponse = { json: () => Promise.resolve({ private_description: 'Secret notes.' }) };

      await controller.mergePrivateDescription(fullResponse, { id: 2 }, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, private_description: 'Secret notes.' });
    });
  });

  describe('#fetchAndMergeAccess', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches access and merges can_edit onto the character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ can_edit: false }),
        }),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(controller.fetchCharacterAccess).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
    });

    it('falls back to original character when access endpoint returns non-ok', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.resolve({ ok: false }),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('falls back to original character when access endpoint throws', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.reject(new Error('Network error')),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('calls loadFullCharacter with the merged character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ can_edit: true }),
        }),
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ private_description: 'Secret notes.' }),
        }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true, private_description: 'Secret notes.' });
    });
  });

  describe('#loadFullCharacter', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('sets the character without fetching full detail when can_edit is false', function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });
      const result = controller.loadFullCharacter({ id: 2, can_edit: false }, params, null, safeSet);

      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(result).toBeUndefined();
    });

    it('fetches full detail when can_edit is true', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ private_description: 'Secret notes.' }),
        }),
      });

      await controller.loadFullCharacter({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: true, private_description: 'Secret notes.',
      });
    });
  });
});
