import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentFilesPreview
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentFilesPreview.jsx';

// `CharacterDocumentFilesPreview` fetches its files through `useEffect` (via
// `CharacterDocumentFilesPreviewController`), which never runs under `renderToStaticMarkup` (no
// DOM, no commit phase) — it always renders `null` on its first (and only) render here, mirroring
// `DocumentFilesPreviewSpec.js`'s own SSR-only coverage. The fetch/degrade behavior is exercised
// directly in `CharacterDocumentFilesPreviewControllerSpec.js`; the rendering once resolved is
// exercised in `CharacterDocumentFilesPreviewHelperSpec.js`.
describe('CharacterDocumentFilesPreview', function() {
  it('renders nothing before the fetch effect resolves', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterDocumentFilesPreview, {
        game_slug: 'demo', kind: 'pcs', character_id: 7, id: 9,
      }),
    );

    expect(html).toBe('');
  });
});
