import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import DocumentPreviewCard from '../../../../../../assets/js/components/common/cards/DocumentPreviewCard.jsx';

describe('DocumentPreviewCard', function() {
  it('delegates rendering to DocumentPreviewCardHelper', function() {
    const document = { id: 1, name: 'Ancient Tome', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(DocumentPreviewCard, { document }));

    expect(html).toContain('alt="Ancient Tome"');
    expect(html).toContain('default_document.png');
  });
});
