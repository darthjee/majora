import { renderToStaticMarkup } from 'react-dom/server';
import BaseCharacterEditHelper from '../../../../../../assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx';

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

describe('BaseCharacterEditHelper', function() {
  const helper = new BaseCharacterEditHelper('test', 'npc_edit_page');

  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onAvatarUrlChange: jasmine.createSpy('onAvatarUrlChange'),
    onRoleChange: jasmine.createSpy('onRoleChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Test Character',
    avatar_url: '',
    role: 'Fighter',
    description: 'A brave warrior.',
    privateDescription: 'DM notes.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('#render', function() {
    it('renders all expected fields using the configured id prefix', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="test-edit-name"');
      expect(html).toContain('id="test-edit-avatar-url"');
      expect(html).toContain('id="test-edit-role"');
      expect(html).toContain('id="test-edit-description"');
      expect(html).toContain('id="test-edit-private-description"');
      expect(html).toContain('value="Test Character"');
      expect(html).toContain('value="Fighter"');
      expect(html).toContain('DM notes.');
    });

    it('renders a live avatar preview reflecting the current avatar_url', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({ avatar_url: 'http://example.com/avatar.png' }),
          buildHandlers()
        )
      );

      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the default avatar when avatar_url is empty', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).toContain('default_character.png');
    });

    it('renders per-field errors', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({ fieldErrors: { role: ['must not be blank'] } }),
          buildHandlers()
        )
      );

      expect(html).toContain('must not be blank');
      expect(html).toContain('alert-danger');
    });

    it('renders no field errors when none are present', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ status: 'error' }), buildHandlers())
      );

      expect(html).toContain('Failed to save character. Please try again.');
    });

    it('disables submit while submitting', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ status: 'submitting' }), buildHandlers())
      );

      expect(html).toContain('disabled=""');
    });

    it('renders the upload photo button', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).toContain('Upload Photo');
    });

    it('wires the upload photo button to the open upload modal handler', function() {
      const handlers = buildHandlers();
      const element = helper.render(buildState(), handlers);
      const uploadButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );

      uploadButton.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('#renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(helper.renderLoading())).toContain('Loading character');
    });
  });
});
