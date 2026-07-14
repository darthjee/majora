import AccessStore from '../../../../../../assets/js/utils/access/store/AccessStore.js';
import AccessEvents from '../../../../../../assets/js/utils/access/AccessEvents.js';
import GameClient from '../../../../../../assets/js/client/GameClient.js';
import CharacterClient from '../../../../../../assets/js/client/CharacterClient.js';
import TreasureClient from '../../../../../../assets/js/client/TreasureClient.js';
import { ACCESS_DEFAULT, fakeResponse } from './support.js';

describe('AccessStore', function() {
  beforeEach(function() {
    AccessStore.reset();
  });

  afterEach(function() {
    AccessStore.reset();
  });

  describe('#ensureGameAccess', function() {
    it('resolves with the fetched identity payload and emits an event', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ username: 'gm', is_superuser: false })),
      );
      spyOn(AccessEvents, 'emit');

      const result = await AccessStore.ensureGameAccess('demo');

      expect(result).toEqual({ username: 'gm', is_superuser: false });
      expect(AccessEvents.emit).toHaveBeenCalledWith({ key: 'game:demo' });
    });

    it('caches the ready result and does not refetch', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ username: 'gm' })),
      );

      await AccessStore.ensureGameAccess('demo');
      await AccessStore.ensureGameAccess('demo');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('dedupes concurrent calls into a single request', async function() {
      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse({ username: 'gm' })),
      );

      const [first, second] = await Promise.all([
        AccessStore.ensureGameAccess('demo'),
        AccessStore.ensureGameAccess('demo'),
      ]);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(first).toEqual({ username: 'gm' });
      expect(second).toEqual({ username: 'gm' });
    });

    it('resolves with the fail-closed default when the response is not ok', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.resolve(fakeResponse(null, false)),
      );

      const result = await AccessStore.ensureGameAccess('demo');

      expect(result).toEqual(ACCESS_DEFAULT);
    });

    it('resolves with the fail-closed default when the request throws', async function() {
      spyOn(GameClient.prototype, 'fetchGameAccess').and.returnValue(
        Promise.reject(new Error('network error')),
      );

      const result = await AccessStore.ensureGameAccess('demo');

      expect(result).toEqual(ACCESS_DEFAULT);
    });

    it('does not cache a fail-closed result and refetches after an abort', async function() {
      let rejectPending;
      const pending = new Promise((resolve, reject) => {
        rejectPending = reject;
      });

      const fetchSpy = spyOn(GameClient.prototype, 'fetchGameAccess').and.callFake((slug, token, signal) => {
        signal.addEventListener('abort', () => {
          rejectPending(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
        return pending;
      });

      const first = AccessStore.ensureGameAccess('demo');
      AccessStore.reset();
      await first;

      fetchSpy.and.returnValue(Promise.resolve(fakeResponse({ username: 'gm' })));
      const second = await AccessStore.ensureGameAccess('demo');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(second).toEqual({ username: 'gm' });
    });
  });

  describe('#ensureCharacterAccess', function() {
    it('resolves with the fetched identity payload, keyed by kind/game/character', async function() {
      spyOn(CharacterClient.prototype, 'fetchCharacterAccess').and.returnValue(
        Promise.resolve(fakeResponse({ is_owner: true })),
      );

      const result = await AccessStore.ensureCharacterAccess('pcs', 'demo', '2');

      expect(result).toEqual({ is_owner: true });
      expect(AccessStore.getCharacterAccess('pcs', 'demo', '2')).toEqual({ is_owner: true });
      expect(AccessStore.getCharacterAccess('npcs', 'demo', '2')).toEqual(ACCESS_DEFAULT);
    });
  });

  describe('#ensureTreasureAccess', function() {
    it('resolves with the fetched identity payload', async function() {
      spyOn(TreasureClient.prototype, 'fetchTreasureAccess').and.returnValue(
        Promise.resolve(fakeResponse({ username: 'gm' })),
      );

      const result = await AccessStore.ensureTreasureAccess(42);

      expect(result).toEqual({ username: 'gm' });
      expect(AccessStore.getTreasureAccess(42)).toEqual({ username: 'gm' });
    });
  });
});
