import PcCharacterTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterTreasuresController.js';
import { buildCharacterClient } from './support.js';

describe('PcCharacterTreasuresController', function() {
  it('uses route params to request pc character treasures', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/pcs/2/treasures');
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', quantity: 1, value: 100 }],
      pagination: { page: 2, pages: 3, perPage: 4 },
    }));

    const cleanup = new PcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/pcs/2/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', quantity: 1, value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 2, pages: 3, perPage: 4 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });
});
