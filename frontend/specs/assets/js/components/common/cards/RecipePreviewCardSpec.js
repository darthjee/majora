import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import RecipePreviewCard from '../../../../../../assets/js/components/common/cards/RecipePreviewCard.jsx';

describe('RecipePreviewCard', function() {
  const recipe = { id: 2, name: 'Brew', output: { id: 3, name: 'Potion', photo_path: '/photos/3.png' } };

  it('delegates rendering to RecipePreviewCardHelper', function() {
    const html = renderToStaticMarkup(React.createElement(RecipePreviewCard, { recipe }));

    expect(html).toContain('alt="Brew"');
    expect(html).toContain('src="/photos/3.png"');
    expect(html).not.toContain('<a ');
  });

  it('links to the given href when provided', function() {
    const html = renderToStaticMarkup(React.createElement(RecipePreviewCard, { recipe, href: '#/games/demo/recipes/2' }));

    expect(html).toContain('href="#/games/demo/recipes/2"');
  });
});
