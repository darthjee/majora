import AccessStoreLogging from '../../../../../../assets/js/utils/access/store/AccessStoreLogging.js';
import MajoraLogger from '../../../../../../assets/js/utils/logging/MajoraLogger.js';

describe('AccessStoreLogging', function() {
  let debugSpy;

  beforeEach(function() {
    debugSpy = spyOn(MajoraLogger, 'debug');
  });

  describe('#wrap', function() {
    it('returns the original promise unchanged on success', async function() {
      const fetcherPromise = Promise.resolve({ can_edit: true });

      const result = await AccessStoreLogging.wrap('ensureGame', ['demo'], fetcherPromise);

      expect(result).toEqual({ can_edit: true });
    });

    it('logs the method, args, and result at debug level on success', async function() {
      const fetcherPromise = Promise.resolve({ can_edit: true });

      await AccessStoreLogging.wrap('ensureGame', ['demo'], fetcherPromise);

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo'],
        result: { can_edit: true },
      });
    });

    it('merges the given meta into the logged entry', async function() {
      const fetcherPromise = Promise.resolve({ can_edit: true });

      await AccessStoreLogging.wrap(
        'ensureGame', ['demo', ['player']], fetcherPromise, { roles: ['player'], effectiveRoles: ['dm'] },
      );

      expect(debugSpy).toHaveBeenCalledWith({
        method: 'ensureGame',
        args: ['demo', ['player']],
        roles: ['player'],
        effectiveRoles: ['dm'],
        result: { can_edit: true },
      });
    });

    it('rejects with the original error without swallowing it', async function() {
      const error = new Error('boom');
      const fetcherPromise = Promise.reject(error);

      await expectAsync(
        AccessStoreLogging.wrap('ensureGame', ['demo'], fetcherPromise),
      ).toBeRejectedWith(error);
    });

    it('logs the method, args, and error at debug level on failure', async function() {
      const error = new Error('boom');
      const fetcherPromise = Promise.reject(error);

      await expectAsync(AccessStoreLogging.wrap('ensureGame', ['demo'], fetcherPromise)).toBeRejectedWith(error);

      expect(debugSpy).toHaveBeenCalledWith({ method: 'ensureGame', args: ['demo'], error });
    });

    it('defaults meta to an empty object', async function() {
      const fetcherPromise = Promise.resolve('ok');

      await AccessStoreLogging.wrap('ensureSuperUser', [], fetcherPromise);

      expect(debugSpy).toHaveBeenCalledWith({ method: 'ensureSuperUser', args: [], result: 'ok' });
    });
  });
});
