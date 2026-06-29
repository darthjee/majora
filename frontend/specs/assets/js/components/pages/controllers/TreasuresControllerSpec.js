import TreasuresController from '../../../../../../assets/js/components/pages/controllers/TreasuresController.js';

describe('TreasuresController', function() {
  it('fetches treasures and pagination', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['fetchIndex']);
    client.fetchIndex.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword', value: 100 }],
      pagination: { page: 1, pages: 1, perPage: 10 },
    }));

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(client.fetchIndex).toHaveBeenCalledWith('/treasures.json');
    expect(setTreasures).toHaveBeenCalledWith([{ id: 1, name: 'Sword', value: 100 }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets error when the fetch fails', async function() {
    const setTreasures = jasmine.createSpy('setTreasures');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const client = jasmine.createSpyObj('client', ['fetchIndex']);
    client.fetchIndex.and.returnValue(Promise.reject(new Error('network error')));

    const cleanup = new TreasuresController(
      setTreasures, setPagination, setLoading, setError, client,
    ).buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalledWith('Unable to load treasures.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });
});
