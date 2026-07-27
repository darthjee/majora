import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import DocumentFileCard from '../../../../../../assets/js/components/common/cards/DocumentFileCard.jsx';

describe('DocumentFileCard', function() {
  it('delegates rendering to DocumentFileCardHelper', function() {
    const file = {
      id: 1, name: 'Campaign Notes', path: '/files/1/download', photo_path: null,
    };
    const html = renderToStaticMarkup(React.createElement(DocumentFileCard, { file }));

    expect(html).toContain('alt="Campaign Notes"');
    expect(html).toContain('default_file.png');
    expect(html).toContain('href="/files/1/download"');
  });
});
