import { randomUUID } from 'node:crypto';
import axios from 'axios';
import { NaviClient } from 'navi-hey-client';
import { RequestHandler } from 'navi-hey/extension';

// Matches a Lootstudios bundle (collection) URL and captures its slug, e.g.
// https://app.lootstudios.com/bundle/tidal-aberrations/ -> "tidal-aberrations".
const BUNDLE_URL_PATTERN = /^https?:\/\/app\.lootstudios\.com\/bundle\/([a-z0-9-]+)\/?(\?.*)?$/i;

const GET_MY_LOOTS_CACHE_URL =
  'https://app.lootstudios.com/wp-admin/admin-ajax.php?action=GetMyLootsCache';

// Same browser-like headers as crawler/navi_config.yaml's `lootstudios`
// client, needed to avoid the flat 403 bot-protection response.
const LOOTSTUDIOS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
};

const NAVI_BASE_URL = 'http://localhost:3000';

// Builds the per-collection two-pass resource (bundle pass -> Collection,
// miniature pass -> StlModels), narrowed to the resolved slug/obj_inid, per
// docs/agents/specs/loot-crawling/interactive-collection-enqueue.md's
// "Per-collection resource shape".
function buildResource (slug, bundleInid) {
  return [
    {
      url: '/wp-admin/admin-ajax.php?action=GetMyLootsCache',
      status: 200,
      client: 'lootstudios',
      parser: {
        type: 'json_path',
        match: 'bundleObjs',
        filter: [
          { field: 'obj_type', equals: 'bundle' },
          { field: 'obj_slug', equals: slug },
        ],
        fields: {
          obj_inid: 'external_id',
          obj_title: 'name',
          obj_slug: 'slug',
        },
      },
      emit: {
        client: 'majora_api',
        method: 'POST',
        url: '/miniatures/collections/import.json',
        status: 200,
        body_template: {
          name: '{:name}',
          external_id: '{:external_id}',
          url: 'https://app.lootstudios.com/bundle/{:slug}/',
          source_name: 'Lootstudios',
        },
      },
    },
    {
      url: '/wp-admin/admin-ajax.php?action=GetMyLootsCache',
      status: 200,
      client: 'lootstudios',
      parser: {
        type: 'json_path',
        match: 'bundleObjs',
        filter: [
          { field: 'obj_type', equals: 'miniature' },
          { field: 'bnd_inid', equals: bundleInid },
        ],
        fields: {
          obj_inid: 'external_id',
          obj_title: 'name',
          bnd_inid: 'collection_external_id',
        },
      },
      emit: {
        client: 'majora_api',
        method: 'POST',
        url: '/miniatures/stl_models/import.json',
        status: 200,
        body_template: {
          name: '{:name}',
          external_id: '{:external_id}',
          source_name: 'Lootstudios',
          collection_external_id: '{:collection_external_id}',
        },
      },
    },
  ];
}

class EnqueueHandler extends RequestHandler {
  constructor (request, response) {
    super();
    this.request = request;
    this.response = response;
  }

  async handle () {
    const url = this.request.body && this.request.body.url;
    const match = typeof url === 'string' ? url.match(BUNDLE_URL_PATTERN) : null;

    if (!match) {
      this.response.status(400).json({
        error: 'url must be an https://app.lootstudios.com/bundle/<slug>/ URL',
      });
      return;
    }

    const slug = match[1];
    let bundle;

    try {
      const response = await axios.get(GET_MY_LOOTS_CACHE_URL, {
        headers: {
          ...LOOTSTUDIOS_HEADERS,
          Cookie: `PHPSESSID=${process.env.LOOTSTUDIOS_SESSION_COOKIE}`,
        },
      });
      const bundleObjs = (response.data && response.data.bundleObjs) || [];
      bundle = bundleObjs.find(
        (item) => item.obj_type === 'bundle' && item.obj_slug === slug,
      );
    } catch (err) {
      this.response.status(502).json({ error: err.message });
      return;
    }

    if (!bundle) {
      this.response.status(404).json({ error: 'collection not found' });
      return;
    }

    const namespace = `enqueue_${slug}_${randomUUID()}`;

    try {
      const client = new NaviClient({
        baseUrl: NAVI_BASE_URL,
        token: process.env.NAVI_API_TOKEN,
      });

      await client.config({
        namespace,
        resources: { enqueue: buildResource(slug, bundle.obj_inid) },
      });
      await client.engineStart({
        targets: [{ namespace, resources: ['enqueue'] }],
      });
    } catch (err) {
      this.response.status(502).json({ error: err.message });
      return;
    }

    this.response.status(200).json({ status: 'enqueued', slug, namespace });
  }
}

export default [
  { method: 'POST', path: '/ext/lootstudios/enqueue.json', handler: EnqueueHandler },
];
