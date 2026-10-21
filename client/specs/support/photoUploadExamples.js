import { ApiError } from '../../src/core/errors/ApiError.js';
import { PermissionError } from '../../src/core/errors/PermissionError.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { UPLOAD_SUBMIT_TIMEOUT } from '../../src/resources/photoPath.js';
import { BASE_URL } from './buildCore.js';
import { TOKEN, buildRetrying, setup } from './photoSupport.js';

const UPLOAD_TOKEN = 'upload_secret_token_value';
const INIT = { upload_id: 42, token: UPLOAD_TOKEN };
const SUBMIT_URL = `${BASE_URL}/uploads/image/42/submit`;

/**
 * Defines the specs of `uploadPhoto(id, file, options)` on a family wrapper.
 * @param {Function} build - `(http, paginator) => resource`.
 * @param {string} base - The resource base path (e.g. `games/epic-quest/npcs`).
 */
export function itUploadsPhotos(build, base) {
  describe('uploadPhoto', () => {
    let stub;
    let resource;

    beforeEach(() => {
      ({ stub, resource } = setup(build));
    });

    it('runs the init and the submit steps and returns the submit body', async () => {
      stub.reply(201, INIT).reply(201, { file_path: 'photos/a.png' });
      const blob = new Blob(['png'], { type: 'image/png' });
      const body = await resource.uploadPhoto(7, blob, { filename: 'a.png' });

      expect(body).toEqual({ file_path: 'photos/a.png' });
      expect(stub.calls.length).toEqual(2);
      expect(stub.calls[0].url).toEqual(`${BASE_URL}/${base}/7/photo_upload.json`);
      expect(stub.calls[0].options.method).toEqual('POST');
      expect(stub.calls[0].options.body).toBeUndefined();
      expect(stub.calls[1].url).toEqual(SUBMIT_URL);
      expect(stub.calls[1].options.method).toEqual('POST');
    });

    it('sends the upload token and the Bearer token on the submit step', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, new Blob(['png']));

      expect(stub.calls[0].options.headers['X-Upload-Token']).toBeUndefined();
      expect(stub.calls[1].options.headers['X-Upload-Token']).toEqual(UPLOAD_TOKEN);
      expect(stub.calls[1].options.headers.Authorization).toEqual(`Bearer ${TOKEN}`);
      expect(stub.calls[1].options.headers['Content-Type']).toBeUndefined();
    });

    it('passes extra headers to both steps, never replacing the upload token', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, new Blob(['png']), { headers: { 'X-Trace': '1', 'X-Upload-Token': 'x' } });

      expect(stub.calls[0].options.headers['X-Trace']).toEqual('1');
      expect(stub.calls[1].options.headers['X-Trace']).toEqual('1');
      expect(stub.calls[1].options.headers['X-Upload-Token']).toEqual(UPLOAD_TOKEN);
    });

    it('sends a multipart body with the file under the field file', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, new Blob(['png-bytes'], { type: 'image/png' }), { filename: 'a.png' });

      const form = stub.calls[1].options.body;
      const file = form.get('file');

      expect(form).toEqual(jasmine.any(FormData));
      expect(file.name).toEqual('a.png');
      expect(file.type).toEqual('image/png');
      expect(await file.text()).toEqual('png-bytes');
    });

    it('keeps the name of a File', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, new File(['png'], 'portrait.png', { type: 'image/png' }));

      expect(stub.calls[1].options.body.get('file').name).toEqual('portrait.png');
    });

    it('accepts a Buffer with a filename and a content type', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, Buffer.from('jpg-bytes'), { filename: 'b.jpg', contentType: 'image/jpeg' });

      const file = stub.calls[1].options.body.get('file');

      expect(file.name).toEqual('b.jpg');
      expect(file.type).toEqual('image/jpeg');
      expect(await file.text()).toEqual('jpg-bytes');
    });

    it('accepts a Uint8Array with a filename', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, new Uint8Array([104, 105]), { filename: 'c.png' });

      const file = stub.calls[1].options.body.get('file');

      expect(file.name).toEqual('c.png');
      expect(await file.text()).toEqual('hi');
    });

    it('URL-encodes the id', async () => {
      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto('a b', new Blob(['png']));

      expect(stub.calls[0].url).toEqual(`${BASE_URL}/${base}/a%20b/photo_upload.json`);
    });

    describe('timeouts', () => {
      beforeEach(() => {
        spyOn(AbortSignal, 'timeout').and.callThrough();
      });

      it('uses the configured timeout for the init and 120 s for the submit', async () => {
        stub.reply(201, INIT).reply(201, {});
        await resource.uploadPhoto(7, new Blob(['png']));

        expect(UPLOAD_SUBMIT_TIMEOUT).toEqual(120000);
        expect(AbortSignal.timeout.calls.allArgs()).toEqual([[30000], [120000]]);
      });

      it('lets the caller override the submit timeout only', async () => {
        stub.reply(201, INIT).reply(201, {});
        await resource.uploadPhoto(7, new Blob(['png']), { timeout: 5000 });

        expect(AbortSignal.timeout.calls.allArgs()).toEqual([[30000], [5000]]);
      });
    });

    it('passes the caller signal to both steps', async () => {
      const controller = new AbortController();

      stub.reply(201, INIT).reply(201, {});
      await resource.uploadPhoto(7, new Blob(['png']), { signal: controller.signal });
      controller.abort();

      expect(stub.calls[0].options.signal.aborted).toBeTrue();
      expect(stub.calls[1].options.signal.aborted).toBeTrue();
    });

    it('rejects a restricted upload with UsageError, without any request', async () => {
      await expectAsync(resource.uploadPhoto(7, new Blob(['png']), { restricted: true }))
        .toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });

    [undefined, null, ''].forEach((blank) => {
      it(`rejects a blank id (${JSON.stringify(blank)}) with UsageError, without any request`, async () => {
        await expectAsync(resource.uploadPhoto(blank, new Blob(['png']))).toBeRejectedWithError(UsageError, 'Missing id');
        expect(stub.calls).toEqual([]);
      });
    });

    [undefined, null, 'photo.png', 42, { name: 'a.png' }, new ArrayBuffer(2)].forEach((file) => {
      it(`rejects the file ${Object.prototype.toString.call(file)} with UsageError, without any request`, async () => {
        await expectAsync(resource.uploadPhoto(7, file, { filename: 'a.png' }))
          .toBeRejectedWithError(UsageError, /Invalid file/);
        expect(stub.calls).toEqual([]);
      });
    });

    [Buffer.from('png'), new Uint8Array([1])].forEach((file) => {
      it(`requires a filename for a ${file.constructor.name}, without any request`, async () => {
        await expectAsync(resource.uploadPhoto(7, file)).toBeRejectedWithError(UsageError, /Missing filename/);
        expect(stub.calls).toEqual([]);
      });
    });

    it('never sends the submit when the init fails', async () => {
      stub.reply(403, { errors: { detail: ['scope_missing'] } });
      const error = await resource.uploadPhoto(7, new Blob(['png'])).catch((caught) => caught);

      expect(error).toEqual(jasmine.any(PermissionError));
      expect(stub.calls.length).toEqual(1);
    });

    it('surfaces the codes of a proxy 422 on the submit', async () => {
      stub.reply(201, INIT).reply(422, { error: 'Unprocessable Entity', reason: 'invalid_image' });
      const error = await resource.uploadPhoto(7, new Blob(['png'])).catch((caught) => caught);

      expect(error).toEqual(jasmine.any(ApiError));
      expect(error.status).toEqual(422);
      expect(error.codes).toContain('invalid_image');
      expect(error.path).toEqual('/uploads/image/42/submit');
    });

    it('never retries either step', async () => {
      resource = buildRetrying(build, stub);
      stub.reply(503, 'down');
      await expectAsync(resource.uploadPhoto(7, new Blob(['png']), { retries: 3 })).toBeRejected();
      expect(stub.calls.length).toEqual(1);

      stub.reply(201, INIT).reply(503, 'down');
      await expectAsync(resource.uploadPhoto(7, new Blob(['png']), { retries: 3 })).toBeRejected();
      expect(stub.calls.length).toEqual(3);
    });

    it('never puts the API token nor the upload token in errors', async () => {
      stub.reply(201, INIT).reply(403, { errors: { detail: ['token_not_allowed'] } });
      const error = await resource.uploadPhoto(7, new Blob(['png'])).catch((caught) => caught);
      const dump = `${error.message} ${error.stack} ${JSON.stringify(error)}`;

      expect(error).toEqual(jasmine.any(PermissionError));
      expect(dump).not.toContain(TOKEN);
      expect(dump).not.toContain(UPLOAD_TOKEN);
    });

    it('never puts the tokens in a network error of the submit', async () => {
      stub.reply(201, INIT).fail(new TypeError('fetch failed'));
      const error = await resource.uploadPhoto(7, new Blob(['png'])).catch((caught) => caught);
      const dump = `${error.message} ${error.stack} ${JSON.stringify(error)}`;

      expect(error.message).toContain('/uploads/image/42/submit');
      expect(dump).not.toContain(TOKEN);
      expect(dump).not.toContain(UPLOAD_TOKEN);
    });
  });
}
