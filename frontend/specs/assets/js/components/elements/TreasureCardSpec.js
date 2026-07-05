import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TreasureCard from '../../../../../assets/js/components/elements/TreasureCard.jsx';
import Noop from '../../../../../assets/js/utils/Noop.js';

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

  it('does not render the upload button when canManage is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, canManage: false })
    );
    expect(html).not.toContain('photo-upload-overlay-button');
  });

  it('renders the upload button when canManage is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, canManage: true, onUploadClick: Noop.noop })
    );
    expect(html).toContain('photo-upload-overlay-button');
  });

  it('does not render the edit link when canManage is true but editHref is omitted', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, canManage: true })
    );
    expect(html).not.toContain('Edit');
  });

  it('renders the edit link when canManage is true and editHref is present', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, {
        treasure, canManage: true, editHref: '#/games/demo/treasures/42/edit',
      })
    );
    expect(html).toContain('href="#/games/demo/treasures/42/edit"');
  });

  it('does not render the edit link when canManage is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, {
        treasure, canManage: false, editHref: '#/games/demo/treasures/42/edit',
      })
    );
    expect(html).not.toContain('href="#/games/demo/treasures/42/edit"');
  });
});
