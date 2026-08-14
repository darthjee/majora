import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PossessionPreviewCard from '../../../../../../assets/js/components/common/cards/PossessionPreviewCard.jsx';

describe('PossessionPreviewCard', function() {
  it('delegates rendering to PossessionPreviewCardHelper', function() {
    const possession = { id: 1, name: 'Manor House', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(PossessionPreviewCard, { possession }));

    expect(html).toContain('alt="Manor House"');
    expect(html).toContain('default_possession.png');
  });

  it('does not render a link when href is not given', function() {
    const possession = { id: 1, name: 'Manor House', photo_path: null };
    const html = renderToStaticMarkup(React.createElement(PossessionPreviewCard, { possession }));

    expect(html).not.toContain('<a ');
  });

  it('links to the given href when provided', function() {
    const possession = { id: 1, name: 'Manor House', photo_path: null };
    const html = renderToStaticMarkup(
      React.createElement(
        PossessionPreviewCard,
        { possession, href: '#/games/demo/pcs/7/possessions/1' },
      ),
    );

    expect(html).toContain('href="#/games/demo/pcs/7/possessions/1"');
  });
});
