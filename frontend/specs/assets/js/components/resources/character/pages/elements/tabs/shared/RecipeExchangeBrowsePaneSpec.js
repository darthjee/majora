import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeExchangeBrowsePane
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/shared/RecipeExchangeBrowsePane.jsx';
import Translator from '../../../../../../../../../../assets/js/i18n/Translator.js';

const findAll = (node, matcher, acc = []) => {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, matcher, acc));
    return acc;
  }
  if (matcher(node)) acc.push(node);
  if (typeof node.type === 'function') return findAll(node.type(node.props), matcher, acc);
  return findAll(node.props?.children, matcher, acc);
};

const buildHandlers = () => ({
  onSelect: jasmine.createSpy('onSelect'),
  onPrev: jasmine.createSpy('onPrev'),
  onNext: jasmine.createSpy('onNext'),
  onSearchChange: jasmine.createSpy('onSearchChange'),
  onConfirm: jasmine.createSpy('onConfirm'),
  onCancel: jasmine.createSpy('onCancel'),
});

const browse = (overrides = {}) => ({
  items: [], page: 1, pages: 1, loading: false, error: '', ...overrides,
});

const renderBrowse = (state, handlers = buildHandlers()) => renderToStaticMarkup(
  React.createElement(RecipeExchangeBrowsePane, { state, handlers }),
);

describe('RecipeExchangeBrowsePane', function() {
  it('renders the loading state', function() {
    expect(renderBrowse({ browse: browse({ loading: true }) })).toContain(Translator.t('recipe_exchange_modal.loading'));
  });

  it('renders the translated error', function() {
    expect(renderBrowse({ browse: browse({ error: 'recipe_exchange_modal.load_error' }) }))
      .toContain(Translator.t('recipe_exchange_modal.load_error'));
  });

  it('renders the empty state', function() {
    expect(renderBrowse({ browse: browse() })).toContain(Translator.t('recipe_exchange_modal.empty'));
  });

  it('renders entries with their output thumbnail and a hidden badge when hidden', function() {
    const html = renderBrowse({
      browse: browse({
        items: [
          { id: 1, name: 'Healing Potion', output: { photo_path: '/potion.png' } },
          { id: 2, name: 'Secret Brew', output: null, hidden: true },
        ],
      }),
    });

    expect(html).toContain('Healing Potion');
    expect(html).toContain('/potion.png');
    expect(html).toContain('Secret Brew');
    expect(html.split(Translator.t('recipe_exchange_modal.hidden_label')).length - 1).toBe(1);
  });

  it('wires selection and search changes to the handlers', function() {
    const handlers = buildHandlers();
    const item = { id: 1, name: 'Healing Potion', output: null };
    const element = React.createElement(RecipeExchangeBrowsePane, {
      state: { browse: browse({ items: [item] }), search: 'he' }, handlers,
    });

    findAll(element, (node) => node.type === 'button')[0].props.onClick();
    findAll(element, (node) => node.type === 'input')[0].props.onChange({ target: { value: 'heal' } });

    expect(handlers.onSelect).toHaveBeenCalledWith(item);
    expect(handlers.onSearchChange).toHaveBeenCalledWith('heal');
  });
});
