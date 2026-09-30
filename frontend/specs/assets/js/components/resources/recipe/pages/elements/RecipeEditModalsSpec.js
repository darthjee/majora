import React from 'react';
import RecipeEditModals from '../../../../../../../../assets/js/components/resources/recipe/pages/elements/RecipeEditModals.jsx';
import MoneyEditModal from '../../../../../../../../assets/js/components/common/modals/MoneyEditModal.jsx';

describe('RecipeEditModals', function() {
  it('wires the crafting cost into a treasure-context MoneyEditModal', function() {
    const onClose = jasmine.createSpy('onClose');
    const onConfirm = jasmine.createSpy('onConfirm');

    const element = RecipeEditModals({
      show: true, cost: '500', onClose, onConfirm,
    });

    expect(element.type).toBe(MoneyEditModal);
    expect(element.props).toEqual(jasmine.objectContaining({
      show: true, money: '500', context: 'treasure', onClose, onConfirm,
    }));
    expect(React.isValidElement(element)).toBe(true);
  });
});
