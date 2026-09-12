import axios from 'axios';
import { AxiosUtils } from 'navi-hey/testing/axios.js';
import routes from '../../src/backend/enqueue.js';

const VALID_URL = 'https://app.lootstudios.com/bundle/tidal-aberrations/';
const SLUG = 'tidal-aberrations';
const BUNDLE_INID = 'F2608S14E02';

function fakeResponse () {
  const response = {
    status: jasmine.createSpy('status'),
    json: jasmine.createSpy('json'),
  };
  response.status.and.returnValue(response);
  return response;
}

function catalogWithBundle () {
  return {
    bundleObjs: [
      {
        obj_type: 'bundle',
        obj_slug: SLUG,
        obj_inid: BUNDLE_INID,
        obj_title: 'Tidal Aberrations',
      },
    ],
  };
}

async function run (url) {
  const request = { body: { url } };
  const response = fakeResponse();
  await new routes[0].handler(request, response).handle();
  return response;
}

describe('enqueue backend extension', () => {
  it('declares POST /ext/lootstudios/enqueue.json', () => {
    const [route] = routes;
    expect(route.method).toBe('POST');
    expect(route.path).toBe('/ext/lootstudios/enqueue.json');
  });

  describe('with a malformed url', () => {
    beforeEach(() => {
      spyOn(axios, 'get');
      spyOn(axios, 'post');
    });

    it('rejects a missing url with a 400 before any network call', async () => {
      const response = await run(undefined);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'url must be an https://app.lootstudios.com/bundle/<slug>/ URL',
      });
      expect(axios.get).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('rejects a bare slug with a 400 before any network call', async () => {
      const response = await run('tidal-aberrations');

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'url must be an https://app.lootstudios.com/bundle/<slug>/ URL',
      });
      expect(axios.get).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('rejects a wrong-host url with a 400 before any network call', async () => {
      const response = await run('https://example.com/bundle/tidal-aberrations/');

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'url must be an https://app.lootstudios.com/bundle/<slug>/ URL',
      });
      expect(axios.get).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('with a slug not present in the catalog', () => {
    it('returns a 404', async () => {
      AxiosUtils.stubGet(200, { bundleObjs: [] });

      const response = await run(VALID_URL);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({ error: 'collection not found' });
    });
  });

  describe('when the resolve call fails', () => {
    it('returns a 502 with the underlying failure message', async () => {
      AxiosUtils.stubGetRejection(new Error('resolve call failed'));

      const response = await run(VALID_URL);

      expect(response.status).toHaveBeenCalledWith(502);
      expect(response.json).toHaveBeenCalledWith({ error: 'resolve call failed' });
    });
  });

  describe('when the push/start calls fail', () => {
    it('returns a 502 with the underlying failure message', async () => {
      AxiosUtils.stubGet(200, catalogWithBundle());
      AxiosUtils.stubPostRejection(new Error('push failed'));

      const response = await run(VALID_URL);

      expect(response.status).toHaveBeenCalledWith(502);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Request to http://localhost:3000/api/config failed: push failed',
      });
    });
  });

  describe('with a valid, resolvable url', () => {
    it('pushes the per-collection resource and starts the engine', async () => {
      AxiosUtils.stubGet(200, catalogWithBundle());
      AxiosUtils.stubPost(200, { status: 'accepted' });

      const response = await run(VALID_URL);

      expect(axios.post).toHaveBeenCalledTimes(2);

      const [configUrl, configBody] = axios.post.calls.argsFor(0);
      expect(configUrl).toBe('http://localhost:3000/api/config');
      expect(configBody.namespace).toMatch(new RegExp(`^enqueue_${SLUG}_.+`));

      const [bundlePass, miniaturePass] = configBody.resources.enqueue;
      expect(bundlePass.parser.filter).toEqual([
        { field: 'obj_type', equals: 'bundle' },
        { field: 'obj_slug', equals: SLUG },
      ]);
      expect(miniaturePass.parser.filter).toEqual([
        { field: 'obj_type', equals: 'miniature' },
        { field: 'bnd_inid', equals: BUNDLE_INID },
      ]);

      const [startUrl, startBody] = axios.post.calls.argsFor(1);
      expect(startUrl).toBe('http://localhost:3000/api/engine/start');
      expect(startBody).toEqual({
        targets: [{ namespace: configBody.namespace, resources: ['enqueue'] }],
      });

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        status: 'enqueued',
        slug: SLUG,
        namespace: configBody.namespace,
      });
    });
  });
});
