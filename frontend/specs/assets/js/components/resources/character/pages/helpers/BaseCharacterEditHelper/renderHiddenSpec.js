import { renderToStaticMarkup } from 'react-dom/server';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';
import { helper, npcHelper, buildHandlers, buildState, findElement } from './support.js';

describe('BaseCharacterEditHelper', function() {
  describe('#render', function() {
    describe('hidden switch', function() {
      it('does not render the hidden switch when idPrefix is not "npc"', function() {
        const html = renderToStaticMarkup(helper.render(buildState(), buildHandlers()));

        expect(html).not.toContain('id="test-edit-hidden"');
        expect(html).not.toContain('form-switch');
      });

      it('renders the hidden switch when idPrefix is "npc" and isFullEditor is true', function() {
        const html = renderToStaticMarkup(npcHelper.render(buildState(), buildHandlers()));

        expect(html).toContain('id="npc-edit-hidden"');
        expect(html).toContain('form-switch');
        expect(html).toContain('role="switch"');
      });

      it('does not render the hidden switch when isFullEditor is false, even for an npc', function() {
        const html = renderToStaticMarkup(
          npcHelper.render(buildState({ isFullEditor: false }), buildHandlers())
        );

        expect(html).not.toContain('id="npc-edit-hidden"');
      });

      it('checks the hidden switch when hidden is true', function() {
        const checkedHtml = renderToStaticMarkup(
          npcHelper.render(buildState({ hidden: true }), buildHandlers())
        );
        const uncheckedHtml = renderToStaticMarkup(
          npcHelper.render(buildState({ hidden: false }), buildHandlers())
        );
        const checkedIndex = checkedHtml.indexOf('id="npc-edit-hidden"');
        const uncheckedIndex = uncheckedHtml.indexOf('id="npc-edit-hidden"');

        expect(checkedHtml.indexOf('checked=""', checkedIndex - 100)).toBeGreaterThan(-1);
        expect(uncheckedHtml.indexOf('checked=""', uncheckedIndex - 100)).toBe(-1);
      });

      it('wires the hidden switch to onHiddenChange', function() {
        const handlers = buildHandlers();
        const element = npcHelper.render(buildState(), handlers);
        const checkbox = findElement(
          element,
          (child) => child.type === 'input' && child.props.id === 'npc-edit-hidden'
        );

        expect(checkbox).not.toBeNull();
        expect(checkbox.props.onChange).toBe(handlers.onHiddenChange);
      });

      it('dims the avatar preview when hidden is true', function() {
        const handlers = buildHandlers();
        const element = npcHelper.render(buildState({ hidden: true }), handlers);
        const overlay = findElement(element, (child) => child.type === ActionsOverlay);

        expect(overlay.props.dimmed).toBe(true);
      });

      it('does not dim the avatar preview when hidden is false', function() {
        const handlers = buildHandlers();
        const element = npcHelper.render(buildState({ hidden: false }), handlers);
        const overlay = findElement(element, (child) => child.type === ActionsOverlay);

        expect(overlay.props.dimmed).toBe(false);
      });
    });
  });
});
