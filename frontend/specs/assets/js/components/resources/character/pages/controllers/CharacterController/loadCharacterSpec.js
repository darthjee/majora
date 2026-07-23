import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { StubCharacterController, safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#loadCharacter', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches the character through RequestStore and merges access on success', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      await controller.loadCharacter(params, safeSet);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController', resource: 'pc', quantityType: 'single', params: { gameSlug: 'demo', id: '2' },
      });
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        treasures: [],
        items: [],
        documents: [],
        photos: [],
        game_type: 'dnd',
        can_edit: false,
        is_player: false,
        is_staff: false,
        access_resolved: true,
      });
    });

    it('resolves the npc resource for an npc controller', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 2 } }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = new StubCharacterController(
        setCharacter, Noop.noop, Noop.noop, () => params, null,
      );
      controller.characterKind = 'npcs';

      await controller.loadCharacter(params, safeSet);

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CharacterController', resource: 'npc', quantityType: 'single', params: { gameSlug: 'demo', id: '2' },
      });
    });

    it('renders with the character already merged with full (editor-only) fields when RequestStore resolves the private variant', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: { id: 2, slain: true, public_slain: false },
      }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      await controller.loadCharacter(params, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        treasures: [],
        items: [],
        documents: [],
        photos: [],
        game_type: 'dnd',
        can_edit: false,
        is_player: false,
        is_staff: false,
        slain: true,
        public_slain: false,
        access_resolved: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        treasures: [],
        items: [],
        documents: [],
        photos: [],
        game_type: 'dnd',
        can_edit: true,
        is_player: false,
        is_staff: false,
        slain: true,
        public_slain: false,
        access_resolved: true,
      });
    });

    it('calls setError when RequestStore.ensure rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('network error')));
      const setError = jasmine.createSpy('setError');
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = new StubCharacterController(
        setCharacter,
        Noop.noop,
        setError,
        () => params,
        null,
      );

      await controller.loadCharacter(params, safeSet);

      expect(setError).toHaveBeenCalledWith('Unable to load character.');
    });

    it('calls setLoading with false after the fetch chain completes', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('network error')));
      const setLoading = jasmine.createSpy('setLoading');
      const controller = new StubCharacterController(
        Noop.noop,
        setLoading,
        Noop.noop,
        () => params,
        null,
      );

      await controller.loadCharacter(params, safeSet);

      expect(setLoading).toHaveBeenCalledWith(false);
    });
  });
});
