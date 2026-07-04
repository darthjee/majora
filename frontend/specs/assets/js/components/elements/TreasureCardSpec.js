import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TreasureCard from '../../../../../assets/js/components/elements/TreasureCard.jsx';

describe('TreasureCard', function() {
  const treasure = { id: 42, name: 'Golden Crown', value: 500 };

  it('delegates rendering to TreasureCardHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure })
    );
    expect(html).toContain('Golden Crown');
    expect(html).toContain('500');
    expect(html).toContain('href="#/treasures/42"');
  });

  it('renders the 6-per-row column classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure })
    );
    expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
  });

  it('does not render the upload button when isSuperUser is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, isSuperUser: false })
    );
    expect(html).not.toContain('photo-upload-overlay-button');
  });

  it('renders the upload button when isSuperUser is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, isSuperUser: true, onUploadClick: () => {} })
    );
    expect(html).toContain('photo-upload-overlay-button');
  });
});
