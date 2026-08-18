import { renderToStaticMarkup } from 'react-dom/server';
import GameCommonItemNewHelper
  from '../../../../../../../../assets/js/components/resources/common_item/pages/helpers/GameCommonItemNewHelper.jsx';

describe('GameCommonItemNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onCategoryChange: jasmine.createSpy('onCategoryChange'),
    onHiddenChange: jasmine.createSpy('onHiddenChange'),
    onOpenPriceModal: jasmine.createSpy('onOpenPriceModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Healing Potion',
    description: 'Heals wounds.',
    price: '50',
    category: 'potion',
    hidden: false,
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameCommonItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="common-item-new-name"');
      expect(html).toContain('id="common-item-new-description"');
      expect(html).toContain('id="common-item-new-category"');
      expect(html).toContain('id="common-item-new-hidden"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameCommonItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Healing Potion"');
      expect(html).toContain('Heals wounds.');
    });

    it('renders the hidden checkbox as checked when hidden is true', function() {
      const html = renderToStaticMarkup(
        GameCommonItemNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('checked=""');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameCommonItemNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameCommonItemNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameCommonItemNewHelper.render(
          buildState({ fieldErrors: { name: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameCommonItemNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('alert');
    });
  });
});
