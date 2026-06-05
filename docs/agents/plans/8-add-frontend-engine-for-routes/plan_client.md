# Plan: HTTP Client

## `frontend/assets/js/client/GenericClient.js`

Identical to the Oak version. All page controllers use this instead of calling `fetch`
directly. The `hashProvider` constructor argument allows injecting a fixed hash in tests.

```js
import getHashQueryParams from '../utils/hashQueryParams.js';
import HashRouteResolver from '../utils/HashRouteResolver.js';

export default class GenericClient {
  #hashProvider;
  #routeResolver;

  constructor(hashProvider = () => (typeof window === 'undefined' ? '' : window.location.hash)) {
    this.#hashProvider = hashProvider;
    this.#routeResolver = new HashRouteResolver(hashProvider);
  }

  currentHash() { return this.#hashProvider(); }

  async fetch(path) {
    return this.#request(
      this.#buildUrl(path, getHashQueryParams(this.currentHash())),
      { headers: { Accept: 'application/json' } },
    );
  }

  async fetchIndex(path) {
    const response = await fetch(
      this.#buildUrl(path, this.#routeResolver.getPaginationParams()),
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) throw new Error(`Request failed for ${path}`);
    const data = await response.json();
    return { data, pagination: this.#extractPagination(response.headers) };
  }

  async post(path, body) {
    return this.#request(path, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async patch(path, body) {
    return this.#request(path, {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  #buildUrl(path, params = new URLSearchParams()) {
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  #extractPagination(headers) {
    const pages = this.#parsePositiveInteger(headers.get('pages'), 1);
    const page  = this.#clamp(this.#parsePositiveInteger(headers.get('page'), 1), 1, pages);
    const perPage = this.#parsePositiveInteger(headers.get('per_page'), 10);
    return { page, pages, perPage };
  }

  #parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return (Number.isNaN(parsed) || parsed < 1) ? fallback : parsed;
  }

  #clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  async #request(path, options) {
    const response = await fetch(path, options);
    if (!response.ok) throw new Error(`Request failed for ${path}`);
    return response.json();
  }
}
```

### Method summary

| Method | HTTP verb | Hash params forwarded | Pagination headers read | Returns |
|---|---|---|---|---|
| `fetch(path)` | GET | all params | no | JSON body |
| `fetchIndex(path)` | GET | `page`, `per_page` only | yes | `{ data, pagination }` |
| `post(path, body)` | POST | none | no | JSON body |
| `patch(path, body)` | PATCH | none | no | JSON body |
