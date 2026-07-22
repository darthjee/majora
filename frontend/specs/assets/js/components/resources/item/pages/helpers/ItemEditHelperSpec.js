import { renderToStaticMarkup } from 'react-dom/server';
import ItemEditHelper
  from '../../../../../../../../assets/js/components/resources/item/pages/helpers/ItemEditHelper.jsx';
import ActionsOverlay from '../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

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

    it('wires the ActionsOverlay to type=item, dimmed when hidden, and the upload handler', function() {
      const handlers = buildHandlers();
      const element = ItemEditHelper.render(buildState({ hidden: true, photo_path: '/item.png' }), handlers);
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.type).toBe('item');
      expect(overlay.props.url).toBe('/item.png');
      expect(overlay.props.dimmed).toBe(true);
      expect(overlay.props.canEdit).toBe(true);

      overlay.props.onClick();
      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('does not dim the photo when not hidden', function() {
      const element = ItemEditHelper.render(buildState({ hidden: false }), buildHandlers());
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.dimmed).toBe(false);
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
