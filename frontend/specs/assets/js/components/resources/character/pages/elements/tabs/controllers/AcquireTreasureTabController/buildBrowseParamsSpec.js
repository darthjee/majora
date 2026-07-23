import { buildBrowseParams }
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController.js';
import { buildCharacter } from '../../../../../../../../../../support/factories.js';

describe('buildBrowseParams', function() {
  const character = buildCharacter({ money: 500 });

  it('includes search and a fixed desc ordering, with no maxValue key', function() {
    const params = buildBrowseParams(2, 10, character, 'sword');

    expect(params).toEqual({
      page: 2, perPage: 10, search: 'sword', ordering: 'desc',
    });
    expect(params.maxValue).toBeUndefined();
  });

  it('forwards an empty search term as-is', function() {
    expect(buildBrowseParams(1, 10, character, '')).toEqual({
      page: 1, perPage: 10, search: '', ordering: 'desc',
    });
  });
});
