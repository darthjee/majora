import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyRecipeRow from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyRecipeRow.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyRecipeRow', function() {
  let row;

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement('table', null, React.createElement('tbody', null, React.createElement('tr', null,
      React.createElement(StaffCopyRecipeRow, { row: { ...row, ...overrides }, selected: false, onToggle: jasmine.createSpy('onToggle') }),
    ))),
  );

  beforeEach(function() {
    row = {
      id: 12,
      name: 'Healing Potion Recipe',
      hidden: false,
      yield_quantity: 2,
      crafting_cost: 30,
      common_item: { id: 7, name: 'Healing Potion', copied_to_target: true },
      copied_to_target: false,
    };
  });

  it('renders three cells', function() {
    expect(render().match(/<td>/g).length).toBe(3);
  });

  it('renders the recipe name', function() {
    expect(render()).toContain('<td>Healing Potion Recipe</td>');
  });

  it('renders the common item name', function() {
    expect(render()).toContain('Healing Potion</span>');
  });

  describe('when the common item was already copied to the target', function() {
    it('renders the reused indicator', function() {
      expect(render()).toContain(Translator.t('staff_copies_page.common_item_reused'));
    });

    it('does not render the will-be-copied indicator', function() {
      expect(render()).not.toContain(Translator.t('staff_copies_page.common_item_will_copy'));
    });
  });

  describe('when the common item was not copied to the target yet', function() {
    const overrides = () => ({ common_item: { id: 7, name: 'Healing Potion', copied_to_target: false } });

    it('renders the will-be-copied indicator', function() {
      expect(render(overrides())).toContain(Translator.t('staff_copies_page.common_item_will_copy'));
    });

    it('does not render the reused indicator', function() {
      expect(render(overrides())).not.toContain(Translator.t('staff_copies_page.common_item_reused'));
    });
  });

  it('renders the hidden badge when the recipe is hidden', function() {
    const html = render({ hidden: true });

    expect(html).toContain('data-testid="staff-copy-hidden-badge"');
    expect(html).toContain(Translator.t('staff_copies_page.hidden_badge'));
  });

  it('renders an empty visibility cell when the recipe is visible', function() {
    const html = render();

    expect(html).not.toContain('staff-copy-hidden-badge');
    expect(html).toContain('<td></td>');
  });
});
