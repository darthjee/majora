import { renderToStaticMarkup } from 'react-dom/server';
import GameEditHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GameEditHelper.jsx';
import ActionsOverlay from '../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';
import TextareaField from '../../../../../../../../assets/js/components/common/forms/TextareaField.jsx';

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

describe('GameEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Epic Quest',
    description: 'A heroic adventure.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-edit-name"');
      expect(html).toContain('id="game-edit-description"');
    });

    it('renders the description as a TextareaField rather than a single-line input', function() {
      const element = GameEditHelper.render(buildState(), buildHandlers());
      const textareaField = findElement(element, (child) => child.type === TextareaField
        && child.props?.id === 'game-edit-description');

      expect(textareaField).not.toBeNull();
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Epic Quest"');
      expect(html).toContain('>A heroic adventure.</textarea>');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Save changes');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameEditHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameEditHelper.render(
          buildState({ fieldErrors: { name: ['is too short'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is too short');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameEditHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to save game. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to save game.');
    });

    it('renders the upload photo button', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('Upload Photo');
    });

    it('renders the photo overlay bound to the open upload modal handler and always editable', function() {
      const handlers = buildHandlers();
      const element = GameEditHelper.render(buildState(), handlers);
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(true);

      overlay.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('passes the cover_photo_path through to the photo overlay', function() {
      const element = GameEditHelper.render(
        buildState({ cover_photo_path: 'http://example.com/cover.png' }),
        buildHandlers(),
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.url).toBe('http://example.com/cover.png');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameEditHelper.renderLoading())).toContain('Loading game');
    });
  });
});
