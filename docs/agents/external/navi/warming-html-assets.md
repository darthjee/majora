# Warming HTML pages and their assets

By default, Navi treats response bodies as JSON and chains further requests via `actions`.
When a resource is an HTML page (e.g. `/`, `/about`), you can instruct Navi to also warm the
CSS stylesheets and JavaScript bundles it references by declaring an `assets` list.

Each entry in `assets` specifies:

- **`selector`** — a CSS selector used to find the relevant elements in the response HTML (e.g. `link[rel="stylesheet"]`, `script[src]`).
- **`attribute`** — the attribute on each matched element that holds the asset URL (e.g. `href`, `src`).
- **`client`** *(optional)* — named client to use when fetching the asset. Defaults to `default`.
- **`status`** *(optional)* — expected HTTP status code for asset fetches. Defaults to `200`.

### Example

```yaml
clients:
  default:
    base_url: https://your-app.example.com

resources:
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
        - selector: 'script[src]'
          attribute: src
```

When Navi fetches `/`, it parses the HTML body and extracts the `href` attribute from every
`<link rel="stylesheet">` element and the `src` attribute from every `<script src="…">` element.
Each discovered URL is then fetched as an independent job that follows the standard retry/dead path.

#### URL resolution

Asset URLs are resolved to absolute form before being fetched:

| Form | Resolution |
|------|------------|
| `https://…` or `http://…` (absolute) | Used as-is. |
| `//cdn.example.com/app.css` (protocol-relative) | Prepended with `https:`. |
| `/assets/app.css` (root-relative) | Concatenated with the client's `base_url`. |

#### Using a separate CDN client

If your assets are served from a CDN with different headers or a different base URL, define a
dedicated client and reference it in the asset rule:

```yaml
clients:
  default:
    base_url: https://your-app.example.com
  cdn:
    base_url: https://cdn.example.com
    headers:
      Cache-Control: no-cache

resources:
  home_page:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
          client: cdn
```

#### Combining `assets` and `actions`

A resource may declare both `assets` and `actions`. Both are processed independently after
a successful response — `assets` for HTML asset extraction and `actions` for JSON response
chaining. In practice, a resource would typically declare one or the other.

[← Back to How to Use Navi](../HOW_TO_USE_NAVI.md)
