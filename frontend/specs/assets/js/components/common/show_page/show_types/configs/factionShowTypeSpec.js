import factionShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/factionShowType.js';
import FactionCharactersPanel
  from '../../../../../../../../assets/js/components/resources/faction/pages/elements/FactionCharactersPanel.jsx';

describe('factionShowType', function() {
  it('renders the character-list panel only on the show page (issue #943)', function() {
    const entry = factionShowType.right.find((item) => item.Show === FactionCharactersPanel);

    expect(entry).toBeDefined();
    expect(entry.Edit).toBeUndefined();
    expect(entry.New).toBeUndefined();
  });

  it('has no bottom slot entries', function() {
    expect(factionShowType.bottom).toEqual([]);
  });
});
