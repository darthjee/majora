import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlayerProfileCard
  from '../../../../../../../../assets/js/components/resources/player/pages/elements/PlayerProfileCard.jsx';

describe('PlayerProfileCard', function() {
  it('renders the label and name', function() {
    const html = renderToStaticMarkup(
      React.createElement(PlayerProfileCard, { label: 'Character', photoUrl: '/char.png', name: 'Frodo' })
    );

    expect(html).toContain('Character');
    expect(html).toContain('Frodo');
  });

  it('renders the given photo URL', function() {
    const html = renderToStaticMarkup(
      React.createElement(PlayerProfileCard, { label: 'Character', photoUrl: '/char.png', name: 'Frodo' })
    );

    expect(html).toContain('/char.png');
  });

  it('falls back to the default placeholder image when no photo URL is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(PlayerProfileCard, { label: 'Player', photoUrl: null, name: 'No linked account' })
    );

    expect(html).toContain('<img');
    expect(html).not.toContain('src=""');
  });
});
