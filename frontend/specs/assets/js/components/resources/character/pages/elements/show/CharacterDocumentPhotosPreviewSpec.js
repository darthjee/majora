import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentPhotosPreview
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPhotosPreview.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

// `CharacterDocumentPhotosPreview` fetches its photos through `useEffect` (via
// `CharacterDocumentPhotosPreviewController`), which never runs under `renderToStaticMarkup` (no
// DOM, no commit phase) — it always renders `null` on its first (and only) render here, mirroring
// `DocumentPhotosPreviewSpec.js`'s own SSR-only coverage. The fetch/degrade behavior is exercised
// directly in `CharacterDocumentPhotosPreviewControllerSpec.js`; the rendering once resolved is
// exercised in `CharacterDocumentPhotosPreviewHelperSpec.js`.
describe('CharacterDocumentPhotosPreview', function() {
  it('renders nothing before the fetch effect resolves', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDocumentPhotosPreview, {
        game_slug: 'demo', kind: 'pcs', character_id: 7, id: 9, handlers: { onSelectPhoto: Noop.noop },
      }),
    );

    expect(html).toBe('');
  });
});
