import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterCard from '../../../../../assets/js/components/elements/CharacterCard.jsx';
import { buildCharacter } from '../../../../support/factories.js';

describe('CharacterCard', function() {
  const character = buildCharacter({ id: 42, name: 'Aragorn' });

  it('delegates rendering to CharacterCardHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, { character, gameSlug: 'epic-quest', characterType: 'pc' })
    );
    expect(html).toContain('Aragorn');
    expect(html).toContain('href="#/games/epic-quest/pcs/42"');
  });

  it('renders the normal size by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, { character, gameSlug: 'epic-quest', characterType: 'pc' })
    );
    expect(html).toContain('col-sm-6 col-md-4 col-lg-3');
    expect(html).toContain('<h5');
  });

  it('renders the small size when requested', function() {
    const html = renderToStaticMarkup(
      React.createElement(
        CharacterCard, { character, gameSlug: 'epic-quest', characterType: 'pc', size: 'small' },
      )
    );
    expect(html).toContain('col-sm-3 col-md-2 col-lg-1');
    expect(html).not.toContain('card-title');
  });

  it('renders a plain CardAvatar for PCs, with no overlay buttons', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, {
        character, gameSlug: 'epic-quest', characterType: 'pc', canEdit: true,
      })
    );
    expect(html).not.toContain('<button');
  });

  it('renders the upload overlay button for NPCs when canEdit is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, {
        character, gameSlug: 'epic-quest', characterType: 'npc', canEdit: true,
      })
    );
    expect(html).toContain('actions-overlay-button-left');
  });

  it('does not render overlay buttons for NPCs when canEdit is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterCard, {
        character, gameSlug: 'epic-quest', characterType: 'npc',
      })
    );
    expect(html).not.toContain('<button');
  });
});
