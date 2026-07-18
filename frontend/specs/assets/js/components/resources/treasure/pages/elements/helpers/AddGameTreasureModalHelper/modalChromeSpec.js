import AddGameTreasureModalHelper
  from '../../../../../../../../../../assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import { buildHandlers, buildState, findElement } from './support.js';

describe('AddGameTreasureModalHelper', function() {
  describe('.render', function() {
    it('renders the modal title', function() {
      const element = AddGameTreasureModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Add Treasure');
    });

    it('wires the modal onHide and footer cancel button to onClose', function() {
      const handlers = buildHandlers();
      const element = AddGameTreasureModalHelper.render(true, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      const cancelButton = findElement(
        element, (child) => child.type === 'button' && child.props.children === 'Cancel'
      );
      cancelButton.props.onClick();

      expect(handlers.onClose).toHaveBeenCalledTimes(2);
    });

    it('does not render a Save button when no item is selected', function() {
      const element = AddGameTreasureModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('Save');
    });

    it('renders the action error in the footer when present', function() {
      const state = buildState({ actionError: 'add_game_treasure_modal.save_error' });
      const element = AddGameTreasureModalHelper.render(true, state, buildHandlers());

      expect(JSON.stringify(element)).toContain('alert-danger');
    });

    it('does not render an action error when absent', function() {
      const element = AddGameTreasureModalHelper.render(true, buildState(), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('alert-danger');
    });
  });
});
