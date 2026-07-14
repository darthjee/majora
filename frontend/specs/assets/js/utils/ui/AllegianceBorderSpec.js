import allegianceBorderClass from '../../../../../assets/js/utils/ui/AllegianceBorder.js';

describe('allegianceBorderClass', function() {
  it('returns the green border class for "ally"', function() {
    expect(allegianceBorderClass('ally')).toEqual('border border-success');
  });

  it('returns the red border class for "enemy"', function() {
    expect(allegianceBorderClass('enemy')).toEqual('border border-danger');
  });

  it('returns the gray border class for "neutral"', function() {
    expect(allegianceBorderClass('neutral')).toEqual('border border-secondary');
  });

  it('returns the gray border class when allegiance is missing', function() {
    expect(allegianceBorderClass()).toEqual('border border-secondary');
  });

  it('returns the gray border class for an unrecognized value', function() {
    expect(allegianceBorderClass('unknown')).toEqual('border border-secondary');
  });
});
