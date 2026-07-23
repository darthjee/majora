import PercentageThresholds from '../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/PercentageThresholds.js';

describe('PercentageThresholds', function() {
  describe('.normalize', function() {
    [
      { thresholds: null, expected: [0.5, 0.8, 1.0] },
      { thresholds: undefined, expected: [0.5, 0.8, 1.0] },
      { thresholds: [], expected: [0.5, 0.8, 1.0] },
      { thresholds: [0.7], expected: [0.7, 0.7, 1.0] },
      { thresholds: [1.2], expected: [1.2, 1.2, 1.2] },
      { thresholds: [0.7, 0.8], expected: [0.7, 0.8, 1.0] },
      { thresholds: [0.7, 1.2], expected: [0.7, 0.7, 1.2] },
      { thresholds: [1.2, 1.3], expected: [1.2, 1.2, 1.3] },
      { thresholds: [0.8, 0.7], expected: [0.7, 0.8, 1.0] },
    ].forEach(({ thresholds, expected }) => {
      it(`normalizes ${JSON.stringify(thresholds)} to ${JSON.stringify(expected)}`, function() {
        expect(PercentageThresholds.normalize(thresholds)).toEqual(expected);
      });
    });
  });

  describe('.levelFor', function() {
    [
      { percentage: 0, expected: 'ok' },
      { percentage: 0.5, expected: 'ok' },
      { percentage: 0.50001, expected: 'warning' },
      { percentage: 0.8, expected: 'warning' },
      { percentage: 0.80001, expected: 'danger' },
      { percentage: 1.0, expected: 'danger' },
      { percentage: 1.00001, expected: 'overlimit' },
      { percentage: 2, expected: 'overlimit' },
    ].forEach(({ percentage, expected }) => {
      it(`resolves ${percentage} to '${expected}' with default thresholds`, function() {
        expect(PercentageThresholds.levelFor(percentage, undefined)).toBe(expected);
      });
    });

    it('resolves against custom thresholds', function() {
      expect(PercentageThresholds.levelFor(0.75, [0.7, 1.2])).toBe('danger');
    });
  });
});
