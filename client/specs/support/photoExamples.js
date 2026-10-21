import { UsageError } from '../../src/core/errors/UsageError.js';
import { BASE_URL } from './buildCore.js';
import { buildRetrying, setup } from './photoSupport.js';
import { itUploadsPhotos } from './photoUploadExamples.js';

/**
 * Defines the specs of the photo actions of a family wrapper: `uploadPhoto` always, and
 * `setMainPhoto` / `deletePhoto` when supported (else they must be absent).
 * @param {Function} build - `(http, paginator) => resource`.
 * @param {string} base - The resource base path (e.g. `games/epic-quest/npcs`).
 * @param {object} [actions] - Which optional actions the family supports.
 * @param {boolean} [actions.set] - Whether `setMainPhoto` is supported.
 * @param {boolean} [actions.remove] - Whether `deletePhoto` is supported.
 */
export function itManagesPhotos(build, base, { set = false, remove = false } = {}) {
  itUploadsPhotos(build, base);

  describe('setMainPhoto', () => {
    let stub;
    let resource;

    beforeEach(() => {
      ({ stub, resource } = setup(build));
    });

    if (!set) {
      it('is not supported', () => {
        expect(resource.setMainPhoto).toBeUndefined();
      });
      return;
    }

    it('PATCHes <id>/photos/<photo_id>/set with no body and returns the body', async () => {
      stub.reply(200, { id: 3, main: true });
      const body = await resource.setMainPhoto(7, 3);

      expect(body).toEqual({ id: 3, main: true });
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/7/photos/3/set.json`);
      expect(stub.lastCall.options.method).toEqual('PATCH');
      expect(stub.lastCall.options.body).toBeUndefined();
    });

    it('URL-encodes both ids', async () => {
      stub.reply(200, {});
      await resource.setMainPhoto('a b', 'c/d');

      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/a%20b/photos/c%2Fd/set.json`);
    });

    it('rejects a restricted variant with UsageError, without any request', async () => {
      await expectAsync(resource.setMainPhoto(7, 3, { restricted: true })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });

    [undefined, null, ''].forEach((blank) => {
      it(`rejects a blank id (${JSON.stringify(blank)}) with UsageError, without any request`, async () => {
        await expectAsync(resource.setMainPhoto(blank, 3)).toBeRejectedWithError(UsageError, 'Missing id');
        await expectAsync(resource.setMainPhoto(7, blank)).toBeRejectedWithError(UsageError, 'Missing photo id');
        expect(stub.calls).toEqual([]);
      });
    });

    it('is never retried', async () => {
      resource = buildRetrying(build, stub);
      stub.reply(503, 'down');
      await expectAsync(resource.setMainPhoto(7, 3, { retries: 3 })).toBeRejected();
      expect(stub.calls.length).toEqual(1);
    });
  });

  describe('deletePhoto', () => {
    let stub;
    let resource;

    beforeEach(() => {
      ({ stub, resource } = setup(build));
    });

    if (!remove) {
      it('is not supported', () => {
        expect(resource.deletePhoto).toBeUndefined();
      });
      return;
    }

    it('DELETEs <id>/photos/<photo_id> and returns the body', async () => {
      stub.reply(204);
      const body = await resource.deletePhoto(7, 3);

      expect(body).toBeNull();
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/7/photos/3.json`);
      expect(stub.lastCall.options.method).toEqual('DELETE');
      expect(stub.lastCall.options.body).toBeUndefined();
    });

    it('rejects a restricted variant with UsageError, without any request', async () => {
      await expectAsync(resource.deletePhoto(7, 3, { restricted: true })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });

    [undefined, null, ''].forEach((blank) => {
      it(`rejects a blank id (${JSON.stringify(blank)}) with UsageError, without any request`, async () => {
        await expectAsync(resource.deletePhoto(blank, 3)).toBeRejectedWithError(UsageError, 'Missing id');
        await expectAsync(resource.deletePhoto(7, blank)).toBeRejectedWithError(UsageError, 'Missing photo id');
        expect(stub.calls).toEqual([]);
      });
    });

    it('is never retried', async () => {
      resource = buildRetrying(build, stub);
      stub.reply(503, 'down');
      await expectAsync(resource.deletePhoto(7, 3, { retries: 3 })).toBeRejected();
      expect(stub.calls.length).toEqual(1);
    });
  });
}
