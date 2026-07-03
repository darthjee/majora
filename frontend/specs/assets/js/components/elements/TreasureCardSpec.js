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
});
