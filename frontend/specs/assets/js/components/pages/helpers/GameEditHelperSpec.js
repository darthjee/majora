import { renderToStaticMarkup } from 'react-dom/server';
import GameEditHelper from '../../../../../../assets/js/components/pages/helpers/GameEditHelper.jsx';

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
    onPhotoChange: jasmine.createSpy('onPhotoChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Epic Quest',
    photo: 'http://example.com/cover.png',
    description: 'A heroic adventure.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-edit-name"');
      expect(html).toContain('id="game-edit-photo"');
      expect(html).toContain('id="game-edit-description"');
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Epic Quest"');
      expect(html).toContain('value="http://example.com/cover.png"');
      expect(html).toContain('value="A heroic adventure."');
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

    it('wires the upload photo button to the open upload modal handler', function() {
      const handlers = buildHandlers();
      const element = GameEditHelper.render(buildState(), handlers);
      const uploadButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );

      uploadButton.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameEditHelper.renderLoading())).toContain('Loading game');
    });
  });
});
