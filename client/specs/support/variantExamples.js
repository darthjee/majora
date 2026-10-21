import { UsageError } from '../../src/core/errors/UsageError.js';
import { FetchStub } from './FetchStub.js';
import { BASE_URL, buildCore } from './buildCore.js';

const METHODS = {
  list: 'GET', get: 'GET', create: 'POST', update: 'PATCH',
};
const CUSTOM_METHODS = { trim: 'DELETE', bumpVersion: 'PATCH' };
const ID = 12;
const DATA = { name: 'Bob' };
const KEEP = 3;
const BUMP = { version: 2, exclude_ids: [ID] };
const BODIES = {
  create: DATA, update: DATA, trim: { keep: KEEP }, bumpVersion: BUMP,
};

/**
 * Calls one action of a wrapper.
 * @param {object} resource - The wrapper.
 * @param {string} action - The action.
 * @param {object} options - Call options.
 * @returns {Promise<unknown>} The call result.
 */
function call(resource, action, options) {
  switch (action) {
    case 'list':
      return resource.list(options);
    case 'get':
      return resource.get(ID, options);
    case 'create':
      return resource.create(DATA, options);
    case 'trim':
      return resource.trim(KEEP, options);
    case 'bumpVersion':
      return resource.bumpVersion(BUMP, options);
    default:
      return resource.update(ID, DATA, options);
  }
}

/**
 * Defines the specs of a wrapper's variant map: for every action and variant, the exact URL
 * and HTTP method, or a `UsageError` with no request when the variant / action is missing.
 * @param {Function} build - `(http, paginator) => resource`.
 * @param {object} table - `action → [regularPath, restrictedPath]` (paths without `.json`,
 *   `null` for a missing variant); actions not in the table must be unsupported. The custom
 *   actions `trim` and `bumpVersion` are only checked when present in the table.
 */
export function itResolvesVariants(build, table) {
  describe('variants', () => {
    let stub;
    let resource;

    beforeEach(() => {
      stub = new FetchStub();
      const { http, paginator } = buildCore(stub);

      resource = build(http, paginator);
    });

    const methods = { ...METHODS };

    Object.keys(CUSTOM_METHODS).filter((action) => table[action]).forEach((action) => {
      methods[action] = CUSTOM_METHODS[action];
    });

    Object.keys(methods).forEach((action) => {
      const paths = table[action];

      if (!paths) {
        it(`does not support ${action} (UsageError, no request)`, async () => {
          await expectAsync(call(resource, action, {})).toBeRejectedWithError(UsageError);
          await expectAsync(call(resource, action, { restricted: true })).toBeRejectedWithError(UsageError);
          expect(stub.calls).toEqual([]);
        });
        return;
      }

      [false, true].forEach((restricted, index) => {
        const path = paths[index];
        const label = restricted ? 'restricted' : 'regular';

        if (path === null) {
          it(`has no ${label} ${action} (UsageError, no request)`, async () => {
            await expectAsync(call(resource, action, { restricted })).toBeRejectedWithError(UsageError);
            expect(stub.calls).toEqual([]);
          });
          return;
        }

        it(`sends ${methods[action]} ${path}.json for a ${label} ${action}`, async () => {
          stub.reply(200, action === 'list' ? [] : { id: ID });
          await call(resource, action, restricted ? { restricted } : {});

          expect(stub.lastCall.url).toEqual(`${BASE_URL}/${path}.json`);
          expect(stub.lastCall.options.method).toEqual(methods[action]);
          if (BODIES[action]) {
            expect(JSON.parse(stub.lastCall.options.body)).toEqual(BODIES[action]);
          }
        });
      });
    });

    it('has no delete', () => {
      expect(resource.delete).toBeUndefined();
    });
  });
}
