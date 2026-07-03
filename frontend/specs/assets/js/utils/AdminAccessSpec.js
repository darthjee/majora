import AdminAccess from '../../../../assets/js/utils/AdminAccess.js';
import AuthStorage from '../../../../assets/js/utils/AuthStorage.js';

describe('AdminAccess', function() {
  let client;

  beforeEach(function() {
    client = jasmine.createSpyObj('client', ['status']);
    spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
  });

  describe('.isSuperUser', function() {
    it('resolves to true when the status response reports a superuser', async function() {
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: true }),
      }));

      const result = await AdminAccess.isSuperUser(client);

      expect(client.status).toHaveBeenCalledWith('tok-abc');
      expect(result).toBe(true);
    });

    it('resolves to false when the status response reports is_superuser: false', async function() {
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_superuser: false }),
      }));

      const result = await AdminAccess.isSuperUser(client);

      expect(result).toBe(false);
    });

    it('resolves to false when is_superuser is absent from the response', async function() {
      client.status.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }));

      const result = await AdminAccess.isSuperUser(client);

      expect(result).toBe(false);
    });

    it('resolves to false when the response is not ok', async function() {
      client.status.and.returnValue(Promise.resolve({ ok: false }));

      const result = await AdminAccess.isSuperUser(client);

      expect(result).toBe(false);
    });

    it('resolves to false when the request throws', async function() {
      client.status.and.returnValue(Promise.reject(new Error('network error')));

      const result = await AdminAccess.isSuperUser(client);

      expect(result).toBe(false);
    });
  });
});
