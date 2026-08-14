import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FactionPreviewCard from '../../../../../../assets/js/components/common/cards/FactionPreviewCard.jsx';

describe('FactionPreviewCard', function() {
  it('delegates rendering to FactionPreviewCardHelper', function() {
    const faction = { id: 1, name: 'The Silver Hand', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(FactionPreviewCard, { faction }));

    expect(html).toContain('alt="The Silver Hand"');
    expect(html).toContain('default_faction.png');
  });

  it('does not render a link when href is not given', function() {
    const faction = { id: 1, name: 'The Silver Hand', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(FactionPreviewCard, { faction }));

    expect(html).not.toContain('<a ');
  });

  it('links to the given href when provided', function() {
    const faction = { id: 1, name: 'The Silver Hand', photo_path: null };
    const html = renderToStaticMarkup(
      React.createElement(FactionPreviewCard, { faction, href: '#/games/demo/factions/9' }),
    );

    expect(html).toContain('href="#/games/demo/factions/9"');
  });
});
