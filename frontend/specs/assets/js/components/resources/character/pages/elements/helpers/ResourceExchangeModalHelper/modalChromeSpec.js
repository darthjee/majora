import ResourceExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import TreasureMoney
  from '../../../../../../../../../../assets/js/components/common/misc/TreasureMoney.jsx';
import {
  buildHandlers, buildState, buildItemTabs, findElement,
} from './support.js';

describe('ResourceExchangeModalHelper', function() {
  describe('.render', function() {
    it('renders the modal title', function() {
      const element = ResourceExchangeModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Treasure Exchange');
    });

    it('renders the modal title from the item tabs namespace', function() {
      const element = ResourceExchangeModalHelper.render(
        true, buildState({ tabs: buildItemTabs(), activeTab: 'acquire' }), buildHandlers()
      );
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Item Exchange');
    });

    it('wires the modal onHide and footer close button to onClose', function() {
      const handlers = buildHandlers();
      const element = ResourceExchangeModalHelper.render(true, buildState(), handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders the money display with the character money and gameType', function() {
      const element = ResourceExchangeModalHelper.render(
        true, buildState({ character: { money: 750 }, gameType: 'deadlands' }), buildHandlers()
      );
      const moneyElement = findElement(element, (child) => child.type === TreasureMoney);

      expect(moneyElement.props.value).toBe(750);
      expect(moneyElement.props.gameType).toBe('deadlands');
    });

    it('does not render the money display when no character is given', function() {
      const element = ResourceExchangeModalHelper.render(true, buildState({ character: null }), buildHandlers());

      expect(JSON.stringify(element)).not.toContain('your_money');
    });

    it('does not render the money display for the item tabs namespace, even with a character', function() {
      const element = ResourceExchangeModalHelper.render(
        true,
        buildState({ tabs: buildItemTabs(), activeTab: 'acquire', character: { money: 750 } }),
        buildHandlers()
      );

      expect(JSON.stringify(element)).not.toContain('your_money');
      expect(findElement(element, (child) => child.type === TreasureMoney)).toBeNull();
    });
  });
});
