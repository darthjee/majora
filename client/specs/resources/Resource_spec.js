import { UsageError } from '../../src/core/errors/UsageError.js';
import { Page } from '../../src/core/Page.js';
import { Resource } from '../../src/resources/Resource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';

class Widgets extends Resource {
  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: ':id/full' },
  };
}

class ReadOnlyWidgets extends Resource {
  static variants = {
    list: { regular: '', restricted: null },
    get: { regular: ':id', restricted: null },
  };
}

describe('Resource', () => {
  let stub;
  let core;
  let widgets;

  const url = (path) => `${BASE_URL}/${path}.json`;

  beforeEach(() => {
    stub = new FetchStub();
    core = buildCore(stub);
    widgets = new Widgets(core.http, core.paginator, 'shop/widgets');
  });

  describe('basePath, http and paginator', () => {
    it('exposes them', () => {
      expect(widgets.basePath).toEqual('shop/widgets');
      expect(widgets.http).toBe(core.http);
      expect(widgets.paginator).toBe(core.paginator);
    });
  });

  describe('pathFor', () => {
    it('resolves the regular variant by default', () => {
      expect(widgets.pathFor('list')).toEqual('shop/widgets');
      expect(widgets.pathFor('get', { id: 12 })).toEqual('shop/widgets/12');
    });

    it('resolves the restricted variant', () => {
      expect(widgets.pathFor('list', { restricted: true })).toEqual('shop/widgets/all');
      expect(widgets.pathFor('get', { id: 12, restricted: true })).toEqual('shop/widgets/12/full');
    });

    it('URL-encodes the id', () => {
      expect(widgets.pathFor('get', { id: 'a b/c?$&' })).toEqual('shop/widgets/a%20b%2Fc%3F%24%26');
    });

    it('raises UsageError for a blank id', () => {
      [undefined, null, ''].forEach((id) => {
        expect(() => widgets.pathFor('get', { id })).toThrowError(UsageError, 'Missing id');
      });
    });

    it('raises UsageError for a missing variant', () => {
      expect(() => widgets.pathFor('create', { restricted: true }))
        .toThrowError(UsageError, 'Widgets has no restricted variant for create');
    });

    it('raises UsageError for a missing action', () => {
      expect(() => widgets.pathFor('delete')).toThrowError(UsageError, 'Widgets does not support delete');
      expect(() => widgets.pathFor('toString')).toThrowError(UsageError);
    });
  });

  describe('list', () => {
    it('returns a Page from the regular path', async () => {
      stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2));
      const page = await widgets.list();

      expect(page).toEqual(jasmine.any(Page));
      expect(page.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(page.pages).toEqual(2);
      expect(stub.lastCall.url).toEqual(url('shop/widgets'));
      expect(stub.lastCall.options.method).toEqual('GET');
    });

    it('uses the restricted path and forwards the other options', async () => {
      stub.reply(200, [], pageHeaders(2, 2));
      await widgets.list({
        restricted: true, page: 2, perPage: 10, query: { name: 'Bob' }, headers: { 'X-Extra': '1' },
      });

      expect(stub.lastCall.url).toEqual(`${url('shop/widgets/all')}?name=Bob&page=2&per_page=10`);
      expect(stub.lastCall.options.headers['X-Extra']).toEqual('1');
    });

    it('does not send restricted as a query parameter', async () => {
      stub.reply(200, []);
      await widgets.list({ restricted: false });

      expect(stub.lastCall.url).toEqual(url('shop/widgets'));
    });

    it('fetches the next page through the Page', async () => {
      stub.reply(200, [{ id: 1 }], pageHeaders(1, 2)).reply(200, [{ id: 2 }], pageHeaders(2, 2));
      const page = await widgets.list({ restricted: true, perPage: 1 });
      const next = await page.next();

      expect(next.data).toEqual([{ id: 2 }]);
      expect(stub.lastCall.url).toEqual(`${url('shop/widgets/all')}?page=2&per_page=1`);
    });

    it('rejects with UsageError for a missing variant, without any request', async () => {
      const readOnly = new ReadOnlyWidgets(core.http, core.paginator, 'shop/widgets');

      await expectAsync(readOnly.list({ restricted: true })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });
  });

  describe('iterate', () => {
    it('yields every item of every page', async () => {
      stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2))
        .reply(200, [{ id: 3 }, { id: 4 }], pageHeaders(2, 2));
      const items = await collect(widgets.iterate({ restricted: true, query: { slain: false } }));

      expect(items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      expect(stub.calls.map((call) => call.url)).toEqual([
        `${url('shop/widgets/all')}?slain=false`,
        `${url('shop/widgets/all')}?slain=false&page=2`,
      ]);
    });

    it('throws UsageError synchronously for a missing variant, without any request', () => {
      const readOnly = new ReadOnlyWidgets(core.http, core.paginator, 'shop/widgets');

      expect(() => readOnly.iterate({ restricted: true })).toThrowError(UsageError);
      expect(stub.calls).toEqual([]);
    });
  });

  describe('get', () => {
    it('returns the parsed body', async () => {
      stub.reply(200, { id: 12, name: 'Bob' });

      expect(await widgets.get(12)).toEqual({ id: 12, name: 'Bob' });
      expect(stub.lastCall.url).toEqual(url('shop/widgets/12'));
      expect(stub.lastCall.options.method).toEqual('GET');
    });

    it('uses the restricted path and forwards the options', async () => {
      stub.reply(200, {});
      await widgets.get(12, { restricted: true, query: { lang: 'en' }, headers: { 'X-Extra': '1' } });

      expect(stub.lastCall.url).toEqual(`${url('shop/widgets/12/full')}?lang=en`);
      expect(stub.lastCall.options.headers['X-Extra']).toEqual('1');
    });

    it('forwards the caller signal', async () => {
      const controller = new AbortController();

      controller.abort();
      stub.hang();

      await expectAsync(widgets.get(12, { signal: controller.signal })).toBeRejected();
    });

    it('rejects with UsageError for a blank id, without any request', async () => {
      await expectAsync(widgets.get(undefined)).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });

    it('rejects with UsageError for a missing variant, without any request', async () => {
      const readOnly = new ReadOnlyWidgets(core.http, core.paginator, 'shop/widgets');

      await expectAsync(readOnly.get(1, { restricted: true })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });
  });

  describe('create', () => {
    it('POSTs the JSON body and returns the parsed body', async () => {
      stub.reply(201, { id: 3, name: 'Bob' });
      const body = await widgets.create({ name: 'Bob' });

      expect(body).toEqual({ id: 3, name: 'Bob' });
      expect(stub.lastCall.url).toEqual(url('shop/widgets'));
      expect(stub.lastCall.options.method).toEqual('POST');
      expect(JSON.parse(stub.lastCall.options.body)).toEqual({ name: 'Bob' });
      expect(stub.lastCall.options.headers['Content-Type']).toEqual('application/json');
    });

    it('rejects with UsageError for a missing variant, without any request', async () => {
      await expectAsync(widgets.create({ name: 'Bob' }, { restricted: true })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });

    it('rejects with UsageError for a missing action, without any request', async () => {
      const readOnly = new ReadOnlyWidgets(core.http, core.paginator, 'shop/widgets');

      await expectAsync(readOnly.create({ name: 'Bob' })).toBeRejectedWithError(UsageError, 'ReadOnlyWidgets does not support create');
      expect(stub.calls).toEqual([]);
    });
  });

  describe('update', () => {
    it('PATCHes the JSON body and returns the parsed body', async () => {
      stub.reply(200, { id: 12, name: 'Robert' });
      const body = await widgets.update(12, { name: 'Robert' });

      expect(body).toEqual({ id: 12, name: 'Robert' });
      expect(stub.lastCall.url).toEqual(url('shop/widgets/12'));
      expect(stub.lastCall.options.method).toEqual('PATCH');
      expect(JSON.parse(stub.lastCall.options.body)).toEqual({ name: 'Robert' });
    });

    it('uses the restricted path', async () => {
      stub.reply(200, {});
      await widgets.update(12, { name: 'Robert' }, { restricted: true });

      expect(stub.lastCall.url).toEqual(url('shop/widgets/12/full'));
      expect(stub.lastCall.options.method).toEqual('PATCH');
    });

    it('rejects with UsageError for a blank id, without any request', async () => {
      await expectAsync(widgets.update('', { name: 'Robert' })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });

    it('rejects with UsageError for a missing action, without any request', async () => {
      const readOnly = new ReadOnlyWidgets(core.http, core.paginator, 'shop/widgets');

      await expectAsync(readOnly.update(1, {})).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });
  });

  it('has no delete action', () => {
    expect(widgets.delete).toBeUndefined();
  });
});
