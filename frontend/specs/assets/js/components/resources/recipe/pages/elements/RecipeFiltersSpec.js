import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeFilters
  from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/RecipeFilters.jsx';
import RecipeFiltersHelper
  from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/helpers/RecipeFiltersHelper.jsx';

describe('RecipeFilters', function() {
  let originalWindow;
  let captured;

  beforeEach(function() {
    originalWindow = globalThis.window;
    spyOn(RecipeFiltersHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'filters');
    });
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const renderWithHash = (hash, onQuery = jasmine.createSpy('onQuery')) => {
    globalThis.window = { location: { hash } };
    renderToStaticMarkup(React.createElement(RecipeFilters, { onQuery }));
    return captured;
  };

  it('starts as "all" when the hash has no category', function() {
    expect(renderWithHash('#/games/demo/recipes').state).toEqual({ category: '' });
  });

  it('pre-populates the category from the hash', function() {
    expect(renderWithHash('#/games/demo/recipes?category=potion').state).toEqual({ category: 'potion' });
  });

  it('discards an unknown category from the hash', function() {
    expect(renderWithHash('#/games/demo/recipes?category=bogus').state).toEqual({ category: '' });
  });

  it('applies the query when the category changes', function() {
    const onQuery = jasmine.createSpy('onQuery');

    renderWithHash('#/games/demo/recipes', onQuery).handlers.onCategoryChange('gear');

    expect(onQuery).toHaveBeenCalledWith({ category: 'gear' });
  });
});
