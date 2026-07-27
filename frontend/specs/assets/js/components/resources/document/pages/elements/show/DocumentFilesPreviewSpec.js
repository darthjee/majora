import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DocumentFilesPreview
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentFilesPreview.jsx';

// `DocumentFilesPreview` fetches its files through `useEffect` (via
// `DocumentFilesPreviewController`), which never runs under `renderToStaticMarkup` (no DOM, no
// commit phase) — it always renders `null` on its first (and only) render here, mirroring
// `DocumentPhotosPreviewSpec.js`'s own SSR-only coverage. The fetch/degrade behavior is exercised
// directly in `DocumentFilesPreviewControllerSpec.js`; the rendering once resolved is exercised
// in `DocumentFilesPreviewHelperSpec.js`.
describe('DocumentFilesPreview', function() {
  it('renders nothing before the fetch effect resolves', function() {
    const html = renderToStaticMarkup(
      React.createElement(DocumentFilesPreview, { game_slug: 'demo', id: 9 }),
    );

    expect(html).toBe('');
  });
});
