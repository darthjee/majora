import { renderToStaticMarkup } from 'react-dom/server';
import RemoveRecipeTabHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveRecipeTabHelper.jsx';
import Translator from '../../../../../../../../../../assets/js/i18n/Translator.js';

const handlers = {
  onSelect: jasmine.createSpy(),
  onCancel: jasmine.createSpy(),
  onPrev: jasmine.createSpy(),
  onNext: jasmine.createSpy(),
  onConfirm: jasmine.createSpy(),
  onSearchChange: jasmine.createSpy(),
};

const buildState = (overrides = {}) => ({
  browse: {
    items: [{ id: 1, name: 'Healing Potion', output: null }], page: 1, pages: 1, loading: false, error: '',
  },
  selected: null,
  submitting: false,
  actionError: '',
  search: '',
  ...overrides,
});

describe('RemoveRecipeTabHelper', function() {
  it('renders the browse list without a detail pane when nothing is selected', function() {
    const html = renderToStaticMarkup(RemoveRecipeTabHelper.render(buildState(), handlers));

    expect(html).toContain('Healing Potion');
    expect(html).toContain(Translator.t('recipe_exchange_modal.search_placeholder'));
    expect(html).not.toContain(Translator.t('recipe_exchange_modal.confirm'));
  });

  it('renders the detail pane once an entry is selected', function() {
    const html = renderToStaticMarkup(RemoveRecipeTabHelper.render(
      buildState({ selected: { id: 1, name: 'Healing Potion', output: null } }), handlers,
    ));

    expect(html).toContain(Translator.t('recipe_exchange_modal.confirm'));
  });
});
