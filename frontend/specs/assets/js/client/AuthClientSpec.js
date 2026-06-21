import AuthClient from '../../../../assets/js/client/AuthClient.js';

describe('AuthClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#login', function() {
    it('posts credentials to the login endpoint', async function() {
      const client = new AuthClient();

      await client.login('majora-user', 'secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/login.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ username: 'majora-user', password: 'secret' }),
      });
    });
  });

  describe('#logout', function() {
    it('posts to the logout endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.logout('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/logout.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
          Authorization: 'Token abc123',
        },
      });
    });
  });

  describe('#status', function() {
    it('sends the auth token when present', async function() {
      const client = new AuthClient();

      await client.status('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/status.json', {
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': '1',
          Authorization: 'Token abc123',
        },
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new AuthClient();

      await client.status(null);

      expect(fetchSpy).toHaveBeenCalledWith('/users/status.json', {
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': '1',
        },
      });
    });
  });

  describe('#sendTestEmail', function() {
    it('posts to the test-email endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.sendTestEmail('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/test-email.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
      });
    });
  });

  describe('#recoverPassword', function() {
    it('posts the email to the recover endpoint', async function() {
      const client = new AuthClient();

      await client.recoverPassword('user@example.com');

      expect(fetchSpy).toHaveBeenCalledWith('/users/recover.json', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
    });
  });

  describe('#resetPassword', function() {
    it('posts the token and password to the reset-password endpoint', async function() {
      const client = new AuthClient();

      await client.resetPassword('tok-123', 'new-secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/reset-password.json', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok-123', password: 'new-secret' }),
      });
    });
  });
});
