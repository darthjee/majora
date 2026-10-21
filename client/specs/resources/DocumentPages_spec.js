import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { Page } from '../../src/core/Page.js';
import { Paginator } from '../../src/core/Paginator.js';
import { NetworkError } from '../../src/core/errors/NetworkError.js';
import { PermissionError } from '../../src/core/errors/PermissionError.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { ValidationError } from '../../src/core/errors/ValidationError.js';
import { DocumentPages } from '../../src/resources/DocumentPages.js';
import { GameResource } from '../../src/resources/GameResource.js';
import { Resource } from '../../src/resources/Resource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';
import { itResolvesVariants } from '../support/variantExamples.js';

describe('DocumentPages', () => {
  const documentsBase = 'games/epic-quest/documents';
  const base = `${documentsBase}/7/pages`;
  const token = 'mjr_fake_token_for_specs';

  itResolvesVariants((http, paginator) => new DocumentPages(http, paginator, documentsBase, 7), {
    list: [base, `${base}/all`],
    create: [base, `${base}/all`],
    update: [`${base}/12`, `${base}/12/all`],
    trim: [base, `${base}/all`],
    bumpVersion: [`${base}/bump_version`, `${base}/bump_version/all`],
  });

  describe('with a stubbed fetch', () => {
    let stub;
    let pages;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      pages = new DocumentPages(http, paginator, documentsBase, 7);
    });

    it('is a Resource, not a GameResource', () => {
      expect(pages).toEqual(jasmine.any(Resource));
      expect(pages).not.toEqual(jasmine.any(GameResource));
    });

    it('exposes the document id and the base path', () => {
      expect(pages.documentId).toEqual(7);
      expect(pages.basePath).toEqual(base);
    });

    it('URL-encodes the document id', () => {
      const { http, paginator } = buildCore(stub);
      const encoded = new DocumentPages(http, paginator, documentsBase, 'a b/c');

      expect(encoded.basePath).toEqual(`${documentsBase}/a%20b%2Fc/pages`);
    });

    [undefined, null, ''].forEach((blank) => {
      it(`throws UsageError for a blank document id (${JSON.stringify(blank)})`, () => {
        const { http, paginator } = buildCore(stub);

        expect(() => new DocumentPages(http, paginator, documentsBase, blank))
          .toThrowError(UsageError, 'Missing document id');
        expect(stub.calls).toEqual([]);
      });
    });

    describe('list', () => {
      it('lists a Page with the page options', async () => {
        stub.reply(200, [{ id: 1 }], pageHeaders(2, 3));
        const page = await pages.list({ page: 2, perPage: 2 });

        expect(page).toEqual(jasmine.any(Page));
        expect(page.data).toEqual([{ id: 1 }]);
        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}.json?page=2&per_page=2`);
        expect(stub.lastCall.options.method).toEqual('GET');
      });

      it('iterates over every page', async () => {
        stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2)).reply(200, [{ id: 3 }], pageHeaders(2, 2));

        expect(await collect(pages.iterate({ restricted: true }))).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
        expect(stub.calls.length).toEqual(2);
        expect(stub.calls[0].url).toEqual(`${BASE_URL}/${base}/all.json`);
      });
    });

    describe('get', () => {
      it('is not supported (UsageError, no request)', async () => {
        await expectAsync(pages.get(12)).toBeRejectedWithError(UsageError, 'DocumentPages does not support get');
        await expectAsync(pages.get(12, { restricted: true })).toBeRejectedWithError(UsageError);
        expect(stub.calls).toEqual([]);
      });
    });

    describe('create / update', () => {
      it('POSTs the JSON body with the Bearer token', async () => {
        stub.reply(201, { id: 12, order: 1 });
        const body = await pages.create({ content: 'Once', order: 1, version: 2 });

        expect(body).toEqual({ id: 12, order: 1 });
        expect(stub.lastCall.options.method).toEqual('POST');
        expect(JSON.parse(stub.lastCall.options.body)).toEqual({ content: 'Once', order: 1, version: 2 });
        expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
        expect(stub.lastCall.options.headers['Content-Type']).toEqual('application/json');
      });

      it('PATCHes one page and URL-encodes its id', async () => {
        stub.reply(200, { id: 12 });
        await pages.update('1 2', { content: 'Twice' });

        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/1%202.json`);
        expect(stub.lastCall.options.method).toEqual('PATCH');
      });

      it('rejects a blank page id with UsageError, without any request', async () => {
        await expectAsync(pages.update('', { content: 'Twice' })).toBeRejectedWithError(UsageError);
        expect(stub.calls).toEqual([]);
      });
    });

    describe('trim', () => {
      it('sends DELETE with the JSON body {keep} and resolves on 204', async () => {
        stub.reply(204);
        const body = await pages.trim(3);

        expect(body).toBeNull();
        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}.json`);
        expect(stub.lastCall.options.method).toEqual('DELETE');
        expect(stub.lastCall.options.body).toEqual('{"keep":3}');
        expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
        expect(stub.lastCall.options.headers['Content-Type']).toEqual('application/json');
      });

      it('uses the restricted path', async () => {
        stub.reply(204);
        await pages.trim(0, { restricted: true });

        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/all.json`);
        expect(JSON.parse(stub.lastCall.options.body)).toEqual({ keep: 0 });
      });

      it('maps a 403 to PermissionError without the token in the message', async () => {
        stub.reply(403, { errors: { detail: ['scope_missing'] } });
        const error = await pages.trim(3).catch((caught) => caught);

        expect(error).toEqual(jasmine.any(PermissionError));
        expect(error.message).not.toContain(token);
      });
    });

    describe('bumpVersion', () => {
      it('sends PATCH bump_version with the body unchanged', async () => {
        stub.reply(200);
        await pages.bumpVersion({ version: 2, exclude_ids: [12] });

        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/bump_version.json`);
        expect(stub.lastCall.options.method).toEqual('PATCH');
        expect(JSON.parse(stub.lastCall.options.body)).toEqual({ version: 2, exclude_ids: [12] });
        expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
      });

      it('uses the restricted path', async () => {
        stub.reply(200);
        await pages.bumpVersion({ version: 2 }, { restricted: true });

        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/bump_version/all.json`);
      });

      it('maps a 400 to ValidationError without the token in the message', async () => {
        stub.reply(400, { errors: { version: ['invalid'] } });
        const error = await pages.bumpVersion({ version: 'x' }).catch((caught) => caught);

        expect(error).toEqual(jasmine.any(ValidationError));
        expect(error.message).not.toContain(token);
      });
    });
  });

  describe('retries', () => {
    let stub;
    let sleep;
    let pages;

    beforeEach(() => {
      stub = new FetchStub();
      sleep = jasmine.createSpy('sleep').and.resolveTo();
      const http = new HttpClient(new Config({
        baseUrl: BASE_URL, token, fetch: stub.fetch, retries: 2, env: {},
      }), { sleep, random: () => 0.5 });

      pages = new DocumentPages(http, new Paginator(http), documentsBase, 7);
    });

    it('never retries trim on a network error', async () => {
      stub.fail(new TypeError('fetch failed'));

      await expectAsync(pages.trim(3)).toBeRejectedWithError(NetworkError);
      expect(stub.calls.length).toEqual(1);
      expect(sleep).not.toHaveBeenCalled();
    });

    it('never retries bumpVersion on a network error', async () => {
      stub.fail(new TypeError('fetch failed'));

      await expectAsync(pages.bumpVersion({ version: 2 })).toBeRejectedWithError(NetworkError);
      expect(stub.calls.length).toEqual(1);
      expect(sleep).not.toHaveBeenCalled();
    });

    it('retries list on a network error', async () => {
      stub.fail(new TypeError('fetch failed')).reply(200, [], pageHeaders(1, 1));

      await pages.list();
      expect(stub.calls.length).toEqual(2);
    });
  });
});
