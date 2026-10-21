import { PermissionError } from '../../src/core/errors/PermissionError.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { FetchStub } from './FetchStub.js';
import { BASE_URL, buildCore } from './buildCore.js';

const TOKEN = 'mjr_fake_token_for_specs';

/**
 * Defines the specs of `summary(id, kind, characterId)` on a linked family wrapper.
 * @param {Function} build - `(http, paginator) => resource`.
 * @param {string} base - The resource base path (e.g. `games/epic-quest/items`).
 */
export function itReadsSummaries(build, base) {
  describe('summary', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = build(http, paginator);
    });

    ['pcs', 'npcs'].forEach((kind) => {
      it(`GETs <id>/${kind}/<character_id>/summary and returns the body`, async () => {
        stub.reply(200, { id: 7, quantity: 2 });
        const body = await resource.summary(7, kind, 12);

        expect(body).toEqual({ id: 7, quantity: 2 });
        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/7/${kind}/12/summary.json`);
        expect(stub.lastCall.options.method).toEqual('GET');
        expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${TOKEN}`);
      });

      it(`uses summary/all for a restricted ${kind} summary`, async () => {
        stub.reply(200, { id: 7 });
        await resource.summary(7, kind, 12, { restricted: true });

        expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/7/${kind}/12/summary/all.json`);
      });
    });

    it('URL-encodes both ids', async () => {
      stub.reply(200, {});
      await resource.summary('a b', 'pcs', 'c/d');

      expect(stub.lastCall.url).toEqual(`${BASE_URL}/${base}/a%20b/pcs/c%2Fd/summary.json`);
    });

    ['characters', 'PCS', '', undefined].forEach((kind) => {
      it(`rejects the kind ${JSON.stringify(kind)} with UsageError, without any request`, async () => {
        await expectAsync(resource.summary(7, kind, 12)).toBeRejectedWithError(UsageError, /character kind/);
        expect(stub.calls).toEqual([]);
      });
    });

    [undefined, null, ''].forEach((blank) => {
      it(`rejects a blank id (${JSON.stringify(blank)}) with UsageError, without any request`, async () => {
        await expectAsync(resource.summary(blank, 'pcs', 12)).toBeRejectedWithError(UsageError, 'Missing id');
        await expectAsync(resource.summary(7, 'pcs', blank))
          .toBeRejectedWithError(UsageError, 'Missing character id');
        expect(stub.calls).toEqual([]);
      });
    });

    it('maps a 403 to PermissionError without the token in the message', async () => {
      stub.reply(403, { errors: { detail: ['scope_missing'] } });
      const error = await resource.summary(7, 'npcs', 12).catch((caught) => caught);

      expect(error).toEqual(jasmine.any(PermissionError));
      expect(error.message).not.toContain(TOKEN);
    });
  });
}
