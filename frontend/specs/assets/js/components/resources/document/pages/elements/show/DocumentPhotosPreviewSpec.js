import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPhotosPreview
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPhotosPreview.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

// `DocumentPhotosPreview` fetches its photos through `useEffect` (via
// `DocumentPhotosPreviewController`), which never runs under `renderToStaticMarkup` (no DOM, no
// commit phase) — it always renders `null` on its first (and only) render here, mirroring
// `ShortListSpec.js`'s own SSR-only coverage. The fetch/degrade behavior is exercised directly in
// `DocumentPhotosPreviewControllerSpec.js`; the rendering once resolved is exercised in
// `DocumentPhotosPreviewHelperSpec.js`.
describe('DocumentPhotosPreview', function() {
  it('renders nothing before the fetch effect resolves', function() {
    const html = renderToStaticMarkup(
      React.createElement(DocumentPhotosPreview, {
        game_slug: 'demo', id: 9, handlers: { onSelectPhoto: Noop.noop },
      }),
    );

    expect(html).toBe('');
  });
});
