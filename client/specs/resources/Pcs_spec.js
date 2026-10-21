import { UsageError } from '../../src/core/errors/UsageError.js';
import { Page } from '../../src/core/Page.js';
import { Pcs } from '../../src/resources/Pcs.js';
import { CharacterDocuments } from '../../src/resources/CharacterDocuments.js';
import { CharacterFactions } from '../../src/resources/CharacterFactions.js';
import { CharacterItems } from '../../src/resources/CharacterItems.js';
import { CharacterResource } from '../../src/resources/CharacterResource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';
import { itResolvesVariants } from '../support/variantExamples.js';

describe('Pcs', () => {
  const base = 'games/epic-quest/pcs';

  itResolvesVariants((http, paginator) => new Pcs(http, paginator, 'epic-quest'), {
    list: [base, null],
    get: [`${base}/12`, `${base}/12/full`],
    update: [`${base}/12`, `${base}/12/full`],
  });

  describe('pagination', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = new Pcs(http, paginator, 'epic-quest');
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

    it('throws UsageError when iterating the restricted list, without any request', () => {
      expect(() => resource.iterate({ restricted: true })).toThrowError(UsageError, 'Pcs has no restricted variant for list');
      expect(stub.calls).toEqual([]);
    });

    it('rejects create with UsageError, without any request', async () => {
      await expectAsync(resource.create({ name: 'Bob' })).toBeRejectedWithError(UsageError, 'Pcs does not support create');
      expect(stub.calls).toEqual([]);
    });
  });

  describe('link sub-wrappers', () => {
    let resource;

    beforeEach(() => {
      const { http, paginator } = buildCore(new FetchStub());

      resource = new Pcs(http, paginator, 'epic-quest');
    });

    [
      ['items', CharacterItems],
      ['documents', CharacterDocuments],
      ['factions', CharacterFactions],
    ].forEach(([factory, Klass]) => {
      it(`${factory}(id) returns a ${Klass.name} bound to the character`, () => {
        const links = resource[factory](12);

        expect(links).toEqual(jasmine.any(Klass));
        expect(links.characterId).toEqual(12);
        expect(links.basePath).toEqual(`${base}/12/${factory}`);
      });
    });
  });
});
