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
    it('sends a DELETE to the logout endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.logout('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/logout.json', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });
  });

  describe('#status', function() {
    it('sends the auth token when present', async function() {
      const client = new AuthClient();

      await client.status('abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/users/status.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': '1',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new AuthClient();

      await client.status(null);

      expect(fetchSpy).toHaveBeenCalledWith('/users/status.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': '1',
        },
        body: undefined,
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
        body: undefined,
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

  describe('#register', function() {
    it('posts the registration fields to the register endpoint', async function() {
      const client = new AuthClient();

      await client.register('Jane Doe', 'jane@example.com', 'secret', 'secret');

      expect(fetchSpy).toHaveBeenCalledWith('/users/register.json', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Skip-Cache': '1' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'secret',
          password_confirmation: 'secret',
        }),
      });
    });
  });

  describe('#setLanguagePreference', function() {
    it('posts the language to the language endpoint with the auth token', async function() {
      const client = new AuthClient();

      await client.setLanguagePreference('abc123', 'en');

      expect(fetchSpy).toHaveBeenCalledWith('/users/language.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
          Authorization: 'Token abc123',
        },
        body: JSON.stringify({ language: 'en' }),
      });
    });
  });
});
