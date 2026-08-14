import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FactionCharacterCard
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/FactionCharacterCard.jsx';

describe('FactionCharacterCard', function() {
  it('delegates rendering to FactionCharacterCardHelper', function() {
    const character = {
      id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
    };
    const html = renderToStaticMarkup(React.createElement(FactionCharacterCard, { character, gameSlug: 'demo' }));

    expect(html).toContain('alt="Aragorn"');
    expect(html).toContain('href="#/games/demo/pcs/5"');
  });

  it('links to the npcs page for an npc character', function() {
    const character = {
      id: 8, name: 'Gandalf', type: 'npc', photo_path: null,
    };
    const html = renderToStaticMarkup(React.createElement(FactionCharacterCard, { character, gameSlug: 'demo' }));

    expect(html).toContain('href="#/games/demo/npcs/8"');
  });

  it('does not render a kick button by default', function() {
    const character = {
      id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
    };
    const html = renderToStaticMarkup(React.createElement(FactionCharacterCard, { character, gameSlug: 'demo' }));

    expect(html).not.toContain('bi-person-x');
  });

  it('renders a kick button when canKick is true', function() {
    const character = {
      id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
    };
    const html = renderToStaticMarkup(
      React.createElement(FactionCharacterCard, { character, gameSlug: 'demo', canKick: true }),
    );

    expect(html).toContain('bi-person-x');
  });
});
