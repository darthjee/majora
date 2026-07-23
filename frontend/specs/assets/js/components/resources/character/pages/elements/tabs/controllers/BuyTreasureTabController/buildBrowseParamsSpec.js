import { buildBrowseParams }
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('buildBrowseParams', function() {
  const character = buildCharacter({ money: 500 });

  it('includes maxValue, search, and a fixed desc ordering', function() {
    expect(buildBrowseParams(2, 10, character, 'sword')).toEqual({
      page: 2, perPage: 10, maxValue: 500, search: 'sword', ordering: 'desc',
    });
  });

  it('forwards an empty search term as-is', function() {
    expect(buildBrowseParams(1, 10, character, '')).toEqual({
      page: 1, perPage: 10, maxValue: 500, search: '', ordering: 'desc',
    });
  });
});
