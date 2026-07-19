import parsePositiveInt from '../../../../assets/js/utils/parsePositiveInt.js';

describe('parsePositiveInt', function() {
  it('parses a valid positive integer string', function() {
    expect(parsePositiveInt('5', 1)).toBe(5);
  });

  it('falls back when the value is not a number', function() {
    expect(parsePositiveInt('not-a-number', 7)).toBe(7);
  });

  it('falls back when the value is null', function() {
    expect(parsePositiveInt(null, 7)).toBe(7);
  });

  it('falls back when the value is below the minimum bound', function() {
    expect(parsePositiveInt('0', 7)).toBe(7);
    expect(parsePositiveInt('-3', 7)).toBe(7);
  });

  it('truncates decimal strings', function() {
    expect(parsePositiveInt('4.9', 1)).toBe(4);
  });
});
