import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { Page } from '../../src/core/Page.js';
import { Paginator } from '../../src/core/Paginator.js';
import { ApiError } from '../../src/core/errors/ApiError.js';
import { NetworkError } from '../../src/core/errors/NetworkError.js';
import { ServerError } from '../../src/core/errors/ServerError.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { CharacterLinks } from '../../src/resources/CharacterLinks.js';
import { Npcs } from '../../src/resources/Npcs.js';
import { Pcs } from '../../src/resources/Pcs.js';
import { FetchStub } from './FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from './buildCore.js';
import { itResolvesVariants } from './variantExamples.js';

export const TOKEN = 'mjr_fake_token_for_specs';

/**
 * The character families a link sub-wrapper hangs from.
 * @type {Array<{kind: string, Family: Function}>}
 */
export const CHARACTER_FAMILIES = [
  { kind: 'npcs', Family: Npcs },
  { kind: 'pcs', Family: Pcs },
];

/**
 * Defines the specs shared by every character link sub-wrapper, for both `npcs` and `pcs`.
 * @param {object} params - Parameters.
 * @param {Function} params.Klass - The sub-wrapper class (`CharacterItems`, ...).
 * @param {string} params.factory - The factory method on `Npcs` / `Pcs` (`items`, ...).
 * @param {Function} params.remove - `(links, options) => promise` calling `remove`.
 * @param {Function} params.removePath - `(base) => [regular, restricted]` remove paths.
 * @param {object} params.removeBody - The JSON body `remove` is expected to send.
 * @param {Function} [params.extra] - `(kind, base, build) => void` for extra specs.
 */
