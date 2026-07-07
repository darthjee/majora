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
    expect(html).toContain('5 GP');
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

  it('renders a quantity badge when quantity is greater than 1', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, quantity: 4 })
    );
    expect(html).toContain('×4');
  });

  it('does not render a quantity badge when quantity is 1', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure, quantity: 1 })
    );
    expect(html).not.toContain('×');
  });

  it('renders the available/max units line when treasure.max_units is present', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, {
        treasure: { ...treasure, available_units: 2, max_units: 5 },
      })
    );
    expect(html).toContain('Available: 2 / 5');
  });

  it('does not render an availability line when treasure.max_units is absent', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureCard, { treasure })
    );
    expect(html).not.toContain('Available:');
  });
});
