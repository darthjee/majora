import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { ApiError } from '../../src/core/errors/ApiError.js';
import { AuthenticationError } from '../../src/core/errors/AuthenticationError.js';
import { NetworkError } from '../../src/core/errors/NetworkError.js';
import { NotFoundError } from '../../src/core/errors/NotFoundError.js';
import { PermissionError } from '../../src/core/errors/PermissionError.js';
import { ServerError } from '../../src/core/errors/ServerError.js';
import { ValidationError } from '../../src/core/errors/ValidationError.js';
import { FetchStub } from '../support/FetchStub.js';

describe('HttpClient', () => {
  const token = 'mjr_secret_token_value';
  let stub;
  let http;

  const buildClient = (options = {}) => new HttpClient(new Config({
    baseUrl: 'https://majora.example.com/', token, fetch: stub.fetch, retries: 0, env: {}, ...options,
  }));

  beforeEach(() => {
    stub = new FetchStub();
    http = buildClient();
  });

  describe('URL building', () => {
    it('targets <baseUrl>/<path>.json', async () => {
      stub.reply(200, []);
      await http.get('games/epic-quest/npcs/all');

      expect(stub.lastCall.url).toEqual('https://majora.example.com/games/epic-quest/npcs/all.json');
    });

    it('ignores leading slashes in the path', async () => {
      stub.reply(200, []);
      await http.get('//my-games');

      expect(stub.lastCall.url).toEqual('https://majora.example.com/my-games.json');
    });

    it('keeps a baseUrl path prefix', async () => {
      http = buildClient({ baseUrl: 'https://example.com/majora' });
      stub.reply(200, []);
      await http.get('games');

      expect(stub.lastCall.url).toEqual('https://example.com/majora/games.json');
    });

    it('adds query parameters, skipping undefined and null', async () => {
      stub.reply(200, []);
      await http.get('games/x/npcs', {
        query: { name: 'Bob Smith', slain: false, page: 2, empty: undefined, none: null, tag: ['a', 'b'] },
      });

      expect(stub.lastCall.url).toEqual(
        'https://majora.example.com/games/x/npcs.json?name=Bob+Smith&slain=false&page=2&tag=a&tag=b',
      );
    });
  });

  describe('json: false option', () => {
    it('targets <baseUrl>/<path> without the .json suffix', async () => {
      stub.reply(201, { file_path: 'x.png' });
      await http.post('uploads/image/7/submit', new FormData(), { json: false });

      expect(stub.lastCall.url).toEqual('https://majora.example.com/uploads/image/7/submit');
      expect(stub.lastCall.options.method).toEqual('POST');
    });

    it('still appends .json by default', async () => {
      stub.reply(201, {});
      await http.post('games/x/npcs/1/photo_upload', {});

      expect(stub.lastCall.url).toEqual('https://majora.example.com/games/x/npcs/1/photo_upload.json');
    });

    it('still appends .json when json is true', async () => {
      stub.reply(200, {});
      await http.get('games', { json: true });

      expect(stub.lastCall.url).toEqual('https://majora.example.com/games.json');
    });

    it('still applies query parameters', async () => {
      stub.reply(200, {});
      await http.get('uploads/image/7/submit', { json: false, query: { a: 1 } });

      expect(stub.lastCall.url).toEqual('https://majora.example.com/uploads/image/7/submit?a=1');
    });

    it('uses the suffix-less path in error messages', async () => {
      stub.reply(404, { error: 'Not Found' });

      await expectAsync(http.post('uploads/image/7/submit', new FormData(), { json: false }))
        .toBeRejectedWith(jasmine.objectContaining({ path: '/uploads/image/7/submit' }));
    });
  });

  describe('headers', () => {
    it('sends the Bearer token and accepts JSON', async () => {
      stub.reply(200, {});
      await http.get('games');

      expect(stub.lastCall.options.headers).toEqual({
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      });
    });

    it('merges extra headers but never lets them replace the Bearer header', async () => {
      stub.reply(200, {});
      await http.get('games', { headers: { 'X-Trace': '1', Authorization: 'Token legacy' } });

      expect(stub.lastCall.options.headers['X-Trace']).toEqual('1');
      expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
    });

    it('uses the upper-case method', async () => {
      stub.reply(200, {});
      await http.request('get', 'games');

      expect(stub.lastCall.options.method).toEqual('GET');
    });
  });

  describe('request bodies', () => {
    it('sends no body for a GET', async () => {
      stub.reply(200, {});
      await http.get('games');

      expect(stub.lastCall.options.body).toBeUndefined();
    });

    it('sends JSON bodies with a JSON content type on POST', async () => {
      stub.reply(201, { id: 1 });
      await http.post('games/x/npcs', { name: 'Bob' });

      expect(stub.lastCall.options.method).toEqual('POST');
      expect(stub.lastCall.options.body).toEqual('{"name":"Bob"}');
      expect(stub.lastCall.options.headers['Content-Type']).toEqual('application/json');
    });

    it('sends JSON bodies on PATCH', async () => {
      stub.reply(200, { id: 1 });
      await http.patch('games/x/npcs/1', { name: 'Robert' });

      expect(stub.lastCall.options.method).toEqual('PATCH');
      expect(stub.lastCall.options.body).toEqual('{"name":"Robert"}');
    });

    it('passes FormData bodies as is, leaving the content type to fetch', async () => {
      const form = new FormData();

      form.append('file', new Blob(['data'], { type: 'image/png' }), 'photo.png');
      stub.reply(200, { ok: true });
      await http.post('uploads/image/1/submit', form);

      expect(stub.lastCall.options.body).toBe(form);
      expect(stub.lastCall.options.headers['Content-Type']).toBeUndefined();
      expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
    });

    it('sends DELETE without a body', async () => {
      stub.reply(204);
      const response = await http.delete('games/x/photos/3');

      expect(stub.lastCall.options.method).toEqual('DELETE');
      expect(response.body).toBeNull();
      expect(response.status).toEqual(204);
    });
  });

  describe('responses', () => {
    it('parses JSON bodies and exposes status and headers', async () => {
      stub.reply(200, [{ id: 1 }], { page: '1' });
      const response = await http.get('games');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([{ id: 1 }]);
      expect(response.headers.get('page')).toEqual('1');
    });

    it('keeps the raw text of non-JSON bodies', async () => {
      stub.reply(200, 'plain text');

      expect((await http.get('games')).body).toEqual('plain text');
    });

    it('parses JSON even without a JSON content type', async () => {
      stub.handleWith(() => new Response('{"a":1}', { status: 200 }));

      expect((await http.get('games')).body).toEqual({ a: 1 });
    });

    it('returns null for an empty body', async () => {
      stub.reply(200);

      expect((await http.get('games')).body).toBeNull();
    });
  });

  describe('error mapping', () => {
    const cases = [
      [400, ValidationError, { errors: { name: ['blank'] } }],
      [401, AuthenticationError, { detail: 'token_invalid' }],
      [403, PermissionError, { errors: { detail: ['scope_missing'] } }],
      [404, NotFoundError, null],
      [409, ApiError, { errors: { slug: ['taken'] } }],
      [422, ApiError, { status: 'failed', error: 'not_available' }],
      [500, ServerError, { detail: 'oops' }],
      [502, ServerError, '<html><body>502 Bad Gateway</body></html>'],
    ];

    cases.forEach(([status, ErrorClass, body]) => {
      it(`raises ${ErrorClass.name} for a ${status}`, async () => {
        stub.reply(status, body);

        await expectAsync(http.get('games/x/npcs/all')).toBeRejectedWith(jasmine.objectContaining({
          constructor: ErrorClass,
          status,
          method: 'GET',
          path: '/games/x/npcs/all.json',
          body,
        }));
      });
    });

    it('builds a readable message', async () => {
      stub.reply(403, { errors: { detail: ['scope_missing'] } });

      await expectAsync(http.get('games/x/npcs/all')).toBeRejectedWithError(
        PermissionError, '403 PermissionError on GET /games/x/npcs/all.json: scope_missing',
      );
    });
  });

  describe('network failures', () => {
    it('raises NetworkError with the cause', async () => {
      const cause = new TypeError('fetch failed');

      stub.fail(cause);

      await expectAsync(http.get('games')).toBeRejectedWith(jasmine.objectContaining({
        constructor: NetworkError,
        cause,
        timeout: false,
        message: 'Network error on GET /games.json',
      }));
    });

    it('raises NetworkError when the body cannot be read', async () => {
      const cause = new TypeError('terminated');

      stub.handleWith(() => ({ ok: true, status: 200, headers: new Headers(), text: () => Promise.reject(cause) }));

      await expectAsync(http.get('games')).toBeRejectedWith(jasmine.objectContaining({
        constructor: NetworkError, cause,
      }));
    });
  });
});
