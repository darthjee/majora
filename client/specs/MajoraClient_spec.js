import { inspect } from 'node:util';
import { MajoraClient } from '../src/MajoraClient.js';
import { HttpClient } from '../src/core/HttpClient.js';
import { Paginator } from '../src/core/Paginator.js';
import {
  ApiError, AuthenticationError, ConfigurationError, MajoraError, NetworkError, NotFoundError,
  PermissionError, ServerError, UsageError, ValidationError,
} from '../src/index.js';
import { FetchStub } from './support/FetchStub.js';

describe('MajoraClient', () => {
  const token = 'mjr_fake_token_for_specs';
  const secretBody = 'private campaign content';
  let stub;
  let client;

  const build = (options = {}) => new MajoraClient({
    baseUrl: 'https://majora.example.com', token, fetch: stub.fetch, retries: 0, env: {}, ...options,
  });

  beforeEach(() => {
    stub = new FetchStub();
    client = build();
  });

  describe('construction', () => {
    it('exposes the HTTP layer and the paginator', () => {
      expect(client.http).toEqual(jasmine.any(HttpClient));
      expect(client.paginator).toEqual(jasmine.any(Paginator));
    });

    it('keeps http and paginator read-only', () => {
      expect(() => {
        client.http = null;
      }).toThrowError(TypeError);
      expect(client.http).toEqual(jasmine.any(HttpClient));
    });

    it('has no resource accessors yet', () => {
      expect(client.game).toBeUndefined();
      expect(client.games).toBeUndefined();
    });

    it('falls back to the environment', async () => {
      client = new MajoraClient({ fetch: stub.fetch, env: { MAJORA_URL: 'https://env.example.com', MAJORA_TOKEN: 'mjr_env' } });
      stub.reply(200, []);
      await client.http.get('my-games');

      expect(stub.lastCall.url).toEqual('https://env.example.com/my-games.json');
      expect(stub.lastCall.options.headers.Authorization).toEqual('Bearer mjr_env');
    });

    it('raises ConfigurationError at construction, before any request', () => {
      [
        { baseUrl: undefined },
        { baseUrl: 'not a url' },
        { token: undefined },
        { baseUrl: 'http://majora.example.com' },
      ].forEach((options) => {
        expect(() => build(options)).toThrowError(ConfigurationError);
      });
      expect(stub.calls).toEqual([]);
    });

    it('accepts insecure http with allowInsecureHttp', () => {
      expect(() => build({ baseUrl: 'http://majora_proxy:3000', allowInsecureHttp: true })).not.toThrow();
    });

    it('does not reveal the token when inspected or serialized', () => {
      expect(inspect(client, { showHidden: true, depth: 10 })).not.toContain(token);
      expect(JSON.stringify(client)).not.toContain(token);
      expect(String(client)).not.toContain(token);
    });
  });

  describe('end to end', () => {
    it('sends an authenticated GET through the injected fetch', async () => {
      stub.reply(200, [{ slug: 'epic-quest' }]);
      const response = await client.http.get('my-games');

      expect(response.body).toEqual([{ slug: 'epic-quest' }]);
      expect(stub.lastCall.url).toEqual('https://majora.example.com/my-games.json');
      expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
    });

    it('lists pages through the paginator', async () => {
      stub.reply(200, [{ id: 1 }], { page: '1', pages: '1', per_page: '24', total: '1' });
      const page = await client.paginator.list('games/epic-quest/npcs');

      expect(page.data).toEqual([{ id: 1 }]);
      expect(stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${token}`);
    });
  });

  describe('token safety', () => {
    const captureError = async (queue, send = () => client.http.post('games/x/npcs', { notes: secretBody })) => {
      queue();
      try {
        await send();
      } catch (error) {
        return error;
      }
      throw new Error('expected an error');
    };

    const scenarios = {
      ValidationError: () => captureError(() => stub.reply(400, { errors: { name: ['blank'] } })),
      AuthenticationError: () => captureError(() => stub.reply(401, { detail: 'token_invalid' }, { 'WWW-Authenticate': 'Bearer' })),
      PermissionError: () => captureError(() => stub.reply(403, { errors: { detail: ['scope_missing'] } })),
      NotFoundError: () => captureError(() => stub.reply(404, { detail: 'Not found.' })),
      ApiError: () => captureError(() => stub.reply(422, { status: 'failed', error: 'not_available' })),
      ServerError: () => captureError(() => stub.reply(502, '<html>Bad Gateway</html>')),
      NetworkError: () => captureError(() => stub.fail(new TypeError('fetch failed'))),
      'NetworkError (timeout)': () => captureError(() => stub.hang(), () => client.http.get('games', { timeout: 5 })),
      'NetworkError (abort)': () => {
        const controller = new AbortController();

        controller.abort();

        return captureError(() => stub.hang(), () => client.http.get('games', { signal: controller.signal }));
      },
      ConfigurationError: () => captureError(() => null, () => Promise.resolve().then(() => build({ baseUrl: 'http://x.example.com' }))),
      UsageError: () => Promise.resolve(new UsageError('restricted variant not available')),
    };
    const classes = {
      ValidationError, AuthenticationError, PermissionError, NotFoundError, ApiError, ServerError,
      NetworkError, ConfigurationError, UsageError,
    };

    Object.entries(scenarios).forEach(([name, scenario]) => {
      it(`never exposes the token nor the request body in a ${name}`, async () => {
        const error = await scenario();
        const ErrorClass = classes[name.split(' ')[0]];
        const ownValues = Object.getOwnPropertyNames(error).map((key) => {
          const value = error[key];

          return typeof value === 'string' ? value : inspect(value, { depth: 10 });
        });

        expect(error).toEqual(jasmine.any(ErrorClass));
        expect(error).toEqual(jasmine.any(MajoraError));
        [error.message, String(error), error.stack, JSON.stringify(error), inspect(error, { showHidden: true, depth: 10 }), ...ownValues]
          .forEach((text) => {
            expect(text).not.toContain(token);
            expect(text).not.toContain(secretBody);
          });
      });
    });
  });
});
