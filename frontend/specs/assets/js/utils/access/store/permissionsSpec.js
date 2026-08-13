import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import AccessStoreFacade from '../../../../../../assets/js/utils/access/store/AccessStoreFacade.js';
import AccessEvents from '../../../../../../assets/js/utils/access/AccessEvents.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import CharacterClient from '../../../../../../assets/js/client/CharacterClient.js';
import TreasureClient from '../../../../../../assets/js/client/TreasureClient.js';
import { fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
    AccessStoreFacade.clear();
  });

  afterEach(function() {
    AccessStore.reset();
    AccessStoreFacade.clear();
  });

  describe('#ensureGamePermissions', function() {
    it('resolves with the fetched permissions payload and emits an event', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );
      spyOn(AccessEvents, 'emit');

      const result = await AccessStore.ensureGamePermissions('demo');

      expect(result).toEqual({ can_edit: true });
      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
      expect(AccessEvents.emit).toHaveBeenCalledWith({ key: 'permissions:game:demo:' });
    });

    it('resolves with the fail-closed default when the request throws', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.reject(new Error('network error')),
      );

      const result = await AccessStore.ensureGamePermissions('demo');

      expect(result).toEqual({ can_edit: false });
    });

    it('derives the requested role set from the already-resolved game access', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ is_dm: true, is_logged: true })),
      );
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.callFake(
        (slug, token, signal, roles) => Promise.resolve(fakeResponse({ can_edit: roles.includes('dm') })),
      );

      await AccessStore.ensureGameAccess('demo');
      const result = await AccessStore.ensureGamePermissions('demo');

      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), ['dm', 'logged']);
      expect(result).toEqual({ can_edit: true });
      expect(AccessStore.getGamePermissions('demo')).toEqual({ can_edit: true });
    });

    it('caches distinct role sets (e.g. real vs. facade-simulated) under distinct keys, without colliding', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.callFake(
        (slug, token, signal, roles) => Promise.resolve(fakeResponse({ can_edit: roles.includes('dm') })),
      );

      const noRole = await AccessStore.ensureGamePermissions('demo');

      expect(AccessStore.getGamePermissions('demo')).toEqual({ can_edit: false });

      AccessStoreFacade.set(true, ['dm']);
      const dmRole = await AccessStore.ensureGamePermissions('demo');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(noRole).toEqual({ can_edit: false });
      expect(dmRole).toEqual({ can_edit: true });
      expect(AccessStore.getGamePermissions('demo')).toEqual({ can_edit: true });

      AccessStoreFacade.clear();
      expect(AccessStore.getGamePermissions('demo')).toEqual({ can_edit: false });
    });
  });

  describe('#ensurePossessionPermissions', function() {
    it('resolves with the fetched permissions payload', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchPossessionPermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensurePossessionPermissions('demo');

      expect(result).toEqual({ can_edit: true });
      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });
  });

  describe('#ensureItemPermissions', function() {
    it('resolves with the fetched permissions payload', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchItemPermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureItemPermissions('demo');

      expect(result).toEqual({ can_edit: true });
      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });
  });

  describe('#ensureFactionPermissions', function() {
    it('resolves with the fetched permissions payload', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchFactionPermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureFactionPermissions('demo');

      expect(result).toEqual({ can_edit: true });
      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });
  });

  describe('#ensureDocumentPermissions', function() {
    it('resolves with the fetched permissions payload', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      const fetchSpy = spyOn(GameClient.prototype, 'fetchDocumentPermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureDocumentPermissions('demo');

      expect(result).toEqual({ can_edit: true });
      expect(fetchSpy).toHaveBeenCalledWith('demo', null, jasmine.anything(), []);
    });
  });

  describe('#ensureCharacterPermissions', function() {
    it('resolves with the fetched permissions payload, keyed by kind/game/character/roles', async function() {
      spyOn(CharacterClient.prototype, 'fetchCharacterAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      spyOn(CharacterClient.prototype, 'fetchCharacterPermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureCharacterPermissions('pcs', 'demo', '2');

      expect(result).toEqual({ can_edit: true });
      expect(AccessStore.getCharacterPermissions('pcs', 'demo', '2')).toEqual({ can_edit: true });
      expect(AccessStore.getCharacterPermissions('npcs', 'demo', '2')).toEqual({ can_edit: false });
    });
  });

  describe('#ensureTreasurePermissions', function() {
    it('resolves with the fetched permissions payload', async function() {
      spyOn(TreasureClient.prototype, 'fetchTreasureAccess').and.returnValue(Promise.resolve(fakeResponse({})));
      spyOn(TreasureClient.prototype, 'fetchTreasurePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureTreasurePermissions(42);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStore.getTreasurePermissions(42)).toEqual({ can_edit: true });
    });
  });
});
