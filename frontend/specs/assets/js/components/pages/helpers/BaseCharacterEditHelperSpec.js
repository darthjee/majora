import { renderToStaticMarkup } from 'react-dom/server';
import BaseCharacterEditHelper from '../../../../../../assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx';
import PhotoUploadOverlay from '../../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';

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
    onRoleChange: jasmine.createSpy('onRoleChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
    onMoneyChange: jasmine.createSpy('onMoneyChange'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Test Character',
    profile_photo_path: null,
    links: [],
    role: 'Fighter',
    description: 'A brave warrior.',
    privateDescription: 'DM notes.',
    money: '0',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('#render', function() {
    it('renders all expected fields using the configured id prefix', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="test-edit-name"');
      expect(html).toContain('id="test-edit-role"');
      expect(html).toContain('id="test-edit-description"');
      expect(html).toContain('id="test-edit-private-description"');
      expect(html).toContain('id="test-edit-money"');
      expect(html).toContain('value="Test Character"');
      expect(html).toContain('value="Fighter"');
      expect(html).toContain('DM notes.');
    });

    it('renders the money field with the loaded value', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '310' }), buildHandlers())
      );

      expect(html).toContain('id="test-edit-money"');
      expect(html).toContain('type="number"');
      expect(html).toContain('value="310"');
    });

    it('renders money field errors', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({ fieldErrors: { money: ['must be greater than or equal to 0'] } }),
          buildHandlers()
        )
      );

      expect(html).toContain('must be greater than or equal to 0');
      expect(html).toContain('alert-danger');
    });

    it('renders an avatar preview reflecting the loaded profile_photo_path', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({ profile_photo_path: 'http://example.com/avatar.png' }),
          buildHandlers()
        )
      );

      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the default avatar when profile_photo_path is null', function() {
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

    it('renders the character links as a read-only LinkList', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({ links: [{ text: 'Wiki', url: 'https://example.com/wiki' }] }),
          buildHandlers()
        )
      );

      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Wiki');
    });

    it('does not render any link elements when links is empty', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('<a href="http');
    });

    it('wraps all form fields in a single form element so submission still works', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));
      const formStart = html.indexOf('<form');
      const formEnd = html.indexOf('</form>');

      expect(formStart).toBeGreaterThan(-1);
      expect(html.indexOf('id="test-edit-name"')).toBeGreaterThan(formStart);
      expect(html.indexOf('id="test-edit-name"')).toBeLessThan(formEnd);
      expect(html.indexOf('id="test-edit-role"')).toBeGreaterThan(formStart);
      expect(html.indexOf('id="test-edit-role"')).toBeLessThan(formEnd);
    });

    it('renders the photo overlay bound to the open upload modal handler and always editable', function() {
      const handlers = buildHandlers();
      const element = helper.render(buildState(), handlers);
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      expect(overlay.props.canEdit).toBe(true);
      expect(overlay.props.type).toBe('avatar');

      overlay.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });
  });

  describe('#renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(helper.renderLoading())).toContain('Loading character');
    });
  });
});
