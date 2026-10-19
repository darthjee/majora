import { Config, DEFAULT_RETRIES, DEFAULT_TIMEOUT } from '../../src/core/Config.js';
import { ConfigurationError } from '../../src/core/errors/ConfigurationError.js';

describe('Config', () => {
  const token = 'mjr_secret_token_value';
  const fetch = () => Promise.resolve();
  const build = (options = {}) => new Config({
    baseUrl: 'https://majora.example.com', token, fetch, env: {}, ...options,
  });
  const expectError = (options, message) => {
    expect(() => build(options)).toThrowMatching((error) => (
      error instanceof ConfigurationError && (!message || error.message.includes(message))
    ));
  };

  describe('with explicit options', () => {
    it('resolves every value', () => {
      const config = build({ timeout: 5000, retries: 0 });

      expect(config.baseUrl).toEqual('https://majora.example.com');
      expect(config.token).toEqual(token);
      expect(config.timeout).toEqual(5000);
      expect(config.retries).toEqual(0);
      expect(config.fetch).toBe(fetch);
    });

    it('prefers the options over the environment', () => {
      const config = build({ env: { MAJORA_URL: 'https://env.example.com', MAJORA_TOKEN: 'mjr_env' } });

      expect(config.baseUrl).toEqual('https://majora.example.com');
      expect(config.token).toEqual(token);
    });
  });

  describe('with the environment fallback', () => {
    it('reads MAJORA_URL and MAJORA_TOKEN', () => {
      const config = build({
        baseUrl: undefined, token: undefined,
        env: { MAJORA_URL: 'https://env.example.com/', MAJORA_TOKEN: 'mjr_env' },
      });

      expect(config.baseUrl).toEqual('https://env.example.com');
      expect(config.token).toEqual('mjr_env');
    });

    it('treats empty options as missing', () => {
      const config = build({ baseUrl: '', token: '', env: { MAJORA_URL: 'https://env.example.com', MAJORA_TOKEN: 'mjr_env' } });

      expect(config.baseUrl).toEqual('https://env.example.com');
      expect(config.token).toEqual('mjr_env');
    });

    it('defaults to process.env', () => {
      const config = new Config({ baseUrl: 'https://majora.example.com', token, fetch });

      expect(config.token).toEqual(token);
    });

    it('tolerates a null environment', () => {
      expectError({ token: undefined, env: null }, 'MAJORA_TOKEN');
    });
  });

  describe('defaults', () => {
    it('uses the default timeout, retries and fetch', () => {
      const config = new Config({ baseUrl: 'https://majora.example.com', token, env: {} });

      expect(config.timeout).toEqual(DEFAULT_TIMEOUT);
      expect(config.timeout).toEqual(30000);
      expect(config.retries).toEqual(DEFAULT_RETRIES);
      expect(config.retries).toEqual(2);
      expect(config.fetch).toBe(globalThis.fetch);
    });

    it('accepts null as default', () => {
      const config = build({ timeout: null, retries: null });

      expect(config.timeout).toEqual(30000);
      expect(config.retries).toEqual(2);
    });
  });

  describe('baseUrl normalization', () => {
    it('strips trailing slashes', () => {
      expect(build({ baseUrl: 'https://majora.example.com//' }).baseUrl).toEqual('https://majora.example.com');
    });

    it('keeps a path prefix', () => {
      expect(build({ baseUrl: 'https://example.com/majora/' }).baseUrl).toEqual('https://example.com/majora');
    });
  });

  describe('baseUrl validation', () => {
    it('rejects a missing baseUrl', () => {
      expectError({ baseUrl: undefined }, 'MAJORA_URL');
    });

    it('rejects a relative URL', () => {
      expectError({ baseUrl: 'majora.example.com' }, 'Invalid baseUrl');
    });

    it('rejects a non-http protocol', () => {
      expectError({ baseUrl: 'ftp://majora.example.com' }, 'http(s)');
    });

    it('rejects credentials, queries and fragments', () => {
      expectError({ baseUrl: 'https://user:pass@majora.example.com' }, 'credentials');
      expectError({ baseUrl: 'https://majora.example.com?a=1' }, 'query');
      expectError({ baseUrl: 'https://majora.example.com#top' }, 'fragment');
    });
  });

  describe('transport security', () => {
    it('rejects http for a remote host', () => {
      expectError({ baseUrl: 'http://majora.example.com' }, 'Insecure baseUrl');
    });

    it('rejects http for a docker-compose hostname without allowInsecureHttp', () => {
      expectError({ baseUrl: 'http://majora_proxy:3000' }, 'allowInsecureHttp');
    });

    it('rejects http when allowInsecureHttp is not exactly true', () => {
      expectError({ baseUrl: 'http://majora_proxy:3000', allowInsecureHttp: 'yes' }, 'Insecure');
    });

    it('allows http for a docker-compose hostname with allowInsecureHttp', () => {
      expect(build({ baseUrl: 'http://majora_proxy:3000', allowInsecureHttp: true }).baseUrl)
        .toEqual('http://majora_proxy:3000');
    });

    it('allows http for localhost', () => {
      expect(build({ baseUrl: 'http://localhost:3000' }).baseUrl).toEqual('http://localhost:3000');
    });

    it('allows http for 127.0.0.1', () => {
      expect(build({ baseUrl: 'http://127.0.0.1:3000/' }).baseUrl).toEqual('http://127.0.0.1:3000');
    });
  });

  describe('token validation', () => {
    it('rejects a missing token', () => {
      expectError({ token: undefined }, 'Missing token');
    });

    it('rejects a non-string token', () => {
      expectError({ token: 1234 }, 'Missing token');
    });
  });

  describe('timeout and retries validation', () => {
    [-1, 1.5, '10', NaN, Infinity].forEach((value) => {
      it(`rejects a timeout of ${value}`, () => {
        expectError({ timeout: value }, 'timeout');
      });

      it(`rejects retries of ${value}`, () => {
        expectError({ retries: value }, 'retries');
      });
    });

    it('accepts 0 to disable them', () => {
      const config = build({ timeout: 0, retries: 0 });

      expect(config.timeout).toEqual(0);
      expect(config.retries).toEqual(0);
    });
  });

  describe('fetch validation', () => {
    it('rejects a non-function fetch', () => {
      expectError({ fetch: 'fetch' }, 'fetch');
    });
  });

  describe('immutability and secrecy', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(build())).toBeTrue();
    });

    it('does not expose the token when serialized', () => {
      const config = build();

      expect(JSON.stringify(config)).not.toContain(token);
      expect(Object.keys(config)).not.toContain('token');
    });

    it('never puts the token in an error message', () => {
      try {
        build({ baseUrl: `http://${token}.example.com` });
      } catch (error) {
        expect(error).toEqual(jasmine.any(ConfigurationError));
      }
      [{ timeout: token }, { retries: token }, { fetch: token }].forEach((options) => {
        expect(() => build(options)).toThrowMatching((error) => !error.message.includes(token));
      });
    });
  });
});
