import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    // The PC/NPC preview sections are no longer threaded through `GameHelper.render` as props —
    // `gameShowType.js`'s `right` slot now declares `buildShortListSlot('pc')`/`('npc')`
    // (issue #856), which renders a self-fetching `ShortList` element. `ShortList` fetches
    // through `useEffect` (a no-op under `renderToStaticMarkup`), so it renders nothing here;
    // its fetch/render behavior is exercised directly in `ShortListSpec.js`/
    // `ShortListControllerSpec.js`/`shortListResourceConfigSpec.js`.
    it('does not throw and needs no pcs/npcs arguments', function() {
      expect(() => renderToStaticMarkup(GameHelper.render(game))).not.toThrow();
    });
  });
});
