import showTypeConfig from '../../../../../../../assets/js/components/common/show_page/show_types/showTypeConfig.js';
import documentShowType from '../../../../../../../assets/js/components/common/show_page/show_types/configs/documentShowType.js';
import gameShowType from '../../../../../../../assets/js/components/common/show_page/show_types/configs/gameShowType.js';
import pcShowType from '../../../../../../../assets/js/components/common/show_page/show_types/configs/pcShowType.js';
import npcShowType from '../../../../../../../assets/js/components/common/show_page/show_types/configs/npcShowType.js';
import treasureShowType from '../../../../../../../assets/js/components/common/show_page/show_types/configs/treasureShowType.js';

describe('showTypeConfig', function() {
  it('registers the document show type', function() {
    expect(showTypeConfig.document).toBe(documentShowType);
  });

  it('registers the game show type', function() {
    expect(showTypeConfig.game).toBe(gameShowType);
  });

  it('registers the pc show type', function() {
    expect(showTypeConfig.pc).toBe(pcShowType);
  });

  it('registers the npc show type', function() {
    expect(showTypeConfig.npc).toBe(npcShowType);
  });

  it('registers the treasure show type', function() {
    expect(showTypeConfig.treasure).toBe(treasureShowType);
  });
});
