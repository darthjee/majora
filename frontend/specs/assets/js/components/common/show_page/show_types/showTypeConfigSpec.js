import showTypeConfig from '../../../../../../../assets/js/components/common/show_page/show_types/showTypeConfig.js';
import gameShowType from '../../../../../../../assets/js/components/common/show_page/show_types/configs/gameShowType.js';

describe('showTypeConfig', function() {
  it('registers the game show type', function() {
    expect(showTypeConfig.game).toBe(gameShowType);
  });
});
