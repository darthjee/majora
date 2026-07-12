import AccessStore from '../../../../../assets/js/utils/AccessStore.js';
import AccessEvents from '../../../../../assets/js/utils/AccessEvents.js';
import GameClient from '../../../../../assets/js/client/GameClient.js';
import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
  });

  afterEach(function() {
    AccessStore.reset();
  });

  describe('#ensureGamePermissions', function() {
    it('resolves with the fetched permissions payload and emits an event', async function() {
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
      spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.reject(new Error('network error')),
      );

      const result = await AccessStore.ensureGamePermissions('demo');

      expect(result).toEqual({ can_edit: false });
    });

    it('caches distinct role sets under distinct keys, without colliding', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.callFake(
        (slug, token, signal, roles) => Promise.resolve(fakeResponse({ can_edit: roles.includes('dm') })),
      );

      const noRole = await AccessStore.ensureGamePermissions('demo');
      const dmRole = await AccessStore.ensureGamePermissions('demo', ['dm']);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(noRole).toEqual({ can_edit: false });
      expect(dmRole).toEqual({ can_edit: true });
      expect(AccessStore.getGamePermissions('demo')).toEqual({ can_edit: false });
      expect(AccessStore.getGamePermissions('demo', ['dm'])).toEqual({ can_edit: true });
    });

    it('normalizes (sorts/dedupes) the role set for the cache key', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGamePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      await AccessStore.ensureGamePermissions('demo', ['player', 'dm']);
      await AccessStore.ensureGamePermissions('demo', ['dm', 'dm', 'player']);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#ensureCharacterPermissions', function() {
    it('resolves with the fetched permissions payload, keyed by kind/game/character/roles', async function() {
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
      spyOn(TreasureClient.prototype, 'fetchTreasurePermissions').and.returnValue(
        Promise.resolve(fakeResponse({ can_edit: true })),
      );

      const result = await AccessStore.ensureTreasurePermissions(42);

      expect(result).toEqual({ can_edit: true });
      expect(AccessStore.getTreasurePermissions(42)).toEqual({ can_edit: true });
    });
  });
});
