import { Page } from '../../src/core/Page.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { DocumentPages } from '../../src/resources/DocumentPages.js';
import { Documents } from '../../src/resources/Documents.js';
import { GameResource } from '../../src/resources/GameResource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';
import { itReadsSummaries } from '../support/summaryExamples.js';
import { itResolvesVariants } from '../support/variantExamples.js';

describe('Documents', () => {
  const base = 'games/epic-quest/documents';

  itResolvesVariants((http, paginator) => new Documents(http, paginator, 'epic-quest'), {
    list: [base, `${base}/all`],
    get: [`${base}/12`, `${base}/12/full`],
    create: [base, null],
    update: [`${base}/12`, null],
  });

  describe('pagination', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = new Documents(http, paginator, 'epic-quest');
    });

    it('is a GameResource', () => {
      expect(resource).toEqual(jasmine.any(GameResource));
    });

    it('lists a Page with the page options', async () => {
      stub.reply(200, [{ id: 1 }], pageHeaders(2, 3));
      const page = await resource.list({ page: 2, perPage: 2 });

      expect(page).toEqual(jasmine.any(Page));
      expect(page.data).toEqual([{ id: 1 }]);
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}.json?page=2&per_page=2`);
    });

    it('iterates over every page', async () => {
      stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2)).reply(200, [{ id: 3 }], pageHeaders(2, 2));

      expect(await collect(resource.iterate())).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(stub.calls.length).toEqual(2);
    });
  });

  describe('pages', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = new Documents(http, paginator, 'epic-quest');
    });

    it('returns a DocumentPages bound to the document', () => {
      const pages = resource.pages(7);

      expect(pages).toEqual(jasmine.any(DocumentPages));
      expect(pages.documentId).toEqual(7);
      expect(pages.basePath).toEqual(`${base}/7/pages`);
    });

    it('lists the pages of the document', async () => {
      stub.reply(200, [{ id: 12 }], pageHeaders(1, 1));
      await resource.pages(7).list();

      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/7/pages.json`);
    });

    it('URL-encodes the document id', () => {
      expect(resource.pages('a/b').basePath).toEqual(`${base}/a%2Fb/pages`);
    });

    [undefined, null, ''].forEach((blank) => {
      it(`throws UsageError for a blank id (${JSON.stringify(blank)}), without any request`, () => {
        expect(() => resource.pages(blank)).toThrowError(UsageError);
        expect(stub.calls).toEqual([]);
      });
    });
  });

  itReadsSummaries((http, paginator) => new Documents(http, paginator, 'epic-quest'), base);
});
