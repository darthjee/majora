import ResourceExchangeModalHelper
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/ResourceExchangeModalHelper.jsx';
import { buildHandlers, buildState, buildTabs, findElement } from './support.js';

describe('ResourceExchangeModalHelper', function() {
  describe('.render', function() {
    it('renders the Component configured for the active tab', function() {
      const tabs = buildTabs();
      const state = buildState({ activeTab: 'sell', tabs });
      const element = ResourceExchangeModalHelper.render(true, state, buildHandlers());
      const activeComponent = findElement(element, (child) => child.type === tabs.sell.Component);

      expect(activeComponent).not.toBeNull();
    });

    it('forwards show/character/ownedTreasures/gameType/onSuccess to the active tab component', function() {
      const tabs = buildTabs();
      const character = { id: 7, money: 500 };
      const ownedTreasures = [{ id: 1, treasure_id: 9, name: 'Ring', quantity: 1 }];
      const onSuccess = jasmine.createSpy('onSuccess');
      const state = buildState({
        tabs, character, ownedTreasures, gameType: 'deadlands', onSuccess,
      });
      const element = ResourceExchangeModalHelper.render(true, state, buildHandlers());
      const activeComponent = findElement(element, (child) => child.type === tabs.buy.Component);

      expect(activeComponent.props.show).toBe(true);
      expect(activeComponent.props.character).toBe(character);
      expect(activeComponent.props.ownedTreasures).toBe(ownedTreasures);
      expect(activeComponent.props.gameType).toBe('deadlands');
      expect(activeComponent.props.onSuccess).toBe(onSuccess);
    });

    it('forwards show as false when the modal is hidden', function() {
      const tabs = buildTabs();
      const element = ResourceExchangeModalHelper.render(false, buildState({ tabs }), buildHandlers());
      const activeComponent = findElement(element, (child) => child.type === tabs.buy.Component);

      expect(activeComponent.props.show).toBe(false);
    });
  });
});
