import { useState } from 'react';
import useFormState from '../../../../../utils/useFormState.js';
import { RECIPE_FORM_DEFAULTS } from '../recipeForm.js';

/**
 * Shared form state for the recipe new/edit pages (issue #1449): the field values, their change
 * handlers, and the crafting-cost `MoneyEditModal` wiring.
 *
 * @returns {{fields: object, setField: Function, handlers: object, costModalProps: object}}
 *   `fields` — current form values; `setField` — sets one field; `handlers` — slot change
 *   handlers (plus `onOpenCostModal`); `costModalProps` — props for `RecipeEditModals`.
 */
export default function useRecipeForm() {
  const [showCostModal, setShowCostModal] = useState(false);
  const {
    state: fields, setField, handleChange, handleCheckboxChange,
  } = useFormState(RECIPE_FORM_DEFAULTS);

  const handlers = {
    onNameChange: handleChange('name'),
    onOutputChange: (item) => setField('output', item),
    onYieldChange: handleChange('yield_quantity'),
    onCraftingTimeChange: handleChange('crafting_time'),
    onDescriptionChange: handleChange('description'),
    onIngredientsChange: handleChange('ingredients'),
    onChecksChange: handleChange('checks'),
    onHiddenChange: handleCheckboxChange('hidden'),
    onOpenCostModal: () => setShowCostModal(true),
  };

  const costModalProps = {
    show: showCostModal,
    cost: fields.crafting_cost,
    onClose: () => setShowCostModal(false),
    onConfirm: (newTotal) => {
      setField('crafting_cost', String(newTotal));
      setShowCostModal(false);
    },
  };

  return {
    fields, setField, handlers, costModalProps,
  };
}
