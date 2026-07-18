import { renderToStaticMarkup } from 'react-dom/server';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';
import { helper, npcHelper, buildHandlers, buildState, findElement } from './support.js';

describe('BaseCharacterEditHelper', function() {
  describe('#render', function() {
    it('renders all expected fields using the configured id prefix', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="test-edit-name"');
      expect(html).toContain('id="test-edit-role"');
      expect(html).toContain('id="test-edit-description"');
      expect(html).toContain('id="test-edit-private-description"');
      expect(html).toContain('value="Test Character"');
      expect(html).toContain('value="Fighter"');
      expect(html).toContain('DM notes.');
    });

    it('renders the money breakdown for the loaded value', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '310' }), buildHandlers())
      );

      expect(html).toContain('20');
      expect(html).toContain('29');
    });

    it('renders nothing for the money breakdown when money is 0', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '0' }), buildHandlers())
      );

      expect(html).not.toContain('id="test-edit-money"');
    });

    it('renders a dollar bill box when gameType is deadlands', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '350', gameType: 'deadlands' }), buildHandlers())
      );

      expect(html).toContain('character-money-bill');
      expect(html).toContain('3,50');
    });

    it('renders an Edit money button wired to onOpenMoneyModal', function() {
      const handlers = buildHandlers();
      const element = helper.render(buildState(), handlers);
      const button = findElement(
        element,
        (child) => child.type === 'button' && child.props.onClick === handlers.onOpenMoneyModal
      );

      expect(button).not.toBeNull();

      button.props.onClick();

      expect(handlers.onOpenMoneyModal).toHaveBeenCalled();
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

    it('filters out links marked delete: true from the visible LinkList', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({
            links: [
              { text: 'Wiki', url: 'https://example.com/wiki' },
              { id: 2, text: 'Old link', url: 'https://example.com/old', delete: true },
            ],
          }),
          buildHandlers()
        )
      );

      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).not.toContain('href="https://example.com/old"');
    });

    it('renders an Edit links button wired to onOpenLinksModal', function() {
      const handlers = buildHandlers();
      const element = helper.render(buildState(), handlers);
      const button = findElement(
        element,
        (child) => child.type === 'button' && child.props.onClick === handlers.onOpenLinksModal
      );

      expect(button).not.toBeNull();

      button.props.onClick();

      expect(handlers.onOpenLinksModal).toHaveBeenCalled();
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
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(true);
      expect(overlay.props.type).toBe('avatar');

      overlay.props.onClick();

      expect(handlers.onOpenUploadModal).toHaveBeenCalled();
    });

    it('does not render the allegiance selects when idPrefix is not "npc"', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('allegiance');
    });

    it('renders the allegiance selects when idPrefix is "npc"', function() {
      const html = renderToStaticMarkup(
        npcHelper.render(buildState({ allegiance: 'ally', publicAllegiance: 'enemy' }), buildHandlers())
      );

      expect(html).toContain('id="npc-edit-allegiance"');
      expect(html).toContain('id="npc-edit-public-allegiance"');
    });

    it('renders the selected allegiance/publicAllegiance values', function() {
      const html = renderToStaticMarkup(
        npcHelper.render(buildState({ allegiance: 'ally', publicAllegiance: 'enemy' }), buildHandlers())
      );
      const allegianceStart = html.indexOf('id="npc-edit-allegiance"');
      const publicAllegianceStart = html.indexOf('id="npc-edit-public-allegiance"');

      expect(html.indexOf('selected=""', allegianceStart)).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', publicAllegianceStart)).toBeGreaterThan(-1);
    });

    it('does not render the slain toggle when idPrefix is not "npc"', function() {
      const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('id="test-edit-public-slain"');
    });

    it('renders the slain toggle when idPrefix is "npc"', function() {
      const html = renderToStaticMarkup(npcHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="npc-edit-public-slain"');
      expect(html).toContain('type="checkbox"');
    });

    it('checks the slain toggle when publicSlain is true', function() {
      const checkedHtml = renderToStaticMarkup(
        npcHelper.render(buildState({ publicSlain: true }), buildHandlers())
      );
      const uncheckedHtml = renderToStaticMarkup(
        npcHelper.render(buildState({ publicSlain: false }), buildHandlers())
      );

      expect(checkedHtml).toContain('checked=""');
      expect(uncheckedHtml).not.toContain('checked=""');
    });

    it('wires the slain toggle to onPublicSlainChange', function() {
      const handlers = buildHandlers();
      const element = npcHelper.render(buildState(), handlers);
      const checkbox = findElement(
        element,
        (child) => child.type === 'input' && child.props.id === 'npc-edit-public-slain'
      );

      expect(checkbox).not.toBeNull();
      expect(checkbox.props.onChange).toBe(handlers.onPublicSlainChange);
    });
  });
});
