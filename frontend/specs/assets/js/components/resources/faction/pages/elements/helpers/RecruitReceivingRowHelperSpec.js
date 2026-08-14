import { renderToStaticMarkup } from 'react-dom/server';
import RecruitReceivingRowHelper
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/RecruitReceivingRowHelper.jsx';
import { findButtonWithIcon } from './support.js';

describe('RecruitReceivingRowHelper', function() {
  describe('.render', function() {
    const buildRow = (overrides = {}) => ({
      character: { id: 1, name: 'Aria' },
      kind: 'pcs',
      enlisted: false,
      result: null,
      ...overrides,
    });

    const buildHandlers = () => ({
      onRemove: jasmine.createSpy('onRemove'),
    });

    it('renders the character name', function() {
      const html = renderToStaticMarkup(RecruitReceivingRowHelper.render(buildRow(), buildHandlers()));

      expect(html).toContain('Aria');
    });

    it('renders the pc badge for a pc row', function() {
      const html = renderToStaticMarkup(RecruitReceivingRowHelper.render(buildRow({ kind: 'pcs' }), buildHandlers()));

      expect(html).toContain('PCs');
    });

    it('renders the npc badge for an npc row', function() {
      const html = renderToStaticMarkup(RecruitReceivingRowHelper.render(buildRow({ kind: 'npcs' }), buildHandlers()));

      expect(html).toContain('NPCs');
    });

    it('renders the remove icon', function() {
      const html = renderToStaticMarkup(RecruitReceivingRowHelper.render(buildRow(), buildHandlers()));

      expect(html).toContain('bi-person-x');
    });

    it('does not gray out a non-enlisted row', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ enlisted: false }), buildHandlers()),
      );

      expect(html).not.toContain('text-muted');
    });

    it('grays out an already-enlisted row', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ enlisted: true }), buildHandlers()),
      );

      expect(html).toContain('text-muted');
    });

    it('does not render the already-enlisted indicator for a non-enlisted row', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ enlisted: false }), buildHandlers()),
      );

      expect(html).not.toContain('bi-check-circle-fill');
    });

    it('renders the already-enlisted indicator icon for an enlisted row', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ enlisted: true }), buildHandlers()),
      );

      expect(html).toContain('bi-check-circle-fill');
    });

    it('does not render a result message when result is null', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ result: null }), buildHandlers()),
      );

      expect(html).not.toContain('text-success');
      expect(html).not.toContain('text-danger');
    });

    it('renders the success result message', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ result: 'success' }), buildHandlers()),
      );

      expect(html).toContain('text-success');
      expect(html).toContain('Aria recruited.');
    });

    it('renders the failure result message', function() {
      const html = renderToStaticMarkup(
        RecruitReceivingRowHelper.render(buildRow({ result: 'failure' }), buildHandlers()),
      );

      expect(html).toContain('text-danger');
      expect(html).toContain('Unable to recruit Aria.');
    });

    it('calls onRemove with the row kind/id when the remove icon is clicked', function() {
      const handlers = buildHandlers();
      const element = RecruitReceivingRowHelper.render(buildRow(), handlers);
      const removeButton = findButtonWithIcon(element, 'bi-person-x');

      removeButton.props.onClick();

      expect(handlers.onRemove).toHaveBeenCalledWith('pcs', 1);
    });

    it('still allows removing an already-enlisted row', function() {
      const handlers = buildHandlers();
      const element = RecruitReceivingRowHelper.render(buildRow({ enlisted: true }), handlers);
      const removeButton = findButtonWithIcon(element, 'bi-person-x');

      removeButton.props.onClick();

      expect(handlers.onRemove).toHaveBeenCalledWith('pcs', 1);
    });
  });
});
