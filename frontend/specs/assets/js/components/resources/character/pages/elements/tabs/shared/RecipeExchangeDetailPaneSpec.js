import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeExchangeDetailPane
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/shared/RecipeExchangeDetailPane.jsx';
import Translator from '../../../../../../../../../../assets/js/i18n/Translator.js';

const buildHandlers = () => ({
  onSelect: jasmine.createSpy('onSelect'),
  onPrev: jasmine.createSpy('onPrev'),
  onNext: jasmine.createSpy('onNext'),
  onSearchChange: jasmine.createSpy('onSearchChange'),
  onConfirm: jasmine.createSpy('onConfirm'),
  onCancel: jasmine.createSpy('onCancel'),
});

describe('RecipeExchangeDetailPane', function() {
  const selected = { id: 1, name: 'Healing Potion', output: null };

  it('renders nothing without a selection', function() {
    expect(RecipeExchangeDetailPane({ selected: null, handlers: buildHandlers() })).toBeNull();
  });

  it('renders the selected recipe, confirm/cancel buttons and the action error', function() {
    const html = renderToStaticMarkup(React.createElement(RecipeExchangeDetailPane, {
      selected, submitting: false, actionError: 'recipe_exchange_modal.already_owned_error', handlers: buildHandlers(),
    }));

    expect(html).toContain('Healing Potion');
    expect(html).toContain(Translator.t('recipe_exchange_modal.confirm'));
    expect(html).toContain(Translator.t('recipe_exchange_modal.cancel_selection'));
    expect(html).toContain(Translator.t('recipe_exchange_modal.already_owned_error'));
  });

  it('disables confirm while submitting', function() {
    const html = renderToStaticMarkup(React.createElement(RecipeExchangeDetailPane, {
      selected, submitting: true, actionError: '', handlers: buildHandlers(),
    }));

    expect(html).toContain('disabled');
  });
});
