import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeTitle from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeTitle.jsx';
import RecipeSubmitButton from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeSubmitButton.jsx';
import RecipeNameField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeNameField.jsx';
import RecipeOutputField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeOutputField.jsx';
import RecipeInvalidOutputAlert from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeInvalidOutputAlert.jsx';
import RecipeYieldField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeYieldField.jsx';
import RecipeCraftingTimeField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeCraftingTimeField.jsx';
import RecipeCraftingCostField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeCraftingCostField.jsx';
import RecipeMarkdownField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeMarkdownField.jsx';
import RecipeDescriptionField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeDescriptionField.jsx';
import RecipeIngredientsField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeIngredientsField.jsx';
import RecipeChecksField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeChecksField.jsx';
import RecipeHiddenField from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeHiddenField.jsx';
import RecipeHiddenNotice from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/RecipeHiddenNotice.jsx';
import { formFieldId, formKey } from '../../../../../../../../../assets/js/components/resources/recipe/pages/elements/show/recipeFormKeys.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

const handlers = new Proxy({}, { get: () => Noop.noop });
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, { handlers, ...props }));

describe('recipe form fields', function() {
  describe('recipeFormKeys', function() {
    it('builds mode-specific keys and ids', function() {
      expect(formKey('new', 'title')).toBe('recipe_new_page.title');
      expect(formKey('edit', 'title')).toBe('recipe_edit_page.title');
      expect(formFieldId('edit', 'name')).toBe('recipe-edit-name');
    });
  });

  describe('RecipeTitle', function() {
    it('renders the mode title', function() {
      expect(render(RecipeTitle, { mode: 'new', status: 'idle' })).toBe('<h1>New Recipe</h1>');
      expect(render(RecipeTitle, { mode: 'edit', status: 'idle' })).toBe('<h1>Edit Recipe</h1>');
    });

    it('renders an error alert when the submission failed', function() {
      expect(render(RecipeTitle, { mode: 'new', status: 'error' })).toContain('alert-danger');
    });
  });

  describe('RecipeSubmitButton', function() {
    it('renders the mode submit label', function() {
      expect(render(RecipeSubmitButton, { mode: 'new', status: 'idle' })).toContain('Create Recipe');
      expect(render(RecipeSubmitButton, { mode: 'edit', status: 'idle' })).toContain('Save changes');
    });

    it('is disabled while submitting', function() {
      expect(render(RecipeSubmitButton, { mode: 'new', status: 'submitting' })).toContain('disabled');
    });
  });

  describe('RecipeNameField', function() {
    it('renders the name input with its errors', function() {
      const html = render(RecipeNameField, { mode: 'new', name: 'Brew', fieldErrors: { name: ['required'] } });

      expect(html).toContain('id="recipe-new-name"');
      expect(html).toContain('value="Brew"');
      expect(html).toContain('This field is required.');
    });
  });

  describe('RecipeOutputField.Edit', function() {
    it('renders the picked output', function() {
      const html = render(RecipeOutputField.Edit, {
        mode: 'edit', game_slug: 'demo', output: { id: 3, name: 'Healing Potion' },
      });

      expect(html).toContain('Output');
      expect(html).toContain('Healing Potion');
      expect(html).not.toContain('recipe-invalid-output');
    });

    it('renders the search when nothing is picked', function() {
      expect(render(RecipeOutputField.New, { mode: 'new', game_slug: 'demo', output: null }))
        .toContain('Search for a common item...');
    });

    it('renders the invalid output error', function() {
      const html = render(RecipeOutputField.New, {
        mode: 'new', game_slug: 'demo', output: null, fieldErrors: { game_common_item_id: ['does_not_exist'] },
      });

      expect(html).toContain('recipe-invalid-output');
    });
  });

  describe('RecipeInvalidOutputAlert', function() {
    it('renders nothing without errors', function() {
      expect(render(RecipeInvalidOutputAlert, { mode: 'new' })).toBe('');
    });

    it('renders the translated message with errors', function() {
      expect(render(RecipeInvalidOutputAlert, { mode: 'edit', errors: ['does_not_exist'] }))
        .toContain('The selected output item is invalid.');
    });
  });

  describe('RecipeYieldField.Edit', function() {
    it('renders a number input', function() {
      const html = render(RecipeYieldField.Edit, { mode: 'new', yield_quantity: '2' });

      expect(html).toContain('type="number"');
      expect(html).toContain('value="2"');
    });
  });

  describe('RecipeCraftingTimeField.Edit', function() {
    it('renders a text input', function() {
      const html = render(RecipeCraftingTimeField.Edit, { mode: 'edit', crafting_time: '1 hour' });

      expect(html).toContain('id="recipe-edit-crafting-time"');
      expect(html).toContain('value="1 hour"');
    });
  });

  describe('RecipeCraftingCostField.Edit', function() {
    it('renders the cost and the modal button', function() {
      const html = render(RecipeCraftingCostField.Edit, { mode: 'new', crafting_cost: '500' });

      expect(html).toContain('5 GP');
      expect(html).toContain('Edit crafting cost');
    });

    it('defaults an invalid cost to zero', function() {
      expect(render(RecipeCraftingCostField.Edit, { mode: 'new', crafting_cost: '' })).toContain('Crafting cost');
    });
  });

  describe('RecipeMarkdownField', function() {
    it('renders a markdown editor for the field', function() {
      const html = render(RecipeMarkdownField, {
        mode: 'new', field: 'checks', value: 'DC 12', onChange: Noop.noop,
      });

      expect(html).toContain('Checks');
      expect(html).toContain('DC 12');
    });
  });

  [
    ['RecipeDescriptionField', RecipeDescriptionField, 'description', 'Description'],
    ['RecipeIngredientsField', RecipeIngredientsField, 'ingredients', 'Ingredients'],
    ['RecipeChecksField', RecipeChecksField, 'checks', 'Checks'],
  ].forEach(([name, Field, key, label]) => {
    describe(`${name}.Edit`, function() {
      it('renders its markdown editor', function() {
        const html = render(Field.Edit, { mode: 'edit', [key]: 'Some text' });

        expect(html).toContain(label);
        expect(html).toContain('Some text');
        expect(Field.New).toBe(Field.Edit);
      });
    });
  });

  describe('RecipeHiddenField', function() {
    it('renders the switch', function() {
      const html = render(RecipeHiddenField, { mode: 'new', hidden: false, canEditGame: false });

      expect(html).toContain('id="recipe-new-hidden"');
      expect(html).not.toContain('recipe-hidden-notice');
    });

    it('renders the notice when a non-editor turns it on', function() {
      expect(render(RecipeHiddenField, { mode: 'edit', hidden: true, canEditGame: false }))
        .toContain('recipe-hidden-notice');
    });
  });

  describe('RecipeHiddenNotice', function() {
    it('renders nothing for a game editor', function() {
      expect(render(RecipeHiddenNotice, { mode: 'new', hidden: true, canEditGame: true })).toBe('');
    });

    it('renders nothing when not hidden', function() {
      expect(render(RecipeHiddenNotice, { mode: 'new', hidden: false, canEditGame: false })).toBe('');
    });

    it('renders the notice otherwise', function() {
      expect(render(RecipeHiddenNotice, { mode: 'new', hidden: true, canEditGame: false }))
        .toContain('Hidden recipes are only visible to game editors.');
    });
  });
});
