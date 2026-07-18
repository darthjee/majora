import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SeeAllCard from '../../../../../../assets/js/components/common/cards/SeeAllCard.jsx';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';

describe('SeeAllCard', function() {
  it('delegates rendering to SeeAllCardHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(SeeAllCard, { icon: Icons.gem, text: 'See all Treasures', href: '#/treasures' })
    );

    expect(html).toContain('bi-gem');
    expect(html).toContain('href="#/treasures"');
  });
});
