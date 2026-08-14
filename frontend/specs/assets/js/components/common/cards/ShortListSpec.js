import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ShortList from '../../../../../../assets/js/components/common/cards/ShortList.jsx';

// `ShortList` fetches its items through `useEffect` (via `ShortListController`), which never
// runs under `renderToStaticMarkup` (no DOM, no commit phase) — the fetch stays pending on its
// first (and only) render here, mirroring `OpenPollsWidgetSpec.js`'s own SSR-only coverage. The
// fetch/degrade behavior is exercised directly in `ShortListControllerSpec.js`; the per-resource
// params/hrefs/action/card behavior it renders once resolved is exercised in
// `shortListResourceConfigSpec.js`.
describe('ShortList', function() {
  ['pc', 'npc', 'treasure', 'item', 'document'].forEach((resource) => {
    it(`renders the title immediately with a "loading" placeholder for '${resource}'`, function() {
      const html = renderToStaticMarkup(
        React.createElement(ShortList, {
          resource, game_slug: 'demo', id: 7, is_pc: true, game_type: 'dnd',
        }),
      );

      expect(html).toContain('(loading)');
    });
  });
});
