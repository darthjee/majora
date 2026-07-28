import PhotoDeleteSaga
  from '../../../../../../../assets/js/components/common/base/controllers/PhotoDeleteSaga.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('PhotoDeleteSaga', function() {
  describe('#run', function() {
    beforeEach(function() {
      spyOn(RequestStore, 'mutate');
    });

    it('returns true when the mark-not-ready and delete requests both succeed', async function() {
      RequestStore.mutate.and.returnValues(
        Promise.resolve({ ok: true }),
        Promise.resolve({ ok: true }),
      );

      const saga = new PhotoDeleteSaga();
      const result = await saga.run('pc', 'demo', '7', '9');

      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'PhotoDeleteSaga',
        resource: 'pc',
        method: 'PATCH',
        quantityType: 'photoDelete',
        params: { gameSlug: 'demo', id: '7', photoId: '9' },
        body: { ready: false },
      });
      expect(RequestStore.mutate).toHaveBeenCalledWith({
        componentName: 'PhotoDeleteSaga',
        resource: 'pc',
        method: 'DELETE',
        quantityType: 'photoDelete',
        params: { gameSlug: 'demo', id: '7', photoId: '9' },
      });
      expect(result).toBe(true);
    });

    it('returns false and does not attempt the delete step when the mark-not-ready request fails', async function() {
      RequestStore.mutate.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      const saga = new PhotoDeleteSaga();
      const result = await saga.run('npc', 'demo', '7', '9');

      expect(RequestStore.mutate).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });

    it('returns false when the delete request fails', async function() {
      RequestStore.mutate.and.returnValues(
        Promise.resolve({ ok: true }),
        Promise.resolve({ ok: false, status: 500 }),
      );

      const saga = new PhotoDeleteSaga();
      const result = await saga.run('pc', 'demo', '7', '9');

      expect(result).toBe(false);
    });

    it('returns false when RequestStore.mutate throws', async function() {
      RequestStore.mutate.and.returnValue(Promise.reject(new Error('network error')));

      const saga = new PhotoDeleteSaga();
      const result = await saga.run('pc', 'demo', '7', '9');

      expect(result).toBe(false);
    });
  });
});
