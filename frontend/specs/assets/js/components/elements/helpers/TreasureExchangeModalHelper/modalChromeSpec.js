import TreasureExchangeModalHelper
  from '../../../../../../../assets/js/components/elements/helpers/TreasureExchangeModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import { buildHandlers, buildState, findElement } from './support.js';

describe('TreasureExchangeModalHelper', function() {
  describe('.render', function() {
    it('renders the modal title', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Treasure Exchange');
    });

    it('wires the modal onHide and footer close button to onClose', function() {
      const handlers = buildHandlers();
      const element = TreasureExchangeModalHelper.render(true, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });
  });
});
