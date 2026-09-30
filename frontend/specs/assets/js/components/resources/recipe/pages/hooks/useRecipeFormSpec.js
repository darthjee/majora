import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useRecipeForm from '../../../../../../../../assets/js/components/resources/recipe/pages/hooks/useRecipeForm.js';
import { RECIPE_FORM_DEFAULTS } from '../../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';

/**
 * Minimal component exercising `useRecipeForm`, capturing what the hook returns.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onResult - Callback invoked with the hook's return value.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ onResult }) {
  onResult(useRecipeForm());
  return React.createElement('div', null, 'ok');
}

describe('useRecipeForm', function() {
  let result;

  beforeEach(function() {
    renderToStaticMarkup(React.createElement(TestHost, { onResult: (value) => { result = value; } }));
  });

  it('starts from the recipe form defaults', function() {
    expect(result.fields).toEqual(RECIPE_FORM_DEFAULTS);
  });

  it('exposes every field handler', function() {
    expect(Object.keys(result.handlers).sort()).toEqual([
      'onChecksChange', 'onCraftingTimeChange', 'onDescriptionChange', 'onHiddenChange',
      'onIngredientsChange', 'onNameChange', 'onOpenCostModal', 'onOutputChange', 'onYieldChange',
    ]);
  });

  it('starts with the cost modal hidden, showing the current cost', function() {
    expect(result.costModalProps.show).toBe(false);
    expect(result.costModalProps.cost).toBe('0');
    expect(typeof result.costModalProps.onClose).toBe('function');
    expect(typeof result.costModalProps.onConfirm).toBe('function');
  });
});
