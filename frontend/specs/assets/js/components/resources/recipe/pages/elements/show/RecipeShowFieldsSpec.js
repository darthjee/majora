import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeImage
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeImage.jsx';
import RecipeNameHeading
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeNameHeading.jsx';
import RecipeOutputField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeOutputField.jsx';
import RecipeYieldField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeYieldField.jsx';
import RecipeCraftingTimeField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeCraftingTimeField.jsx';
import RecipeCraftingCostField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeCraftingCostField.jsx';
import RecipeDescriptionField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeDescriptionField.jsx';
import RecipeIngredientsField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeIngredientsField.jsx';
import RecipeChecksField
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeChecksField.jsx';
import RecipeHiddenBadge
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeHiddenBadge.jsx';
import RecipeTextSection
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeTextSection.jsx';
import RecipeShowLine
  from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeShowLine.jsx';

const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));

describe('recipe show fields', function() {
  describe('RecipeImage.Show', function() {
    it("renders the output's photo", function() {
      const html = render(RecipeImage.Show, { name: 'Brew', output: { photo_path: '/photos/3.png' } });

      expect(html).toContain('src="/photos/3.png"');
      expect(html).toContain('alt="Brew"');
    });

    it('falls back to the common item placeholder for a masked output', function() {
      expect(render(RecipeImage.Show, { name: 'Brew', output: null })).toContain('default_common_item.png');
    });
  });

  describe('RecipeNameHeading', function() {
    it('renders the name as a heading', function() {
      expect(render(RecipeNameHeading, { name: 'Brew' })).toBe('<h1>Brew</h1>');
    });
  });

  describe('RecipeShowLine', function() {
    it('renders a labeled line', function() {
      expect(render(RecipeShowLine, { label: 'Yield', children: '2' })).toBe('<p><strong>Yield</strong>: 2</p>');
    });
  });

  describe('RecipeOutputField.Show', function() {
    it('links to the output common item page', function() {
      const html = render(RecipeOutputField.Show, { game_slug: 'demo', output: { id: 3, name: 'Healing Potion' } });

      expect(html).toContain('Output');
      expect(html).toContain('<a href="#/games/demo/common_items/3">Healing Potion</a>');
    });

    it('renders the unknown output label when masked', function() {
      const html = render(RecipeOutputField.Show, { game_slug: 'demo', output: null });

      expect(html).toContain('Unknown item');
      expect(html).not.toContain('<a');
    });
  });

  describe('RecipeYieldField.Show', function() {
    it('renders the yield quantity', function() {
      expect(render(RecipeYieldField.Show, { yield_quantity: 3 })).toBe('<p><strong>Yield</strong>: 3</p>');
    });
  });

  describe('RecipeCraftingTimeField.Show', function() {
    it('renders the crafting time', function() {
      expect(render(RecipeCraftingTimeField.Show, { crafting_time: '2 days' })).toContain('2 days');
    });

    it('renders nothing when blank', function() {
      expect(render(RecipeCraftingTimeField.Show, { crafting_time: '' })).toBe('');
    });
  });

  describe('RecipeCraftingCostField.Show', function() {
    it('renders the cost as money', function() {
      expect(render(RecipeCraftingCostField.Show, { crafting_cost: 500 })).toContain('5 GP');
    });

    it('defaults a missing cost to zero', function() {
      expect(render(RecipeCraftingCostField.Show, {})).toContain('Crafting cost');
    });
  });

  describe('RecipeTextSection', function() {
    it('renders a titled section', function() {
      const html = render(RecipeTextSection, { title: 'Checks', text: 'DC 12' });

      expect(html).toContain('<h5>Checks</h5>');
      expect(html).toContain('DC 12');
    });

    it('renders nothing when the text is empty', function() {
      expect(render(RecipeTextSection, { title: 'Checks', text: '' })).toBe('');
    });
  });

  [
    ['RecipeDescriptionField', RecipeDescriptionField, 'description', 'Description'],
    ['RecipeIngredientsField', RecipeIngredientsField, 'ingredients', 'Ingredients'],
    ['RecipeChecksField', RecipeChecksField, 'checks', 'Checks'],
  ].forEach(([name, Field, key, title]) => {
    describe(`${name}.Show`, function() {
      it('renders its titled section', function() {
        const html = render(Field.Show, { [key]: 'Some text' });

        expect(html).toContain(`<h5>${title}</h5>`);
        expect(html).toContain('Some text');
      });

      it('renders nothing when empty', function() {
        expect(render(Field.Show, {})).toBe('');
      });
    });
  });

  describe('RecipeHiddenBadge', function() {
    it('renders the hidden badge when hidden', function() {
      expect(render(RecipeHiddenBadge, { hidden: true })).toContain('Hidden');
    });

    it('renders nothing when not hidden', function() {
      expect(render(RecipeHiddenBadge, { hidden: false })).toBe('');
    });
  });
});
