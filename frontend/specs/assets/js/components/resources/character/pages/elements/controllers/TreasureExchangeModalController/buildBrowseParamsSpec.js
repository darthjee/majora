import { buildBrowseParams }
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js';
import { buildCharacter } from '../../../../../../../../../support/factories.js';

describe('buildBrowseParams', function() {
  const character = buildCharacter({ money: 500 });

  it('includes maxValue, search, and a fixed desc ordering for the acquire tab', function() {
    expect(buildBrowseParams('acquire', 2, 10, character, 'sword')).toEqual({
      page: 2, perPage: 10, maxValue: 500, search: 'sword', ordering: 'desc',
    });
  });

  it('includes only page, perPage, and search for the sell tab', function() {
    expect(buildBrowseParams('sell', 3, 10, character, 'sword')).toEqual({
      page: 3, perPage: 10, search: 'sword',
    });
  });

  it('forwards an empty search term as-is', function() {
    expect(buildBrowseParams('acquire', 1, 10, character, '')).toEqual({
      page: 1, perPage: 10, maxValue: 500, search: '', ordering: 'desc',
    });
  });
});
