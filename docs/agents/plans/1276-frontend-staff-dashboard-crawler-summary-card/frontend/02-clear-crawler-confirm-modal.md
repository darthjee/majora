# Add ClearCrawlerConfirmModal + i18n

Create a dedicated confirmation modal for the crawler card, a direct sibling of
`ClearCacheConfirmModal.jsx` / `helpers/ClearCacheConfirmModalHelper.jsx`, so
the dialog copy is crawler-specific instead of "Clear Cache".

New component `elements/ClearCrawlerConfirmModal.jsx` — same 2-line shape as
`ClearCacheConfirmModal.jsx`:

```jsx
import ClearCrawlerConfirmModalHelper from './helpers/ClearCrawlerConfirmModalHelper.jsx';

export default function ClearCrawlerConfirmModal({ show, onConfirm, onCancel }) {
  return ClearCrawlerConfirmModalHelper.render(show, { onConfirm, onCancel });
}
```

New helper `elements/helpers/ClearCrawlerConfirmModalHelper.jsx` — copy
`ClearCacheConfirmModalHelper.jsx` verbatim, swapping the translation namespace
from `clear_cache_confirm_modal.*` to `clear_crawler_confirm_modal.*` (keep the
`react-bootstrap/cjs/Modal.js` import, the `btn btn-secondary` cancel button,
and the `btn btn-danger` confirm button unchanged).

i18n — add a `clear_crawler_confirm_modal` block to `assets/i18n/en/common.yaml`
next to `clear_cache_confirm_modal`:

```yaml
clear_crawler_confirm_modal:
  title: Clear crawler entries
  body: This clears every captured crawler debug entry. This action cannot be undone.
  confirm: Clear entries
  cancel: Cancel
```

Register the namespace in `assets/i18n/en/index.js` — add
`'clear_crawler_confirm_modal'` to the `commonNamespaces` array (next to
`'clear_cache_confirm_modal'`). Do the same in `assets/i18n/pt/index.js` only
if that file carries its own `commonNamespaces` list; the `pt/common.yaml`
translations themselves are the `translator` agent's job — flag them.

Specs (mirror the existing `ClearCacheConfirmModal` specs):

- `elements/ClearCrawlerConfirmModalSpec.js` — asserts the component delegates
  to `ClearCrawlerConfirmModalHelper.render` with `(show, objectContaining({ onConfirm, onCancel }))`
  and forwards `show` as-is.
- `elements/helpers/ClearCrawlerConfirmModalHelperSpec.js` — asserts the modal
  shell renders the `clear_crawler_confirm_modal` title/body and the
  cancel/confirm buttons wired to the handlers.

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/ClearCrawlerConfirmModal.jsx` — new component.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearCrawlerConfirmModalHelper.jsx` — new helper.
- `frontend/assets/i18n/en/common.yaml` — add `clear_crawler_confirm_modal` block.
- `frontend/assets/i18n/en/index.js` — register the namespace in `commonNamespaces`.
- `frontend/assets/i18n/pt/index.js` — register the namespace if it maintains its own list.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/ClearCrawlerConfirmModalSpec.js` — new spec.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearCrawlerConfirmModalHelperSpec.js` — new spec.
