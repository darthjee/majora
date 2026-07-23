import { buildPartialNotice }
  from '../../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController.js';

describe('buildPartialNotice', function() {
  it('returns an empty string when acquired is not a number', function() {
    expect(buildPartialNotice(5, undefined)).toBe('');
  });

  it('returns an empty string when acquired matches the requested quantity', function() {
    expect(buildPartialNotice(5, 5)).toBe('');
  });

  it('returns an empty string when acquired is greater than the requested quantity', function() {
    expect(buildPartialNotice(5, 8)).toBe('');
  });

  it('returns the translated notice when acquired is less than the requested quantity', function() {
    expect(buildPartialNotice(5, 2)).toBe('Only 2 of 5 were available and were acquired.');
  });
});
