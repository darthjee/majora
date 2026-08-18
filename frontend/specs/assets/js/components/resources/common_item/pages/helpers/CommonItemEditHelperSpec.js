import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemEditHelper
  from '../../../../../../../../assets/js/components/resources/common_item/pages/helpers/CommonItemEditHelper.jsx';

const buildState = (overrides = {}) => ({
  name: 'Healing Potion',
  description: 'Heals wounds.',
  price: '50',
  category: 'potion',
  hidden: false,
  photo_path: null,
  status: 'idle',
  fieldErrors: {},
  ...overrides,
});

const buildHandlers = (overrides = {}) => ({
  onSubmit: jasmine.createSpy('onSubmit'),
  onNameChange: jasmine.createSpy('onNameChange'),
  onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
  onCategoryChange: jasmine.createSpy('onCategoryChange'),
  onHiddenChange: jasmine.createSpy('onHiddenChange'),
  onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  onOpenPriceModal: jasmine.createSpy('onOpenPriceModal'),
  ...overrides,
});

describe('CommonItemEditHelper', function() {
  describe('.render', function() {
    it('renders the common item name in the name field', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('Healing Potion');
    });

    it('renders the common item description in the description field', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('Heals wounds.');
    });

    it('renders the category select with the current category selected', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="common-item-edit-category"');
    });

    it('renders field errors for the name field', function() {
      const state = buildState({ fieldErrors: { name: ['is too short'] } });
      const html = renderToStaticMarkup(CommonItemEditHelper.render(state, buildHandlers()));

      expect(html).toContain('is too short');
    });

    it('renders field errors for the description field', function() {
      const state = buildState({ fieldErrors: { description: ['is too long'] } });
      const html = renderToStaticMarkup(CommonItemEditHelper.render(state, buildHandlers()));

      expect(html).toContain('is too long');
    });

    it('renders field errors for the price field', function() {
      const state = buildState({ fieldErrors: { price: ['must be positive'] } });
      const html = renderToStaticMarkup(CommonItemEditHelper.render(state, buildHandlers()));

      expect(html).toContain('must be positive');
    });

    it('renders the error alert when status is error', function() {
      const html = renderToStaticMarkup(
        CommonItemEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save common item. Please try again.');
    });

    it('does not render the error alert otherwise', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save common item. Please try again.');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        CommonItemEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('renders the photo dimmed when hidden is true', function() {
      const html = renderToStaticMarkup(
        CommonItemEditHelper.render(
          buildState({ hidden: true, photo_path: '/common_item.png' }), buildHandlers(),
        ),
      );

      expect(html).toContain('/common_item.png');
      expect(html).toContain('photo-hidden');
      expect(html).toContain('actions-overlay-button');
    });

    it('does not dim the photo when not hidden', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.render(buildState({ hidden: false }), buildHandlers()));

      expect(html).not.toContain('photo-hidden');
    });

    it('passes the upload handler through to the show page layout context', function() {
      const handlers = buildHandlers();
      const element = CommonItemEditHelper.render(buildState(), handlers);

      expect(element.props.context.handlers.onOpenUploadModal).toBe(handlers.onOpenUploadModal);
    });

    it('renders the hidden switch checked according to state', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.render(buildState({ hidden: true }), buildHandlers()));

      expect(html).toContain('checked=""');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.renderLoading());

      expect(html).toContain('Loading common item...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(CommonItemEditHelper.renderError('boom'));

      expect(html).toContain('boom');
    });
  });
});
