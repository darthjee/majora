import { Page } from '../../src/core/Page.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { Factions } from '../../src/resources/Factions.js';
import { GameResource } from '../../src/resources/GameResource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';
import { itReadsSummaries } from '../support/summaryExamples.js';
import { itManagesPhotos } from '../support/photoExamples.js';
import { itResolvesVariants } from '../support/variantExamples.js';

describe('Factions', () => {
  const base = 'games/epic-quest/factions';

  itResolvesVariants((http, paginator) => new Factions(http, paginator, 'epic-quest'), {
    list: [base, null],
    get: [`${base}/12`, null],
    create: [base, null],
    update: [`${base}/12`, null],
  });

  describe('pagination', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = new Factions(http, paginator, 'epic-quest');
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

  describe('characters', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = new Factions(http, paginator, 'epic-quest');
    });

    it('lists the faction members as a Page', async () => {
      stub.reply(200, [{ id: 12 }], pageHeaders(1, 2));
      const page = await resource.characters(5, { perPage: 2 });

      expect(page).toEqual(jasmine.any(Page));
      expect(page.data).toEqual([{ id: 12 }]);
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/5/characters.json?per_page=2`);
      expect(stub.lastCall.options.method).toEqual('GET');
    });

    it('uses characters/all when restricted', async () => {
      stub.reply(200, [], pageHeaders(1, 1));
      await resource.characters(5, { restricted: true });

      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/5/characters/all.json`);
    });

    it('URL-encodes the faction id', async () => {
      stub.reply(200, [], pageHeaders(1, 1));
      await resource.characters('a b');

      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/a%20b/characters.json`);
    });

    it('iterateCharacters walks every page', async () => {
      stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2)).reply(200, [{ id: 3 }], pageHeaders(2, 2));

      expect(await collect(resource.iterateCharacters(5, { restricted: true })))
        .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(stub.calls.map((call) => call.url)).toEqual([
        `${BASE_URL}/${base}/5/characters/all.json`,
        `${BASE_URL}/${base}/5/characters/all.json?page=2`,
      ]);
    });

    [undefined, null, ''].forEach((blank) => {
      it(`rejects a blank faction id (${JSON.stringify(blank)}) with UsageError, without any request`, async () => {
        await expectAsync(resource.characters(blank)).toBeRejectedWithError(UsageError, 'Missing id');
        expect(() => resource.iterateCharacters(blank)).toThrowError(UsageError, 'Missing id');
        expect(stub.calls).toEqual([]);
      });
    });
  });

  itReadsSummaries((http, paginator) => new Factions(http, paginator, 'epic-quest'), base);

  itManagesPhotos((http, paginator) => new Factions(http, paginator, 'epic-quest'), 'games/epic-quest/factions');
});
