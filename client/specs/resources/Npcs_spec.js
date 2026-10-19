import { Page } from '../../src/core/Page.js';
import { Npcs } from '../../src/resources/Npcs.js';
import { CharacterResource } from '../../src/resources/CharacterResource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';
import { itResolvesVariants } from '../support/variantExamples.js';

describe('Npcs', () => {
  const base = 'games/epic-quest/npcs';

  itResolvesVariants((http, paginator) => new Npcs(http, paginator, 'epic-quest'), {
    list: [base, `${base}/all`],
    get: [`${base}/12`, `${base}/12/full`],
    create: [base, `${base}/full`],
    update: [`${base}/12`, `${base}/12/full`],
  });

  describe('pagination', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = new Npcs(http, paginator, 'epic-quest');
    });

    it('is a CharacterResource', () => {
      expect(resource).toEqual(jasmine.any(CharacterResource));
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
});
