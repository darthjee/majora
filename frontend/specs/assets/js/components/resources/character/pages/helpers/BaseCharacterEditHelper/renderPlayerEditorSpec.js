import { renderToStaticMarkup } from 'react-dom/server';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';
import { helper, npcHelper, buildHandlers, buildState, findElement } from './support.js';

describe('BaseCharacterEditHelper', function() {
  describe('#render', function() {
    describe('player-only editor (isFullEditor: false)', function() {
      it('hides the money and private description inputs', function() {
        const html = renderToStaticMarkup(
          npcHelper.render(buildState({ isFullEditor: false }), buildHandlers())
        );

        expect(html).not.toContain('id="npc-edit-private-description"');
        expect(html).not.toContain(Translator.t('npc_edit_page.money_label'));
      });

      it('keeps the description, links, allegiance, and slain toggle visible', function() {
        const html = renderToStaticMarkup(
          npcHelper.render(buildState({ isFullEditor: false }), buildHandlers())
        );

        expect(html).toContain('id="npc-edit-description"');
        expect(html).toContain('id="npc-edit-allegiance"');
        expect(html).toContain('id="npc-edit-public-allegiance"');
        expect(html).toContain('id="npc-edit-public-slain"');
      });

      it('shows and allows editing the name and role for an npc player editor', function() {
        const handlers = buildHandlers();
        const html = renderToStaticMarkup(
          npcHelper.render(buildState({ isFullEditor: false }), handlers)
        );

        expect(html).toContain('id="npc-edit-name"');
        expect(html).toContain('id="npc-edit-role"');

        const element = npcHelper.render(buildState({ isFullEditor: false }), handlers);
        const roleInput = findElement(
          element,
          (child) => child.type === 'input' && child.props.id === 'npc-edit-role'
        );

        expect(roleInput).not.toBeNull();
        expect(roleInput.props.disabled).toBeFalsy();
      });

      it('still hides the name and role for a non-full pc editor', function() {
        const html = renderToStaticMarkup(
          helper.render(buildState({ isFullEditor: false }), buildHandlers())
        );

        expect(html).not.toContain('id="test-edit-name"');
        expect(html).not.toContain('id="test-edit-role"');
      });
    });
  });
});
