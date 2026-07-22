import { renderToStaticMarkup } from 'react-dom/server';
import ItemEditHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemEditHelper.jsx';

const buildState = (overrides = {}) => ({
  name: 'Cloak of Elvenkind',
  description: 'A shimmering cloak.',
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
  onHiddenChange: jasmine.createSpy('onHiddenChange'),
  onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  ...overrides,
});

describe('ItemEditHelper', function() {
  describe('.render', function() {
    it('renders the item name in the name field', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('Cloak of Elvenkind');
    });

    it('renders the item description in the description field', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('A shimmering cloak.');
    });

    it('renders field errors for the name field', function() {
      const state = buildState({ fieldErrors: { name: ['is too short'] } });
      const html = renderToStaticMarkup(ItemEditHelper.render(state, buildHandlers()));

      expect(html).toContain('is too short');
    });

    it('renders field errors for the description field', function() {
      const state = buildState({ fieldErrors: { description: ['is too long'] } });
      const html = renderToStaticMarkup(ItemEditHelper.render(state, buildHandlers()));

      expect(html).toContain('is too long');
    });

    it('renders the error alert when status is error', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState({ status: 'error' }), buildHandlers()));

      expect(html).toContain('Failed to save item. Please try again.');
    });

    it('does not render the error alert otherwise', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save item. Please try again.');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()));

      expect(html).toContain('disabled=""');
    });

    it('renders the photo dimmed when hidden is true', function() {
      const html = renderToStaticMarkup(
        ItemEditHelper.render(buildState({ hidden: true, photo_path: '/item.png' }), buildHandlers()),
      );

      expect(html).toContain('/item.png');
      expect(html).toContain('photo-hidden');
      expect(html).toContain('actions-overlay-button');
    });

    it('does not dim the photo when not hidden', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState({ hidden: false }), buildHandlers()));

      expect(html).not.toContain('photo-hidden');
    });

    it('passes the upload handler through to the show page layout context', function() {
      const handlers = buildHandlers();
      const element = ItemEditHelper.render(buildState(), handlers);

      expect(element.props.context.handlers.onOpenUploadModal).toBe(handlers.onOpenUploadModal);
    });

    it('renders the hidden switch checked according to state', function() {
      const html = renderToStaticMarkup(ItemEditHelper.render(buildState({ hidden: true }), buildHandlers()));

      expect(html).toContain('checked=""');
    });
  });

  describe('.renderLoading', function() {
    it('renders the loading message', function() {
      const html = renderToStaticMarkup(ItemEditHelper.renderLoading());

      expect(html).toContain('Loading item...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message', function() {
      const html = renderToStaticMarkup(ItemEditHelper.renderError('boom'));

      expect(html).toContain('boom');
    });
  });
});
