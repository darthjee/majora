import TreasureExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import TreasureMoney
  from '../../../../../../../../../../assets/js/components/common/misc/TreasureMoney.jsx';
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

    it('renders the money display with the character money and gameType', function() {
      const element = TreasureExchangeModalHelper.render(
        true, buildState({ character: { money: 750 }, gameType: 'deadlands' }), buildHandlers()
      );
      const moneyElement = findElement(element, (child) => child.type === TreasureMoney);

      expect(moneyElement.props.value).toBe(750);
      expect(moneyElement.props.gameType).toBe('deadlands');
    });

    it('does not render the money display when no character is given', function() {
      const element = TreasureExchangeModalHelper.render(true, buildState({ character: null }), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('your_money');
    });
  });
});
