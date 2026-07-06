import NpcCharacterTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterTreasuresController.js';
import { buildCharacterClient } from './support.js';

describe('NpcCharacterTreasuresController', function() {
  it('sets an error when the fetch fails', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/games/demo/npcs/2/treasures');
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new NpcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('sets an error without fetching when params are missing', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

    client.currentHash.and.returnValue('#/other');

    const cleanup = new NpcCharacterTreasuresController(
      setTreasures, setPagination, setLoading, setError, client, undefined, buildCharacterClient(),
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
});