export function itBehavesLikeCharacterLinks({
  Klass, factory, remove, removePath, removeBody, extra,
}) {
  const segment = Klass.segment;

  CHARACTER_FAMILIES.forEach(({ kind, Family }) => {
    describe(`under ${kind}`, () => {
      const characterBase = `games/epic-quest/${kind}`;
      const base = `${characterBase}/12/${segment}`;
      const build = (http, paginator) => new Family(http, paginator, 'epic-quest')[factory](12);

      itResolvesVariants(build, {
        list: [base, `${base}/all`],
        get: [`${base}/12`, `${base}/12/full`],
      });

      describe('with a stubbed fetch', () => {
        let stub;
        let links;

        beforeEach(() => {
          stub = new FetchStub();
          const { http, paginator } = buildCore(stub);

          links = build(http, paginator);
        });

        it(`is built by ${kind}.${factory}(id) as a ${Klass.name}`, () => {
          expect(links).toEqual(jasmine.any(Klass));
          expect(links).toEqual(jasmine.any(CharacterLinks));
          expect(links.characterId).toEqual(12);
          expect(links.basePath).toEqual(base);
        });

        it('URL-encodes the character id', () => {
          const { http, paginator } = buildCore(stub);
          const encoded = new Family(http, paginator, 'epic-quest')[factory]('a b/c');

          expect(encoded.basePath).toEqual(`${characterBase}/a%20b%2Fc/${segment}`);
        });

        [undefined, null, ''].forEach((blank) => {
          it(`throws UsageError for a blank character id (${JSON.stringify(blank)})`, () => {
            const { http, paginator } = buildCore(stub);
            const family = new Family(http, paginator, 'epic-quest');

            expect(() => family[factory](blank)).toThrowError(UsageError, 'Missing character id');
            expect(() => new Klass(http, paginator, characterBase, blank))
              .toThrowError(UsageError, 'Missing character id');
            expect(stub.calls).toEqual([]);
          });
        });

        it('lists a Page and iterates over every page', async () => {
          stub.reply(200, [{ id: 1 }], pageHeaders(2, 3));
          const page = await links.list({ page: 2, perPage: 2 });

          expect(page).toEqual(jasmine.any(Page));
          expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}.json?page=2&per_page=2`);

          stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2)).reply(200, [{ id: 3 }], pageHeaders(2, 2));
          expect(await collect(links.iterate({ restricted: true }))).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
          expect(stub.calls[1].url).toEqual(`${BASE_URL}/${base}/all.json`);
        });

        describe('available', () => {
          it('GETs available and returns a Page', async () => {
            stub.reply(200, [{ id: 3 }], pageHeaders(1, 1));
            const page = await links.available({ perPage: 5 });

            expect(page).toEqual(jasmine.any(Page));
            expect(page.data).toEqual([{ id: 3 }]);
            expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/available.json?per_page=5`);
            expect(stub.lastCall.options.method).toEqual('GET');
            expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${TOKEN}`);
          });

          it('uses the restricted path', async () => {
            stub.reply(200, [], pageHeaders(1, 1));
            await links.available({ restricted: true });

            expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/available/all.json`);
          });

          it('iterateAvailable walks every page', async () => {
            stub.reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2)).reply(200, [{ id: 3 }], pageHeaders(2, 2));

            expect(await collect(links.iterateAvailable({ restricted: true })))
              .toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
            expect(stub.calls.map((call) => call.url)).toEqual([
              `${BASE_URL}/${base}/available/all.json`,
              `${BASE_URL}/${base}/available/all.json?page=2`,
            ]);
          });
        });

        describe('acquire', () => {
          it('POSTs the body as-is with the Bearer token', async () => {
            stub.reply(200, { status: 'ok' });
            const body = await links.acquire({ some_id: 3, extra: [1] });

            expect(body).toEqual({ status: 'ok' });
            expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/acquire.json`);
            expect(stub.lastCall.options.method).toEqual('POST');
            expect(JSON.parse(stub.lastCall.options.body)).toEqual({ some_id: 3, extra: [1] });
            expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${TOKEN}`);
            expect(stub.lastCall.options.headers['Content-Type']).toEqual('application/json');
          });

          it('uses the restricted path', async () => {
            stub.reply(200, { status: 'ok' });
            await links.acquire({ some_id: 3 }, { restricted: true });

            expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/acquire/all.json`);
          });

          it('maps the LinkHandler 422 to an ApiError with codes, without the token', async () => {
            stub.reply(422, { status: 'failed', error: 'not_available' });
            const error = await links.acquire({ some_id: 3 }).catch((caught) => caught);

            expect(error).toEqual(jasmine.any(ApiError));
            expect(error.status).toEqual(422);
            expect(error.codes).toEqual(['not_available']);
            expect(error.message).not.toContain(TOKEN);
          });
        });

        describe('remove', () => {
          const [regular, restricted] = removePath(base);

          it('POSTs the expected body to the remove path', async () => {
            stub.reply(200, { status: 'ok' });
            const body = await remove(links, {});

            expect(body).toEqual({ status: 'ok' });
            expect(stub.lastCall.url).toEqual(`${BASE_URL}/${regular}.json`);
            expect(stub.lastCall.options.method).toEqual('POST');
            expect(JSON.parse(stub.lastCall.options.body)).toEqual(removeBody);
            expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${TOKEN}`);
          });

          it('uses the restricted path', async () => {
            stub.reply(200, { status: 'ok' });
            await remove(links, { restricted: true });

            expect(stub.lastCall.url).toEqual(`${BASE_URL}/${restricted}.json`);
          });

          it('maps the LinkHandler 422 to an ApiError with codes, without the token', async () => {
            stub.reply(422, { status: 'failed', error: 'not_linked' });
            const error = await remove(links, {}).catch((caught) => caught);

            expect(error).toEqual(jasmine.any(ApiError));
            expect(error.codes).toEqual(['not_linked']);
            expect(error.message).not.toContain(TOKEN);
          });
        });

        if (extra) {
          extra({ base, getLinks: () => links, getStub: () => stub });
        }
      });

      describe('retries', () => {
        let stub;
        let sleep;
        let links;

        beforeEach(() => {
          stub = new FetchStub();
          sleep = jasmine.createSpy('sleep').and.resolveTo();
          const http = new HttpClient(new Config({
            baseUrl: BASE_URL, token: TOKEN, fetch: stub.fetch, retries: 2, env: {},
          }), { sleep, random: () => 0.5 });

          links = new Family(http, new Paginator(http), 'epic-quest')[factory](12);
        });

        it('never retries acquire on a 503', async () => {
          stub.reply(503);

          await expectAsync(links.acquire({ some_id: 3 })).toBeRejectedWithError(ServerError);
          expect(stub.calls.length).toEqual(1);
          expect(sleep).not.toHaveBeenCalled();
        });

        it('never retries remove on a 503', async () => {
          stub.reply(503);

          await expectAsync(remove(links, {})).toBeRejectedWithError(ServerError);
          expect(stub.calls.length).toEqual(1);
          expect(sleep).not.toHaveBeenCalled();
        });

        it('never retries acquire on a network error', async () => {
          stub.fail(new TypeError('fetch failed'));

          await expectAsync(links.acquire({ some_id: 3 })).toBeRejectedWithError(NetworkError);
          expect(stub.calls.length).toEqual(1);
        });

        it('retries available (GET) on a 503', async () => {
          stub.reply(503).reply(200, [], pageHeaders(1, 1));

          await links.available();
          expect(stub.calls.length).toEqual(2);
          expect(sleep).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
}
