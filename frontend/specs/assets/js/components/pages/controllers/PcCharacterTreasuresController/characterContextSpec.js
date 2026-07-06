import PcCharacterTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterTreasuresController.js';
import { buildCharacterClient } from './support.js';

describe('PcCharacterTreasuresController', function() {
  describe('character context', function() {
    const buildClient = () => {
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/games/demo/pcs/2/treasures');
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));

      return client;
    };

    it('merges can_edit from the access endpoint onto the fetched character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = buildCharacterClient();

      characterClient.fetchPc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: true, money: 310 }),
      }));
      characterClient.fetchPcAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      const cleanup = new PcCharacterTreasuresController(
        jasmine.createSpy('setTreasures'),
        jasmine.createSpy('setPagination'),
        jasmine.createSpy('setLoading'),
        jasmine.createSpy('setError'),
        buildClient(),
        setCharacter,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, game_slug: 'demo', is_pc: true, money: 310, can_edit: true,
      });

      cleanup();
    });

    it('sets the character to null when the base fetch fails', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = buildCharacterClient();

      characterClient.fetchPc.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = new PcCharacterTreasuresController(
        jasmine.createSpy('setTreasures'),
        jasmine.createSpy('setPagination'),
        jasmine.createSpy('setLoading'),
        jasmine.createSpy('setError'),
        buildClient(),
        setCharacter,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith(null);

      cleanup();
    });

    it('falls back to the base character with can_edit false when the access fetch fails', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const characterClient = buildCharacterClient();

      characterClient.fetchPc.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, game_slug: 'demo', is_pc: true, money: 310 }),
      }));
      characterClient.fetchPcAccess.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new PcCharacterTreasuresController(
        jasmine.createSpy('setTreasures'),
        jasmine.createSpy('setPagination'),
        jasmine.createSpy('setLoading'),
        jasmine.createSpy('setError'),
        buildClient(),
        setCharacter,
        characterClient,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, game_slug: 'demo', is_pc: true, money: 310 });

      cleanup();
    });
  });
});
