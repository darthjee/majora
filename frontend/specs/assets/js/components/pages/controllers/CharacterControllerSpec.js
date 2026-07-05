import CharacterController
  from '../../../../../../assets/js/components/pages/controllers/CharacterController.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

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

  fetchCharacterTreasures(gameSlug, characterId, token) { // eslint-disable-line no-unused-vars
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }
}

describe('CharacterController', function() {
  const safeSet = (setter, value) => setter(value);

  const buildController = (setCharacter, overrides = {}) => {
    const controller = new StubCharacterController(
      setCharacter,
      Noop.noop,
      Noop.noop,
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
    if (overrides.fetchCharacterTreasures) {
      spyOn(controller, 'fetchCharacterTreasures').and.callFake(overrides.fetchCharacterTreasures);
    }

    return controller;
  };

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

  describe('#loadCharacter', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches the character and merges access on success', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacter: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2 }),
        }),
        fetchCharacterAccess: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ can_edit: false }),
        }),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.loadCharacter(params, safeSet);

      expect(controller.fetchCharacter).toHaveBeenCalledWith('demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false });
    });

    it('calls setError when the character fetch response is not ok', async function() {
      const setError = jasmine.createSpy('setError');
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = new StubCharacterController(
        setCharacter,
        Noop.noop,
        setError,
        () => params,
        null,
      );
      spyOn(controller, 'fetchCharacter').and.returnValue(Promise.resolve({ ok: false }));

      await controller.loadCharacter(params, safeSet);

      expect(setError).toHaveBeenCalledWith('Unable to load character.');
    });

    it('calls setLoading with false after the fetch chain completes', async function() {
      const setLoading = jasmine.createSpy('setLoading');
      const controller = new StubCharacterController(
        Noop.noop,
        setLoading,
        Noop.noop,
        () => params,
        null,
      );
      spyOn(controller, 'fetchCharacter').and.returnValue(Promise.resolve({ ok: false }));

      await controller.loadCharacter(params, safeSet);

      expect(setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('#fetchAndMergeTreasures', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges treasures onto the character on success', async function() {
      const controller = buildController(jasmine.createSpy('setCharacter'), {
        fetchCharacterTreasures: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, name: 'Sword', quantity: 1 }]),
        }),
      });

      const result = await controller.fetchAndMergeTreasures({ id: 2 }, params, 'tok');

      expect(controller.fetchCharacterTreasures).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(result).toEqual({ id: 2, treasures: [{ id: 1, name: 'Sword', quantity: 1 }] });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body is not an array', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ unexpected: 'shape' }),
      })],
    ];

    degradedCases.forEach(([description, fetchCharacterTreasures]) => {
      it(`degrades to an empty array when the ${description}`, async function() {
        const controller = buildController(jasmine.createSpy('setCharacter'), { fetchCharacterTreasures });

        const result = await controller.fetchAndMergeTreasures({ id: 2 }, params, 'tok');

        expect(result).toEqual({ id: 2, treasures: [] });
      });
    });
  });

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
